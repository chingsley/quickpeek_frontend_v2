import {
  HOME_CHROME_COLLAPSE_DISTANCE,
  HOME_COLLAPSED_HEADER_HEIGHT,
  HOME_CHROME_FADE_OUT_END,
  HOME_CHROME_SLIDE_END,
  HOME_FAB_COLLAPSED_SIZE,
  HOME_FAB_EXPANDED_WIDTH,
  HOME_LOGO_SCROLL_LIFT,
  HOME_SCROLL_BOTTOM_LOCK_THRESHOLD,
} from '@/constants/homeChrome';
import { homeChromeProgress } from '@/store/homeChrome.store';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/** Duration of the "complete the transition" ease after the user lets go. */
const CHROME_SETTLE_DURATION_MS = 220;

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
  chromeDirection: { value: number; },
) => {
  'worklet';
  chromeScrollOffset.value = 0;
  prevScrollY.value = 0;
  chromeDirection.value = 0;
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

/**
 * Snaps chrome to a fully expanded or fully collapsed state — it should never
 * be left part-faded/part-slid once the user lets go. At the very top it
 * always expands; at the bottom (or short lists) it always collapses;
 * anywhere else it completes in whichever direction the user was last
 * scrolling, so "let go while scrolling down" hides it and "let go while
 * scrolling up" brings it back. The finish is eased rather than snapped
 * instantly so the motion still reads as a graceful transition.
 */
const settleChromeAtScrollEnd = (
  y: number,
  maxY: number,
  canCollapse: boolean,
  direction: number,
  chromeScrollOffset: { value: number; },
) => {
  'worklet';

  const shouldCollapse =
    canCollapse && y > 0 && (isAtListBottom(y, maxY) || direction > 0);
  const target = shouldCollapse ? HOME_CHROME_COLLAPSE_DISTANCE : 0;

  chromeScrollOffset.value = target;
  homeChromeProgress.value = withTiming(target / HOME_CHROME_COLLAPSE_DISTANCE, {
    duration: CHROME_SETTLE_DURATION_MS,
    easing: Easing.out(Easing.cubic),
  });
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
  /** Sign of the most recent non-zero scroll delta: 1 = down, -1 = up. */
  const chromeDirection = useSharedValue(0);

  const resetChrome = useCallback(() => {
    resetChromeValues(chromeScrollOffset, prevScrollY, chromeDirection);
  }, [chromeScrollOffset, prevScrollY, chromeDirection]);

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

      if (diff !== 0) {
        chromeDirection.value = diff > 0 ? 1 : -1;
      }

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

      settleChromeAtScrollEnd(
        y,
        maxY,
        canCollapseChrome(maxY, headerSwing),
        chromeDirection.value,
        chromeScrollOffset,
      );
      prevScrollY.value = y;
    },
    onMomentumEnd: (event) => {
      const y = event.contentOffset.y;
      const maxY = getMaxScrollY(event.contentSize.height, event.layoutMeasurement.height);
      const headerSwing = expandedHeaderHeight.value - HOME_COLLAPSED_HEADER_HEIGHT;

      settleChromeAtScrollEnd(
        y,
        maxY,
        canCollapseChrome(maxY, headerSwing),
        chromeDirection.value,
        chromeScrollOffset,
      );
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
    const progress = homeChromeProgress.value;
    return {
      opacity: interpolate(
        progress,
        [0, HOME_CHROME_FADE_OUT_END],
        [1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateY: interpolate(
            progress,
            [0, HOME_CHROME_SLIDE_END, 1],
            [0, -slideUp * 0.98, -slideUp],
            Extrapolation.CLAMP,
          ),
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
    opacity: interpolate(
      homeChromeProgress.value,
      [0, HOME_CHROME_FADE_OUT_END],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    width: interpolate(homeChromeProgress.value, [0, 1], [132, 0], Extrapolation.CLAMP),
    marginLeft: interpolate(homeChromeProgress.value, [0, 1], [6, 0], Extrapolation.CLAMP),
  }));

  return { fabContainerStyle, fabTextStyle };
};
