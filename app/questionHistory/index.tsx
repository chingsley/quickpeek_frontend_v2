import questions from '@/_playground/questions.json';
import HistoryItem from '@/components/HistoryItem';
import React from 'react';
import { FlatList, SafeAreaView, StyleSheet, View } from 'react-native';

const QuestionHistory = () => {
  return (
    <SafeAreaView>
      <View style={styles.questionListContainer}>
        <FlatList
          data={questions}
          renderItem={({ item, index }) => (
            <View key={index} style={styles.questionItem}>
              <HistoryItem
                onClick={(addr, qstn) => console.log(addr, ' - ', qstn)}
                question={item.content}
                address={item.address}
              />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default QuestionHistory;

const styles = StyleSheet.create({
  questionListContainer: {

  },
  questionItem: {
    borderWidth: 1,
    margin: 2,

  },
  qnText: {

  }
});