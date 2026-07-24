import { makeMutable } from 'react-native-reanimated';

/** 0 = chrome fully visible, 1 = chrome hidden (tab bar slid away, header collapsed). */
export const homeChromeProgress = makeMutable(0);

/**
 * Raw scroll-driven target (0–1) that `homeChromeProgress` is eased toward every
 * frame by the per-frame smoother in `useHomeScrollChrome`. Splitting "raw
 * target" from "displayed value" is what lets the chrome glide on fast scrolls
 * instead of tracking the finger 1:1, while the direction / settle / bottom-lock
 * / short-list logic all still operate on the unfiltered target.
 */
export const chromeTargetProgress = makeMutable(0);
