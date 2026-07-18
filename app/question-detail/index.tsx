import BackButton from '@/components/shared/BackButton';
import CustomButton from '@/components/shared/CustomButton';
import ReviewModal from '@/components/ReviewModal';
import StarRating from '@/components/StarRating';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { getReviewEligibility } from '@/services/reviews.services';
import { formatDate } from '@/utils/date';
import { TReviewEligibility } from '@/types/review.types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  const [reviewVisible, setReviewVisible] = useState(false);
  const [eligibility, setEligibility] = useState<TReviewEligibility | null>(null);

  const questionIdStr = questionId as string | undefined;
  const isOutboxBool = isOutbox === 'true';
  const isPendingBool = isPending === 'true';
  const isExpiredBool = isExpired === 'true';
  const hasAnswer = answer && String(answer).trim().length > 0;
  const existingRating = answerRating ? Number(answerRating) : 0;
  const respAvgRating = responderAverageRating ? Number(responderAverageRating) : 0;

  useEffect(() => {
    if (!questionIdStr) return;
    getReviewEligibility(questionIdStr)
      .then(setEligibility)
      .catch(() => setEligibility(null));
  }, [questionIdStr]);

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

  const handleOpenChat = () => {
    if (!questionIdStr) return;
    router.push({
      pathname: '/chat',
      params: { questionId: questionIdStr },
    });
  };

  const handleReaskQuestion = () => {
    router.push({
      pathname: '/(tabs)/Home',
      params: {
        questionText: questionText as string,
        address: address as string,
        longitude: String(longitude),
        latitude: String(latitude),
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

              {existingRating > 0 && (
                <View style={styles.ratingSection}>
                  <Text style={styles.ratingLabel}>Your rating</Text>
                  <View style={styles.ratingDisplay}>
                    <StarRating rating={existingRating} size={22} />
                    <Text style={styles.ratingValue}>{existingRating}/5</Text>
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

        {questionIdStr && (
          <View style={styles.actionArea}>
            <CustomButton
              text="Open conversation"
              onPress={handleOpenChat}
              style={styles.btnSubmit}
            />
          </View>
        )}

        {questionIdStr && eligibility?.canReview && (
          <View style={styles.actionArea}>
            <CustomButton
              text="Rate this user"
              onPress={() => setReviewVisible(true)}
              style={styles.btnSubmit}
            />
          </View>
        )}

        {questionIdStr && eligibility?.alreadyReviewed && !eligibility.reviewRevealed && (
          <View style={styles.thankYouCard}>
            <Ionicons name="eye-off-outline" size={24} color={colors.PRIMARY} />
            <Text style={styles.thankYouText}>
              Your review is hidden until they review you back.
            </Text>
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

        {isOutboxBool && !isExpiredBool && (
          <View style={styles.actionArea}>
            <CustomButton
              text={isPendingBool && !hasAnswer ? 'Awaiting Response…' : 'Re-ask Question'}
              onPress={handleReaskQuestion}
              style={styles.btnSubmit}
              disabled={isPendingBool && !hasAnswer}
            />
          </View>
        )}
      </ScrollView>

      {questionIdStr && (
        <ReviewModal
          visible={reviewVisible}
          questionId={questionIdStr}
          onClose={() => setReviewVisible(false)}
          onSubmitted={() => {
            setReviewVisible(false);
            getReviewEligibility(questionIdStr).then(setEligibility).catch(() => undefined);
          }}
        />
      )}
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
