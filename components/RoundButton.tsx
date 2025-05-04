import { colors } from '@/constants/colors';
import { drawBorder } from '@/utils';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';


interface Props {
  onPress: () => void;
}

const RoundButton = ({ onPress }: Props) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={{
        ...drawBorder(colors.PRIMARY),
        borderWidth: 1,
        borderColor: colors.PRIMARY,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '50%'

      }}>
        <Ionicons name="arrow-forward" size={24} color={colors.PRIMARY} />
      </View>
    </TouchableOpacity>

  );
};

export default RoundButton;

const styles = StyleSheet.create({});