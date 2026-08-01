import { AnswerRequestStatus } from '@/types/answerRequest.types';
import {
  formatMoney,
  formatTransactionDate,
  shouldShowMakePayment,
} from '@/utils/payment.utils';

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
