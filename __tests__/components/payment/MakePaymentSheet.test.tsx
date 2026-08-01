import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import MakePaymentSheet from '@/components/payment/MakePaymentSheet';
import { payForRequest, verifyPayment } from '@/services/payments.services';
import { useStripe } from '@stripe/stripe-react-native';
import { TPaymentTransaction } from '@/types/payment.types';

jest.mock('@/services/payments.services', () => ({
  payForRequest: jest.fn(),
  verifyPayment: jest.fn(),
}));

jest.mock('@stripe/stripe-react-native', () => ({
  useStripe: jest.fn(),
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
const mockUseStripe = useStripe as jest.Mock;

const initPaymentSheet = jest.fn();
const presentPaymentSheet = jest.fn();

const transaction: TPaymentTransaction = {
  id: 'tx_1',
  provider: 'STRIPE',
  type: 'QUESTION_PAYMENT',
  status: 'PENDING',
  amount: 25,
  currency: 'USD',
  platformFee: 0,
  payerId: 'u1',
  payeeId: 'u2',
  questionId: 'q1',
  answerRequestId: 'r1',
  providerRef: 'pi_1',
  failureReason: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const stripeResponse = {
  transaction,
  stripe: { clientSecret: 'pi_1_secret', customerId: 'cus_1', ephemeralKey: 'ek_1' },
};

const renderSheet = (props: Partial<React.ComponentProps<typeof MakePaymentSheet>> = {}) =>
  render(
    <MakePaymentSheet
      visible
      onClose={jest.fn()}
      answerRequestId="r1"
      amount={25}
      currency="USD"
      {...props}
    />,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockUseStripe.mockReturnValue({ initPaymentSheet, presentPaymentSheet });
  initPaymentSheet.mockResolvedValue({});
  presentPaymentSheet.mockResolvedValue({});
  mockVerifyPayment.mockResolvedValue({ ...transaction, status: 'SUCCEEDED' });
});

describe('MakePaymentSheet', () => {
  it('shows the amount and hides when not visible', () => {
    const { rerender } = renderSheet();
    expect(screen.getByText('$25.00')).toBeTruthy();
    rerender(
      <MakePaymentSheet
        visible={false}
        onClose={jest.fn()}
        answerRequestId="r1"
        amount={25}
        currency="USD"
      />,
    );
    expect(screen.queryByText('$25.00')).toBeNull();
  });

  it('completes the Stripe flow and reports the paid transaction', async () => {
    mockPayForRequest.mockResolvedValue(stripeResponse);
    const onPaid = jest.fn();
    const onClose = jest.fn();
    renderSheet({ onPaid, onClose });

    fireEvent.press(screen.getByText('Pay $25.00'));

    await waitFor(() => expect(onPaid).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'tx_1', status: 'SUCCEEDED' }),
    ));
    expect(initPaymentSheet).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentIntentClientSecret: 'pi_1_secret',
        customerEphemeralKeySecret: 'ek_1',
        customerId: 'cus_1',
      }),
    );
    expect(mockVerifyPayment).toHaveBeenCalledWith('tx_1');
    expect(onClose).toHaveBeenCalled();
  });

  it('surfaces an initPaymentSheet error', async () => {
    mockPayForRequest.mockResolvedValue(stripeResponse);
    initPaymentSheet.mockResolvedValue({ error: { message: 'Bad client secret' } });
    renderSheet();

    fireEvent.press(screen.getByText('Pay $25.00'));
    expect(await screen.findByText('Bad client secret')).toBeTruthy();
    expect(presentPaymentSheet).not.toHaveBeenCalled();
  });

  it('surfaces a presentPaymentSheet failure', async () => {
    mockPayForRequest.mockResolvedValue(stripeResponse);
    presentPaymentSheet.mockResolvedValue({ error: { code: 'Failed', message: 'Card declined' } });
    renderSheet();

    fireEvent.press(screen.getByText('Pay $25.00'));
    expect(await screen.findByText('Card declined')).toBeTruthy();
  });

  it('returns quietly when the user cancels the payment sheet', async () => {
    mockPayForRequest.mockResolvedValue(stripeResponse);
    presentPaymentSheet.mockResolvedValue({ error: { code: 'Canceled', message: 'Canceled' } });
    renderSheet();

    fireEvent.press(screen.getByText('Pay $25.00'));
    await waitFor(() => expect(presentPaymentSheet).toHaveBeenCalled());
    expect(screen.queryByText('Card declined')).toBeNull();
    // Still on the confirm state — the payer can try again.
    expect(screen.getByText('Pay $25.00')).toBeTruthy();
  });

  it('shows the API error when initiating payment fails', async () => {
    mockPayForRequest.mockRejectedValue({
      response: { data: { error: 'The responder cannot receive payments yet' } },
    });
    renderSheet();

    fireEvent.press(screen.getByText('Pay $25.00'));
    expect(
      await screen.findByText('The responder cannot receive payments yet'),
    ).toBeTruthy();
  });

  it('shows a generic message for unexpected failures', async () => {
    mockPayForRequest.mockRejectedValue(new Error('network down'));
    renderSheet();

    fireEvent.press(screen.getByText('Pay $25.00'));
    expect(await screen.findByText(/failed to start/i)).toBeTruthy();
  });

  it('handles an unexpected pay response shape', async () => {
    mockPayForRequest.mockResolvedValue({ transaction });
    renderSheet();

    fireEvent.press(screen.getByText('Pay $25.00'));
    expect(await screen.findByText(/unexpected payment response/i)).toBeTruthy();
  });

  it('completes the Paystack flow via the hosted checkout', async () => {
    mockPayForRequest.mockResolvedValue({
      transaction: { ...transaction, provider: 'PAYSTACK' },
      paystack: { authorizationUrl: 'https://paystack.test/pay/ref_1' },
    });
    const onPaid = jest.fn();
    const onClose = jest.fn();
    renderSheet({ onPaid, onClose });

    fireEvent.press(screen.getByText('Pay $25.00'));
    const checkout = await screen.findByTestId('paystack-checkout');
    expect(checkout.props.authorizationUrl).toBe('https://paystack.test/pay/ref_1');

    fireEvent(checkout, 'onComplete');
    await waitFor(() => expect(onPaid).toHaveBeenCalled());
    expect(mockVerifyPayment).toHaveBeenCalledWith('tx_1');
    expect(onClose).toHaveBeenCalled();
  });

  it('shows an error when Paystack verification fails', async () => {
    mockPayForRequest.mockResolvedValue({
      transaction: { ...transaction, provider: 'PAYSTACK' },
      paystack: { authorizationUrl: 'https://paystack.test/pay/ref_1' },
    });
    mockVerifyPayment.mockRejectedValue(new Error('boom'));
    renderSheet();

    fireEvent.press(screen.getByText('Pay $25.00'));
    const checkout = await screen.findByTestId('paystack-checkout');
    fireEvent(checkout, 'onComplete');
    expect(await screen.findByText(/could not confirm/i)).toBeTruthy();
  });

  it('closes the Paystack checkout on cancel', async () => {
    mockPayForRequest.mockResolvedValue({
      transaction: { ...transaction, provider: 'PAYSTACK' },
      paystack: { authorizationUrl: 'https://paystack.test/pay/ref_1' },
    });
    renderSheet();

    fireEvent.press(screen.getByText('Pay $25.00'));
    const checkout = await screen.findByTestId('paystack-checkout');
    fireEvent(checkout, 'onCancel');
    await waitFor(() => expect(screen.queryByTestId('paystack-checkout')).toBeNull());
  });

  it('works without an onPaid callback', async () => {
    mockPayForRequest.mockResolvedValue(stripeResponse);
    const onClose = jest.fn();
    renderSheet({ onClose });

    fireEvent.press(screen.getByText('Pay $25.00'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
