import { AnswerRequestStatus } from '@/types/answerRequest.types';
import {
  formatMoney,
  formatTransactionDate,
  formatTransactionDayHeader,
  getAppDeepLink,
  groupTransactionsByDay,
  shouldShowMakePayment,
} from '@/utils/payment.utils';
import Constants from 'expo-constants';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { appOwnership: 'guest', expoConfig: {} },
}));

const mockConstants = Constants as unknown as {
  appOwnership: string | null;
  expoConfig: { scheme?: string; hostUri?: string; };
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

describe('formatTransactionDayHeader', () => {
  it('renders the bank-style uppercase day header', () => {
    expect(formatTransactionDayHeader('2026-08-01T10:30:00.000Z')).toBe('SAT, AUG 01, 2026');
    expect(formatTransactionDayHeader('2026-07-15T10:30:00.000Z')).toBe('WED, JUL 15, 2026');
  });
});

describe('groupTransactionsByDay', () => {
  const item = (id: string, createdAt: string) => ({ id, createdAt });

  it('groups consecutive same-day items under one header, preserving order', () => {
    const items = [
      item('a', '2026-08-01T10:00:00.000Z'),
      item('b', '2026-08-01T09:00:00.000Z'),
      item('c', '2026-07-25T12:00:00.000Z'),
      item('d', '2026-07-22T12:00:00.000Z'),
      item('e', '2026-07-22T11:00:00.000Z'),
    ];
    const sections = groupTransactionsByDay(items);
    expect(sections.map((s) => s.title)).toEqual([
      'SAT, AUG 01, 2026',
      'SAT, JUL 25, 2026',
      'WED, JUL 22, 2026',
    ]);
    expect(sections[0].data.map((i) => i.id)).toEqual(['a', 'b']);
    expect(sections[2].data.map((i) => i.id)).toEqual(['d', 'e']);
  });

  it('handles an empty list', () => {
    expect(groupTransactionsByDay([])).toEqual([]);
  });
});
