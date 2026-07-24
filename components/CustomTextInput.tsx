import { colors } from '@/constants/colors';
import { drawBorder } from '@/utils';
import { BORDER_RADIUS_INPUT } from '@/constants/layout';
import React from 'react';
import { StyleSheet, TextInput } from 'react-native';

interface Props {
  value: string;
  placeholder: string;
  handleTextChange: React.Dispatch<React.SetStateAction<string>>;
}

const CustomTextInput = ({ value, placeholder, handleTextChange }: Props) => {
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={colors.PLACEHOLDER}
      value={value}
      onChangeText={(value) => handleTextChange(value)}
      style={styles.textInput}
      multiline={true}
      numberOfLines={4} // Hint for Android, not a strict limit
    />
  );
};

export default CustomTextInput;

const styles = StyleSheet.create({
  textInput: {
    ...drawBorder(),
    color: colors.TEXT_BODY,
    fontSize: 18,
    backgroundColor: colors.INPUT_BG,
    borderRadius: BORDER_RADIUS_INPUT,
    paddingHorizontal: 10,
    minHeight: 100,
    borderWidth: 1,
  },
});