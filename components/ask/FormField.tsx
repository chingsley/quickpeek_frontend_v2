import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { BORDER_RADIUS_INPUT } from '@/constants/layout';
import React from 'react';
import {
  KeyboardTypeOptions,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Shows a live "x / max" counter and caps the input length. */
  maxLength?: number;
  /** Error message shown below the input; also turns the border red. */
  error?: string | null;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Labeled form input with the validation UX built in: a live character
 * counter, a red border + message for errors. Used by the ask form so limits
 * are communicated where they happen, not after a failed submit.
 */
const FormField = ({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
  error,
  multiline,
  keyboardType,
  style,
  testID,
}: FormFieldProps) => (
  <View style={style}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.multiline, error ? styles.inputError : null]}
      placeholder={placeholder}
      placeholderTextColor={colors.LIGHT_GRAY}
      value={value}
      onChangeText={onChangeText}
      maxLength={maxLength}
      multiline={multiline}
      keyboardType={keyboardType}
      textAlignVertical={multiline ? 'top' : 'center'}
      testID={testID}
    />
    {maxLength ? (
      <Text style={styles.counter}>
        {value.length} / {maxLength}
      </Text>
    ) : null}
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

export default FormField;

const styles = StyleSheet.create({
  label: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    marginBottom: 8,
    marginTop: 12,
  },
  counter: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    marginTop: 6,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    backgroundColor: colors.BG_WHITE,
  },
  multiline: {
    minHeight: 100,
    lineHeight: 22,
    borderRadius: BORDER_RADIUS_INPUT,
  },
  inputError: {
    borderColor: colors.RED,
  },
  errorText: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.RED,
    marginTop: 6,
  },
});
