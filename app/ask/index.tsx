import BackButton from '@/components/shared/BackButton';
import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { assignQuestion, postQuestion } from '@/services/questions.services';
import useAppStore from '@/store/app.store';
import { useQuestionStore } from '@/store/question.store';
import { QuestionStatus } from '@/types/question.types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MAX_QUESTION_LENGTH = 200;

const AskScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { dispatchNewQuestion } = useQuestionStore();
  const { loading, setLoading } = useAppStore();

  const responderId = params.responderId as string;
  const responderName = params.responderName as string;
  const address = params.address as string;
  const latitude = parseFloat(params.latitude as string);
  const longitude = parseFloat(params.longitude as string);
  const prefilledQuestion = (params.questionText as string) || '';

  const [questionText, setQuestionText] = useState(prefilledQuestion);

  const charCount = questionText.length;
  const isNearLimit = charCount > MAX_QUESTION_LENGTH * 0.85;
  const isValid = questionText.trim().length > 0 && responderId && address;

  const handleSend = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const questionData = {
        text: questionText.trim(),
        address,
        latitude,
        longitude,
      };

      const createResponse = await postQuestion(questionData);
      const question = createResponse?.data;
      if (!question?.id) {
        Alert.alert('Error', 'Could not create your question.');
        return;
      }

      await assignQuestion(question.id, responderId);
      await dispatchNewQuestion({
        ...question,
        status: QuestionStatus.Assigned,
        assignedResponderId: responderId,
      });

      Alert.alert(
        'Question sent',
        `${responderName} has been notified and has time to respond.`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/Questions') }],
      );
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || error?.message || 'Failed to send question.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BackButton color={colors.PRIMARY} />

          <Text style={styles.pageTitle}>Type your question</Text>
          <Text style={styles.subtitle}>
            Sending to <Text style={styles.responderName}>{responderName}</Text>
          </Text>

          <View style={styles.locationCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="location-outline" size={16} color={colors.PRIMARY} />
            </View>
            <Text style={styles.locationText} numberOfLines={3}>
              {address}
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="help-circle-outline" size={20} color={colors.PRIMARY} />
            </View>
            <Text style={styles.sectionLabel}>What do you want to know?</Text>
          </View>

          <View style={styles.questionInputWrapper}>
            <TextInput
              style={styles.questionInput}
              placeholder="e.g. Is there a long queue at the bank?"
              placeholderTextColor={colors.LIGHT_GRAY}
              value={questionText}
              onChangeText={setQuestionText}
              multiline
              textAlignVertical="top"
              maxLength={MAX_QUESTION_LENGTH}
              autoFocus
            />
            <View style={styles.questionFooter}>
              <Text style={[styles.charCount, isNearLimit && styles.charCountWarn]}>
                {charCount}/{MAX_QUESTION_LENGTH}
              </Text>
            </View>
          </View>

          <CustomButton
            text={loading ? 'Sending…' : 'Send to responder'}
            onPress={handleSend}
            disabled={!isValid || loading}
            loading={loading}
            style={styles.sendBtn}
          />
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default AskScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.BG_WHITE,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontFamily: 'roboto-bold',
    fontSize: 28,
    color: colors.TEXT_DARK,
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    marginBottom: 20,
  },
  responderName: {
    fontFamily: 'roboto-bold',
    color: colors.PRIMARY,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.BG_WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
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
  locationText: {
    flex: 1,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    lineHeight: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
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
  sectionLabel: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
  },
  questionInputWrapper: {
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: 10,
    backgroundColor: colors.BG_WHITE,
    overflow: 'hidden',
    marginBottom: 24,
  },
  questionInput: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    minHeight: 120,
    lineHeight: 22,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  charCount: {
    fontFamily: 'roboto-light',
    fontSize: 12,
    color: colors.MEDIUM_GRAY,
  },
  charCountWarn: {
    color: colors.ACTIVE,
  },
  sendBtn: {
    marginTop: 8,
  },
});
