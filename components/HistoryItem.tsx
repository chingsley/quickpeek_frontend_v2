import UserAvatar from '@/components/UserAvatar';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { QuestionStatus, TQuestion } from '@/types/question.types';
import { TabType } from '@/types/ui.types';
import { formatListTime } from '@/utils/date';
import { isAssignmentTtrActive } from '@/utils/questions';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props extends TQuestion {
  onClick: () => void;
  activeTab: TabType;
  profileImageUrl?: string | null;
  displayName: string;
  isNew?: boolean;
}

const truncate = (value: string, maxLength: number) => {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trim()}…`;
};

const getSubtitle = (item: Props) => {
  const { activeTab, status, text, answer, questionerName, responderUsername } = item;
  const isActiveAssignment = isAssignmentTtrActive(item);

  if (activeTab === TabType.Outbox) {
    if (status === QuestionStatus.Expired) {
      return 'No response in time';
    }
    if (status === QuestionStatus.Answered && answer) {
      return `${responderUsername || 'Responder'} answered`;
    }
    if (status === QuestionStatus.Assigned || isActiveAssignment) {
      if (answer) {
        return `You: ${truncate(answer, 42)}`;
      }
      return 'Waiting for a response';
    }
    return `You: ${truncate(text, 42)}`;
  }

  if (status === QuestionStatus.Expired) {
    return 'Response window expired';
  }
  if (status === QuestionStatus.Answered && answer) {
    return `You: ${truncate(answer, 42)}`;
  }
  if (isActiveAssignment) {
    return `${questionerName || 'Someone'}: ${truncate(text, 42)}`;
  }
  return `${questionerName || 'Someone'}: ${truncate(text, 42)}`;
};

const shouldShowStatusIcon = (item: Props) => {
  const { activeTab, status } = item;
  if (activeTab === TabType.Outbox) {
    return status === QuestionStatus.Answered || status === QuestionStatus.Assigned;
  }
  return status === QuestionStatus.Answered;
};

const HistoryItem = (item: Props) => {
  const {
    address,
    text,
    createdAt,
    updatedAt,
    onClick,
    profileImageUrl,
    displayName,
    isNew = false,
  } = item;

  const titleSubject = truncate(address || text, 34);
  const subtitle = getSubtitle(item);
  const timestamp = formatListTime(updatedAt || createdAt);
  const showStatusIcon = shouldShowStatusIcon(item);

  return (
    <TouchableOpacity onPress={onClick} style={styles.container} activeOpacity={0.7}>
      <UserAvatar imageUrl={profileImageUrl} size={56} />
      <View style={styles.content}>
        <Text style={[styles.title, isNew && styles.titleNew]} numberOfLines={1}>
          {displayName} · {titleSubject}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle} · {timestamp}
        </Text>
      </View>
      {showStatusIcon && (
        <View style={styles.statusIcon}>
          <Ionicons name="checkmark" size={14} color={colors.MEDIUM_GRAY} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default HistoryItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    marginBottom: 4,
  },
  titleNew: {
    fontFamily: 'roboto-bold',
  },
  subtitle: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.LIGHT_GRAY_THIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
