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
}
const CustomButton = ({ onPress, text, loading, disabled, style, noTopMargin }: CustomButtonProps) => {
  return (
    <View style={style}>
      <TouchableOpacity
        onPress={onPress}
        style={[styles.btn, noTopMargin && styles.btnNoTopMargin]}
        disabled={loading || disabled}
      >
        {
          loading ?
            <ActivityIndicator size={'small'} color={styles.actvIndicator.color} />
            :
            <Text style={styles.text}>{text}</Text>
        }
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
  text: {
    fontFamily: 'roboto-bold',
    fontSize: 20,
    color: colors.BG_WHITE,
  },
  actvIndicator: {
    color: colors.BG_WHITE,
  }
});