// components / Shared / CustomButton.tsx

import { colors } from '@/constants/colors';
import React from 'react';
import {
  ActivityIndicator, GestureResponderEvent,
  StyleSheet, Text,
  TouchableOpacity, View
} from 'react-native';


interface CustomButtonProps {
  text: string;
  onPress: ((event: GestureResponderEvent) => void) | undefined;
  loading?: boolean;
  disabled?: boolean;
  style?: Object;
  noTopMargin?: boolean;
  fullWidth?: boolean;
}
const CustomButton = ({
  onPress,
  text,
  loading,
  disabled,
  style,
  noTopMargin,
  fullWidth,
}: CustomButtonProps) => {
  const isInactive = loading || disabled;

  return (
    <View style={[fullWidth && styles.wrapFullWidth, style]}>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.btn,
          fullWidth && styles.btnFullWidth,
          noTopMargin && styles.btnNoTopMargin,
          isInactive && styles.btnDisabled,
        ]}
        disabled={isInactive}
        accessibilityState={{ disabled: isInactive }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={styles.actvIndicator.color} />
        ) : (
          <Text style={styles.text}>{text}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};


export default CustomButton;

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.PRIMARY,
    height: 50,
    borderRadius: 100,
    marginTop: 15,
    paddingHorizontal: 24,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnNoTopMargin: {
    marginTop: 0,
  },
  btnDisabled: {
    opacity: 0.8,
  },
  wrapFullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  btnFullWidth: {
    width: '100%',
  },
  text: {
    fontFamily: 'roboto-bold',
    fontSize: 20,
    color: colors.BG_WHITE,
  },
  actvIndicator: {
    color: colors.BG_WHITE,
  }
});