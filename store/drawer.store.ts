import { DrawerMenuSectionKey } from '@/constants/feedSections';
import { create } from 'zustand';

export type DrawerMenuSection = {
  key: DrawerMenuSectionKey;
  title: string;
  count: number;
};

type DrawerState = {
  isOpen: boolean;
  menuSections: DrawerMenuSection[];
  selectedSectionKey: DrawerMenuSectionKey;
  settingsSheetVisible: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setMenuSections: (sections: DrawerMenuSection[]) => void;
  selectSection: (key: DrawerMenuSectionKey) => void;
  openSettingsSheet: () => void;
  closeSettingsSheet: () => void;
};

export const useDrawerStore = create<DrawerState>((set) => ({
  isOpen: false,
  menuSections: [],
  selectedSectionKey: 'all',
  settingsSheetVisible: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setMenuSections: (sections) => set({ menuSections: sections }),
  selectSection: (key) => set({ selectedSectionKey: key, isOpen: false }),
  openSettingsSheet: () => set({ settingsSheetVisible: true }),
  closeSettingsSheet: () => set({ settingsSheetVisible: false }),
}));
