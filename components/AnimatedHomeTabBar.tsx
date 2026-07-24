import { homeChromeProgress } from '@/store/homeChrome.store';
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
} from 'react-native-reanimated';

const TAB_BAR_HEIGHT = 100;

const AnimatedHomeTabBar = (props: BottomTabBarProps) => {
  const activeRoute = props.state.routes[props.state.index]?.name;
  const isHome = activeRoute === 'Home';
  const [touchEnabled, setTouchEnabled] = useState(true);
  const slideDistance = TAB_BAR_HEIGHT + props.insets.bottom;

  useEffect(() => {
    if (!isHome) {
      homeChromeProgress.value = 0;
      setTouchEnabled(true);
    }
  }, [isHome]);

  useAnimatedReaction(
    () => (isHome ? homeChromeProgress.value : 0),
    (progress) => {
      runOnJS(setTouchEnabled)(progress < 0.9);
    },
    [isHome],
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (!isHome) {
      return { transform: [{ translateY: 0 }] };
    }

    return {
      opacity: interpolate(homeChromeProgress.value, [0, 1], [1, 0], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(
            homeChromeProgress.value,
            [0, 1],
            [0, slideDistance],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.wrapper, animatedStyle]}
      pointerEvents={touchEnabled ? 'auto' : 'none'}
    >
      <BottomTabBar {...props} />
    </Animated.View>
  );
};

export default AnimatedHomeTabBar;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
