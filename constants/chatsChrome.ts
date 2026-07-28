import { CHAT_AVATAR_SIZE } from './layout';

export { HOME_SCROLL_BOTTOM_LOCK_THRESHOLD as CHATS_SCROLL_BOTTOM_LOCK_THRESHOLD } from './homeChrome';

/** Vertical padding on the chats toolbar row (paddingTop + paddingBottom). */
export const CHATS_TOOLBAR_VERTICAL_PADDING = 12;

/** Pinned toolbar height when the header is collapsed (back button + logo). */
export const CHATS_COLLAPSED_HEADER_HEIGHT = CHAT_AVATAR_SIZE + CHATS_TOOLBAR_VERTICAL_PADDING;

/**
 * Progress (0–1) at which header content opacity reaches zero.
 * Lower = fade completes earlier while slide/layout still finish gracefully.
 */
export const CHATS_CHROME_FADE_OUT_END = 0.4;

/**
 * Progress (0–1) at which header content slide is ~98% complete.
 * Slightly before full collapse so elements are off-screen once faded.
 */
export const CHATS_CHROME_SLIDE_END = 0.85;
