import { colors } from '@/constants/colors';
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
    <TouchableOpacity onPress={handlePress}>
      <View style={styles.container} >
        <View style={{
          width: 44,
          height: 44,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 10,
          backgroundColor: colors.LIGHT_BLUE,
          marginRight: 10,
        }}>
          <Ionicons name="time-outline" size={24} color="black" />
        </View>
        <View style={{
          flex: 1,
          justifyContent: 'space-between',
        }}>
          <Text style={styles.textLocation}>{address}</Text>
          <Text style={styles.textQuestion}>{question}</Text>
        </View>
      </View>
    </TouchableOpacity>

  );
};

export default HistoryItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 5,
    marginBottom: 10,
  },
  textLocation: {
    color: '#333',
    fontFamily: 'Roboto',
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight: '400',
    letterSpacing: 0.14,
  },
  textQuestion: {
    color: '#8C8C8C',
    fontSize: 16
  }
});