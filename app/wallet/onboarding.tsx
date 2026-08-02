import BackButton from '@/components/shared/BackButton';
import CustomButton from '@/components/shared/CustomButton';
import KeyboardAwareScreen from '@/components/shared/KeyboardAwareScreen';
import PillChip from '@/components/shared/PillChip';
import { ScreenTitle } from '@/components/shared/ScreenTitle';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { SCREEN_CHROME_HORIZONTAL_PADDING } from '@/constants/layout';
import { screenChromeStyles } from '@/constants/screenChrome';
import {
  createPaymentAccount,
  getBanks,
  getPaymentAccountStatus,
  startPayoutOnboarding,
} from '@/services/payments.services';
import { TBank, TPaymentAccount } from '@/types/payment.types';
import { getAppDeepLink } from '@/utils/payment.utils';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CURRENCIES = ['USD', 'NGN'] as const;
type WalletCurrency = (typeof CURRENCIES)[number];
const MIN_ACCOUNT_NUMBER_LENGTH = 8;

/**
 * Responder payout setup. No account yet → pick a currency (which picks the
 * provider). Stripe → hosted Express onboarding in the browser. Paystack →
 * bank + account number, resolved and saved as a payout subaccount.
 */
export default function WalletOnboardingScreen() {
  const router = useRouter();
  // undefined = loading, null = none
  const [account, setAccount] = useState<TPaymentAccount | null | undefined>(undefined);
  const [currency, setCurrency] = useState<WalletCurrency>('USD');
  const [banks, setBanks] = useState<TBank[]>([]);
  const [bankCode, setBankCode] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPaymentAccountStatus()
      .then(setAccount)
      .catch(() => setAccount(null));
  }, []);

  // The Paystack form needs the bank directory once a Paystack account exists.
  useEffect(() => {
    if (account?.provider === 'PAYSTACK' && !account.payoutsEnabled) {
      getBanks()
        .then(setBanks)
        .catch(() => setError('Could not load the bank list. Please try again.'));
    }
  }, [account]);

  const handleCreateAccount = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setAccount(await createPaymentAccount(currency));
    } catch {
      setError('Could not create your payment account. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [currency]);

  const handleStripeOnboarding = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      // Deep link straight back into this screen when Stripe is done (or the
      // link expires). openAuthSessionAsync intercepts that redirect and
      // closes itself — no dead browser page, no manual close needed.
      const returnUrl = getAppDeepLink('/wallet/onboarding');
      const { onboardingUrl } = await startPayoutOnboarding({
        returnUrl,
        refreshUrl: returnUrl,
      });
      if (onboardingUrl) {
        await WebBrowser.openAuthSessionAsync(onboardingUrl, returnUrl);
      }
      // Refresh after the browser flow — completed onboarding flips payouts on.
      setAccount(await getPaymentAccountStatus());
    } catch {
      setError('Could not start Stripe onboarding. Please try again.');
    } finally {
      setBusy(false);
    }
  }, []);

  const handlePaystackSave = useCallback(async () => {
    if (!bankCode || accountNumber.trim().length < MIN_ACCOUNT_NUMBER_LENGTH) {
      setError('Select a bank and enter a valid account number.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await startPayoutOnboarding({
        bankCode,
        accountNumber: accountNumber.trim(),
      });
      setResolvedName(result.accountName ?? null);
      setAccount(result.account);
    } catch {
      setError('Could not save your payout account. Check the details and try again.');
    } finally {
      setBusy(false);
    }
  }, [accountNumber, bankCode]);

  const renderBody = () => {
    if (account === undefined) {
      return (
        <ActivityIndicator
          testID="onboarding-loading"
          size="large"
          color={colors.PRIMARY}
          style={styles.loading}
        />
      );
    }

    if (account?.payoutsEnabled) {
      return (
        <View>
          <Text style={styles.successTitle}>Payouts are active</Text>
          <Text style={styles.body}>
            {resolvedName
              ? `Payments you receive are settled to ${resolvedName}.`
              : 'Payments you receive are settled to your payout account.'}
          </Text>
          <Text style={styles.nextSteps}>
            You&apos;re all set. When a questioner pays you from a chat, the money appears in
            your wallet and Stripe pays it out to your bank.
          </Text>
          <CustomButton text="Done" onPress={() => router.back()} />
        </View>
      );
    }

    if (account === null) {
      return (
        <View>
          <Text style={styles.body}>
            Choose the currency you want to be paid in. This also chooses the payment
            provider for your payouts.
          </Text>
          <View style={styles.chipRow}>
            {CURRENCIES.map((code) => (
              <PillChip
                key={code}
                label={code}
                active={currency === code}
                onPress={() => setCurrency(code)}
              />
            ))}
          </View>
          <CustomButton text="Continue" onPress={handleCreateAccount} loading={busy} />
        </View>
      );
    }

    if (account.provider === 'STRIPE') {
      // A connected account without payouts means the user started but did
      // not finish — say so plainly instead of looking like the initial state.
      const started = account.connectedAccountId != null;
      return (
        <View>
          <Text style={styles.body}>
            {started
              ? 'Stripe needs a few more details before we can send your payouts. Tap below to pick up right where you left off — it only takes a minute.'
              : 'QuickPeek partners with Stripe for secure payouts. You will finish setting up your payout account on Stripe&apos;s site — it takes a few minutes.'}
          </Text>
          <CustomButton
            text={started ? 'Finish payout setup' : 'Continue with Stripe'}
            onPress={handleStripeOnboarding}
            loading={busy}
          />
        </View>
      );
    }

    return (
      <View>
        <Text style={styles.body}>
          Enter the bank account your earnings should be settled to.
        </Text>
        <View style={styles.chipRow}>
          {banks.map((bank) => (
            <PillChip
              key={bank.code}
              label={bank.name}
              active={bankCode === bank.code}
              onPress={() => setBankCode(bank.code)}
            />
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder="Account number"
          placeholderTextColor={colors.PLACEHOLDER}
          keyboardType="number-pad"
          value={accountNumber}
          onChangeText={setAccountNumber}
        />
        <CustomButton text="Save payout account" onPress={handlePaystackSave} loading={busy} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={screenChromeStyles.actionRow}>
        <BackButton />
      </View>
      <View style={screenChromeStyles.titleRow}>
        <ScreenTitle title="Payout setup" />
      </View>
      <KeyboardAwareScreen contentContainerStyle={styles.scrollContent}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {renderBody()}
      </KeyboardAwareScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.BG_WHITE,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_CHROME_HORIZONTAL_PADDING,
  },
  loading: {
    marginTop: 64,
  },
  body: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_BODY,
    lineHeight: 22,
  },
  successTitle: {
    fontFamily: fonts.FONT_FAMILY_BOLD,
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.SUCCESS_GREEN,
    marginBottom: 8,
  },
  nextSteps: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    lineHeight: 22,
    marginTop: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginTop: 16,
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
  error: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.RED,
    marginBottom: 12,
  },
});
