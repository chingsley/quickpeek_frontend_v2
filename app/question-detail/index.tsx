import BackButton from '@/components/shared/BackButton';
import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { formatDate } from '@/utils/date';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <View style={styles.starRow}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <Ionicons key={`full-${i}`} name="star" size={22} color={colors.STAR_GOLD} />
      ))}
      {halfStar && <Ionicons name="star-half" size={22} color={colors.STAR_GOLD} />}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Ionicons key={`empty-${i}`} name="star-outline" size={22} color={colors.LIGHT_GRAY} />
      ))}
    </View>
  );
};

const QuestionDetail = () => {
  const { address, questionText, createdAt, answer, answerRating, responderUsername, isOutbox, isPending } =
    useLocalSearchParams();

  const handleReask = () => {
    console.log('Re-asking question:', questionText);
  };

  const isPendingBool = isPending === 'true';
  const isOutboxBool = isOutbox === 'true';
  const hasAnswer = answer && String(answer).trim().length > 0;
  const rating = answerRating ? Number(answerRating) : 0;

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <BackButton color={colors.PRIMARY} />
        </View>

        {/* Page Title */}
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

        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* Answer Section */}
        <Text style={styles.sectionTitle}>Answer</Text>

        {hasAnswer ? (
          <View style={styles.card}>
            <Text style={styles.answerText}>{answer}</Text>

            <View style={styles.answerFooter}>
              {responderUsername && String(responderUsername).trim().length > 0 && (
                <View style={styles.responderRow}>
                  <Ionicons name="person-circle-outline" size={20} color={colors.DARK_GRAY} />
                  <Text style={styles.responderText}>Responded by {String(responderUsername)}</Text>
                </View>
              )}

              {rating > 0 && (
                <View style={styles.ratingSection}>
                  <StarRating rating={rating} />
                  <Text style={styles.ratingText}>
                    {rating.toFixed(1)} / 5
                  </Text>
                </View>
              )}
            </View>
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

        {/* Action Button */}
        {isOutboxBool && (
          <View style={styles.actionArea}>
            <CustomButton
              text={isPendingBool ? 'Pending Response' : 'Re-ask Question'}
              onPress={handleReask}
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

  /* Header */
  header: {
    marginBottom: 10,
  },

  /* Page Title */
  pageTitle: {
    fontFamily: 'roboto-bold',
    fontSize: 28,
    color: colors.TEXT_DARK,
    marginBottom: 24,
  },

  /* Metadata Card */
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

  /* Card (shared) */
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

  /* Section Divider */
  sectionDivider: {
    height: 1,
    backgroundColor: colors.CARD_BORDER,
    marginVertical: 28,
  },

  /* Section Title */
  sectionTitle: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_XL,
    color: colors.TEXT_DARK,
    marginBottom: 16,
  },

  /* Answer */
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
    marginBottom: 10,
  },
  responderText: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.DARK_GRAY,
    marginLeft: 8,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  starRow: {
    flexDirection: 'row',
    gap: 3,
  },
  ratingText: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.DARK_GRAY,
  },

  /* Empty State */
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

  /* Action */
  actionArea: {
    marginTop: 24,
  },
  btnSubmit: {},
});
