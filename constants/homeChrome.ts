/** How far the logo lifts with the header before staying pinned. */
export const HOME_LOGO_SCROLL_LIFT = 8;

/** Logo-only header height when chrome is collapsed. */
export const HOME_COLLAPSED_HEADER_HEIGHT = 48;

/**
 * Pixels of downward scroll (accumulated) required to fully hide chrome.
 * Higher = slower, more gradual fade/slide.
 */
export const HOME_CHROME_COLLAPSE_DISTANCE = 100;

/**
 * Progress (0–1) at which header/tab-bar opacity reaches zero.
 * Lower = fade completes earlier while slide/layout still finish gracefully.
 */
export const HOME_CHROME_FADE_OUT_END = 0.4;

/**
 * Progress (0–1) at which chrome slide is ~98% complete.
 * Slightly before full collapse so elements are off-screen once faded.
 */
export const HOME_CHROME_SLIDE_END = 0.85;

/** Collapsed FAB diameter. */
export const HOME_FAB_COLLAPSED_SIZE = 52;

/** Expanded FAB width (icon + label). */
export const HOME_FAB_EXPANDED_WIDTH = 190;

/** Max width for the FAB label when expanded (caps width during collapse animation). */
export const HOME_FAB_TEXT_MAX_WIDTH = 132;

/** Gap between the FAB icon and label when expanded. */
export const HOME_FAB_ICON_GAP = 6;

/** How close to the list end counts as "at bottom" for chrome locking. */
export const HOME_SCROLL_BOTTOM_LOCK_THRESHOLD = 8;
