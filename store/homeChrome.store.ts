import { makeMutable } from 'react-native-reanimated';

/** 0 = chrome fully visible, 1 = chrome hidden (tab bar slid away, header collapsed). */
export const homeChromeProgress = makeMutable(0);
