import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import MakePaymentSheet from '@/components/payment/MakePaymentSheet.web';
import { payForRequest, verifyPayment } from '@/services/payments.services';
import { formatMoney } from '@/utils/payment.utils';
import { TPaymentTransaction } from '@/types/payment.types';

jest.mock('@/services/payments.services', () => ({
  payForRequest: jest.fn(),
  verifyPayment: jest.fn(),
}));

jest.mock('@/components/shared/BottomSheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, visible }: { children: React.ReactNode; visible: boolean }) =>
      visible ? React.createElement(View, null, children) : null,
  };
});

jest.mock('@/components/payment/PaystackWebView', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) =>
      React.createElement(View, { testID: 'paystack-checkout', ...props }),
  };
});

const mockPayForRequest = payForRequest as jest.Mock;
const mockVerifyPayment = verifyPayment as jest.Mock;

const transaction: TPaymentTransaction = {
  id: 'tx_1',
  provider: 'PAYSTACK',
  type: 'QUESTION_PAYMENT',
  status: 'PENDING',
  amount: 25,
  currency: 'NGN',
  platformFee: 0,
  payerId: 'u1',
  payeeId: 'u2',
  questionId: 'q1',
  answerRequestId: 'r1',
  providerRef: 'ref_1',
  failureReason: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const PAY_BUTTON = `Pay ${formatMoney(25, 'NGN')}`;

const renderSheet = (props: Partial<React.ComponentProps<typeof MakePaymentSheet>> = {}) =>
  render(
    <MakePaymentSheet
      visible
      onClose={jest.fn()}
      answerRequestId="r1"
      amount={25}
      currency="NGN"
      {...props}
    />,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockVerifyPayment.mockResolvedValue({ ...transaction, status: 'SUCCEEDED' });
});

describe('MakePaymentSheet (web)', () => {
  it('hides when not visible', () => {
    const { rerender } = renderSheet();
    expect(screen.getByText(PAY_BUTTON)).toBeTruthy();
    rerender(
      <MakePaymentSheet
        visible={false}
        onClose={jest.fn()}
        answerRequestId="r1"
        amount={25}
        currency="NGN"
      />,
    );
    expect(screen.queryByText(PAY_BUTTON)).toBeNull();
  });

  it('tells the user Stripe payments need the mobile app', async () => {
    mockPayForRequest.mockResolvedValue({
      transaction: { ...transaction, provider: 'STRIPE' },
      stripe: { clientSecret: 's', customerId: 'c', ephemeralKey: 'e' },
    });
    renderSheet();

    fireEvent.press(screen.getByText(PAY_BUTTON));
    expect(await screen.findByText(/only available in the QuickPeek mobile app/)).toBeTruthy();
  });

  it('completes the Paystack flow', async () => {
    mockPayForRequest.mockResolvedValue({
      transaction,
      paystack: { authorizationUrl: 'https://paystack.test/pay/ref_1' },
    });
    const onPaid = jest.fn();
    const onClose = jest.fn();
    renderSheet({ onPaid, onClose });

    fireEvent.press(screen.getByText(PAY_BUTTON));
    const checkout = await screen.findByTestId('paystack-checkout');
    fireEvent(checkout, 'onComplete');

    await waitFor(() => expect(onPaid).toHaveBeenCalled());
    expect(mockVerifyPayment).toHaveBeenCalledWith('tx_1');
    expect(onClose).toHaveBeenCalled();
  });

  it('works without an onPaid callback', async () => {
    mockPayForRequest.mockResolvedValue({
      transaction,
      paystack: { authorizationUrl: 'https://paystack.test/pay/ref_1' },
    });
    const onClose = jest.fn();
    renderSheet({ onClose });

    fireEvent.press(screen.getByText(PAY_BUTTON));
    const checkout = await screen.findByTestId('paystack-checkout');
    fireEvent(checkout, 'onComplete');
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('shows an error when Paystack verification fails', async () => {
    mockPayForRequest.mockResolvedValue({
      transaction,
      paystack: { authorizationUrl: 'https://paystack.test/pay/ref_1' },
    });
    mockVerifyPayment.mockRejectedValue(new Error('boom'));
    renderSheet();

    fireEvent.press(screen.getByText(PAY_BUTTON));
    const checkout = await screen.findByTestId('paystack-checkout');
    fireEvent(checkout, 'onComplete');
    expect(await screen.findByText(/could not confirm/i)).toBeTruthy();
  });

  it('closes the Paystack checkout on cancel', async () => {
    mockPayForRequest.mockResolvedValue({
      transaction,
      paystack: { authorizationUrl: 'https://paystack.test/pay/ref_1' },
    });
    renderSheet();

    fireEvent.press(screen.getByText(PAY_BUTTON));
    const checkout = await screen.findByTestId('paystack-checkout');
    fireEvent(checkout, 'onCancel');
    await waitFor(() => expect(screen.queryByTestId('paystack-checkout')).toBeNull());
  });

  it('handles an unexpected pay response shape', async () => {
    mockPayForRequest.mockResolvedValue({ transaction });
    renderSheet();

    fireEvent.press(screen.getByText(PAY_BUTTON));
    expect(await screen.findByText(/unexpected payment response/i)).toBeTruthy();
  });

  it('shows API and generic initiation errors', async () => {
    mockPayForRequest.mockRejectedValueOnce({ response: { data: { error: 'Not payable' } } });
    renderSheet();
    fireEvent.press(screen.getByText(PAY_BUTTON));
    expect(await screen.findByText('Not payable')).toBeTruthy();

    mockPayForRequest.mockRejectedValueOnce(new Error('network'));
    fireEvent.press(screen.getByText(PAY_BUTTON));
    expect(await screen.findByText(/failed to start/i)).toBeTruthy();
  });
});
