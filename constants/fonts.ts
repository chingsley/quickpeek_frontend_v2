/**
 * Typography tokens for QuickPeek.
 *
 * Custom Roboto files are registered as separate `fontFamily` names in
 * `app/_layout.tsx` (roboto, roboto-medium, roboto-bold, …). On native and web,
 * `fontWeight` does **not** change the glyph when the family already points at a
 * fixed TTF — use `FONT_FAMILY_*` to pick the weight you want.
 */
export const fonts = {
  FONT_SIZE_XL: 22,
  FONT_SIZE_MEDIUM: 18,
  FONT_SIZE_SMALL: 16,
  FONT_SIZE_XS: 14,
  /** Home filter tablet labels — between body small and section medium. */
  FONT_SIZE_TABLET: 17,

  /** Loaded custom font families — use these to set text weight in the app. */
  FONT_FAMILY_LIGHT: 'roboto-light',
  FONT_FAMILY_REGULAR: 'roboto',
  FONT_FAMILY_MEDIUM: 'roboto-medium',
  FONT_FAMILY_BOLD: 'roboto-bold',
  FONT_FAMILY_EXTRABOLD: 'roboto-extrabold',
};
