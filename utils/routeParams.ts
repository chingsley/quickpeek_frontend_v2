/** Normalize expo-router search params (web may return string | string[]). */
export const normalizeRouteParam = (value: string | string[] | undefined): string | undefined => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
};
