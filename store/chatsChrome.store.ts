import { makeMutable } from 'react-native-reanimated';

/** 0 = chats header fully visible, 1 = title/search/filters collapsed. */
export const chatsChromeProgress = makeMutable(0);

/**
 * Raw scroll-driven target (0–1) that `chatsChromeProgress` eases toward every
 * frame in `useChatsScrollChrome`.
 */
export const chatsChromeTargetProgress = makeMutable(0);
