import { setAuthToken, setUnauthorizedHandler } from '@/config/axios.config';
import { useQuestionStore } from '@/store/question.store';
import { useRequestStore } from '@/store/request.store';
import { useUserStore } from '@/store/user.store';
import TUser from '@/types/user.types';
import { ssrSafeStorage } from '@/utils/ssr-safe-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  user: TUser | null;
  token: string | null;
  hasHydrated: boolean;
  login: (locationSharingEnabled: boolean, userData: TUser, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<TUser>) => void;
}

const hasValidSession = (token: string | null | undefined, user: TUser | null | undefined) =>
  !!(token && user);

const applySessionState = (
  set: (state: Partial<AuthState>) => void,
  token: string | null,
  user: TUser | null,
) => {
  const authenticated = hasValidSession(token, user);
  setAuthToken(authenticated ? token : null);
  set({
    token: authenticated ? token : null,
    user: authenticated ? user : null,
    isAuthenticated: authenticated,
  });
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      hasHydrated: false,

      login: async (_locationSharingEnabled: boolean, userData: TUser, token: string) => {
        applySessionState(set, token, userData);
      },

      logout: async () => {
        applySessionState(set, null, null);
        useQuestionStore.getState().clearQuestions();
        useRequestStore.getState().clearRequests();
        useUserStore.getState().clearProfile();
      },

      updateUser: (userData: Partial<TUser>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => ssrSafeStorage),
      skipHydration: true,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Error rehydrating auth storage:', error);
          applySessionState(useAuthStore.setState, null, null);
          useAuthStore.setState({ hasHydrated: true });
          return;
        }

        const token = state?.token ?? null;
        const user = state?.user ?? null;

        applySessionState(useAuthStore.setState, token, user);
        useAuthStore.setState({ hasHydrated: true });
      },
    },
  ),
);

setUnauthorizedHandler(async () => {
  await useAuthStore.getState().logout();
});

export const selectIsLoggedIn = (state: AuthState) =>
  state.hasHydrated && state.isAuthenticated && !!state.token && !!state.user;
