import {
  HOME_CHROME_SHOW_AT_TOP_OFFSET,
  HOME_CHROME_SPRING,
  HOME_COLLAPSED_HEADER_HEIGHT,
  HOME_FAB_COLLAPSED_SIZE,
  HOME_FAB_EXPANDED_WIDTH,
  HOME_SCROLL_DIRECTION_THRESHOLD,
} from '@/constants/homeChrome';
import { homeChromeProgress } from '@/store/homeChrome.store';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const resetHomeChrome = () => {
  'worklet';
  homeChromeProgress.value = 0;
};

const animateChromeTo = (target: 0 | 1) => {
  'worklet';
  homeChromeProgress.value = withSpring(target, HOME_CHROME_SPRING);
};

export const useHomeScrollChrome = () => {
  const prevScrollY = useSharedValue(0);
  const chromeTarget = useSharedValue(0);
  const expandedHeaderHeight = useSharedValue(220);

  useFocusEffect(
    useCallback(() => {
      resetHomeChrome();
      prevScrollY.value = 0;
      chromeTarget.value = 0;

      return () => {
        resetHomeChrome();
        prevScrollY.value = 0;
        chromeTarget.value = 0;
      };
    }, [chromeTarget, prevScrollY]),
  );

  const onHeaderLayout = useCallback(
    (height: number) => {
      if (height > HOME_COLLAPSED_HEADER_HEIGHT) {
        expandedHeaderHeight.value = height;
      }
    },
    [expandedHeaderHeight],
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      const diff = y - prevScrollY.value;

      if (y <= HOME_CHROME_SHOW_AT_TOP_OFFSET) {
        if (chromeTarget.value !== 0) {
          chromeTarget.value = 0;
          animateChromeTo(0);
        }
      } else if (diff > HOME_SCROLL_DIRECTION_THRESHOLD) {
        if (chromeTarget.value !== 1) {
          chromeTarget.value = 1;
          animateChromeTo(1);
        }
      } else if (diff < -HOME_SCROLL_DIRECTION_THRESHOLD) {
        if (chromeTarget.value !== 0) {
          chromeTarget.value = 0;
          animateChromeTo(0);
        }
      }

      prevScrollY.value = y;
    },
  });

  const headerShellStyle = useAnimatedStyle(() => ({
    height: interpolate(
      homeChromeProgress.value,
      [0, 1],
      [expandedHeaderHeight.value, HOME_COLLAPSED_HEADER_HEIGHT],
      Extrapolation.CLAMP,
    ),
  }));

  const chromeFadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(homeChromeProgress.value, [0, 0.55], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(homeChromeProgress.value, [0, 1], [0, -16], Extrapolation.CLAMP),
      },
    ],
  }));

  return {
    scrollHandler,
    headerShellStyle,
    chromeFadeStyle,
    onHeaderLayout,
    expandedHeaderHeight,
  };
};

/** Expanded list bottom inset: tab bar + FAB clearance. */
const tabBarInsetExpanded = 108;
/** Collapsed list bottom inset: FAB clearance only. */
const tabBarInsetCollapsed = 28;

export const useHomeListBottomSpacerStyle = () =>
  useAnimatedStyle(() => ({
    height: interpolate(
      homeChromeProgress.value,
      [0, 1],
      [tabBarInsetExpanded, tabBarInsetCollapsed],
      Extrapolation.CLAMP,
    ),
  }));

export const useHomeFloatingAskStyle = (tabBarHeight: number) => {
  const fabContainerStyle = useAnimatedStyle(() => {
    const progress = homeChromeProgress.value;
    return {
      width: interpolate(
        progress,
        [0, 1],
        [HOME_FAB_EXPANDED_WIDTH, HOME_FAB_COLLAPSED_SIZE],
        Extrapolation.CLAMP,
      ),
      height: HOME_FAB_COLLAPSED_SIZE,
      borderRadius: HOME_FAB_COLLAPSED_SIZE / 2,
      bottom: interpolate(progress, [0, 1], [tabBarHeight + 10, 20], Extrapolation.CLAMP),
    };
  });

  const fabTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(homeChromeProgress.value, [0, 0.45], [1, 0], Extrapolation.CLAMP),
    width: interpolate(homeChromeProgress.value, [0, 1], [132, 0], Extrapolation.CLAMP),
    marginLeft: interpolate(homeChromeProgress.value, [0, 1], [6, 0], Extrapolation.CLAMP),
  }));

  return { fabContainerStyle, fabTextStyle };
};
