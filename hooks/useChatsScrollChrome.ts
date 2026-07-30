import {
  CHATS_CHROME_FADE_OUT_END,
  CHATS_CHROME_SLIDE_END,
  CHATS_COLLAPSED_HEADER_HEIGHT,
  CHATS_SCROLL_BOTTOM_LOCK_THRESHOLD,
} from '@/constants/chatsChrome';
import { colors } from '@/constants/colors';
import {
  chatsBaseMaxScrollY,
  chatsChromeProgress,
  chatsChromeTargetProgress,
  chatsExpandedHeaderHeight,
} from '@/store/chatsChrome.store';
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

/**
 * Time constant used while completing a RELEASE SETTLE (the snap to fully
 * visible / fully hidden). Deliberately larger than the drag constant so the
 * settle glides over ~460ms (≈ 4.6·τ) instead of lurching.
 */
const CHATS_SETTLE_SMOOTHING_TAU_MS = 100;

/** When the smoothed progress is within this of its target, snap exactly. */
const PROGRESS_SNAP_EPSILON = 0.001;

const chromeContentOpacity = (progress: number) => {
  'worklet';
  return interpolate(progress, [0, CHATS_CHROME_FADE_OUT_END], [1, 0], Extrapolation.CLAMP);
};

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
  chromeSettleMode: { value: number; },
) => {
  'worklet';
  chromeScrollOffset.value = 0;
  prevScrollY.value = 0;
  chromeDirection.value = 0;
  chromeSettleMode.value = 0;
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
 * Only the raw target is written here (and settle mode flagged); the
 * per-frame smoother eases `chatsChromeProgress` to the endpoint with the
 * gentler settle time constant so the completion glides instead of lurching.
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
  chatsChromeTargetProgress.value = target / collapseDistance;
};

/**
 * The collapse is safe on ANY list length: the footer spacer (see
 * `useChatsListBottomSpacerStyle`) grows by the deficit between the expanded
 * header height and the list's base scrollable distance as the chrome
 * collapses, compensating the viewport growth so `maxY` can never shrink to
 * zero mid-collapse — the short-list flicker loop is structurally impossible.
 * The only requirement left is that the list scrolls at all.
 */
const canCollapseChrome = (maxY: number) => {
  'worklet';
  return maxY > 0;
};

/**
 * Footer spacer that compensates the viewport growth during a collapse. As
 * the in-flow shell shrinks, the list viewport grows by the expanded header
 * height; without compensation a short list would stop being scrollable
 * mid-collapse and snap back. Growing the spacer by the deficit keeps `maxY`
 * stable (or slightly positive) for any list length, so the chrome effect
 * works on short chat lists too — at the price of a blank tail below the last
 * chat that is only ever as large as the geometry strictly requires (zero for
 * lists that already overflow by more than the header height).
 */
export const useChatsListBottomSpacerStyle = () =>
  useAnimatedStyle(() => ({
    height:
      chatsChromeProgress.value *
      Math.max(
        0,
        chatsExpandedHeaderHeight.value +
          CHATS_COLLAPSE_SAFETY_MARGIN -
          chatsBaseMaxScrollY.value,
      ),
  }));

/**
 * Per-frame exponential smoother that eases the displayed
 * `chatsChromeProgress` toward the raw scroll-driven
 * `chatsChromeTargetProgress`. Mirrors `useChromeProgressSmoother` on Home.
 */
const useChatsProgressSmoother = (chromeSettleMode: { value: number; }) => {
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

    // While a release settle is completing, use the gentler settle constant so
    // the snap glides; live drags keep the tight tracking constant.
    const dt = frameInfo.timeSincePreviousFrame ?? 16.6667;
    const tau =
      chromeSettleMode.value === 1
        ? CHATS_SETTLE_SMOOTHING_TAU_MS
        : CHATS_PROGRESS_SMOOTHING_TAU_MS;
    const alpha = 1 - Math.exp(-dt / tau);
    chatsChromeProgress.value = current + error * alpha;
  });
};

