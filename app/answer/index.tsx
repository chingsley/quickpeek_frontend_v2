import BackButton from '@/components/shared/BackButton';
import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { submitAnswer, submitAnswerWithImage } from '@/services/questions.services';
import { formatDate } from '@/utils/date';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MAX_ANSWER_LENGTH = 500;

const formatCountdown = (ms: number): string => {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const AnswerQuestion = () => {
  const router = useRouter();
  const { id, address, questionText, createdAt, assignedAt, timeToRespondMs } = useLocalSearchParams();

  const questionId = id as string;
  const ttrMs = parseInt((timeToRespondMs as string) || '600000', 10);
  const assignedTime = new Date((assignedAt as string) || (createdAt as string)).getTime();

  const [answer, setAnswer] = useState('');
  const [attachment, setAttachment] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [remainingMs, setRemainingMs] = useState(() => {
    const elapsed = Date.now() - assignedTime;
    return Math.max(0, ttrMs - elapsed);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - assignedTime;
      setRemainingMs(Math.max(0, ttrMs - elapsed));
    }, 1000);
    return () => clearInterval(interval);
  }, [assignedTime, ttrMs]);

  const isExpired = remainingMs <= 0;
  const isSendDisabled = answer.trim().length === 0 || loading || isExpired;

  const handleSend = async () => {
    if (isSendDisabled || !questionId) return;
    setLoading(true);
    try {
      if (attachment) {
        await submitAnswerWithImage(questionId, answer.trim(), attachment.uri);
      } else {
        await submitAnswer(questionId, answer.trim());
      }
      Alert.alert('Response sent', 'Your answer has been delivered.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Could not send your response.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickAttachment = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setAttachment(result.assets[0]);
      }
    } catch (err) {
      console.error('Error picking image:', err);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
  };

  const truncateFilename = (uri: string): string => {
    const filename = uri.split('/').pop() || '';
    return filename.length > 18 ? `${filename.substring(0, 18)}…` : filename;
  };

  const charCount = answer.length;
  const isNearLimit = charCount > MAX_ANSWER_LENGTH * 0.85;

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <BackButton color={colors.PRIMARY} />
        </View>

        <Text style={styles.pageTitle}>Respond to this question</Text>

        <View style={[styles.countdownCard, isExpired && styles.countdownExpired]}>
          <Ionicons
            name={isExpired ? 'timer-outline' : 'timer'}
            size={20}
            color={isExpired ? colors.ACTIVE : colors.PRIMARY}
          />
          <Text style={[styles.countdownText, isExpired && styles.countdownTextExpired]}>
            {isExpired ? 'Time to respond has expired' : `Time left: ${formatCountdown(remainingMs)}`}
          </Text>
        </View>

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

        <View style={styles.questionCard}>
          <Text style={styles.cardLabel}>Question</Text>
          <Text style={styles.questionText}>{questionText}</Text>
        </View>

        <View style={styles.sectionDivider} />

        <Text style={styles.sectionTitle}>Your Response</Text>

        <View style={styles.inputCard}>
          <TextInput
            style={styles.textArea}
            placeholder="Type your answer here…"
            placeholderTextColor={colors.LIGHT_GRAY}
            value={answer}
            onChangeText={setAnswer}
            multiline
            textAlignVertical="top"
            maxLength={MAX_ANSWER_LENGTH}
            editable={!isExpired}
          />
          <View style={styles.inputFooter}>
            <Text style={[styles.charCount, isNearLimit && styles.charCountWarn]}>
              {charCount}/{MAX_ANSWER_LENGTH}
            </Text>
          </View>
        </View>

        {attachment ? (
          <View style={styles.attachmentChip}>
            <Ionicons name="image-outline" size={18} color={colors.PRIMARY} />
            <Text style={styles.attachmentChipText} numberOfLines={1}>
              {truncateFilename(attachment.uri)}
            </Text>
            <TouchableOpacity onPress={handleRemoveAttachment} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={20} color={colors.MEDIUM_GRAY} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.attachmentButton}
            onPress={handlePickAttachment}
            activeOpacity={0.7}
            disabled={isExpired}
          >
            <Ionicons name="attach-outline" size={20} color={colors.DARK_GRAY} />
            <Text style={styles.attachmentButtonText}>Attach an image (optional)</Text>
          </TouchableOpacity>
        )}

        <View style={styles.actionArea}>
          <CustomButton
            text={loading ? 'Sending…' : 'Send Response'}
            onPress={handleSend}
            style={styles.btnSubmit}
            disabled={isSendDisabled}
            loading={loading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AnswerQuestion;

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
    marginBottom: 16,
  },
  countdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.LIGHT_GREEN,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  countdownExpired: {
    backgroundColor: colors.LIGHT_PINK,
  },
  countdownText: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.PRIMARY,
  },
  countdownTextExpired: {
    color: colors.ACTIVE,
  },
  metadataCard: {
    backgroundColor: colors.BG_WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
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
  questionCard: {
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
  sectionTitle: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_XL,
    color: colors.TEXT_DARK,
    marginBottom: 16,
  },
  inputCard: {
    backgroundColor: colors.BG_WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    marginBottom: 12,
  },
  textArea: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    minHeight: 140,
    lineHeight: 26,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  charCount: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
  },
  charCountWarn: {
    color: colors.ACTIVE,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.BG_WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderStyle: 'dashed',
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  attachmentButtonText: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.DARK_GRAY,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.LIGHT_GREEN,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  attachmentChipText: {
    flex: 1,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.DARK_GRAY,
  },
  actionArea: {
    marginTop: 8,
  },
  btnSubmit: {},
});
