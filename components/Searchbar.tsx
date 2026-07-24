import { colors } from '@/constants/colors';
import { BORDER_RADIUS_PILL } from '@/constants/layout';
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
      <Image style={styles.searchIcon} source={icons.search} resizeMode="contain" tintColor={colors.PRIMARY} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.PLACEHOLDER}
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
    borderRadius: BORDER_RADIUS_PILL,
    paddingHorizontal: 16,
    backgroundColor: colors.INPUT_BG,
    minHeight: 48,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: colors.TEXT_DARK,
    fontSize: 16,
    paddingVertical: 12,
    paddingRight: 10,
  },
  label: {
    // default Text styling
  },

});