import { colors } from '@/constants/colors';
import { Platform, TextInputProps } from 'react-native';

/**
 * Keeps native context menus and web text selection enabled so users can
 * copy, cut, and paste in form fields.
 */
export const TEXT_INPUT_CLIPBOARD_PROPS = {
  contextMenuHidden: false,
  editable: true,
  selectionColor: colors.PRIMARY,
} satisfies Pick<TextInputProps, 'contextMenuHidden' | 'editable' | 'selectionColor'>;

/**
 * iOS `decimal-pad` hides paste in the system menu — use a numeric-friendly
 * keyboard that still allows clipboard actions.
 */
export const PRICE_KEYBOARD_TYPE = Platform.select({
  ios: 'numbers-and-punctuation',
  android: 'decimal-pad',
  default: 'decimal-pad',
}) as TextInputProps['keyboardType'];

export const PRICE_INPUT_PROPS = {
  keyboardType: PRICE_KEYBOARD_TYPE,
  inputMode: 'decimal',
} satisfies Pick<TextInputProps, 'keyboardType' | 'inputMode'>;
