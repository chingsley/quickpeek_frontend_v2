import {
  BOTTOM_SHEET_BACKDROP_DURATION_MS,
  BOTTOM_SHEET_CLOSE_DURATION_MS,
  BOTTOM_SHEET_OPEN_DURATION_MS,
} from '@/constants/bottomSheet';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Called after the close animation finishes and the modal unmounts. */
  onClosed?: () => void;
  children: React.ReactNode;
  sheetStyle?: StyleProp<ViewStyle>;
  backdropColor?: string;
};

const BACKDROP_EASING = Easing.out(Easing.quad);
const SHEET_OPEN_EASING = Easing.bezier(0.22, 1, 0.36, 1);
const SHEET_CLOSE_EASING = Easing.bezier(0.4, 0, 0.2, 1);

const BottomSheet = ({
  visible,
  onClose,
  onClosed,
  children,
  sheetStyle,
  backdropColor = 'rgba(0, 0, 0, 0.4)',
}: BottomSheetProps) => {
  const { height: windowHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(windowHeight);
  const animationTokenRef = useRef(0);
  const mountedRef = useRef(visible);
  const openFrameRef = useRef<number | null>(null);
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;

  const finishClose = useCallback((token: number) => {
    if (token !== animationTokenRef.current) return;
    mountedRef.current = false;
    setMounted(false);
    onClosedRef.current?.();
  }, []);

  useEffect(() => {
    const token = ++animationTokenRef.current;
    const distance = windowHeight;

    if (openFrameRef.current !== null) {
      cancelAnimationFrame(openFrameRef.current);
      openFrameRef.current = null;
    }

    cancelAnimation(backdropOpacity);
    cancelAnimation(sheetTranslateY);

    if (visible) {
      mountedRef.current = true;
      setMounted(true);
      backdropOpacity.value = 0;
      sheetTranslateY.value = distance;

      openFrameRef.current = requestAnimationFrame(() => {
        openFrameRef.current = null;
        if (token !== animationTokenRef.current) return;

        backdropOpacity.value = withTiming(1, {
          duration: BOTTOM_SHEET_BACKDROP_DURATION_MS,
          easing: BACKDROP_EASING,
        });
        sheetTranslateY.value = withTiming(0, {
          duration: BOTTOM_SHEET_OPEN_DURATION_MS,
          easing: SHEET_OPEN_EASING,
        });
      });

      return () => {
        if (openFrameRef.current !== null) {
          cancelAnimationFrame(openFrameRef.current);
          openFrameRef.current = null;
        }
      };
    }

    if (!mountedRef.current) {
      return;
    }

    backdropOpacity.value = withTiming(0, {
      duration: BOTTOM_SHEET_BACKDROP_DURATION_MS,
      easing: BACKDROP_EASING,
    });
    sheetTranslateY.value = withTiming(
      distance,
      {
        duration: BOTTOM_SHEET_CLOSE_DURATION_MS,
        easing: SHEET_CLOSE_EASING,
      },
      (finished) => {
        if (finished) {
          runOnJS(finishClose)(token);
        }
      },
    );
  }, [backdropOpacity, finishClose, sheetTranslateY, visible, windowHeight]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  if (!mounted) {
    return null;
  }

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={onClose}
    >
      <View style={styles.host} pointerEvents="box-none">
        <Animated.View
          pointerEvents="auto"
          style={[styles.backdrop, { backgroundColor: backdropColor }, backdropAnimatedStyle]}
        >
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        </Animated.View>

        <Animated.View
          collapsable={false}
          style={[styles.sheet, sheetAnimatedStyle, sheetStyle]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default BottomSheet;

const styles = StyleSheet.create({
  host: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    width: '100%',
  },
});
