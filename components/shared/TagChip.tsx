import { chipStyles } from '@/constants/chips';
import React from 'react';
import { StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';

type TagChipProps = {
  label: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const TagChip = ({ label, style, textStyle }: TagChipProps) => (
  <View style={[chipStyles.tagContainer, style]}>
    <Text style={[chipStyles.tagText, textStyle]}>{label}</Text>
  </View>
);

export default TagChip;
