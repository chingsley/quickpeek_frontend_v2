import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { fonts } from './fonts';

/** Horizontal padding inside pill / bordered form inputs. */
export const FORM_FIELD_INPUT_PADDING_HORIZONTAL = 14;

/** Shared label above form inputs — inset aligns with curved input text start. */
export const formFieldLabelStyles = StyleSheet.create({
  label: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    marginBottom: 8,
    marginTop: 12,
    paddingLeft: FORM_FIELD_INPUT_PADDING_HORIZONTAL,
    textAlign: 'left',
  },
});

/** Footer row under form inputs — error left, character counter right. */
export const formFieldFooterStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 6,
    minHeight: 17,
    paddingLeft: FORM_FIELD_INPUT_PADDING_HORIZONTAL,
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
