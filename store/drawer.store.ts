import { DrawerMenuCategoryKey } from '@/constants/feedCategories';
import { create } from 'zustand';

export type DrawerMenuCategory = {
  key: DrawerMenuCategoryKey;
  title: string;
  count: number;
};

type DrawerState = {
  isOpen: boolean;
  menuCategories: DrawerMenuCategory[];
  selectedCategoryKey: DrawerMenuCategoryKey;
  settingsSheetVisible: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setMenuCategories: (categories: DrawerMenuCategory[]) => void;
  selectCategory: (key: DrawerMenuCategoryKey) => void;
  openSettingsSheet: () => void;
  closeSettingsSheet: () => void;
};

export const useDrawerStore = create<DrawerState>((set) => ({
  isOpen: false,
  menuCategories: [],
  selectedCategoryKey: 'all',
  settingsSheetVisible: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setMenuCategories: (categories) => set({ menuCategories: categories }),
  selectCategory: (key) => set({ selectedCategoryKey: key, isOpen: false }),
  openSettingsSheet: () => set({ settingsSheetVisible: true }),
  closeSettingsSheet: () => set({ settingsSheetVisible: false }),
}));
