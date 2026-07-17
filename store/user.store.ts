import { TUser } from '@/types/user.types';
import { create } from 'zustand';
import { getUserProfile, updateUserProfile, uploadProfileImage } from '@/services/users.services';

interface UserState {
  profile: TUser | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<TUser | null>;
  updateProfile: (updates: Partial<TUser>) => Promise<TUser | null>;
  uploadProfileImage: (imageUri: string) => Promise<TUser | null>;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  loading: false,
  error: null,

  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getUserProfile();
      set({ profile: data, loading: false });
      return data;
    } catch (error: any) {
      set({ loading: false, error: error?.message || 'Failed to load profile' });
      return null;
    }
  },

  updateProfile: async (updates) => {
    set({ loading: true, error: null });
    try {
      const data = await updateUserProfile(updates);
      set({ profile: data, loading: false });
      return data;
    } catch (error: any) {
      set({ loading: false, error: error?.message || 'Failed to update profile' });
      return null;
    }
  },

  uploadProfileImage: async (imageUri) => {
    set({ loading: true, error: null });
    try {
      const data = await uploadProfileImage(imageUri);
      set({ profile: data, loading: false });
      return data;
    } catch (error: any) {
      set({ loading: false, error: error?.message || 'Failed to upload profile image' });
      return null;
    }
  },

  clearProfile: () => set({ profile: null, error: null, loading: false }),
}));
