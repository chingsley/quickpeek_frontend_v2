import { colors } from '@/constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface UserAvatarProps {
  imageUrl?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const UserAvatar = ({ imageUrl, size = 56, style }: UserAvatarProps) => {
  const radius = size / 2;

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: radius },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: radius },
        style,
      ]}
    >
      <Ionicons name="person" size={size * 0.45} color={colors.MEDIUM_GRAY} />
    </View>
  );
};

export default UserAvatar;

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.LIGHT_GRAY_THIN,
  },
  placeholder: {
    backgroundColor: colors.LIGHT_GRAY_THIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
