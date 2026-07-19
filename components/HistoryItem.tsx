import UserAvatar from '@/components/UserAvatar';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { TAnswerRequest } from '@/types/answerRequest.types';
import { TQuestion } from '@/types/question.types';
import { TabType } from '@/types/ui.types';
import { formatListTime } from '@/utils/date';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  onClick: () => void;
  activeTab: TabType;
  displayName: string;
  profileImageUrl?: string | null;
  isNew?: boolean;
} & (
  | { kind: 'question'; item: TQuestion }
  | { kind: 'request'; item: TAnswerRequest }
);

const STATUS_COLORS: Record<string, string> = {
  OPEN: colors.PRIMARY,
  ANSWERED: colors.MEDIUM_GRAY,
  CANCELLED: colors.MEDIUM_GRAY,
  PENDING: colors.ACTIVE,
  ACCEPTED: colors.PRIMARY,
  REJECTED: colors.MEDIUM_GRAY,
  CLOSED_ANSWERED: colors.MEDIUM_GRAY,
};

const HistoryItem = (props: Props) => {
  const { onClick, activeTab, displayName, profileImageUrl, isNew = false } = props;

  const title =
    props.kind === 'question'
      ? props.item.title
      : props.item.question?.title || 'Question';

  const subtitle =
    props.kind === 'question'
      ? props.item.detail
      : props.item.rejectionReason || props.item.question?.detail || '';

  const status =
    props.kind === 'question' ? props.item.status : props.item.status;

  const timestamp = formatListTime(
    props.kind === 'question' ? props.item.createdAt : props.item.createdAt,
  );

  const pendingCount =
    props.kind === 'question' && activeTab === TabType.MyQuestions
      ? props.item.requestCounts?.PENDING ?? 0
      : 0;

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
          <Text style={[styles.status, { color: STATUS_COLORS[status] || colors.MEDIUM_GRAY }]}>
            {status}
          </Text>
          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
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
  status: { fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_XS, textTransform: 'uppercase' },
  badge: {
    backgroundColor: colors.RED,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.BG_WHITE, fontSize: fonts.FONT_SIZE_XS, fontWeight: 'bold' },
  right: { alignItems: 'flex-end', gap: 8 },
  time: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_XS, color: colors.MEDIUM_GRAY },
});
