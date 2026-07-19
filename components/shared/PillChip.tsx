import { chipStyles } from '@/constants/chips';
import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  Text,
  ViewStyle,
} from 'react-native';

type PillChipProps = Omit<PressableProps, 'children'> & {
  label: string;
  active?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const PillChip = ({ label, active, icon, style, ...pressableProps }: PillChipProps) => (
  <Pressable
    style={[chipStyles.pillContainer, active && chipStyles.pillContainerActive, style]}
    {...pressableProps}
  >
    {icon}
    <Text style={[chipStyles.pillText, active && chipStyles.pillTextActive]}>{label}</Text>
  </Pressable>
);

export default PillChip;
