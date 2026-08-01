jest.mock('@/services/payments.services', () => ({
  getWallet: jest.fn(),
}));

import { getWallet } from '@/services/payments.services';
import { useWalletStore } from '@/store/wallet.store';
import { TWallet, TWalletTransaction } from '@/types/payment.types';

const mockGetWallet = getWallet as jest.Mock;

const item = (id: string): TWalletTransaction => ({
  id,
  type: 'QUESTION_PAYMENT',
  status: 'SUCCEEDED',
  amount: 25,
  currency: 'USD',
  platformFee: 0,
  direction: 'earned',
  counterparty: { id: 'u1', name: 'Payer', username: 'payer' },
  question: { id: 'q1', title: 'Q' },
  answerRequestId: 'r1',
  failureReason: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const walletPage = (
  items: TWalletTransaction[],
  pagination: Partial<TWallet['transactions']['pagination']> = {},
): TWallet => ({
  totals: {
    earned: [{ currency: 'USD', amount: 45, count: 2 }],
    spent: [],
    questionsAnswered: 2,
  },
  transactions: {
    items,
    pagination: { page: 1, limit: 2, total: 3, hasMore: false, ...pagination },
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  useWalletStore.getState().reset();
});

describe('wallet store', () => {
  it('loads the first wallet page', async () => {
    mockGetWallet.mockResolvedValue(walletPage([item('a'), item('b')], { hasMore: true }));
    await useWalletStore.getState().loadWallet();
    expect(mockGetWallet).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(useWalletStore.getState().wallet?.transactions.items).toHaveLength(2);
    expect(useWalletStore.getState().loading).toBe(false);
  });

  it('swallows load errors and clears loading', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetWallet.mockRejectedValue(new Error('network'));
    await useWalletStore.getState().loadWallet();
    expect(useWalletStore.getState().wallet).toBeNull();
    expect(useWalletStore.getState().loading).toBe(false);
    consoleError.mockRestore();
  });

  it('does not re-enter while a load is in flight', async () => {
    let resolveFirst!: (value: TWallet) => void;
    mockGetWallet.mockImplementationOnce(
      () => new Promise<TWallet>((resolve) => (resolveFirst = resolve)),
    );
    const first = useWalletStore.getState().loadWallet();
    const second = useWalletStore.getState().loadWallet();
    resolveFirst(walletPage([item('a')]));
    await Promise.all([first, second]);
    expect(mockGetWallet).toHaveBeenCalledTimes(1);
  });

  it('appends the next page on loadMore', async () => {
    mockGetWallet.mockResolvedValueOnce(walletPage([item('a'), item('b')], { hasMore: true }));
    await useWalletStore.getState().loadWallet();

    mockGetWallet.mockResolvedValueOnce(
      walletPage([item('c')], { page: 2, hasMore: false }),
    );
    await useWalletStore.getState().loadMore();

    const wallet = useWalletStore.getState().wallet;
    expect(mockGetWallet).toHaveBeenLastCalledWith({ page: 2, limit: 2 });
    expect(wallet?.transactions.items.map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(wallet?.transactions.pagination.page).toBe(2);
  });

  it('skips loadMore when there are no more pages', async () => {
    mockGetWallet.mockResolvedValueOnce(walletPage([item('a')], { hasMore: false }));
    await useWalletStore.getState().loadWallet();
    await useWalletStore.getState().loadMore();
    expect(mockGetWallet).toHaveBeenCalledTimes(1);
  });

  it('skips loadMore before the first load', async () => {
    await useWalletStore.getState().loadMore();
    expect(mockGetWallet).not.toHaveBeenCalled();
  });

  it('clears loadMore errors', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetWallet.mockResolvedValueOnce(walletPage([item('a')], { hasMore: true }));
    await useWalletStore.getState().loadWallet();
    mockGetWallet.mockRejectedValueOnce(new Error('network'));
    await useWalletStore.getState().loadMore();
    expect(useWalletStore.getState().loading).toBe(false);
    expect(useWalletStore.getState().wallet?.transactions.items).toHaveLength(1);
    consoleError.mockRestore();
  });

  it('resets to the initial state', () => {
    useWalletStore.setState({ wallet: walletPage([item('a')]), loading: true });
    useWalletStore.getState().reset();
    expect(useWalletStore.getState()).toMatchObject({ wallet: null, loading: false });
  });
});
