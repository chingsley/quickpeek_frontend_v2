import BackButton from '@/components/shared/BackButton';
import PillChip from '@/components/shared/PillChip';
import { ScreenTitle } from '@/components/shared/ScreenTitle';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { getPaymentAccountStatus } from '@/services/payments.services';
import SocketService from '@/services/socket.services';
import { useWalletStore } from '@/store/wallet.store';
import { TCurrencyTotal, TPaymentAccount, TWalletTransaction } from '@/types/payment.types';
import { formatMoney, formatTransactionDate } from '@/utils/payment.utils';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_LABEL: Record<TWalletTransaction['status'], string> = {
  SUCCEEDED: 'Paid',
  PENDING: 'Pending',
  FAILED: 'Failed',
};

const STATUS_COLOR: Record<TWalletTransaction['status'], string> = {
  SUCCEEDED: colors.SUCCESS_GREEN,
  PENDING: colors.AMBER,
  FAILED: colors.RED,
};

const TotalsCard = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={styles.totalsCard}>
    <Text style={styles.totalsLabel}>{label}</Text>
    {children}
  </View>
);

const CurrencyTotals = ({ totals, fallback }: { totals: TCurrencyTotal[]; fallback: string }) => {
  if (totals.length === 0) {
    return <Text style={styles.totalsValue}>{fallback}</Text>;
  }
  return (
    <View>
      {totals.map((total) => (
        <Text key={total.currency} style={styles.totalsValue}>
          {formatMoney(total.amount, total.currency)}
        </Text>
      ))}
    </View>
  );
};

const TransactionRow = ({ item }: { item: TWalletTransaction }) => {
  const signed = `${item.direction === 'earned' ? '+' : '-'}${formatMoney(
    item.amount,
    item.currency,
  )}`;
  return (
    <View style={styles.txRow}>
      <View style={styles.txMain}>
        <Text style={styles.txAmount}>{signed}</Text>
        <Text style={styles.txCounterparty}>{item.counterparty.name}</Text>
        <Text style={styles.txQuestion} numberOfLines={1}>
          {item.question ? item.question.title : 'No linked question'}
        </Text>
        <Text style={styles.txDate}>{formatTransactionDate(item.createdAt)}</Text>
      </View>
      <Text style={[styles.txStatus, { color: STATUS_COLOR[item.status] }]}>
        {STATUS_LABEL[item.status]}
      </Text>
    </View>
  );
};

/**
 * Wallet dashboard: earnings (net of platform fees), spend, answered-question
 * count, payout-account status, and the paginated transaction history.
 * Refreshes live on payment socket events.
 */
export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wallet, loading, loadWallet, loadMore } = useWalletStore();
  // undefined = still loading, null = none/failed to load
  const [account, setAccount] = useState<TPaymentAccount | null | undefined>(undefined);

  useEffect(() => {
    loadWallet();
    getPaymentAccountStatus()
      .then(setAccount)
      .catch(() => setAccount(null));
  }, [loadWallet]);

  useEffect(() => {
    const socket = SocketService.getSocket();
    const refresh = () => {
      useWalletStore.getState().loadWallet();
    };
    socket?.on('payment:received', refresh);
    socket?.on('payment:succeeded', refresh);
    socket?.on('payment:failed', refresh);
    return () => {
      socket?.off('payment:received', refresh);
      socket?.off('payment:succeeded', refresh);
      socket?.off('payment:failed', refresh);
    };
  }, []);

  const defaultCurrency = account?.currency ?? 'USD';
  const earnedTotals = wallet?.totals.earned ?? [];
  const spentTotals = wallet?.totals.spent ?? [];
  const zeroFallback = formatMoney(0, defaultCurrency);

  const payoutCtaLabel =
    account == null
      ? 'Set up payouts'
      : !account.payoutsEnabled
        ? 'Finish payout setup'
        : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <BackButton />
        <ScreenTitle title="Wallet" style={styles.headerTitle} />
      </View>

      {wallet === null && loading ? (
        <ActivityIndicator
          testID="wallet-loading"
          size="large"
          color={colors.PRIMARY}
          style={styles.loading}
        />
      ) : (
        <FlatList
          testID="wallet-transactions"
          data={wallet?.transactions.items ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionRow item={item} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <View>
              <View style={styles.totalsRow}>
                <TotalsCard label="Earned">
                  <CurrencyTotals totals={earnedTotals} fallback={zeroFallback} />
                </TotalsCard>
                <TotalsCard label="Spent">
                  <CurrencyTotals totals={spentTotals} fallback={zeroFallback} />
                </TotalsCard>
                <TotalsCard label="Answered">
                  <Text style={styles.totalsValue}>
                    {wallet?.totals.questionsAnswered ?? 0}
                  </Text>
                </TotalsCard>
              </View>

              {account === undefined ? null : payoutCtaLabel ? (
                <PillChip
                  label={payoutCtaLabel}
                  active
                  onPress={() => router.push('/wallet/onboarding')}
                  style={styles.payoutChip}
                />
              ) : (
                <View style={[styles.payoutChip, styles.payoutActive]}>
                  <Text style={styles.payoutActiveText}>Payouts active</Text>
                </View>
              )}

              <Text style={styles.sectionTitle}>Transactions</Text>
            </View>
          }
          ListEmptyComponent={<Text style={styles.empty}>No transactions yet.</Text>}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  loading: {
    marginTop: 64,
  },
  totalsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  totalsCard: {
    flex: 1,
    backgroundColor: colors.CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    padding: 12,
  },
  totalsLabel: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    marginBottom: 6,
  },
  totalsValue: {
    fontFamily: fonts.FONT_FAMILY_BOLD,
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
  },
  payoutChip: {
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  payoutActive: {
    backgroundColor: colors.LIGHT_GREEN,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  payoutActiveText: {
    fontFamily: fonts.FONT_FAMILY_BOLD,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.SUCCESS_GREEN,
  },
  sectionTitle: {
    fontFamily: fonts.FONT_FAMILY_BOLD,
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
    marginTop: 24,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 32,
  },
  empty: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    textAlign: 'center',
    marginTop: 32,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.CARD_BORDER,
  },
  txMain: {
    flex: 1,
    gap: 2,
  },
  txAmount: {
    fontFamily: fonts.FONT_FAMILY_BOLD,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
  txCounterparty: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_BODY,
  },
  txQuestion: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
  },
  txDate: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: 12,
    color: colors.MEDIUM_GRAY,
  },
  txStatus: {
    fontFamily: fonts.FONT_FAMILY_BOLD,
    fontSize: fonts.FONT_SIZE_SMALL,
    marginLeft: 8,
  },
});
