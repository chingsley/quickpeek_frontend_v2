import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import WalletScreen from '@/app/wallet/index';
import { getPaymentAccountStatus, getWallet } from '@/services/payments.services';
import SocketService from '@/services/socket.services';
import { useWalletStore } from '@/store/wallet.store';
import { TPaymentAccount, TWallet, TWalletTransaction } from '@/types/payment.types';

const mockPush = jest.fn();
const mockFocusCallbacks: (() => void)[] = [];
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({ push: mockPush, back: jest.fn() }),
    useFocusEffect: (cb: () => void) => {
      React.useEffect(() => cb(), [cb]);
      if (!mockFocusCallbacks.includes(cb)) mockFocusCallbacks.push(cb);
    },
  };
});
const triggerFocus = () => {
  mockFocusCallbacks.forEach((cb) => cb());
};

jest.mock('@/services/payments.services', () => ({
  getWallet: jest.fn(),
  getPaymentAccountStatus: jest.fn(),
}));

jest.mock('@/services/socket.services', () => ({
  __esModule: true,
  default: { getSocket: jest.fn() },
}));

const mockGetWallet = getWallet as jest.Mock;
const mockGetStatus = getPaymentAccountStatus as jest.Mock;
const mockGetSocket = SocketService.getSocket as jest.Mock;

const activeAccount: TPaymentAccount = {
  id: 'pa_1',
  provider: 'STRIPE',
  currency: 'USD',
  status: 'ACTIVE',
  payoutsEnabled: true,
  customerId: 'cus_1',
  connectedAccountId: 'acct_1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const tx = (overrides: Partial<TWalletTransaction>): TWalletTransaction => ({
  id: Math.random().toString(36).slice(2),
  type: 'QUESTION_PAYMENT',
  status: 'SUCCEEDED',
  amount: 25,
  currency: 'USD',
  platformFee: 0,
  direction: 'earned',
  counterparty: { id: 'u1', name: 'Payer Pete', username: 'pete' },
  question: { id: 'q1', title: 'Best tacos nearby?' },
  answerRequestId: 'r1',
  failureReason: null,
  createdAt: '2026-07-15T10:30:00.000Z',
  updatedAt: '2026-07-15T10:30:00.000Z',
  ...overrides,
});

