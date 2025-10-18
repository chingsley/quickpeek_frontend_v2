import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { QuestionStatus, TQuestion } from '@/types/question.types';
import { TabType } from '@/types/ui.types';
import { formatDate } from '@/utils/date';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props extends TQuestion {
  onClick: () => void;
  activeTab: TabType;
}

const HistoryItem = (item: Props) => {
  const { address, text, createdAt, onClick, status, activeTab } = item;
  return (
    <TouchableOpacity onPress={() => onClick()} style={styles.clickableContainer}>
      <Ionicons name="time-outline" size={15} color="black" />
      <View style={styles.textContainer}>
        <View style={{ flex: 1, flexDirection: 'row', gap: 20 }}>
          <Text style={styles.date}>{formatDate(createdAt)}</Text>
          {status === QuestionStatus.New && activeTab === TabType.Inbox && <Text style={styles.newTag}>New</Text>}
          {status === QuestionStatus.Pending && activeTab === TabType.Outbox && <Text style={styles.pendingTag}>Pending</Text>}
        </View>
        <Text style={styles.address} numberOfLines={2} ellipsizeMode='tail'>{address}</Text>
        <Text style={styles.question} numberOfLines={2} ellipsizeMode='tail'>{text}</Text>
      </View>
    </TouchableOpacity>

  );
};

export default HistoryItem;

const styles = StyleSheet.create({
  clickableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    // borderWidth: 1,
  },
  textContainer: {
    maxWidth: 300,
  },
  date: {
    color: colors.MEDIUM_GRAY,
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_SMALL,
    marginBottom: 5,
  },
  address: {
    color: '#333',
    fontFamily: 'roboto',
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight: '400',
    letterSpacing: 0.14,
  },
  question: {
    fontSize: 16,
    fontFamily: 'roboto-light',
  },
  newTag: {
    color: colors.RED,
    fontSize: 16,
    fontFamily: 'roboto-bold',
    marginBottom: 5,
  },
  pendingTag: {
    color: colors.PRIMARY,
    fontSize: 16,
    fontFamily: 'roboto-bold',
    marginBottom: 5,
  },
});

const btnReaskStyles = StyleSheet.create({
  arrowRotateIconBtn: {
    padding: 10,
  },
  arrowRotateIconBG: {
    padding: 8,
    borderRadius: '50%',
    backgroundColor: colors.LIGHT_GRAY_THIN,

  },
});