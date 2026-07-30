import {
  HOME_COLLAPSED_HEADER_HEIGHT,
  HOME_CHROME_FADE_OUT_END,
  HOME_CHROME_SLIDE_END,
  HOME_FAB_COLLAPSED_SIZE,
  HOME_FAB_EXPANDED_WIDTH,
  HOME_FAB_ICON_GAP,
  HOME_FAB_TEXT_MAX_WIDTH,
  HOME_SCROLL_BOTTOM_LOCK_THRESHOLD,
} from '@/constants/homeChrome';
import { colors } from '@/constants/colors';
import { chromeTargetProgress, homeChromeProgress } from '@/store/homeChrome.store';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

/**
 * Time constant for the exponential smoothing that eases `homeChromeProgress`
 * toward the raw scroll-driven target. The chrome trails the finger by a few
 * frames so fast scrolls glide instead of whipping 1:1, while slow scrolls
 * still feel directly connected. ~50ms keeps the on-release settle close to the
 * original ~220ms perceived duration (it takes ≈ 4.6·τ to reach within 1%).
 */
const CHROME_PROGRESS_SMOOTHING_TAU_MS = 50;

/**
 * Time constant used while completing a RELEASE SETTLE (the snap to fully
 * visible / fully hidden). Deliberately larger than the drag constant: the
 * settle is a pure animation with no finger to track, and a slower time
 * constant spreads the remaining distance — and the layout reflow it drives —
 * over ~460ms (≈ 4.6·τ) so it reads as a graceful glide instead of a lurch.
 */
const CHROME_SETTLE_SMOOTHING_TAU_MS = 120;

/** When the smoothed progress is within this of its target, snap exactly. */
const PROGRESS_SNAP_EPSILON = 0.001;

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
  chromeSettleMode: { value: number; },
) => {
  'worklet';
  chromeScrollOffset.value = 0;
  prevScrollY.value = 0;
  chromeDirection.value = 0;
  chromeSettleMode.value = 0;
  // Snap both target and displayed progress so reset is instant — the smoother
  // is told there is nothing to ease toward.
  chromeTargetProgress.value = 0;
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

const syncChromeProgress = (
  chromeScrollOffset: { value: number; },
  collapseDistance: number,
) => {
  'worklet';
  // Drive only the raw target. The display progress (`homeChromeProgress`)
  // is eased toward it in `useChromeProgressSmoother` below, so fast scrolls
  // glide instead of snapping 1:1 with the finger.
  chromeTargetProgress.value = chromeScrollOffset.value / collapseDistance;
};

const updateChromeFromScroll = (
  y: number,
  diff: number,
  maxY: number,
  chromeScrollOffset: { value: number; },
  collapseDistance: number,
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
    chromeScrollOffset.value = collapseDistance;
    return;
  }

  const nextOffset = chromeScrollOffset.value + diff;
  chromeScrollOffset.value = Math.min(
    collapseDistance,
    Math.max(0, nextOffset),
  );
};

/**
 * Snaps chrome to a fully expanded or fully collapsed state — it should never
 * be left part-faded/part-slid once the user lets go. At the very top it
 * always expands; at the bottom it always collapses; anywhere else it
 * completes in whichever direction the user was last scrolling, so "let go
 * while scrolling down" hides it and "let go while scrolling up" brings it
 * back.
 *
 * Because the header shell is in normal flow, the list's top edge is glued to
 * the shell's bottom edge at every progress value — completing the collapse
 * from ANY scroll position simply slides the content up with the header, so
 * no white gap can ever open and no "spring back to expanded" special case is
 * needed near the top.
 *
 * The settle runs the raw target straight to its endpoint and flags settle
 * mode; the per-frame smoother (see `useChromeProgressSmoother`) eases
 * `homeChromeProgress` toward that endpoint with the gentler settle time
 * constant, so the completion glides instead of lurching.
 */
const settleChromeAtScrollEnd = (
  y: number,
  maxY: number,
  canCollapse: boolean,
  direction: number,
  chromeScrollOffset: { value: number; },
  chromeSettleMode: { value: number; },
  collapseDistance: number,
) => {
  'worklet';

  const shouldCollapse =
    canCollapse && y > 0 && (isAtListBottom(y, maxY) || direction > 0);
  const target = shouldCollapse ? collapseDistance : 0;

  chromeScrollOffset.value = target;
  chromeSettleMode.value = 1;
  chromeTargetProgress.value = target / collapseDistance;
};

