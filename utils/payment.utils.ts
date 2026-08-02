import { AnswerRequestStatus } from '@/types/answerRequest.types';
import { TTransactionStatus } from '@/types/payment.types';
import Constants from 'expo-constants';

/**
 * Deep link back into the app for provider-hosted flows (Stripe onboarding
 * return/refresh). The URL always carries a host — hostless forms like
 * `scheme:///path` are rejected by Stripe's URL validation. In Expo Go the
 * app scheme doesn't exist, so use the exp:// Metro link instead.
 */
export const getAppDeepLink = (path: string): string => {
  const cleanPath = path.replace(/^\//, '');
  if (Constants.appOwnership !== 'expo') {
    const scheme = Constants.expoConfig?.scheme ?? 'quickpeekfrontendv2';
    return `${scheme}://${cleanPath}`;
  }
  const hostUri = Constants.expoConfig?.hostUri ?? 'localhost:8081';
  return `exp://${hostUri}/--/${cleanPath}`;
};

/**
 * Currency display. Falls back to a plain prefix when the runtime rejects
 * the currency code (malformed codes would otherwise crash rendering).
 */
export const formatMoney = (amount: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

/** "Jul 15, 2026" style dates for the wallet transaction list. */
export const formatTransactionDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

/**
 * The chat "Make payment" action is available to the questioner while the
 * request is accepted and no successful payment exists yet (PENDING/FAILED
 * attempts may be retried).
 */
export const shouldShowMakePayment = (opts: {
  isQuestioner: boolean;
  requestStatus: AnswerRequestStatus | undefined;
  paymentStatus: TTransactionStatus | null | undefined;
}): boolean =>
  opts.isQuestioner &&
  opts.requestStatus === AnswerRequestStatus.Accepted &&
  opts.paymentStatus !== 'SUCCEEDED';
