import { makeMutable } from 'react-native-reanimated';

/** 0 = chats header fully visible, 1 = title/search/filters collapsed. */
export const chatsChromeProgress = makeMutable(0);

/**
 * Raw scroll-driven target (0–1) that `chatsChromeProgress` eases toward every
 * frame in `useChatsScrollChrome`.
 */
export const chatsChromeTargetProgress = makeMutable(0);

/** Measured expanded height of the chats header shell. */
export const chatsExpandedHeaderHeight = makeMutable(220);

/**
 * Scrollable distance of the chats list measured while the chrome is fully
 * expanded. The footer spacer grows by the deficit between the expanded
 * header height and this value as the chrome collapses, so the collapse can
 * never make the content stop scrolling (no short-list flicker loop) while
 * adding only as much blank tail as the geometry strictly requires.
 */
export const chatsBaseMaxScrollY = makeMutable(0);
