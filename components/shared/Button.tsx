// components / Shared / Button.tsx

import { colors } from '@/constants/colors';
import React from 'react';
import {
  ActivityIndicator, GestureResponderEvent,
  StyleSheet, Text,
  TouchableOpacity, View
} from 'react-native';


interface ButtonProps {
  text: string;
  onPress: ((event: GestureResponderEvent) => void) | undefined;
  loading?: boolean;
  disabled?: boolean;
  style?: Object;
}
const Button = ({ onPress, text, loading, disabled, style }: ButtonProps) => {
  return (
    <View style={style}>
      <TouchableOpacity
        onPress={onPress}
        style={styles.btn}
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


export default Button;

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.PRIMARY,
    height: 50,
    borderRadius: 10,
    marginTop: 15,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
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