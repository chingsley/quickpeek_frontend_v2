import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  address: string;
  question: string;
  onClick: (address: string, question: string) => void;
}

const HistoryItem = ({ address, question, onClick }: Props) => {
  const handlePress = () => {
    onClick(address, question);
  };
  return (
    <TouchableOpacity onPress={handlePress} style={styles.clickableContainer}>
      <Ionicons name="time-outline" size={15} color="black" />
      <View style={styles.textContainer}>
        <Text style={styles.address}>{address}</Text>
        <Text style={styles.question}>{question}</Text>
      </View>
    </TouchableOpacity>

  );
};

export default HistoryItem;

const styles = StyleSheet.create({
  clickableContainer: {
    borderBottomWidth: 2,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 5,
    marginBottom: 10,

    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
  },
  textContainer: {

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