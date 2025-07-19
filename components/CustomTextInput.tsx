import { drawBorder } from '@/utils';
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
      placeholderTextColor='#a8b5db'
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
    color: '#333',
    fontSize: 18,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 10,
    minHeight: 100,
    borderWidth: 1,
  },
});