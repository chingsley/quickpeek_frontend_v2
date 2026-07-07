import BackButton from '@/components/shared/BackButton';
import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { formatDate } from '@/utils/date';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MAX_ANSWER_LENGTH = 500;

const AnswerQuestion = () => {
  const { address, questionText, createdAt } = useLocalSearchParams();
  const [answer, setAnswer] = useState('');
  const [attachment, setAttachment] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const isSendDisabled = answer.trim().length === 0;

  const handleSend = () => {
    if (isSendDisabled) return;
    console.log('Answer:', answer);
    console.log('Attachment:', attachment);
    // Here you would typically send the answer and attachment to your backend
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
        {/* Header */}
        <View style={styles.header}>
          <BackButton color={colors.PRIMARY} />
        </View>

        {/* Page Title */}
        <Text style={styles.pageTitle}>Respond to this question</Text>

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
        <View style={styles.questionCard}>
          <Text style={styles.cardLabel}>Question</Text>
          <Text style={styles.questionText}>{questionText}</Text>
        </View>

        {/* Section Divider */}
        <View style={styles.sectionDivider} />

        {/* Your Response */}
        <Text style={styles.sectionTitle}>Your Response</Text>

        {/* Response Input Card */}
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
          />
          <View style={styles.inputFooter}>
            <Text style={[styles.charCount, isNearLimit && styles.charCountWarn]}>
              {charCount}/{MAX_ANSWER_LENGTH}
            </Text>
          </View>
        </View>

        {/* Attachment */}
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
          <TouchableOpacity style={styles.attachmentButton} onPress={handlePickAttachment} activeOpacity={0.7}>
            <Ionicons name="attach-outline" size={20} color={colors.DARK_GRAY} />
            <Text style={styles.attachmentButtonText}>Attach an image (optional)</Text>
          </TouchableOpacity>
        )}

        {/* Send Button */}
        <View style={styles.actionArea}>
          <CustomButton
            text="Send Response"
            onPress={handleSend}
            style={styles.btnSubmit}
            disabled={isSendDisabled}
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

  /* Question Card */
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

  /* Response Input Card */
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

  /* Attachment */
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

  /* Attachment Chip */
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

  /* Action */
  actionArea: {
    marginTop: 8,
  },
  btnSubmit: {},
});
