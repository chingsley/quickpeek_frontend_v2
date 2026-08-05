import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { fonts } from './fonts';

/** Footer row under form inputs — error left, character counter right. */
export const formFieldFooterStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 6,
    minHeight: 17,
  },
  errorSpacer: {
    flex: 1,
  },
  errorText: {
    flex: 1,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.RED,
    textAlign: 'left',
  },
  counter: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    textAlign: 'right',
    flexShrink: 0,
  },
});
