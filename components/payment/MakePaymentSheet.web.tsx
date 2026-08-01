import PaystackWebView from '@/components/payment/PaystackWebView';
import {
  initiationErrorMessage,
  makePaymentSheetStyles as styles,
  MakePaymentSheetProps,
} from '@/components/payment/makePaymentSheet.shared';
import BottomSheet from '@/components/shared/BottomSheet';
import CustomButton from '@/components/shared/CustomButton';
import { payForRequest, verifyPayment } from '@/services/payments.services';
import { formatMoney } from '@/utils/payment.utils';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

const STRIPE_WEB_MESSAGE =
  'Card payments are only available in the QuickPeek mobile app. Open this chat on your phone to pay.';

/**
 * Web chat payment flow. Paystack checkout works in-browser; Stripe uses the
 * native PaymentSheet and is not available on web.
 */
const MakePaymentSheet = ({
  visible,
  onClose,
  answerRequestId,
  amount,
  currency,
  onPaid,
}: MakePaymentSheetProps) => {
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
        setError(STRIPE_WEB_MESSAGE);
        setProcessing(false);
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
  }, [answerRequestId]);

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
