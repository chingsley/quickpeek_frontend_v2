import { getWallet } from '@/services/payments.services';
import { TWallet } from '@/types/payment.types';
import { create } from 'zustand';

const WALLET_PAGE_SIZE = 20;

interface WalletState {
  wallet: TWallet | null;
  loading: boolean;
  /** Loads (or reloads) the first wallet page. Safe to call repeatedly. */
  loadWallet: () => Promise<void>;
  /** Appends the next transactions page when the server says there is one. */
  loadMore: () => Promise<void>;
  reset: () => void;
}

/**
 * Wallet dashboard state. Totals and the first transaction page load
 * together; older transactions page in via `loadMore`. Refreshed on
 * `payment:*` socket events and on screen focus.
 */
export const useWalletStore = create<WalletState>((set, get) => ({
  wallet: null,
  loading: false,

  loadWallet: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const wallet = await getWallet({ page: 1, limit: WALLET_PAGE_SIZE });
      set({ wallet, loading: false });
    } catch (error) {
      console.error('Failed to load wallet', error);
      set({ loading: false });
    }
  },

  loadMore: async () => {
    const { wallet, loading } = get();
    if (loading || !wallet || !wallet.transactions.pagination.hasMore) return;

    set({ loading: true });
    try {
      const { page, limit } = wallet.transactions.pagination;
      const next = await getWallet({ page: page + 1, limit });
      set({
        wallet: {
          totals: next.totals,
          transactions: {
            items: [...wallet.transactions.items, ...next.transactions.items],
            pagination: next.transactions.pagination,
          },
        },
        loading: false,
      });
    } catch (error) {
      console.error('Failed to load more transactions', error);
      set({ loading: false });
    }
  },

  reset: () => set({ wallet: null, loading: false }),
}));
