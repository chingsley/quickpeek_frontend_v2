import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { submitReview } from '@/services/reviews.services';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  questionId: string;
  onClose: () => void;
  onSubmitted: () => void;
};

const ReviewModal = ({ visible, questionId, onClose, onSubmitted }: Props) => {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setStars(0);
      setComment('');
      setSubmitting(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (stars === 0 || submitting) return;
    setSubmitting(true);
    try {
      const result = await submitReview(questionId, stars, comment.trim() || undefined);
      Alert.alert(
        result.revealed ? 'Review submitted' : 'Review submitted',
        result.revealed
          ? 'Your review is now visible on their profile.'
          : 'Your review is hidden until they review you or the review window closes.',
      );
      onSubmitted();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>Rate this user</Text>
          <Text style={styles.subtitle}>
            Your review stays hidden until both of you submit, or the review window closes.
          </Text>

          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} onPress={() => setStars(value)} hitSlop={8}>
                <Ionicons
                  name={value <= stars ? 'star' : 'star-outline'}
                  size={34}
                  color={value <= stars ? colors.STAR_GOLD : colors.LIGHT_GRAY}
                />
              </Pressable>
            ))}
          </View>

          <TextInput
            style={styles.commentInput}
            placeholder="Leave a comment (optional)"
            placeholderTextColor={colors.MEDIUM_GRAY}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={1000}
          />

          <CustomButton
            text={submitting ? 'Submitting…' : 'Submit review'}
            onPress={handleSubmit}
            loading={submitting}
            disabled={stars === 0 || submitting}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ReviewModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
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
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_XS,
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
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    marginBottom: 8,
    textAlignVertical: 'top',
  },
});
