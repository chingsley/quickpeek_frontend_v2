import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TRecentAddress = {
  userId: string;
  address: string;
  latitude: number;
  longitude: number;
  chosenAt: string;
};

interface RecentAddressState {
  recentAddress: TRecentAddress | null;
  setRecentAddress: (
    userId: string,
    address: string,
    latitude: number,
    longitude: number,
  ) => void;
  getRecentAddressForUser: (userId: string) => TRecentAddress | null;
  clearRecentAddress: () => void;
}

export const useRecentAddressStore = create<RecentAddressState>()(
  persist(
    (set, get) => ({
      recentAddress: null,

      setRecentAddress: (userId, address, latitude, longitude) => {
        set({
          recentAddress: {
            userId,
            address,
            latitude,
            longitude,
            chosenAt: new Date().toISOString(),
          },
        });
      },

      getRecentAddressForUser: (userId) => {
        const { recentAddress } = get();
        if (!recentAddress || recentAddress.userId !== userId) {
          return null;
        }
        return recentAddress;
      },

      clearRecentAddress: () => set({ recentAddress: null }),
    }),
    {
      name: 'recent-address-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        recentAddress: state.recentAddress,
      }),
    },
  ),
);
