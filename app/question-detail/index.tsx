import BackButton from '@/components/shared/BackButton';
import CustomButton from '@/components/shared/CustomButton';
import StarRating from '@/components/StarRating';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { rateAnswer } from '@/services/ratings.services';
import { formatDate } from '@/utils/date';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TAP_STAR_SIZE = 38;

const QuestionDetail = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    questionId,
    address,
    questionText,
    longitude,
    latitude,
    createdAt,
    answer,
    answerRating,
    answerId,
    responderUsername,
    responderId,
    responderAverageRating,
    isOutbox,
    isPending,
    isExpired,
  } = params;

  const isOutboxBool = isOutbox === 'true';
  const isPendingBool = isPending === 'true';
  const isExpiredBool = isExpired === 'true';
  const hasAnswer = answer && String(answer).trim().length > 0;
  const existingRating = answerRating ? Number(answerRating) : 0;
  const hasExistingRating = existingRating > 0;
  const respAvgRating = responderAverageRating ? Number(responderAverageRating) : 0;
  const answerIdStr = answerId as string | undefined;

  const [selectedRating, setSelectedRating] = useState(0);
  const [submittedRating, setSubmittedRating] = useState(existingRating);
  const [submitting, setSubmitting] = useState(false);

  const canRate = isOutboxBool && hasAnswer && !hasExistingRating && submittedRating === 0 && !!answerIdStr;
  const isRated = hasExistingRating || submittedRating > 0;
  const displayRating = submittedRating > 0 ? submittedRating : existingRating;

  const handleStarPress = (star: number) => {
    if (!canRate) return;
    setSelectedRating(star);
  };

  const handleSubmitRating = async () => {
    if (!answerIdStr || selectedRating === 0) return;
    setSubmitting(true);
    try {
      await rateAnswer(answerIdStr, selectedRating);
      setSubmittedRating(selectedRating);
      setSelectedRating(0);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Could not submit rating';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRechooseResponder = () => {
    router.push({
      pathname: '/responders',
      params: {
        latitude: String(latitude),
        longitude: String(longitude),
        address: address as string,
        reassignQuestionId: questionId as string,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton color={colors.PRIMARY} />
        </View>

        <Text style={styles.pageTitle}>Question Details</Text>

        {/* Metadata Card */}
        <View style={styles.metadataCard}>
          <View style={styles.metadataRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="location-outline" size={16} color={colors.PRIMARY} />
            </View>
            <Text style={styles.metadataText} numberOfLines={3}>
              {address}
            </Text>
          </View>
          <View style={styles.metadataDivider} />
          <View style={styles.metadataRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={16} color={colors.MEDIUM_GRAY} />
            </View>
            <Text style={styles.metadataTime}>{formatDate(createdAt as string)}</Text>
          </View>
        </View>

        {/* Question Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Your Question</Text>
          <Text style={styles.questionText}>{questionText}</Text>
        </View>

        <View style={styles.sectionDivider} />

        {/* Answer Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconCircle}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.PRIMARY} />
          </View>
          <Text style={styles.sectionTitle}>Answer</Text>
        </View>

        {hasAnswer ? (
          <View style={styles.card}>
            <Text style={styles.answerText}>{String(answer)}</Text>

            <View style={styles.answerFooter}>
              {responderUsername && String(responderUsername).trim().length > 0 && (
                <View style={styles.responderRow}>
                  <View style={styles.responderAvatar}>
                    <Ionicons name="person" size={16} color={colors.PRIMARY} />
                  </View>
                  <View style={styles.responderInfo}>
                    <Text style={styles.responderName}>
                      {String(responderUsername)}
                    </Text>
                    {respAvgRating > 0 && (
                      <View style={styles.responderRatingRow}>
                        <StarRating rating={respAvgRating} size={12} />
                        <Text style={styles.responderRatingText}>
                          {respAvgRating.toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {isRated && (
                <View style={styles.ratingSection}>
                  <Text style={styles.ratingLabel}>Your rating</Text>
                  <View style={styles.ratingDisplay}>
                    <StarRating rating={displayRating} size={22} />
                    <Text style={styles.ratingValue}>{displayRating}/5</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        ) : isExpiredBool ? (
          <View style={styles.emptyStateCard}>
            <Ionicons name="timer-outline" size={40} color={colors.ACTIVE} />
            <Text style={styles.emptyStateTitle}>Response window expired</Text>
            <Text style={styles.emptyStateBody}>
              Your responder did not answer in time. You can choose a different responder to try again.
            </Text>
          </View>
        ) : (
          <View style={styles.emptyStateCard}>
            <Ionicons name="hourglass-outline" size={40} color={colors.LIGHT_GRAY} />
            <Text style={styles.emptyStateTitle}>Awaiting Response</Text>
            <Text style={styles.emptyStateBody}>
              Your question hasn't been answered yet. We'll notify you when someone responds.
            </Text>
          </View>
        )}

        {/* Rate Answer Section */}
        {canRate && (
          <View style={styles.rateCard}>
            <Text style={styles.rateTitle}>How helpful was this answer?</Text>
            <Text style={styles.rateSubtitle}>Tap a star to rate the responder</Text>

            <View style={styles.tapStarRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleStarPress(star)}
                  activeOpacity={0.6}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Ionicons
                    name={star <= selectedRating ? 'star' : 'star-outline'}
                    size={TAP_STAR_SIZE}
                    color={star <= selectedRating ? colors.STAR_GOLD : colors.LIGHT_GRAY}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {selectedRating > 0 && (
              <CustomButton
                text={submitting ? 'Sending…' : `Rate ${selectedRating} star${selectedRating > 1 ? 's' : ''}`}
                onPress={handleSubmitRating}
                style={styles.submitRatingBtn}
                loading={submitting}
                disabled={submitting}
              />
            )}
          </View>
        )}

        {/* Thank-you after rating */}
        {submittedRating > 0 && !hasExistingRating && (
          <View style={styles.thankYouCard}>
            <Ionicons name="checkmark-circle" size={24} color={colors.PRIMARY} />
            <Text style={styles.thankYouText}>Thanks for your feedback!</Text>
          </View>
        )}

        {/* Action */}
        {isOutboxBool && isExpiredBool && (
          <View style={styles.actionArea}>
            <CustomButton
              text="Choose another responder"
              onPress={handleRechooseResponder}
              style={styles.btnSubmit}
            />
          </View>
        )}

        {isOutboxBool && !hasAnswer && !isExpiredBool && (
          <View style={styles.actionArea}>
            <CustomButton
              text={isPendingBool ? 'Awaiting Response…' : 'Re-ask Question'}
              onPress={() => { }}
              style={styles.btnSubmit}
              disabled={isPendingBool}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default QuestionDetail;

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: colors.BG_WHITE,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 10,
  },
  pageTitle: {
    fontFamily: 'roboto-bold',
    fontSize: 28,
    color: colors.TEXT_DARK,
    marginBottom: 24,
  },
  metadataCard: {
    backgroundColor: colors.BG_WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 20,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metadataText: {
    flex: 1,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    lineHeight: 22,
  },
  metadataDivider: {
    height: 1,
    backgroundColor: colors.CARD_BORDER,
    marginVertical: 12,
  },
  metadataTime: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
  },
  card: {
    backgroundColor: colors.BG_WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  cardLabel: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  questionText: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
    lineHeight: 26,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.CARD_BORDER,
    marginVertical: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_XL,
    color: colors.TEXT_DARK,
  },
  answerText: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
    lineHeight: 26,
  },
  answerFooter: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.CARD_BORDER,
  },
  responderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  responderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  responderInfo: {
    flex: 1,
  },
  responderName: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    marginBottom: 2,
  },
  responderRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  responderRatingText: {
    fontFamily: 'roboto-light',
    fontSize: 12,
    color: colors.MEDIUM_GRAY,
  },
  ratingSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.CARD_BORDER,
  },
  ratingLabel: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    marginBottom: 8,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingValue: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
  emptyStateCard: {
    backgroundColor: colors.BG_WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    borderStyle: 'dashed',
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.DARK_GRAY,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyStateBody: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    textAlign: 'center',
    lineHeight: 22,
  },
  rateCard: {
    backgroundColor: colors.BG_WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.STAR_GOLD,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  rateTitle: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
    marginBottom: 4,
  },
  rateSubtitle: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    marginBottom: 20,
  },
  tapStarRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  submitRatingBtn: {
    minWidth: 180,
  },
  thankYouCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.LIGHT_GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  thankYouText: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.PRIMARY,
  },
  actionArea: {
    marginTop: 24,
  },
  btnSubmit: {},
});
