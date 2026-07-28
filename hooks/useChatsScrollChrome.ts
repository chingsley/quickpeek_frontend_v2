import {
  CHATS_CHROME_FADE_OUT_END,
  CHATS_CHROME_SLIDE_END,
  CHATS_COLLAPSED_HEADER_HEIGHT,
  CHATS_SCROLL_BOTTOM_LOCK_THRESHOLD,
} from '@/constants/chatsChrome';
import { colors } from '@/constants/colors';
import { chatsChromeProgress, chatsChromeTargetProgress } from '@/store/chatsChrome.store';
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
 * Time constant for the exponential smoothing that eases `chatsChromeProgress`
 * toward the raw scroll-driven target, so fast scrolls glide instead of
 * whipping 1:1. ~50ms keeps the on-release settle close to ~220ms perceived
 * duration (it takes ≈ 4.6·τ to reach within 1%). Mirrors the Home chrome.
 */
const CHATS_PROGRESS_SMOOTHING_TAU_MS = 50;

/** When the smoothed progress is within this of its target, snap exactly. */
const PROGRESS_SNAP_EPSILON = 0.001;

/**
 * Extra scrollable slack required (beyond the layout the collapse itself
 * frees up) before we allow the chrome to collapse. Prevents the short-list
 * feedback loop where collapsing grows the viewport so much that the content
 * no longer scrolls, snapping the position and flickering the header.
 */
const CHATS_COLLAPSE_SAFETY_MARGIN = 4;

const resetChromeValues = (
  chromeScrollOffset: { value: number; },
  prevScrollY: { value: number; },
  chromeDirection: { value: number; },
) => {
  'worklet';
  chromeScrollOffset.value = 0;
  prevScrollY.value = 0;
  chromeDirection.value = 0;
  // Snap both target and displayed progress so reset is instant — the smoother
  // is told there is nothing to ease toward.
  chatsChromeTargetProgress.value = 0;
  chatsChromeProgress.value = 0;
};

const getMaxScrollY = (contentSize: number, layoutHeight: number) => {
  'worklet';
  return Math.max(0, contentSize - layoutHeight);
};

const isAtListBottom = (y: number, maxY: number) => {
  'worklet';
  return maxY > 0 && y >= maxY - CHATS_SCROLL_BOTTOM_LOCK_THRESHOLD;
};

