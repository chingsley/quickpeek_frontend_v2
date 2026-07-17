import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

const isClient = () => typeof window !== 'undefined';

export const ssrSafeStorage: StateStorage = {
  getItem: (name) => {
    if (!isClient()) {
      return Promise.resolve(null);
    }
    return AsyncStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (!isClient()) {
      return Promise.resolve();
    }
    return AsyncStorage.setItem(name, value);
  },
  removeItem: (name) => {
    if (!isClient()) {
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(name);
  },
};
