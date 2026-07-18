import UserAvatar from '@/components/UserAvatar';
import StarRating from '@/components/StarRating';
import BackButton from '@/components/shared/BackButton';
import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import {
  getOutboxQuestions,
  reassignQuestion,
} from '@/services/questions.services';
import { sendMessage } from '@/services/messages.services';
import { getPublicUserProfile } from '@/services/users.services';
import { TPublicUserProfile } from '@/types/review.types';
import { findExistingThread } from '@/utils/questions';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatDistance = (distanceKm: number) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m from question location`;
  }
  return `${distanceKm.toFixed(1)}km from question location`;
};

const GREETING_MESSAGE = 'Hi, I have a question about this location.';

const ResponderProfileScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const distance = parseFloat(params.distance as string);
  const latitude = parseFloat(params.latitude as string);
  const longitude = parseFloat(params.longitude as string);
  const address = params.address as string;
  const reassignQuestionId = (params.reassignQuestionId as string) || '';

  const [profile, setProfile] = useState<TPublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicUserProfile(userId);
      setProfile(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleMessageResponder = async () => {
    if (!profile) return;

    setMessaging(true);

    try {
      if (reassignQuestionId) {
        await reassignQuestion(reassignQuestionId, userId);
        await sendMessage(reassignQuestionId, address);
        await sendMessage(reassignQuestionId, GREETING_MESSAGE);
        router.push({
          pathname: '/chat',
          params: {
            questionId: reassignQuestionId,
            fromSelection: 'true',
          },
        });
        return;
      }

      const outboxQuestions = await getOutboxQuestions();
      const existingThread = findExistingThread(outboxQuestions, userId, latitude, longitude);

      if (existingThread) {
        router.push({
          pathname: '/chat',
          params: {
            questionId: existingThread.id,
            fromSelection: 'true',
          },
        });
        return;
      }

      router.push({
        pathname: '/chat',
        params: {
          draft: 'true',
          fromSelection: 'true',
          responderId: userId,
          responderName: profile.name,
          responderProfileImageUrl: profile.profileImageUrl ?? '',
          latitude: String(latitude),
          longitude: String(longitude),
          address,
        },
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || err?.message || 'Could not start chat.');
    } finally {
      setMessaging(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.page}>
          <BackButton color={colors.PRIMARY} />
          <Text style={styles.errorText}>{error || 'Profile not found.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <BackButton color={colors.PRIMARY} />
        <View style={styles.header}>
          <UserAvatar imageUrl={profile.profileImageUrl} size={88} />
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          {!Number.isNaN(distance) && (
            <Text style={styles.distance}>{formatDistance(distance)}</Text>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <StarRating rating={profile.asResponder.averageRating} size={18} />
            <Text style={styles.statValue}>
              {profile.asResponder.averageRating > 0
                ? profile.asResponder.averageRating.toFixed(1)
                : 'New'}
            </Text>
            <Text style={styles.statLabel}>
              {profile.asResponder.reviewsCount} review
              {profile.asResponder.reviewsCount === 1 ? '' : 's'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profile.answersCount}</Text>
            <Text style={styles.statLabel}>Answers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profile.questionsAskedCount}</Text>
            <Text style={styles.statLabel}>Questions asked</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Reviews</Text>
        {profile.reviews.length === 0 ? (
          <Text style={styles.emptyReviews}>No public reviews yet.</Text>
        ) : (
          profile.reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <UserAvatar imageUrl={review.rater.profileImageUrl} size={40} />
                <View style={styles.reviewMeta}>
                  <Text style={styles.reviewAuthor}>{review.rater.name}</Text>
                  <StarRating rating={review.stars} size={14} />
                </View>
              </View>
              {review.comment ? (
                <Text style={styles.reviewComment}>{review.comment}</Text>
              ) : null}
            </View>
          ))
        )}

        <CustomButton
          text={messaging ? 'Starting chat…' : 'Message this responder'}
          onPress={handleMessageResponder}
          loading={messaging}
          disabled={messaging}
          style={styles.messageBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ResponderProfileScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.BG_WHITE,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  page: {
    flex: 1,
    padding: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  name: {
    fontFamily: 'roboto-bold',
    fontSize: 28,
    color: colors.TEXT_DARK,
    marginTop: 16,
  },
  username: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    marginTop: 4,
  },
  distance: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.DARK_GRAY,
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: colors.BG_WHITE,
  },
  statValue: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
    marginTop: 8,
  },
  statNumber: {
    fontFamily: 'roboto-bold',
    fontSize: 24,
    color: colors.TEXT_DARK,
  },
  statLabel: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    marginTop: 6,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_XL,
    color: colors.TEXT_DARK,
    marginBottom: 14,
  },
  emptyReviews: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    marginBottom: 24,
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  reviewMeta: {
    flex: 1,
    gap: 4,
  },
  reviewAuthor: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
  reviewComment: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.DARK_GRAY,
    lineHeight: 22,
  },
  messageBtn: {
    marginTop: 12,
  },
  errorText: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.RED,
    marginTop: 24,
  },
});
