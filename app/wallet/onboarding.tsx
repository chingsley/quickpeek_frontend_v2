import BackButton from '@/components/shared/BackButton';
import CustomButton from '@/components/shared/CustomButton';
import KeyboardAwareScreen from '@/components/shared/KeyboardAwareScreen';
import PillChip from '@/components/shared/PillChip';
import { ScreenTitle } from '@/components/shared/ScreenTitle';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import {
  createPaymentAccount,
  getBanks,
  getPaymentAccountStatus,
  startPayoutOnboarding,
} from '@/services/payments.services';
import { TBank, TPaymentAccount } from '@/types/payment.types';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
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
      const { onboardingUrl } = await startPayoutOnboarding({});
      if (onboardingUrl) {
        await WebBrowser.openBrowserAsync(onboardingUrl);
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
      return (
        <View>
          <Text style={styles.body}>
            QuickPeek partners with Stripe for secure payouts. You will finish setting up
            your payout account on Stripe&apos;s site — it takes a few minutes.
          </Text>
          <CustomButton
            text="Continue with Stripe"
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
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <BackButton />
        <ScreenTitle title="Payout setup" style={styles.headerTitle} />
      </View>
      <KeyboardAwareScreen>
        <View style={styles.content}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {renderBody()}
        </View>
      </KeyboardAwareScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.BG_WHITE,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerTitle: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
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
