import StarRating from '@/components/StarRating';
import UserAvatar from '@/components/UserAvatar';
import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { getPublicUserProfile } from '@/services/users.services';
import { TPublicUserProfile } from '@/types/review.types';
import { formatDate } from '@/utils/date';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  userId: string | null;
  onClose: () => void;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
};

const UserProfileModal = ({ visible, userId, onClose, onPrimaryAction, primaryActionLabel }: Props) => {
  const [profile, setProfile] = useState<TPublicUserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !userId) {
      setProfile(null);
      return;
    }
    setLoading(true);
    getPublicUserProfile(userId)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [userId, visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.PRIMARY} />
            </View>
          ) : profile ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.headerRow}>
                <UserAvatar imageUrl={profile.profileImageUrl} size={64} />
                <View style={styles.headerInfo}>
                  <Text style={styles.name}>{profile.name}</Text>
                  <Text style={styles.username}>@{profile.username}</Text>
                  <Text style={styles.joined}>Joined {formatDate(profile.createdAt)}</Text>
                </View>
                <Pressable onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={colors.MEDIUM_GRAY} />
                </Pressable>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{profile.questionsAnsweredCount}</Text>
                  <Text style={styles.statLabel}>Answered</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{profile.questionsAskedCount}</Text>
                  <Text style={styles.statLabel}>Asked</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={styles.ratingRow}>
                    <StarRating rating={profile.asResponder.averageRating} size={14} />
                  </View>
                  <Text style={styles.statLabel}>
                    {profile.asResponder.reviewsCount > 0
                      ? `${profile.asResponder.averageRating.toFixed(1)} (${profile.asResponder.reviewsCount})`
                      : 'No ratings'}
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>
                Reviews ({profile.reviewsPagination.total})
              </Text>
              {profile.reviews.length === 0 ? (
                <Text style={styles.emptyText}>No reviews yet.</Text>
              ) : (
                profile.reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <StarRating rating={review.stars} size={12} />
                      <Text style={styles.reviewRaterRole}>{review.raterRole.toLowerCase()}</Text>
                      <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
                    </View>
                    {review.comment ? (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    ) : (
                      <Text style={styles.reviewNoComment}>No comment</Text>
                    )}
                    <Text style={styles.reviewRater}>
                      — {review.rater.name} (@{review.rater.username})
                    </Text>
                  </View>
                ))
              )}

              {onPrimaryAction && primaryActionLabel && (
                <CustomButton
                  text={primaryActionLabel}
                  onPress={onPrimaryAction}
                  style={styles.primaryBtn}
                />
              )}
            </ScrollView>
          ) : (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>Profile not found.</Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default UserProfileModal;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.BG_WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  centered: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  headerInfo: { flex: 1 },
  name: { fontFamily: 'roboto-bold', fontSize: fonts.FONT_SIZE_MEDIUM, color: colors.TEXT_DARK },
  username: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY },
  joined: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_XS, color: colors.MEDIUM_GRAY, marginTop: 4 },
  closeBtn: { padding: 4 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: colors.CARD_BG,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
  },
  statValue: { fontFamily: 'roboto-bold', fontSize: fonts.FONT_SIZE_MEDIUM, color: colors.TEXT_DARK },
  statLabel: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_XS, color: colors.MEDIUM_GRAY, marginTop: 4, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontFamily: 'roboto-bold', fontSize: fonts.FONT_SIZE_SMALL, color: colors.TEXT_DARK, marginBottom: 12 },
  emptyText: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY, textAlign: 'center', marginVertical: 20 },
  reviewCard: {
    backgroundColor: colors.CARD_BG,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  reviewRaterRole: { fontFamily: 'roboto-medium', fontSize: 10, color: colors.MEDIUM_GRAY, textTransform: 'uppercase' },
  reviewDate: { fontFamily: 'roboto-light', fontSize: 10, color: colors.MEDIUM_GRAY, marginLeft: 'auto' },
  reviewComment: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.TEXT_DARK, lineHeight: 20 },
  reviewNoComment: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_XS, color: colors.MEDIUM_GRAY, fontStyle: 'italic' },
  reviewRater: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_XS, color: colors.MEDIUM_GRAY, marginTop: 6 },
  primaryBtn: { marginTop: 16 },
});
