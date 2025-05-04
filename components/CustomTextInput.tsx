import { drawBorder } from '@/utils';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

interface Props {
  value: string;
  placeholder: string;
  handleTextChange: React.Dispatch<React.SetStateAction<string>>;
}

const CustomTextInput = ({ value, placeholder, handleTextChange }: Props) => {
  return (
    <View style={{
      height: 50,
      ...drawBorder('red'),
    }}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor='#a8b5db'
        value={value}
        onChangeText={(value) => handleTextChange(value)}
        style={styles.textInput}
      />
    </View>
  );
};

export default CustomTextInput;

const styles = StyleSheet.create({
  textInput: {
    ...drawBorder(),
    color: '#333',
    height: '100%',
    fontSize: 18,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
});