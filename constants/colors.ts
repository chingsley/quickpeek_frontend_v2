/**
 * Central color palette for QuickPeek.
 * Import `colors` and reference these tokens — do not hardcode hex/rgba values elsewhere.
 */
export const colors = {
  // Brand
  PRIMARY: '#0c538f',
  SECONDARY: '#dcedf3',
  ACTIVE: '#CB2AF7',

  // Neutrals — backgrounds
  BG_WHITE: '#FFFFFF',
  BG_BLACK: '#000000',
  DARK_WHITE: '#F0F0F0',
  CARD_BG: '#F8F9FA',
  INPUT_BG: '#F5F5F5',
  // INPUT_BG: '#eff3f6',
  MAP_PLACEHOLDER_BG: '#E8EDF2',

  // Neutrals — borders & dividers
  CARD_BORDER: '#E8EAED',
  BORDER_GRAY: '#CCCCCC',
  LIGHT_GRAY: '#d2dae2',
  LIGHT_GRAY_THIN: '#dddddd80',

  // Neutrals — text
  TEXT_DARK: '#1A1A2E',
  TEXT_BODY: '#333333',
  MEDIUM_GRAY: '#888888',
  DARK_GRAY: '#485460',
  TEXT_ON_PRIMARY_MUTED: 'rgba(255, 255, 255, 0.7)',

  // Placeholders
  PLACEHOLDER: '#7a7b80',
  PLACEHOLDER_SEARCH: '#a8b5db',

  // Semantic
  RED: '#FF0000',
  SUCCESS_GREEN: '#1DB954',
  LINK: '#007AFF',

  // Tinted backgrounds
  LIGHT_BLUE: '#DFF1FF',
  LIGHT_GREEN: '#E8FFEB',
  LIGHT_PINK: '#FFECEF',
  LIGHT_GOLD: '#FDF1DC',
  LIGHT_RED: '#FFE1E1',

  // Accent
  STAR_GOLD: '#F5A623',

  // Overlays, shadows & utility
  TRANSPARENT: 'transparent',
  BACKDROP_DARK: 'rgba(0, 0, 0, 0.4)',
  BACKDROP_LIGHT: 'rgba(0, 0, 0, 0.12)',
  DRAWER_FADE_OVERLAY: 'rgba(255, 255, 255, 0.52)',
  SHADOW_MEDIUM: 'rgba(0, 0, 0, 0.07)',
  SHADOW_SOFT: 'rgba(0, 0, 0, 0.035)',
} as const;

export type ColorKey = keyof typeof colors;
