import type { ViewStyle } from 'react-native';

const ALL = 0;
const SELECTIVE = 1;

type BorderDebugStyle = Pick<ViewStyle, 'borderWidth' | 'borderColor'>;

/** Temporary layout helper — toggle ALL or SELECTIVE to show debug borders. */
export const drawBorder = (color?: string, selected?: boolean): BorderDebugStyle => {
  const debugColor = color ?? 'red';

  if (ALL) {
    return { borderWidth: 1, borderColor: debugColor };
  }

  if (SELECTIVE && selected) {
    return { borderWidth: 1, borderColor: debugColor };
  }

  return { borderWidth: 0, borderColor: debugColor };
};
