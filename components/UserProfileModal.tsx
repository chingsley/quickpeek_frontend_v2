import StarRating from '@/components/StarRating';
import UserAvatar from '@/components/UserAvatar';
import BottomSheet from '@/components/shared/BottomSheet';
import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { getPublicUserProfile } from '@/services/users.services';
import { TPublicUserProfile } from '@/types/review.types';
import { formatDate } from '@/utils/date';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type RequestDecisionActions = {
  onAccept: () => void;
  onReject: () => void;
  acceptLoading?: boolean;
  rejectLoading?: boolean;
};

type Props = {
  visible: boolean;
  userId: string | null;
  openKey?: number;
  onClose: () => void;
  onClosed?: () => void;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  requestDecision?: RequestDecisionActions;
};

const UserProfileModal = ({
  visible,
  userId,
  openKey = 0,
  onClose,
  onClosed,
  onPrimaryAction,
  primaryActionLabel,
  requestDecision,
}: Props) => {
  const [profile, setProfile] = useState<TPublicUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProfile = useCallback(async (targetUserId: string, cancelled: () => boolean) => {
    setLoading(true);
    setLoadError(null);
    setProfile(null);

    try {
      const data = await getPublicUserProfile(targetUserId);
      if (cancelled()) return;
      setProfile(data);
    } catch {
      if (cancelled()) return;
      setProfile(null);
      setLoadError('Could not load this profile. Please try again.');
    } finally {
      if (!cancelled()) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      setProfile(null);
      setLoading(false);
      setLoadError(null);
      return;
    }

    if (!userId) {
      setProfile(null);
      setLoading(false);
      setLoadError('Could not load this profile. Please try again.');
      return;
    }

    let cancelled = false;
    const isCancelled = () => cancelled;

    loadProfile(userId, isCancelled);

    return () => {
      cancelled = true;
    };
  }, [loadProfile, openKey, userId, visible]);

  const handleRetry = () => {
    if (!userId) return;
    loadProfile(userId, () => false);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} onClosed={onClosed} sheetStyle={styles.sheet}>
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>Profile</Text>
        <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close profile">
          <Ionicons name="close" size={20} color={colors.MEDIUM_GRAY} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      ) : loadError ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{loadError}</Text>
          <Pressable style={styles.retryBtn} onPress={handleRetry}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </Pressable>
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

          {requestDecision && (
            <View style={styles.decisionArea}>
              <Text style={styles.decisionTitle}>Review this request</Text>
              <View style={styles.decisionRow}>
                <Pressable
                  style={[
                    styles.rejectBtn,
                    requestDecision.rejectLoading && styles.decisionBtnDisabled,
                  ]}
                  onPress={requestDecision.onReject}
                  disabled={requestDecision.rejectLoading || requestDecision.acceptLoading}
                >
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </Pressable>
                <CustomButton
                  text="Accept request"
                  onPress={requestDecision.onAccept}
                  loading={requestDecision.acceptLoading}
                  disabled={requestDecision.rejectLoading}
                  style={styles.acceptBtn}
                  noTopMargin
                />
              </View>
            </View>
          )}

          {onPrimaryAction && primaryActionLabel && !requestDecision && (
            <CustomButton
              text={primaryActionLabel}
              onPress={onPrimaryAction}
              style={styles.primaryBtn}
            />
          )}
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Could not load this profile.</Text>
          <Pressable style={styles.retryBtn} onPress={handleRetry}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </Pressable>
        </View>
      )}
    </BottomSheet>
  );
};

export default UserProfileModal;

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.BG_WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: 220,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sheetTitle: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 12,
    padding: 8,
  },
  centered: {
    minHeight: 160,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  headerInfo: { flex: 1 },
  name: { fontFamily: 'roboto-bold', fontSize: fonts.FONT_SIZE_MEDIUM, color: colors.TEXT_DARK },
  username: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY },
  joined: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_XS, color: colors.MEDIUM_GRAY, marginTop: 4 },
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
  emptyText: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY, textAlign: 'center', marginVertical: 12 },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
  },
  retryBtnText: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.PRIMARY,
  },
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
  decisionArea: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.CARD_BORDER },
  decisionTitle: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    marginBottom: 12,
  },
  decisionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  acceptBtn: { flex: 1, marginTop: 0 },
  rejectBtn: {
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 100,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: { fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_SMALL, color: colors.DARK_GRAY },
  decisionBtnDisabled: { opacity: 0.5 },
  primaryBtn: { marginTop: 16 },
});
