import BackButton from '@/components/shared/BackButton';
import CustomButton from '@/components/shared/CustomButton';
import { ScreenInfoBanner } from '@/components/shared/ScreenInfoBanner';
import { ScreenTitle } from '@/components/shared/ScreenTitle';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { BORDER_RADIUS_INPUT, CIRCULAR_CLICK_HEIGHT, CIRCULAR_CLICK_WIDTH, SCREEN_CHROME_HORIZONTAL_PADDING } from '@/constants/layout';
import { screenChromeStyles } from '@/constants/screenChrome';
import { getPaymentAccountStatus } from '@/services/payments.services';
import SocketService from '@/services/socket.services';
import { useWalletStore } from '@/store/wallet.store';
import { TCurrencyTotal, TPaymentAccount, TWalletTransaction } from '@/types/payment.types';
import { formatMoney, groupTransactionsByDay } from '@/utils/payment.utils';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TotalsMetricCard = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <View style={styles.totalsMetricCard}>
    <Text style={styles.totalsLabel}>{label}</Text>
    {children}
  </View>
);

const CurrencyTotals = ({ totals, fallback }: { totals: TCurrencyTotal[]; fallback: string; }) => {
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

const TransactionRow = ({ item }: { item: TWalletTransaction; }) => {
  const earned = item.direction === 'earned';
  const signed = `${earned ? '+' : '-'}${formatMoney(item.amount, item.currency)}`;
  const subtitle = item.question
    ? `${item.counterparty.name} · ${item.question.title}`
    : item.counterparty.name;
  return (
    <View style={styles.txRow}>
      <View style={styles.txIconBox}>
        <Ionicons
          name={earned ? 'arrow-down-outline' : 'arrow-up-outline'}
          size={22}
          color={colors.PRIMARY}
        />
      </View>
      <View style={styles.txBody}>
        <View style={styles.txLeft}>
          <Text style={styles.txTitle} numberOfLines={1}>
            {earned ? 'Payment received' : 'Payment sent'}
          </Text>
          <Text style={styles.txSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <View style={styles.txRight}>
          <Text
            style={[styles.txAmount, earned && styles.txAmountEarned]}
            numberOfLines={1}
          >
            {signed}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.MEDIUM_GRAY} />
        </View>
      </View>
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
  const { wallet, loading, loadWallet, loadMore } = useWalletStore();
  // undefined = still loading, null = none/failed to load
  const [account, setAccount] = useState<TPaymentAccount | null | undefined>(undefined);

  // Reload on every focus — returning from payout onboarding (or any other
  // screen) must never show a stale setup CTA or stale totals.
  useFocusEffect(
    useCallback(() => {
      loadWallet();
      getPaymentAccountStatus()
        .then(setAccount)
        .catch(() => setAccount(null));
    }, [loadWallet]),
  );

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

  const payoutsActive = account?.payoutsEnabled === true;
  const accountLoading = account === undefined;
  const walletInitialLoading = wallet === null && loading;
  const showInitialLoading = accountLoading || walletInitialLoading;

  const transactionSections = useMemo(
    () => groupTransactionsByDay(wallet?.transactions.items ?? []),
    [wallet?.transactions.items],
  );
  const hasMoreTransactions = wallet?.transactions.pagination.hasMore === true;
  const showEndFooter = transactionSections.length > 0 && !hasMoreTransactions;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={screenChromeStyles.actionRow}>
        <BackButton />
      </View>
      <View style={[screenChromeStyles.titleRow, { marginBottom: 40 }]}>
        <ScreenTitle title="Wallet" />
        <Text style={screenChromeStyles.screenSubtitle}>Track earnings, spending, and payouts</Text>
      </View>

      {showInitialLoading ? (
        <ActivityIndicator
          testID="wallet-loading"
          size="large"
          color={colors.PRIMARY}
          style={styles.loading}
        />
      ) : (
        <>
          <View style={styles.payoutBannerShell}>
            {payoutsActive ? (
              <ScreenInfoBanner
                iconName="card-outline"
                label="Payouts active"
                labelStyle={styles.payoutActiveLabel}
              />
            ) : (
              <>
                <Text style={styles.payoutSetupDescription}>
                  We need a payout account so we know where to send it. Setup takes a few
                  minutes, and you only do it once.
                </Text>
                <CustomButton
                  text="Set up payout"
                  onPress={() => router.push('/wallet/onboarding')}
                  noTopMargin
                />
              </>
            )}
          </View>

          <SectionList
            style={styles.list}
            testID="wallet-transactions"
            sections={transactionSections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TransactionRow item={item} />}
            renderSectionHeader={({ section }) => (
              <Text style={styles.dayHeader}>{section.title}</Text>
            )}
            stickySectionHeadersEnabled={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            ListHeaderComponent={
              <View>
                <View style={styles.totalsRow}>
                  <TotalsMetricCard label="Earned">
                    <CurrencyTotals totals={earnedTotals} fallback={zeroFallback} />
                  </TotalsMetricCard>
                  <TotalsMetricCard label="Spent">
                    <CurrencyTotals totals={spentTotals} fallback={zeroFallback} />
                  </TotalsMetricCard>
                  <TotalsMetricCard label="Answered">
                    <Text style={styles.totalsValue}>
                      {wallet?.totals.questionsAnswered ?? 0}
                    </Text>
                  </TotalsMetricCard>
                </View>

                <Text style={styles.sectionTitle}>Transactions</Text>
              </View>
            }
            ListEmptyComponent={<Text style={styles.empty}>No transactions yet.</Text>}
            ListFooterComponent={
              showEndFooter ? (
                <Text style={styles.endFooter}>You&apos;ve reached the end!</Text>
              ) : null
            }
            contentContainerStyle={styles.listContent}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.BG_WHITE,
  },
  list: {
    flex: 1,
  },
  loading: {
    marginTop: 64,
  },
  payoutBannerShell: {
    paddingHorizontal: SCREEN_CHROME_HORIZONTAL_PADDING,
    marginBottom: 32,
  },
  payoutSetupDescription: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    lineHeight: 20,
    marginBottom: 12,
  },
  payoutActiveLabel: {
    fontFamily: fonts.FONT_FAMILY_BOLD,
    color: colors.SUCCESS_GREEN,
  },
  totalsMetricCard: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: 104,
    backgroundColor: colors.INPUT_BG,
    borderRadius: BORDER_RADIUS_INPUT,
    paddingHorizontal: 16,
    paddingVertical: 20,
    justifyContent: 'center',
    marginBottom: 0,
  },
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    marginBottom: 12,
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
    color: colors.PRIMARY,
  },
  sectionTitle: {
    fontFamily: fonts.FONT_FAMILY_BOLD,
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
    marginTop: 12,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: SCREEN_CHROME_HORIZONTAL_PADDING,
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
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.CARD_BORDER,
  },
  txIconBox: {
    width: CIRCULAR_CLICK_WIDTH,
    height: CIRCULAR_CLICK_HEIGHT,
    borderRadius: CIRCULAR_CLICK_WIDTH / 2,
    backgroundColor: colors.INPUT_BG,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  txBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minWidth: 0,
    gap: 8,
  },
  txLeft: {
    flex: 7,
    minWidth: 0,
    gap: 2,
  },
  txRight: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    minWidth: 0,
  },
  txTitle: {
    fontFamily: fonts.FONT_FAMILY_BOLD,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
  txSubtitle: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
  },
  txAmount: {
    flexShrink: 1,
    fontFamily: fonts.FONT_FAMILY_BOLD,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    textAlign: 'right',
  },
  txAmountEarned: {
    color: colors.SUCCESS_GREEN,
  },
  dayHeader: {
    fontFamily: fonts.FONT_FAMILY_BOLD,
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    letterSpacing: 0.6,
    marginTop: 32,
    marginBottom: 4,
  },
  endFooter: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    textAlign: 'center',
    marginTop: 24,
  },
});
