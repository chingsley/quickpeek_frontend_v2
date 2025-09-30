import { initializeAuthToken, setAuthToken } from '@/config/axios.config';
import { requestLocationPermissions, startLocationUpdates, stopLocationUpdates } from '@/services/location.services';
import TUser from '@/types/user.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  isLocationActive: boolean;
  user: TUser | null;
  token: string | null;
  login: (locationSharingEnabled: boolean, userData: TUser, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<TUser>) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLocationActive: false,
      user: null,
      token: null,

      initialize: async () => {
        await initializeAuthToken();
      },

      login: async (locationSharingEnabled: boolean, userData: TUser, token: string) => {
        // Set token in axios config
        setAuthToken(token);

        set({
          isAuthenticated: true,
          user: userData,
          token: token
        });

        if (locationSharingEnabled) {
          const hasPermissions = await requestLocationPermissions();
          if (hasPermissions) {
            await startLocationUpdates();
            set({ isLocationActive: true });
          }
        }
      },

      logout: async () => {
        const { isLocationActive } = get();

        // Clear token from axios config
        setAuthToken(null);

        set({
          isAuthenticated: false,
          user: null,
          token: null,
          isLocationActive: false
        });

        if (isLocationActive) {
          await stopLocationUpdates();
        }
      },

      updateUser: (userData: Partial<TUser>) => {
        set(state => ({
          user: state.user ? { ...state.user, ...userData } : null
        }));
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist these fields to avoid storing functions
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        isLocationActive: state.isLocationActive,
        user: state.user,
        token: state.token,
      }),
    }
  )
);