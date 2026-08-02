import { AnswerRequestStatus } from '@/types/answerRequest.types';
import {
  formatMoney,
  formatTransactionDate,
  getAppDeepLink,
  shouldShowMakePayment,
} from '@/utils/payment.utils';
import Constants from 'expo-constants';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { appOwnership: 'guest', expoConfig: {} },
}));

const mockConstants = Constants as unknown as {
  appOwnership: string | null;
  expoConfig: { scheme?: string; hostUri?: string };
};

beforeEach(() => {
  mockConstants.appOwnership = 'guest';
  mockConstants.expoConfig = {};
});

describe('formatMoney', () => {
  it('formats known currencies', () => {
    expect(formatMoney(25, 'USD')).toBe('$25.00');
    expect(formatMoney(0, 'USD')).toBe('$0.00');
  });

  it('falls back to "<CCY> <amount>" for invalid currency codes', () => {
    expect(formatMoney(1500, 'XXXX')).toBe('XXXX 1500.00');
  });
});

describe('formatTransactionDate', () => {
  it('renders a readable date', () => {
    expect(formatTransactionDate('2026-07-15T10:30:00.000Z')).toBe('Jul 15, 2026');
  });
});

describe('shouldShowMakePayment', () => {
  it('shows only for the questioner on an accepted, unpaid request', () => {
    expect(
      shouldShowMakePayment({
        isQuestioner: true,
        requestStatus: AnswerRequestStatus.Accepted,
        paymentStatus: null,
      }),
    ).toBe(true);
  });

  it('hides for responders', () => {
    expect(
      shouldShowMakePayment({
        isQuestioner: false,
        requestStatus: AnswerRequestStatus.Accepted,
        paymentStatus: null,
      }),
    ).toBe(false);
  });

  it('hides when the request is not accepted', () => {
    expect(
      shouldShowMakePayment({
        isQuestioner: true,
        requestStatus: AnswerRequestStatus.Pending,
        paymentStatus: null,
      }),
    ).toBe(false);
  });

  it('hides once payment succeeded', () => {
    expect(
      shouldShowMakePayment({
        isQuestioner: true,
        requestStatus: AnswerRequestStatus.Accepted,
        paymentStatus: 'SUCCEEDED',
      }),
    ).toBe(false);
  });

  it('shows again after a failed payment', () => {
    expect(
      shouldShowMakePayment({
        isQuestioner: true,
        requestStatus: AnswerRequestStatus.Accepted,
        paymentStatus: 'FAILED',
      }),
    ).toBe(true);
  });

  it('tolerates missing thread data', () => {
    expect(
      shouldShowMakePayment({
        isQuestioner: true,
        requestStatus: undefined,
        paymentStatus: undefined,
      }),
    ).toBe(false);
  });
});

describe('getAppDeepLink', () => {
  it('uses the app scheme outside Expo Go, always with a host', () => {
    mockConstants.appOwnership = 'standalone';
    mockConstants.expoConfig = { scheme: 'quickpeekfrontendv2' };
    expect(getAppDeepLink('/wallet/onboarding')).toBe(
      'quickpeekfrontendv2://wallet/onboarding',
    );
  });

  it('falls back to the bundled scheme when none is configured', () => {
    mockConstants.appOwnership = 'guest';
    mockConstants.expoConfig = {};
    expect(getAppDeepLink('wallet/onboarding')).toBe(
      'quickpeekfrontendv2://wallet/onboarding',
    );
  });

  it('builds an exp:// link with the Metro host in Expo Go', () => {
    mockConstants.appOwnership = 'expo';
    mockConstants.expoConfig = { hostUri: '192.168.1.10:8081' };
    expect(getAppDeepLink('/wallet/onboarding')).toBe(
      'exp://192.168.1.10:8081/--/wallet/onboarding',
    );
  });

  it('falls back to localhost when the host is unknown', () => {
    mockConstants.appOwnership = 'expo';
    mockConstants.expoConfig = {};
    expect(getAppDeepLink('/wallet/onboarding')).toBe(
      'exp://localhost:8081/--/wallet/onboarding',
    );
  });
});
