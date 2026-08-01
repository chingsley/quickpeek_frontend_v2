import PaystackWebView from '@/components/payment/PaystackWebView';
import BottomSheet from '@/components/shared/BottomSheet';
import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { payForRequest, verifyPayment } from '@/services/payments.services';
import { formatMoney } from '@/utils/payment.utils';
import { useStripe } from '@stripe/stripe-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TPaymentTransaction } from '@/types/payment.types';

type MakePaymentSheetProps = {
  visible: boolean;
  onClose: () => void;
  answerRequestId: string;
  amount: number;
  currency: string;
  /** Called with the finalized transaction once the provider confirms payment. */
  onPaid?: (transaction: TPaymentTransaction) => void;
};

const initiationErrorMessage = (error: unknown): string => {
  const apiError = (error as { response?: { data?: { error?: string } } })?.response?.data
    ?.error;
  return apiError ?? 'Payment failed to start. Please try again.';
};

/**
 * Chat payment flow for the questioner. Stripe: confirms via the native
 * PaymentSheet (saved cards are offered automatically through the customer
 * session). Paystack: hosted checkout in a WebView. Both paths end with a
 * server-side verify — the webhook is the authoritative confirmation.
 */
const MakePaymentSheet = ({
  visible,
  onClose,
  answerRequestId,
  amount,
  currency,
  onPaid,
}: MakePaymentSheetProps) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paystackCheckout, setPaystackCheckout] = useState<{
    url: string;
    transactionId: string;
  } | null>(null);

  useEffect(() => {
    if (visible) {
      setProcessing(false);
      setError(null);
    }
  }, [visible]);

  const finishPayment = useCallback(
    async (transactionId: string) => {
      const confirmed = await verifyPayment(transactionId);
      onPaid?.(confirmed);
      onClose();
    },
    [onClose, onPaid],
  );

  const handleConfirm = useCallback(async () => {
    setProcessing(true);
    setError(null);
    try {
      const payResponse = await payForRequest(answerRequestId);

      if (payResponse.stripe) {
        const init = await initPaymentSheet({
          paymentIntentClientSecret: payResponse.stripe.clientSecret,
          customerEphemeralKeySecret: payResponse.stripe.ephemeralKey,
          customerId: payResponse.stripe.customerId,
          merchantDisplayName: 'QuickPeek',
        });
        if (init.error) {
          setError(init.error.message);
          setProcessing(false);
          return;
        }

        const present = await presentPaymentSheet();
        if (present.error) {
          // A cancel just returns to the confirm state; anything else shows.
          if (present.error.code !== 'Canceled') {
            setError(present.error.message);
          }
          setProcessing(false);
          return;
        }

        await finishPayment(payResponse.transaction.id);
        return;
      }

      if (payResponse.paystack) {
        setPaystackCheckout({
          url: payResponse.paystack.authorizationUrl,
          transactionId: payResponse.transaction.id,
        });
        setProcessing(false);
        return;
      }

      setError('Unexpected payment response. Please try again.');
      setProcessing(false);
    } catch (err) {
      setError(initiationErrorMessage(err));
      setProcessing(false);
    }
  }, [answerRequestId, finishPayment, initPaymentSheet, presentPaymentSheet]);

  const handlePaystackComplete = useCallback(() => {
    const checkout = paystackCheckout!;
    setPaystackCheckout(null);
    finishPayment(checkout.transactionId).catch(() => {
      setError('Could not confirm the payment yet. Check your wallet shortly.');
    });
  }, [finishPayment, paystackCheckout]);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <Text style={styles.title}>Make payment</Text>
        <Text style={styles.subtitle}>
          Pay the responder for this question. The payment transfers to them as soon as it
          succeeds.
        </Text>
        <Text style={styles.amount}>{formatMoney(amount, currency)}</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <CustomButton
          text={`Pay ${formatMoney(amount, currency)}`}
          onPress={handleConfirm}
          loading={processing}
          noTopMargin
        />
      </View>

      {paystackCheckout ? (
        <PaystackWebView
          authorizationUrl={paystackCheckout.url}
          onComplete={handlePaystackComplete}
          onCancel={() => setPaystackCheckout(null)}
        />
      ) : null}
    </BottomSheet>
  );
};

export default MakePaymentSheet;

const styles = StyleSheet.create({
  content: {
    backgroundColor: colors.BG_WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontFamily: fonts.FONT_FAMILY_BOLD,
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
  },
  subtitle: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    marginTop: 8,
  },
  amount: {
    fontFamily: fonts.FONT_FAMILY_BOLD,
    fontSize: 32,
    color: colors.PRIMARY,
    marginVertical: 20,
  },
  error: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.RED,
    marginBottom: 12,
  },
});
