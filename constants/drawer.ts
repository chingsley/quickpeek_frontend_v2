import { colors } from './colors';
import { BORDER_RADIUS_BUTTON } from './layout';

export const DRAWER_SHIFT_RATIO = 0.68;
/** Scale of the shifted main view when the drawer is open (1 = no scale). */
export const DRAWER_SCALE = 0.93;
export const DRAWER_BORDER_RADIUS = BORDER_RADIUS_BUTTON;
export const DRAWER_ANIMATION_MS = 280;
/** Width of the visible menu panel — keeps content from sliding under the shifted main view. */
export const MENU_CONTENT_WIDTH_RATIO = 0.72;
/** @deprecated Import `colors.DRAWER_FADE_OVERLAY` from `@/constants/colors` instead. */
export const DRAWER_FADE_OVERLAY = colors.DRAWER_FADE_OVERLAY;
/** Height of the settings bottom sheet as a fraction of screen height (0–1). */
export const SETTINGS_SHEET_HEIGHT_RATIO = 0.9;

/** Padding below the safe-area inset before the brand row (`HomeSideMenu`). */
export const DRAWER_CONTENT_TOP_PADDING = 16;

/** Vertical gap below the brand row (above Ask a Question). */
export const DRAWER_BRAND_BOTTOM_MARGIN = 62;
export const DRAWER_ASK_BUTTON_BOTTOM_MARGIN = 100;


/**
 * Minimum space between the Ask a Question button and the CATEGORIES block.
 * The categories block is vertically centered in the remaining drawer height;
 * increase this if the heading sits too close to the button when the list is short.
 */
export const DRAWER_ASK_TO_CATEGORIES_GAP = 24;

/** Space below the CATEGORIES heading (above the category list). */
export const DRAWER_CATEGORY_HEADING_BOTTOM_GAP = 10;

/** Font size for the CATEGORIES label in the side menu. */
export const DRAWER_CATEGORY_HEADING_FONT_SIZE = 14;
/** Left inset for category heading + item text; also used as highlight inner padding. */
export const DRAWER_CATEGORY_ITEM_INSET = 12;
