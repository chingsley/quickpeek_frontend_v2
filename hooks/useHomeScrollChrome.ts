import {
  HOME_CHROME_COLLAPSE_DISTANCE,
  HOME_COLLAPSED_HEADER_HEIGHT,
  HOME_FAB_COLLAPSED_SIZE,
  HOME_FAB_EXPANDED_WIDTH,
  HOME_LOGO_SCROLL_LIFT,
  HOME_SCROLL_BOTTOM_LOCK_THRESHOLD,
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
} from 'react-native-reanimated';

/** Expanded list bottom inset: tab bar + FAB clearance. */
const tabBarInsetExpanded = 108;
/** Collapsed list bottom inset: FAB clearance only. */
const tabBarInsetCollapsed = 28;

/** How much the list footer spacer shrinks over a full collapse. */
const CHROME_SPACER_SWING = tabBarInsetExpanded - tabBarInsetCollapsed;

/**
 * Extra scrollable slack required (beyond the layout the collapse itself
 * frees up) before we allow the chrome to collapse. Prevents the short-list
 * feedback loop where collapsing removes so much layout that the content no
 * longer scrolls, snapping the position and flickering the header/footer.
 */
const CHROME_COLLAPSE_SAFETY_MARGIN = 4;

const resetChromeValues = (
  chromeScrollOffset: { value: number; },
  prevScrollY: { value: number; },
) => {
  'worklet';
  chromeScrollOffset.value = 0;
  prevScrollY.value = 0;
  homeChromeProgress.value = 0;
};

const getMaxScrollY = (contentSize: number, layoutHeight: number) => {
  'worklet';
  return Math.max(0, contentSize - layoutHeight);
};

const isAtListBottom = (y: number, maxY: number) => {
  'worklet';
  return maxY > 0 && y >= maxY - HOME_SCROLL_BOTTOM_LOCK_THRESHOLD;
};

const syncChromeProgress = (chromeScrollOffset: { value: number; }) => {
  'worklet';
  homeChromeProgress.value = chromeScrollOffset.value / HOME_CHROME_COLLAPSE_DISTANCE;
};

const updateChromeFromScroll = (
  y: number,
  diff: number,
  maxY: number,
  chromeScrollOffset: { value: number; },
) => {
  'worklet';

  if (y <= 0) {
    chromeScrollOffset.value = 0;
    return;
  }

  if (isAtListBottom(y, maxY)) {
    // At the bottom, keep chrome fully collapsed. Elastic overscroll makes the
    // frame diff flip sign as the list springs back; ignore it here so the
    // header/tab bar/FAB stay steady. Restoring resumes only once the user
    // scrolls up out of the bottom zone (handled below).
    chromeScrollOffset.value = HOME_CHROME_COLLAPSE_DISTANCE;
    return;
  }

  const nextOffset = chromeScrollOffset.value + diff;
  chromeScrollOffset.value = Math.min(
    HOME_CHROME_COLLAPSE_DISTANCE,
    Math.max(0, nextOffset),
  );
};

const settleChromeAtScrollEnd = (
  y: number,
  maxY: number,
  canCollapse: boolean,
  chromeScrollOffset: { value: number; },
) => {
  'worklet';

  if (!canCollapse || y <= 0) {
    chromeScrollOffset.value = 0;
    return;
  }

  if (isAtListBottom(y, maxY)) {
    chromeScrollOffset.value = HOME_CHROME_COLLAPSE_DISTANCE;
  }
};

/**
 * Reconstructs the scrollable distance the list would have while fully
 * expanded. As progress grows, live `maxY` shrinks linearly by `totalSwing`
 * (header collapse frees viewport height, footer spacer removes content), so
 * `expandedMaxY = maxY + progress * totalSwing` stays constant across the
 * animation and gives a stable basis for deciding collapsibility.
 */
const canCollapseChrome = (maxY: number, headerSwing: number) => {
  'worklet';
  const totalSwing = headerSwing + CHROME_SPACER_SWING;
  const expandedMaxY = maxY + homeChromeProgress.value * totalSwing;
  return expandedMaxY > totalSwing + CHROME_COLLAPSE_SAFETY_MARGIN;
};

export const useHomeScrollChrome = () => {
  const prevScrollY = useSharedValue(0);
  const chromeScrollOffset = useSharedValue(0);
  const expandedHeaderHeight = useSharedValue(220);

  const resetChrome = useCallback(() => {
    resetChromeValues(chromeScrollOffset, prevScrollY);
  }, [chromeScrollOffset, prevScrollY]);

  useFocusEffect(
    useCallback(() => {
      resetChrome();

      return () => {
        resetChrome();
      };
    }, [resetChrome]),
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
      const maxY = getMaxScrollY(event.contentSize.height, event.layoutMeasurement.height);
      const diff = y - prevScrollY.value;
      const headerSwing = expandedHeaderHeight.value - HOME_COLLAPSED_HEADER_HEIGHT;

      if (canCollapseChrome(maxY, headerSwing)) {
        updateChromeFromScroll(y, diff, maxY, chromeScrollOffset);
      } else {
        // List too short to sustain a collapse — keep chrome fully visible.
        chromeScrollOffset.value = 0;
      }
      syncChromeProgress(chromeScrollOffset);
      prevScrollY.value = y;
    },
    onEndDrag: (event) => {
      const y = event.contentOffset.y;
      const maxY = getMaxScrollY(event.contentSize.height, event.layoutMeasurement.height);
      const headerSwing = expandedHeaderHeight.value - HOME_COLLAPSED_HEADER_HEIGHT;

      settleChromeAtScrollEnd(y, maxY, canCollapseChrome(maxY, headerSwing), chromeScrollOffset);
      syncChromeProgress(chromeScrollOffset);
      prevScrollY.value = y;
    },
    onMomentumEnd: (event) => {
      const y = event.contentOffset.y;
      const maxY = getMaxScrollY(event.contentSize.height, event.layoutMeasurement.height);
      const headerSwing = expandedHeaderHeight.value - HOME_COLLAPSED_HEADER_HEIGHT;

      settleChromeAtScrollEnd(y, maxY, canCollapseChrome(maxY, headerSwing), chromeScrollOffset);
      syncChromeProgress(chromeScrollOffset);
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

  const headerChromeSlideStyle = useAnimatedStyle(() => {
    const slideUp = expandedHeaderHeight.value - HOME_COLLAPSED_HEADER_HEIGHT;
    return {
      opacity: interpolate(homeChromeProgress.value, [0, 1], [1, 0], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(homeChromeProgress.value, [0, 1], [0, -slideUp], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const logoSlideStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          homeChromeProgress.value,
          [0, 1],
          [0, -HOME_LOGO_SCROLL_LIFT],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return {
    scrollHandler,
    headerShellStyle,
    headerChromeSlideStyle,
    logoSlideStyle,
    onHeaderLayout,
    resetChrome,
  };
};

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
    opacity: interpolate(homeChromeProgress.value, [0, 0.5], [1, 0], Extrapolation.CLAMP),
    width: interpolate(homeChromeProgress.value, [0, 1], [132, 0], Extrapolation.CLAMP),
    marginLeft: interpolate(homeChromeProgress.value, [0, 1], [6, 0], Extrapolation.CLAMP),
  }));

  return { fabContainerStyle, fabTextStyle };
};
