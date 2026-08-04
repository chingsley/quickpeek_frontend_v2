import CustomButton from '@/components/shared/CustomButton';
import BottomSheet from '@/components/shared/BottomSheet';
import { useActionSheet } from '@/components/shared/useActionSheet';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { BORDER_RADIUS_INPUT } from '@/constants/layout';
import { REVIEW_COMMENT_MAX_LENGTH } from '@/constants/reviews';
import { submitReview } from '@/services/reviews.services';
import { useReviewWindowCountdown } from '@/utils/reviewWindow';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  requestId: string;
  /** Preselected star count when opening (e.g. from the timeline rating card). */
  initialStars?: number;
  reviewWindowEndsAt: string | null;
  reviewWindowOpen: boolean;
  reviewWindowDays: number;
  onClose: () => void;
  onSubmitted: () => void;
  onWindowExpired?: () => void;
};

const ReviewModal = ({
  visible,
  requestId,
  initialStars,
  reviewWindowEndsAt,
  reviewWindowOpen,
  reviewWindowDays,
  onClose,
  onSubmitted,
  onWindowExpired,
}: Props) => {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showActionSheet, actionSheet } = useActionSheet();
  const { remaining, ended } = useReviewWindowCountdown({
    endsAt: reviewWindowEndsAt,
    windowOpen: reviewWindowOpen,
    onWindowExpired,
  });
  const windowClosed = ended || !reviewWindowOpen;

  useEffect(() => {
    if (visible) {
      setStars(initialStars ?? 0);
      return;
    }
    setStars(0);
    setComment('');
    setSubmitting(false);
  }, [visible, initialStars]);

  const handleSubmit = async () => {
    if (stars === 0 || submitting || windowClosed) return;
    setSubmitting(true);
    try {
      const result = await submitReview(requestId, stars, comment.trim() || undefined);
      showActionSheet({
        title: 'Review submitted',
        message: result.revealed
          ? 'Your review is now visible on their profile.'
          : 'Your review is hidden until they review you or the review window closes.',
        tone: 'success',
      });
      onSubmitted();
    } catch (err: any) {
      showActionSheet({
        title: 'Error',
        message: err?.response?.data?.error || 'Could not submit review.',
        tone: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <BottomSheet visible={visible} onClose={onClose} sheetStyle={styles.sheet}>
      <Text style={styles.title}>Rate this user</Text>
      {windowClosed ? (
        <Text style={styles.endedText}>Review window ended — you can no longer submit a review.</Text>
      ) : (
        <>
          <Text style={styles.subtitle}>
            Your review stays hidden until both of you submit, or the review window closes. You have{' '}
            {reviewWindowDays} days from when reviews opened.
          </Text>
          {remaining && <Text style={styles.countdown}>{remaining}</Text>}
        </>
      )}

      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable
            key={value}
            onPress={() => !windowClosed && setStars(value)}
            hitSlop={8}
            disabled={windowClosed}
            accessibilityState={{ disabled: windowClosed }}
          >
            <Ionicons
              name={value <= stars ? 'star' : 'star-outline'}
              size={34}
              color={
                windowClosed
                  ? colors.LIGHT_GRAY
                  : value <= stars
                    ? colors.STAR_GOLD
                    : colors.LIGHT_GRAY
              }
            />
          </Pressable>
        ))}
      </View>

      <TextInput
        style={[styles.commentInput, windowClosed && styles.commentInputDisabled]}
        placeholder="Leave a comment (optional)"
        placeholderTextColor={colors.MEDIUM_GRAY}
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={REVIEW_COMMENT_MAX_LENGTH}
        editable={!windowClosed}
      />

      <CustomButton
        text={windowClosed ? 'Review window ended' : submitting ? 'Submitting…' : 'Submit review'}
        onPress={handleSubmit}
        loading={submitting}
        disabled={windowClosed || stars === 0 || submitting}
      />
      </BottomSheet>

      {actionSheet}
    </>
  );
};

export default ReviewModal;

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.BG_WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  title: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_XL,
    color: colors.TEXT_DARK,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    lineHeight: 20,
    marginBottom: 8,
  },
  countdown: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.PRIMARY,
    marginBottom: 16,
  },
  endedText: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    lineHeight: 20,
    marginBottom: 20,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  commentInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    borderRadius: BORDER_RADIUS_INPUT,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    marginBottom: 8,
    textAlignVertical: 'top',
  },
  commentInputDisabled: {
    backgroundColor: colors.CARD_BG,
    color: colors.MEDIUM_GRAY,
  },
});