const syncChromeProgress = (
  chromeScrollOffset: { value: number; },
  collapseDistance: number,
) => {
  'worklet';
  // Drive only the raw target. The display progress (`chatsChromeProgress`)
  // is eased toward it in `useChatsProgressSmoother` below.
  chatsChromeTargetProgress.value = chromeScrollOffset.value / collapseDistance;
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
    // header stays steady. Restoring resumes only once the user scrolls up out
    // of the bottom zone (handled below).
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
 * completes in whichever direction the user was last scrolling.
 *
 * The header shell is in normal flow above the list, so the list's top edge
 * is glued to the shell's bottom edge at every progress value — completing
 * the collapse from ANY scroll position just slides the content up with the
 * header, and no gap can ever open between them.
 *
 * Only the raw target is written here; the per-frame smoother eases
 * `chatsChromeProgress` to it so the completion reads as the transition
 * gracefully finishing — not an abrupt cut.
 */
const settleChromeAtScrollEnd = (
  y: number,
  maxY: number,
  canCollapse: boolean,
  direction: number,
  chromeScrollOffset: { value: number; },
  collapseDistance: number,
) => {
  'worklet';

  const shouldCollapse =
    canCollapse && y > 0 && (isAtListBottom(y, maxY) || direction > 0);
  const target = shouldCollapse ? collapseDistance : 0;

  chromeScrollOffset.value = target;
  chatsChromeTargetProgress.value = target / collapseDistance;
};

/**
 * Reconstructs the scrollable distance the list would have while fully
 * expanded. The header shell is in normal flow, so as it collapses the list
 * viewport GROWS by the expanded header height — live `maxY` drops by that
 * much over a full collapse, and `expandedMaxY = maxY + progress *
 * expandedHeight` stays constant across the animation, giving a stable basis
 * for deciding collapsibility.
 */
const canCollapseChrome = (maxY: number, expandedHeight: number) => {
  'worklet';
  const expandedMaxY = maxY + chatsChromeProgress.value * expandedHeight;
  return expandedMaxY > expandedHeight + CHATS_COLLAPSE_SAFETY_MARGIN;
};

/**
 * Per-frame exponential smoother that eases the displayed
 * `chatsChromeProgress` toward the raw scroll-driven
 * `chatsChromeTargetProgress`. Mirrors `useChromeProgressSmoother` on Home.
 */
const useChatsProgressSmoother = () => {
  useFrameCallback((frameInfo) => {
    'worklet';
    const target = chatsChromeTargetProgress.value;
    const current = chatsChromeProgress.value;
    const error = target - current;

    if (Math.abs(error) <= PROGRESS_SNAP_EPSILON) {
      if (current !== target) {
        chatsChromeProgress.value = target;
      }
      return;
    }

    const dt = frameInfo.timeSincePreviousFrame ?? 16.6667;
    const alpha = 1 - Math.exp(-dt / CHATS_PROGRESS_SMOOTHING_TAU_MS);
    chatsChromeProgress.value = current + error * alpha;
  });
};

export const useChatsScrollChrome = () => {
  // Eases the displayed chrome progress toward the raw scroll target every
  // frame. Mounted for the Chats screen's lifetime.
  useChatsProgressSmoother();

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
    (slideHeight: number) => {
      const total = slideHeight + CHATS_COLLAPSED_HEADER_HEIGHT;
      if (total > CHATS_COLLAPSED_HEADER_HEIGHT) {
        expandedHeaderHeight.value = total;
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
      const collapseDistance = expandedHeaderHeight.value - CHATS_COLLAPSED_HEADER_HEIGHT;

      if (diff !== 0) {
        chromeDirection.value = diff > 0 ? 1 : -1;
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
      const collapseDistance = expandedHeaderHeight.value - CHATS_COLLAPSED_HEADER_HEIGHT;

      settleChromeAtScrollEnd(
        y,
        maxY,
        canCollapseChrome(maxY, expandedHeaderHeight.value),
        chromeDirection.value,
        chromeScrollOffset,
        collapseDistance,
      );
      prevScrollY.value = y;
    },
    onMomentumEnd: (event) => {
      const y = event.contentOffset.y;
      const maxY = getMaxScrollY(event.contentSize.height, event.layoutMeasurement.height);
      const collapseDistance = expandedHeaderHeight.value - CHATS_COLLAPSED_HEADER_HEIGHT;

      settleChromeAtScrollEnd(
        y,
        maxY,
        canCollapseChrome(maxY, expandedHeaderHeight.value),
        chromeDirection.value,
        chromeScrollOffset,
        collapseDistance,
      );
      prevScrollY.value = y;
    },
  });

  const headerShellStyle = useAnimatedStyle(() => ({
    // The shell is in normal flow above the list, so shrinking it all the way
    // to zero slides the list content up with it — the two stay glued and no
    // gap can open at any progress. The pinned toolbar (back button + logo)
    // is a separate overlay (see `toolbarStripStyle`), so the shell is free
    // to reach zero.
    height: interpolate(
      chatsChromeProgress.value,
      [0, 1],
      [expandedHeaderHeight.value, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const headerChromeSlideStyle = useAnimatedStyle(() => {
    const slideUp = expandedHeaderHeight.value - CHATS_COLLAPSED_HEADER_HEIGHT;
    const progress = chatsChromeProgress.value;
    return {
      opacity: interpolate(
        progress,
        [0, CHATS_CHROME_FADE_OUT_END],
        [1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateY: interpolate(
            progress,
            [0, CHATS_CHROME_SLIDE_END, 1],
            [0, -slideUp * 0.98, -slideUp],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const toolbarStripStyle = useAnimatedStyle(() => {
    // Transparent while the solid shell is behind it; eases to the
    // translucent tint once the shell has shrunk below the strip, so chat
    // rows scroll visibly underneath the pinned toolbar.
    const tintStart = Math.max(
      0,
      1 - CHATS_COLLAPSED_HEADER_HEIGHT / expandedHeaderHeight.value,
    );
    return {
      backgroundColor: interpolateColor(
        chatsChromeProgress.value,
        [0, tintStart, 1],
        [colors.HOME_HEADER_STRIP_CLEAR, colors.HOME_HEADER_STRIP_CLEAR, colors.HOME_HEADER_COLLAPSED_TINT],
      ),
    };
  });

  return {
    scrollHandler,
    headerShellStyle,
    headerChromeSlideStyle,
    toolbarStripStyle,
    onHeaderLayout,
    resetChrome,
  };
};