export const useChatsScrollChrome = () => {
  const prevScrollY = useSharedValue(0);
  const chromeScrollOffset = useSharedValue(0);
  /** Sign of the most recent non-zero scroll delta: 1 = down, -1 = up. */
  const chromeDirection = useSharedValue(0);
  /** 1 while a release settle is completing (smoother uses the gentler τ). */
  const chromeSettleMode = useSharedValue(0);

  // Eases the displayed chrome progress toward the raw scroll target every
  // frame. Mounted for the Chats screen's lifetime.
  useChatsProgressSmoother(chromeSettleMode);

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
    (slideHeight: number) => {
      // The measured wrap holds only the sliding content (title/search/
      // filters); the shell's expanded height additionally spans the toolbar
      // band at the top that the pinned strip overlays.
      const total = slideHeight + CHATS_COLLAPSED_HEADER_HEIGHT;
      if (total > CHATS_COLLAPSED_HEADER_HEIGHT) {
        chatsExpandedHeaderHeight.value = total;
      }
    },
    [],
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      const maxY = getMaxScrollY(event.contentSize.height, event.layoutMeasurement.height);
      const diff = y - prevScrollY.value;
      // Collapsing the chrome takes exactly one header swing of scroll, so the
      // header content slides up 1:1 with the list items while dragging.
      const collapseDistance = chatsExpandedHeaderHeight.value - CHATS_COLLAPSED_HEADER_HEIGHT;

      if (diff !== 0) {
        chromeDirection.value = diff > 0 ? 1 : -1;
        // A real drag frame — cancel settle mode so the smoother returns to
        // tight finger tracking immediately (grabbing mid-settle stays
        // responsive).
        chromeSettleMode.value = 0;
      }

      if (chromeScrollOffset.value === 0) {
        // Chrome fully expanded — this is the list's base scrollable distance,
        // the reference the footer spacer's growth is computed from.
        chatsBaseMaxScrollY.value = maxY;
      }

      if (canCollapseChrome(maxY)) {
        updateChromeFromScroll(y, diff, maxY, chromeScrollOffset, collapseDistance);
      } else {
        // List doesn't scroll at all — keep chrome fully visible.
        chromeScrollOffset.value = 0;
      }
      syncChromeProgress(chromeScrollOffset, collapseDistance);
      prevScrollY.value = y;
    },
    onEndDrag: (event) => {
      const y = event.contentOffset.y;
      const maxY = getMaxScrollY(event.contentSize.height, event.layoutMeasurement.height);
      const collapseDistance = chatsExpandedHeaderHeight.value - CHATS_COLLAPSED_HEADER_HEIGHT;

      settleChromeAtScrollEnd(
        y,
        maxY,
        canCollapseChrome(maxY),
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
      const collapseDistance = chatsExpandedHeaderHeight.value - CHATS_COLLAPSED_HEADER_HEIGHT;

      settleChromeAtScrollEnd(
        y,
        maxY,
        canCollapseChrome(maxY),
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
    // gap can open at any progress. The pinned toolbar (back button + logo)
    // is a separate overlay (see `toolbarStripStyle`), so the shell is free
    // to reach zero.
    height: interpolate(
      chatsChromeProgress.value,
      [0, 1],
      [chatsExpandedHeaderHeight.value, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const headerChromeSlideStyle = useAnimatedStyle(() => {
    const slideUp = chatsExpandedHeaderHeight.value - CHATS_COLLAPSED_HEADER_HEIGHT;
    const progress = chatsChromeProgress.value;
    return {
      opacity: chromeContentOpacity(progress),
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

  const toolbarChromeFadeStyle = useAnimatedStyle(() => ({
    opacity: chromeContentOpacity(chatsChromeProgress.value),
  }));

  const toolbarStripStyle = useAnimatedStyle(() => {
    // Transparent while the solid shell is behind it; eases to the
    // translucent tint once the shell has shrunk below the strip, so chat
    // rows scroll visibly underneath the pinned toolbar.
    const tintStart = Math.max(
      0,
      1 - CHATS_COLLAPSED_HEADER_HEIGHT / chatsExpandedHeaderHeight.value,
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
    toolbarChromeFadeStyle,
    toolbarStripStyle,
    onHeaderLayout,
    resetChrome,
  };
};