const wallet = (
  items: TWalletTransaction[],
  totals: Partial<TWallet['totals']> = {},
  hasMore = false,
): TWallet => ({
  totals: {
    earned: [{ currency: 'USD', amount: 45, count: 2 }],
    spent: [{ currency: 'USD', amount: 50, count: 2 }],
    questionsAnswered: 2,
    ...totals,
  },
  transactions: {
    items,
    pagination: { page: 1, limit: 20, total: items.length, hasMore },
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFocusCallbacks.length = 0;
  useWalletStore.getState().reset();
  mockGetSocket.mockReturnValue(null);
  mockGetStatus.mockResolvedValue(activeAccount);
});

describe('WalletScreen', () => {
  it('shows a loading indicator while the first page loads', () => {
    mockGetWallet.mockImplementation(() => new Promise(() => { }));
    useWalletStore.setState({ wallet: null, loading: true });
    render(<WalletScreen />);
    expect(screen.getByTestId('wallet-loading')).toBeTruthy();
  });

  it('waits for payout account status before showing body content', () => {
    mockGetWallet.mockResolvedValue(wallet([]));
    mockGetStatus.mockImplementation(() => new Promise(() => { }));
    render(<WalletScreen />);
    expect(screen.getByTestId('wallet-loading')).toBeTruthy();
    expect(screen.queryByText('Payouts active')).toBeNull();
    expect(screen.queryByTestId('wallet-transactions')).toBeNull();
  });

  it('renders totals and the grouped transaction list', async () => {
    mockGetWallet.mockResolvedValue(
      wallet([
        tx({ id: 't1', direction: 'earned', amount: 25 }),
        tx({ id: 't2', direction: 'spent', amount: 30, question: null, status: 'PENDING' }),
        tx({ id: 't3', direction: 'earned', amount: 20, status: 'FAILED' }),
        tx({ id: 't4', direction: 'spent', amount: 15, status: 'SUCCEEDED' }),
      ]),
    );
    render(<WalletScreen />);

    expect(await screen.findByText('$45.00')).toBeTruthy(); // earned
    expect(screen.getByText('$50.00')).toBeTruthy(); // spent
    expect(screen.getByText('2')).toBeTruthy(); // questions answered

    // One day-group header for the shared fixture date.
    expect(screen.getByText('WED, JUL 15, 2026')).toBeTruthy();

    // Row titles/subtitles.
    expect(screen.getAllByText('Payment received')).toHaveLength(2);
    expect(screen.getAllByText('Payment sent')).toHaveLength(2);
    expect(screen.getAllByText('Payer Pete · Best tacos nearby?')).toHaveLength(3);
    expect(screen.getByText('Payer Pete')).toBeTruthy();

    // Amounts.
    expect(screen.getByText('+$25.00')).toBeTruthy();
    expect(screen.getByText('-$30.00')).toBeTruthy();

    // End-of-list footer.
    expect(screen.getByText("You've reached the end!")).toBeTruthy();
  });

  it('shows zero totals for an empty wallet', async () => {
    mockGetWallet.mockResolvedValue(
      wallet([], { earned: [], spent: [], questionsAnswered: 0 }),
    );
    render(<WalletScreen />);
    expect(await screen.findAllByText('$0.00')).toHaveLength(2);
    expect(screen.getByText('No transactions yet.')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.queryByText("You've reached the end!")).toBeNull();
  });

  it('renders fallback content when the wallet fails to load', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetWallet.mockRejectedValue(new Error('network'));
    render(<WalletScreen />);
    expect(await screen.findAllByText('$0.00')).toHaveLength(2);
    expect(screen.getByText('No transactions yet.')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.queryByText("You've reached the end!")).toBeNull();
    consoleError.mockRestore();
  });

  it('prompts payout setup when there is no account and navigates on press', async () => {
    mockGetWallet.mockResolvedValue(wallet([]));
    mockGetStatus.mockResolvedValue(null);
    render(<WalletScreen />);

    expect(
      await screen.findByText(/we need a payout account so we know where to send it/i),
    ).toBeTruthy();
    const cta = await screen.findByText('Set up payout');
    fireEvent.press(cta);
    expect(mockPush).toHaveBeenCalledWith('/wallet/onboarding');
  });

  it('prompts to finish setup while payouts are disabled', async () => {
    mockGetWallet.mockResolvedValue(wallet([]));
    mockGetStatus.mockResolvedValue({ ...activeAccount, payoutsEnabled: false, status: 'ONBOARDING' });
    render(<WalletScreen />);

    const cta = await screen.findByText('Set up payout');
    fireEvent.press(cta);
    expect(mockPush).toHaveBeenCalledWith('/wallet/onboarding');
  });

  it('shows payouts as active once enabled', async () => {
    mockGetWallet.mockResolvedValue(wallet([]));
    render(<WalletScreen />);
    expect(await screen.findByText('Payouts active')).toBeTruthy();
    expect(screen.queryByText('Set up payout')).toBeNull();
    expect(screen.queryByText(/we need a payout account/i)).toBeNull();
  });

  it('treats an account status failure as no account', async () => {
    mockGetWallet.mockResolvedValue(wallet([]));
    mockGetStatus.mockRejectedValue(new Error('network'));
    render(<WalletScreen />);
    expect(await screen.findByText('Set up payout')).toBeTruthy();
  });

  it('renders multi-currency totals', async () => {
    mockGetWallet.mockResolvedValue(
      wallet([], {
        earned: [
          { currency: 'USD', amount: 45, count: 2 },
          { currency: 'NGN', amount: 5000, count: 1 },
        ],
        spent: [{ currency: 'NGN', amount: 2500, count: 1 }],
        questionsAnswered: 3,
      }),
    );
    render(<WalletScreen />);
    expect(await screen.findByText('$45.00')).toBeTruthy();
    expect(screen.getByText(/5,000/)).toBeTruthy();
    expect(screen.getByText(/2,500/)).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('loads more transactions at the list end', async () => {
    mockGetWallet.mockResolvedValue(wallet([tx({ id: 't1' })], {}, true));
    render(<WalletScreen />);
    await screen.findByText('+$25.00');
    expect(screen.queryByText("You've reached the end!")).toBeNull();

    fireEvent(screen.getByTestId('wallet-transactions'), 'onEndReached');
    await waitFor(() => expect(mockGetWallet).toHaveBeenCalledTimes(2));
    expect(mockGetWallet).toHaveBeenLastCalledWith({ page: 2, limit: 20 });
  });

  it('refreshes wallet and account status when the screen regains focus', async () => {
    mockGetWallet.mockResolvedValue(wallet([]));
    render(<WalletScreen />);
    await screen.findByText('No transactions yet.');
    expect(mockGetStatus).toHaveBeenCalledTimes(1);
    expect(mockGetWallet).toHaveBeenCalledTimes(1);

    triggerFocus();
    await waitFor(() => expect(mockGetStatus).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(mockGetWallet).toHaveBeenCalledTimes(2));
  });

  it('refreshes when payment socket events arrive', async () => {
    const listeners: Record<string, () => void> = {};
    const fakeSocket = {
      on: jest.fn((event: string, cb: () => void) => {
        listeners[event] = cb;
      }),
      off: jest.fn(),
    };
    mockGetSocket.mockReturnValue(fakeSocket);
    mockGetWallet.mockResolvedValue(wallet([]));
    render(<WalletScreen />);
    await screen.findByText('No transactions yet.');
    expect(mockGetWallet).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(fakeSocket.on).toHaveBeenCalledWith('payment:received', expect.any(Function)));
    listeners['payment:received']();
    await waitFor(() => expect(mockGetWallet).toHaveBeenCalledTimes(2));
    listeners['payment:succeeded']();
    await waitFor(() => expect(mockGetWallet).toHaveBeenCalledTimes(3));
    listeners['payment:failed']();
    await waitFor(() => expect(mockGetWallet).toHaveBeenCalledTimes(4));
  });
});
