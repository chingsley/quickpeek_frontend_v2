import { colors } from '@/constants/colors';
import { icons } from '@/constants/icons';
import React from 'react';
import { Image, StyleSheet, TextInput, View } from 'react-native';

interface Props {
  placeholder: string;
  inputValue: string;
  setValue: (value: string) => void;
}

const Searchbar = ({ placeholder, inputValue, setValue }: Props) => {
  // const [value, setValue] = useState(inputValue);
  return (
    <View style={styles.container}>
      <Image style={styles.searchIcon} source={icons.search} resizeMode="contain" tintColor='#333' />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor='#a8b5db'
        value={inputValue}
        onChangeText={(value) => setValue(value)}
        style={styles.input}
      />
    </View>
  );
};

export default Searchbar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingLeft: 20,
    backgroundColor: colors.BG_WHITE,
    height: 50
  },
  searchIcon: {
    width: 20,
    height: 20,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    color: '#333',
    height: '100%',
    fontSize: 20,
    paddingRight: 10,
  },
  label: {
    // default Text styling
  },

});