/**
 * Reconstructs the scrollable distance the list would have while fully
 * expanded. The header shell is in normal flow above the list, so as it
 * collapses the list viewport GROWS by the expanded header height while the
 * footer spacer shrinks the content by CHROME_SPACER_SWING — live `maxY`
 * therefore drops by `totalSwing` over a full collapse, and `expandedMaxY =
 * maxY + progress * totalSwing` stays constant across the animation, giving a
 * stable basis for deciding collapsibility.
 */
const canCollapseChrome = (maxY: number, expandedHeight: number) => {
  'worklet';
  const totalSwing = expandedHeight + CHROME_SPACER_SWING;
  const expandedMaxY = maxY + homeChromeProgress.value * totalSwing;
  return expandedMaxY > totalSwing + CHROME_COLLAPSE_SAFETY_MARGIN;
};

/**
 * Per-frame exponential smoother that eases the displayed `homeChromeProgress`
 * toward the raw scroll-driven `chromeTargetProgress`. This is the single
 * change that makes the chrome glide on fast scrolls instead of tracking the
 * finger 1:1: every scroll event slams the target, and this callback spreads
 * the motion over a few subsequent frames with a frame-rate-independent decay.
 *
 * - `homeChromeProgress` is what the header / tab bar / FAB styles read, so
 *   easing it here eases all three at once from one source of truth.
 * - `chromeTargetProgress` keeps the raw, unfiltered value the scroll logic
 *   (direction, bottom-lock, short-list guard, settle) still reasons about, so
 *   none of those correctness rules are affected by the smoothing.
 * - The geometric invariant in `canCollapseChrome` holds for any progress, so
 *   smoothing the displayed value cannot reintroduce the short-list feedback
 *   loop — it only changes how the chrome *feels*, not what it decides.
 */
const useChromeProgressSmoother = (chromeSettleMode: { value: number; }) => {
  useFrameCallback((frameInfo) => {
    'worklet';
    const target = chromeTargetProgress.value;
    const current = homeChromeProgress.value;
    const error = target - current;

    if (Math.abs(error) <= PROGRESS_SNAP_EPSILON) {
      // Within rounding distance of the target — snap exactly so we never leave
      // the chrome a hair off the fully-visible / fully-hidden endpoint.
      if (current !== target) {
        homeChromeProgress.value = target;
      }
      return;
    }

    // Frame-rate-independent first-order low-pass:
    //   next = current + (target - current) * (1 - e^(-dt / τ))
    // `timeSincePreviousFrame` is the actual frame delta in ms, so the feel is
    // identical on 60Hz, 90Hz, 120Hz, and under dropped frames. Falls back to a
    // 16.67ms assumption on the first frame (when it is null).
    // While a release settle is completing, use the gentler settle constant so
    // the snap glides; live drags keep the tight tracking constant.
    const dt = frameInfo.timeSincePreviousFrame ?? 16.6667;
    const tau =
      chromeSettleMode.value === 1
        ? CHROME_SETTLE_SMOOTHING_TAU_MS
        : CHROME_PROGRESS_SMOOTHING_TAU_MS;
    const alpha = 1 - Math.exp(-dt / tau);
    homeChromeProgress.value = current + error * alpha;
  });
};

