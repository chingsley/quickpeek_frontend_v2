import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { TMessage } from '@/types/message.types';
import { formatMessageTime } from '@/utils/date';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

export type MessageGroupPosition = 'single' | 'first' | 'middle' | 'last';

/** Drag distance that arms the reply action. */
const SWIPE_TRIGGER_X = 64;
/** Max drag distance the bubble follows the finger. */
const SWIPE_MAX_X = 72;

type Props = {
  message: TMessage;
  isMine: boolean;
  groupPosition: MessageGroupPosition;
  /** Resolves a senderId to a display name for quote blocks. */
  resolveSenderName: (senderId: string) => string;
  onSwipeReply: (message: TMessage) => void;
};

/**
 * WhatsApp-style message bubble: large radius with a tail on the bottom
 * outer corner of the last bubble in a same-sender group (triangle nub drawn
 * with borders, in the bubble's own background color), tighter spacing inside
 * a group, an optional quoted-reply block, and a rightward drag-to-reply
 * gesture that never hijacks vertical scrolling.
 */
const MessageBubble = ({
  message,
  isMine,
  groupPosition,
  resolveSenderName,
  onSwipeReply,
}: Props) => {
  const translateX = useSharedValue(0);
  const hasTail = groupPosition === 'single' || groupPosition === 'last';
  const bubbleColor = isMine ? colors.LIGHT_BLUE : colors.CHAT_MUTED_BG;
  const inGroup = groupPosition === 'first' || groupPosition === 'middle';

  const pan = Gesture.Pan()
    .activeOffsetX(15)
    .failOffsetY([-15, 15])
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = Math.min(event.translationX, SWIPE_MAX_X);
      }
    })
    .onEnd(() => {
      if (translateX.value >= SWIPE_TRIGGER_X) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        runOnJS(onSwipeReply)(message);
      }
      translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
    })
    .onFinalize(() => {
      // Gesture cancelled (e.g. scroll view stole it) — settle back.
      if (translateX.value !== 0 && translateX.value < SWIPE_TRIGGER_X) {
        translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    });

  const bubbleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const replyIconAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_TRIGGER_X], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(
          translateX.value,
          [0, SWIPE_TRIGGER_X],
          [0.6, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View
      style={[
        styles.row,
        isMine ? styles.rowMine : styles.rowOther,
        inGroup ? styles.rowTight : styles.rowLoose,
      ]}
    >
      <Animated.View style={[styles.replyIcon, replyIconAnimStyle]} pointerEvents="none">
        <Ionicons name="arrow-undo" size={16} color={colors.BG_WHITE} />
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.bubble,
            { backgroundColor: bubbleColor },
            hasTail && (isMine ? styles.bubbleMineTailed : styles.bubbleOtherTailed),
            bubbleAnimStyle,
          ]}
        >
          {message.replyTo ? (
            <View style={styles.quoteBox}>
              <Text style={styles.quoteName} numberOfLines={1}>
                {resolveSenderName(message.replyTo.senderId)}
              </Text>
              <Text style={styles.quoteText} numberOfLines={1}>
                {message.replyTo.text}
              </Text>
            </View>
          ) : null}

          <Text style={styles.messageText}>{message.text}</Text>
          <Text style={styles.messageTime}>{formatMessageTime(message.createdAt)}</Text>

          {hasTail ? (
            <View
              style={[
                styles.tail,
                { borderBottomColor: bubbleColor },
                isMine ? styles.tailMine : styles.tailOther,
              ]}
              pointerEvents="none"
            />
          ) : null}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export default MessageBubble;

const styles = StyleSheet.create({
  row: {
    position: 'relative',
  },
  rowMine: { alignItems: 'flex-end' },
  rowOther: { alignItems: 'flex-start' },
  /** Tighter spacing between consecutive bubbles of the same sender. */
  rowTight: { marginBottom: 3 },
  /** Wider spacing between groups / standalone bubbles. */
  rowLoose: { marginBottom: 10 },
  replyIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    marginTop: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  /** Tailed corner keeps a small radius so the nub reads as a tail. */
  bubbleMineTailed: { borderBottomRightRadius: 4 },
  bubbleOtherTailed: { borderBottomLeftRadius: 4 },
  tail: {
    position: 'absolute',
    bottom: 2,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  tailMine: {
    right: -8,
    transform: [{ rotate: '90deg' }],
  },
  tailOther: {
    left: -8,
    transform: [{ rotate: '-90deg' }],
  },
  quoteBox: {
    borderRadius: 8,
    backgroundColor: colors.CARD_BG,
    borderLeftWidth: 3,
    borderLeftColor: colors.PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 6,
  },
  quoteName: {
    fontFamily: 'roboto-medium',
    fontSize: 11,
    color: colors.PRIMARY,
    marginBottom: 2,
  },
  quoteText: {
    fontFamily: 'roboto',
    fontSize: 12,
    color: colors.MEDIUM_GRAY,
  },
  messageText: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.TEXT_DARK, lineHeight: 20 },
  messageTime: { fontFamily: 'roboto', fontSize: 10, color: colors.MEDIUM_GRAY, marginTop: 4, alignSelf: 'flex-end' },
});
