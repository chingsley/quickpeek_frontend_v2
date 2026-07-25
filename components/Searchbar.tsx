import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { BORDER_RADIUS_PILL } from '@/constants/layout';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

interface Props {
  placeholder: string;
  inputValue: string;
  setValue: (value: string) => void;
  /** Layout-only styles (e.g. margins). Box chrome lives in this component. */
  style?: StyleProp<ViewStyle>;
  returnKeyType?: TextInputProps['returnKeyType'];
  autoCorrect?: boolean;
}

const Searchbar = ({
  placeholder,
  inputValue,
  setValue,
  style,
  returnKeyType = 'search',
  autoCorrect = false,
}: Props) => {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="search-outline" size={20} color={colors.PRIMARY} style={styles.searchIcon} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.PLACEHOLDER}
        value={inputValue}
        onChangeText={setValue}
        style={styles.input}
        returnKeyType={returnKeyType}
        autoCorrect={autoCorrect}
      />
      {inputValue.length > 0 && (
        <Pressable
          onPress={() => setValue('')}
          style={styles.clearBtn}
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close-circle" size={18} color={colors.MEDIUM_GRAY} />
        </Pressable>
      )}
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
    borderWidth: 1,
    borderColor: colors.PRIMARY,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    paddingVertical: 12,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
});
