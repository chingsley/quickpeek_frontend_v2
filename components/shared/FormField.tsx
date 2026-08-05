import FormFieldFooter from '@/components/shared/FormFieldFooter';
import {
  FORM_FIELD_INPUT_PADDING_HORIZONTAL,
  formFieldLabelStyles,
} from '@/constants/formField';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { BORDER_RADIUS_INPUT } from '@/constants/layout';
import { TEXT_INPUT_CLIPBOARD_PROPS } from '@/constants/textInput';
import React from 'react';
import {
  KeyboardTypeOptions,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
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
  /** Error message in the footer row (left); also turns the border red. */
  error?: string | null;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  inputMode?: TextInputProps['inputMode'];
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Labeled form input with validation UX: red border on error, footer row with
 * the message on the left and an optional character counter on the right.
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
  inputMode,
  secureTextEntry,
  autoCapitalize,
  autoComplete,
  style,
  testID,
}: FormFieldProps) => (
  <View style={[styles.field, style]}>
    <Text style={formFieldLabelStyles.label}>{label}</Text>
    <TextInput
      {...TEXT_INPUT_CLIPBOARD_PROPS}
      style={[
        styles.input,
        multiline && styles.multiline,
        error ? styles.inputError : null,
        Platform.OS === 'web' && styles.inputWeb,
      ]}
      placeholder={placeholder}
      placeholderTextColor={colors.LIGHT_GRAY}
      value={value}
      onChangeText={onChangeText}
      maxLength={maxLength}
      multiline={multiline}
      keyboardType={keyboardType}
      inputMode={inputMode}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      autoComplete={autoComplete}
      textAlignVertical={multiline ? 'top' : 'center'}
      testID={testID}
    />
    <FormFieldFooter error={error} valueLength={value.length} maxLength={maxLength} />
  </View>
);

export default FormField;

const styles = StyleSheet.create({
  field: {
    width: '100%',
    alignSelf: 'stretch',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: 100,
    paddingHorizontal: FORM_FIELD_INPUT_PADDING_HORIZONTAL,
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
  inputWeb: {
    userSelect: 'text',
  } as TextStyle,
});
