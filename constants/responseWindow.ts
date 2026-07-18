export type ResponseWindowVariant = 'inline' | 'menu' | 'composer';

/** Switch between UX variants A (inline), B (menu), C (composer). */
export const RESPONSE_WINDOW_VARIANT: ResponseWindowVariant = 'inline';

export const RESPONSE_WINDOW_PRESETS = [
  { label: '15m', ms: 15 * 60 * 1000 },
  { label: '30m', ms: 30 * 60 * 1000 },
  { label: '1h', ms: 60 * 60 * 1000 },
  { label: '3h', ms: 3 * 60 * 60 * 1000 },
] as const;

export const MIN_RESPONSE_WINDOW_MS = 30 * 1000;
export const MAX_RESPONSE_WINDOW_MS = 24 * 60 * 60 * 1000;
