import HomeSideMenu from '@/components/HomeSideMenu';
import SettingsBottomSheet from '@/components/SettingsBottomSheet';
import {
  DRAWER_ANIMATION_MS,
  DRAWER_BORDER_RADIUS,
  DRAWER_FADE_OVERLAY,
  DRAWER_SCALE,
  DRAWER_SHIFT_RATIO,
} from '@/constants/drawer';
import { colors } from '@/constants/colors';
import { useDrawerStore } from '@/store/drawer.store';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  children: React.ReactNode;
};

const HomeDrawerLayout = ({ children }: Props) => {
  const { width } = useWindowDimensions();
  const isOpen = useDrawerStore((state) => state.isOpen);
  const settingsSheetVisible = useDrawerStore((state) => state.settingsSheetVisible);
  const close = useDrawerStore((state) => state.close);
  const progress = useSharedValue(0);

  const shiftX = width * DRAWER_SHIFT_RATIO;

  useEffect(() => {
    progress.value = withTiming(isOpen ? 1 : 0, { duration: DRAWER_ANIMATION_MS });
  }, [isOpen, progress]);

  const mainAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, shiftX]) },
      { scale: interpolate(progress.value, [0, 1], [1, DRAWER_SCALE]) },
    ],
    borderTopLeftRadius: interpolate(progress.value, [0, 1], [0, DRAWER_BORDER_RADIUS]),
    borderBottomLeftRadius: interpolate(progress.value, [0, 1], [0, DRAWER_BORDER_RADIUS]),
    transformOrigin: 'left center',
  }));

  const fadeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  return (
    <View style={styles.root}>
      <View style={styles.menuLayer}>
        <HomeSideMenu />
      </View>

      <Animated.View style={[styles.mainLayer, mainAnimatedStyle]}>
        <View style={styles.mainContent} pointerEvents={isOpen ? 'none' : 'auto'}>
          {children}
        </View>

        {isOpen && !settingsSheetVisible && (
          <Pressable
            style={styles.dismissOverlay}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          >
            <Animated.View style={[styles.fadeVeil, fadeOverlayStyle]} />
          </Pressable>
        )}
      </Animated.View>

      <SettingsBottomSheet />
    </View>
  );
};

export default HomeDrawerLayout;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.DARK_WHITE,
  },
  menuLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  mainLayer: {
    flex: 1,
    backgroundColor: colors.BG_WHITE,
    overflow: 'hidden',
    boxShadow: [
      {
        offsetX: -6,
        offsetY: 0,
        blurRadius: 42,
        spreadDistance: 2,
        color: 'rgba(0, 0, 0, 0.07)',
      },
      {
        offsetX: 0,
        offsetY: -4,
        blurRadius: 30,
        spreadDistance: 1,
        color: 'rgba(0, 0, 0, 0.035)',
      },
      {
        offsetX: 0,
        offsetY: 4,
        blurRadius: 30,
        spreadDistance: 1,
        color: 'rgba(0, 0, 0, 0.035)',
      },
    ],
  },
  mainContent: {
    flex: 1,
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  fadeVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DRAWER_FADE_OVERLAY,
  },
});
