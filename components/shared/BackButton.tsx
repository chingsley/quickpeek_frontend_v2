import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

interface IBackButtonProps {
  color?: string;
  style?: object;
}
const BackButton = ({ color, style }: IBackButtonProps) => {
  const router = useRouter();

  return (
    <Pressable style={style} onPress={() => router.back()}>
      <FontAwesome6 name="arrow-left-long" size={28} color={color || colors.BG_BLACK} />
    </Pressable>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  backArrow: {
    // paddingHorizontal: 10,
    borderWidth: 1,
  }
});