export const useHomeScrollChrome = () => {
  const prevScrollY = useSharedValue(0);
  const chromeScrollOffset = useSharedValue(0);
  const expandedHeaderHeight = useSharedValue(220);
  /** Sign of the most recent non-zero scroll delta: 1 = down, -1 = up. */
  const chromeDirection = useSharedValue(0);
  /** 1 while a release settle is completing (smoother uses the gentler τ). */
  const chromeSettleMode = useSharedValue(0);

  // Eases the displayed chrome progress toward the raw scroll target every
  // frame. Mounted for the Home screen's lifetime.
  useChromeProgressSmoother(chromeSettleMode);

  const resetChrome = useCallback(() => {
    resetChromeValues(chromeScrollOffset, prevScrollY, chromeDirection, chromeSettleMode);
  }, [chromeScrollOffset, prevScrollY, chromeDirection, chromeSettleMode]);

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
      // Collapsing the chrome takes exactly one header swing of scroll, so the
      // header content slides up 1:1 with the list items while dragging.
      const collapseDistance = expandedHeaderHeight.value - HOME_COLLAPSED_HEADER_HEIGHT;

      if (diff !== 0) {
        chromeDirection.value = diff > 0 ? 1 : -1;
        // A real drag frame — cancel settle mode so the smoother returns to
        // tight finger tracking immediately (grabbing mid-settle stays
        // responsive).
        chromeSettleMode.value = 0;
      }

      if (canCollapseChrome(maxY, expandedHeaderHeight.value)) {
        updateChromeFromScroll(y, diff, maxY, chromeScrollOffset, collapseDistance);
      } else {
        // List too short to sustain a collapse — keep chrome fully visible.
        chromeScrollOffset.value = 0;
      }
      syncChromeProgress(chromeScrollOffset, collapseDistance);
      prevScrollY.value = y;
    },
    onEndDrag: (event) => {
      const y = event.contentOffset.y;
      const maxY = getMaxScrollY(event.contentSize.height, event.layoutMeasurement.height);
      const collapseDistance = expandedHeaderHeight.value - HOME_COLLAPSED_HEADER_HEIGHT;

      settleChromeAtScrollEnd(
        y,
        maxY,
        canCollapseChrome(maxY, expandedHeaderHeight.value),
        chromeDirection.value,
        chromeScrollOffset,
        chromeSettleMode,
        collapseDistance,
      );
      prevScrollY.value = y;
    },
    onMomentumEnd: (event) => {
      const y = event.contentOffset.y;
      const maxY = getMaxScrollY(event.contentSize.height, event.layoutMeasurement.height);
      const collapseDistance = expandedHeaderHeight.value - HOME_COLLAPSED_HEADER_HEIGHT;

      settleChromeAtScrollEnd(
        y,
        maxY,
        canCollapseChrome(maxY, expandedHeaderHeight.value),
        chromeDirection.value,
        chromeScrollOffset,
        chromeSettleMode,
        collapseDistance,
      );
      prevScrollY.value = y;
    },
  });

  const headerShellStyle = useAnimatedStyle(() => ({
    // The shell is in normal flow above the list, so shrinking it all the way
    // to zero slides the list content up with it — the two stay glued and no
    // gap can open at any progress. The pinned logo strip is a separate
    // overlay (see `logoStripStyle`), so the shell is free to reach zero.
    height: interpolate(
      homeChromeProgress.value,
      [0, 1],
      [expandedHeaderHeight.value, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const logoStripStyle = useAnimatedStyle(() => {
    // Transparent while the solid shell is behind it; eases to the
    // translucent tint once the shell has shrunk below the strip, so question
    // cards scroll visibly underneath the pinned logo.
    const tintStart = Math.max(
      0,
      1 - HOME_COLLAPSED_HEADER_HEIGHT / expandedHeaderHeight.value,
    );
    return {
      backgroundColor: interpolateColor(
        homeChromeProgress.value,
        [0, tintStart, 1],
        [colors.HOME_HEADER_STRIP_CLEAR, colors.HOME_HEADER_STRIP_CLEAR, colors.HOME_HEADER_COLLAPSED_TINT],
      ),
    };
  });

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

  return {
    scrollHandler,
    headerShellStyle,
    headerChromeSlideStyle,
    logoStripStyle,
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
    // maxWidth (not width) lets the label shrink to its natural text width so
    // the icon + label group centers evenly in the pill — a fixed width leaves
    // slack on the right that reads as extra right padding.
    maxWidth: interpolate(
      homeChromeProgress.value,
      [0, 1],
      [HOME_FAB_TEXT_MAX_WIDTH, 0],
      Extrapolation.CLAMP,
    ),
    marginLeft: interpolate(
      homeChromeProgress.value,
      [0, 1],
      [HOME_FAB_ICON_GAP, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return { fabContainerStyle, fabTextStyle };
};
