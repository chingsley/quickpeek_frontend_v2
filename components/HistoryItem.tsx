import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { formatDate } from '@/utils/date';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  address: string;
  question: string;
  createdAt: string;
  onClick: () => void;
}

const HistoryItem = ({ address, question, createdAt, onClick }: Props) => {
  const handlePress = () => {
    onClick();
  };
  return (
    <TouchableOpacity onPress={handlePress} style={styles.clickableContainer}>
      <Ionicons name="time-outline" size={15} color="black" />
      <View style={styles.textContainer}>
        <Text style={styles.date}>{formatDate(createdAt)}</Text>
        <Text style={styles.address}>{address}</Text>
        <Text style={styles.question}>{question}</Text>
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
  }
});