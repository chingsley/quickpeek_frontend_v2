import { chromeTargetProgress, homeChromeProgress } from '@/store/homeChrome.store';
import { HOME_CHROME_FADE_OUT_END, HOME_CHROME_SLIDE_END } from '@/constants/homeChrome';
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
      // Reset both target and displayed progress so the per-frame smoother
      // can't pull a stale collapsed value back up while another screen is
      // showing (and so re-entering Home starts from fully visible).
      chromeTargetProgress.value = 0;
      homeChromeProgress.value = 0;
      setTouchEnabled(true);
    }
  }, [isHome]);

  useAnimatedReaction(
    () => (isHome ? homeChromeProgress.value : 0),
    (progress) => {
      runOnJS(setTouchEnabled)(progress < HOME_CHROME_FADE_OUT_END + 0.15);
    },
    [isHome],
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (!isHome) {
      return { transform: [{ translateY: 0 }] };
    }

    return {
      opacity: interpolate(
        homeChromeProgress.value,
        [0, HOME_CHROME_FADE_OUT_END],
        [1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateY: interpolate(
            homeChromeProgress.value,
            [0, HOME_CHROME_SLIDE_END, 1],
            [0, slideDistance * 0.98, slideDistance],
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
