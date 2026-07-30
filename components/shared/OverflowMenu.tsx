import OverflowMenuButton from '@/components/shared/OverflowMenuButton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { BORDER_RADIUS_MENU } from '@/constants/layout';
import { runAfterOverlayDismiss } from '@/utils/runAfterOverlayDismiss';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const MENU_MIN_WIDTH = 220;
const MENU_ICON_SIZE = 22;
const MENU_HORIZONTAL_PADDING = 16;
const MENU_VERTICAL_PADDING = 6;
const MENU_OPEN_SPRING = { damping: 17, stiffness: 320, mass: 0.65 };
const MENU_CLOSE_DURATION_MS = 160;
const BACKDROP_OPEN_DURATION_MS = 200;
const BACKDROP_CLOSE_DURATION_MS = 160;
const BACKDROP_EASING = Easing.out(Easing.quad);

export type OverflowMenuItem = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  onPress: () => void;
  disabled?: boolean;
};

type AnchorLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type OverflowMenuProps = {
  items: OverflowMenuItem[];
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  menuMinWidth?: number;
};

const OverflowMenu = ({
  items,
  accessibilityLabel = 'Open menu',
  style,
  buttonStyle,
  menuMinWidth = MENU_MIN_WIDTH,
}: OverflowMenuProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const anchorRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [anchorLayout, setAnchorLayout] = useState<AnchorLayout | null>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const dismissCleanupRef = useRef<(() => void) | null>(null);
  const closingRef = useRef(false);
  const menuProgress = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const finishClose = useCallback(() => {
    closingRef.current = false;
    setVisible(false);
  }, []);

  const animateOpen = useCallback(() => {
    cancelAnimation(menuProgress);
    cancelAnimation(backdropOpacity);
    menuProgress.value = 0;
    backdropOpacity.value = 0;
    menuProgress.value = withSpring(1, MENU_OPEN_SPRING);
    backdropOpacity.value = withTiming(1, {
      duration: BACKDROP_OPEN_DURATION_MS,
      easing: BACKDROP_EASING,
    });
  }, [backdropOpacity, menuProgress]);

  const animateClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    cancelAnimation(menuProgress);
    cancelAnimation(backdropOpacity);
    menuProgress.value = withTiming(0, {
      duration: MENU_CLOSE_DURATION_MS,
      easing: BACKDROP_EASING,
    });
    backdropOpacity.value = withTiming(0, {
      duration: BACKDROP_CLOSE_DURATION_MS,
      easing: BACKDROP_EASING,
    }, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  }, [backdropOpacity, finishClose, menuProgress]);

  const openMenu = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setAnchorLayout({ x, y, width, height });
      setVisible(true);
    });
  }, []);

  const closeMenu = useCallback(() => {
    if (!visible) return;
    animateClose();
  }, [animateClose, visible]);

  const handleItemPress = useCallback(
    (item: OverflowMenuItem) => {
      if (item.disabled) return;
      pendingActionRef.current = item.onPress;
      closeMenu();
    },
    [closeMenu],
  );

  useEffect(() => {
    if (visible || !pendingActionRef.current) return;

    const action = pendingActionRef.current;
    pendingActionRef.current = null;

    dismissCleanupRef.current?.();
    dismissCleanupRef.current = runAfterOverlayDismiss(action);
  }, [visible]);

  useEffect(
    () => () => {
      dismissCleanupRef.current?.();
      dismissCleanupRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (!visible) return;
    animateOpen();
  }, [animateOpen, visible]);

  const menuPosition = useMemo(() => {
    if (!anchorLayout) return null;

    const top = anchorLayout.y;
    const right = Math.max(12, screenWidth - anchorLayout.x - anchorLayout.width);

    return { top, right };
  }, [anchorLayout, screenWidth]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(menuProgress.value, [0, 0.35, 1], [0, 0.9, 1]),
    transform: [{ scale: interpolate(menuProgress.value, [0, 1], [0.86, 1]) }],
    transformOrigin: 'top right',
  }));

  if (items.length === 0) return null;

  return (
    <View ref={anchorRef} collapsable={false} style={style}>
      <OverflowMenuButton
        onPress={openMenu}
        accessibilityLabel={accessibilityLabel}
        style={buttonStyle}
      />

      <Modal visible={visible} transparent animationType="none" onRequestClose={closeMenu}>
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeMenu}
            accessibilityLabel="Close menu"
          >
            <Animated.View style={[styles.backdrop, backdropAnimatedStyle]} />
          </Pressable>
          {menuPosition && (
            <Animated.View
              style={[
                styles.menu,
                menuAnimatedStyle,
                {
                  top: menuPosition.top,
                  right: menuPosition.right,
                  minWidth: menuMinWidth,
                },
              ]}
            >
              {items.map((item, index) => (
                <React.Fragment key={item.key}>
                  {index > 0 && <View style={styles.divider} />}
                  <Pressable
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed && !item.disabled && styles.menuItemPressed,
                      item.disabled && styles.menuItemDisabled,
                    ]}
                    onPress={() => handleItemPress(item)}
                    disabled={item.disabled}
                    accessibilityRole="menuitem"
                    accessibilityLabel={item.label}
                  >
                    <Ionicons
                      name={item.icon}
                      size={MENU_ICON_SIZE}
                      color={item.disabled ? colors.MEDIUM_GRAY : (item.iconColor ?? colors.TEXT_DARK)}
                    />
                    <Text
                      style={[styles.menuItemLabel, item.disabled && styles.menuItemLabelDisabled]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                </React.Fragment>
              ))}
            </Animated.View>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default OverflowMenu;

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.BACKDROP_LIGHT,
  },
  menu: {
    position: 'absolute',
    backgroundColor: colors.BG_WHITE,
    borderRadius: BORDER_RADIUS_MENU,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    paddingVertical: MENU_VERTICAL_PADDING,
    shadowColor: colors.BG_BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: MENU_HORIZONTAL_PADDING,
    paddingVertical: 12,
    minHeight: 48,
  },
  menuItemPressed: {
    backgroundColor: colors.CARD_BG,
  },
  menuItemDisabled: {
    opacity: 0.45,
  },
  menuItemLabel: {
    flex: 1,
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
  menuItemLabelDisabled: {
    color: colors.MEDIUM_GRAY,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.CARD_BORDER,
    marginHorizontal: MENU_HORIZONTAL_PADDING,
  },
});
