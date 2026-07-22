import UserAvatar from '@/components/UserAvatar';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { TAnswerRequest } from '@/types/answerRequest.types';
import { TQuestion } from '@/types/question.types';
import { formatListTime } from '@/utils/date';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  onClick: () => void;
  displayName: string;
  profileImageUrl?: string | null;
  isNew?: boolean;
} & (
  | { kind: 'question'; item: TQuestion }
  | { kind: 'request'; item: TAnswerRequest }
);

const HistoryItem = (props: Props) => {
  const { onClick, displayName, profileImageUrl, isNew = false } = props;

  const title =
    props.kind === 'question'
      ? props.item.title
      : props.item.question?.title || 'Question';

  const subtitle =
    props.kind === 'question'
      ? props.item.detail
      : props.item.rejectionReason || props.item.question?.detail || '';

  const timestamp = formatListTime(
    props.kind === 'question' ? props.item.createdAt : props.item.createdAt,
  );

  return (
    <TouchableOpacity style={styles.container} onPress={onClick} activeOpacity={0.85}>
      <UserAvatar imageUrl={profileImageUrl} size={48} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, isNew && styles.titleNew]} numberOfLines={1}>{title}</Text>
          {isNew && <View style={styles.newDot} />}
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        <View style={styles.footer}>
          <Text style={styles.displayName}>{displayName}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.time}>{timestamp}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.LIGHT_GRAY} />
      </View>
    </TouchableOpacity>
  );
};

export default HistoryItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.CARD_BORDER,
    gap: 12,
  },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flex: 1, fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.TEXT_DARK },
  titleNew: { fontFamily: 'roboto-bold' },
  newDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.RED },
  subtitle: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_XS, color: colors.MEDIUM_GRAY, marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  displayName: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_XS, color: colors.DARK_GRAY },
  right: { alignItems: 'flex-end', gap: 8 },
  time: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_XS, color: colors.MEDIUM_GRAY },
});
