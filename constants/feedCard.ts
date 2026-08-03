import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { BORDER_RADIUS_INPUT } from './layout';

/** Home feed question card — shared surface for list cards and wallet summary. */
export const feedCardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.BG_WHITE,
    borderRadius: BORDER_RADIUS_INPUT,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.BG_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
});
