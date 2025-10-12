import BackButton from '@/components/shared/BackButton';
import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import { formatDate } from '@/utils/date';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

const QuestionDetail = () => {
  const { address, questionText, createdAt, answer, answerRating, responderUsername, isOutbox, isPending } = useLocalSearchParams();

  const handleReask = () => {
    console.log('Re-asking question:', questionText);
  };

  const isPendingBool = isPending === 'true';

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.pageContentContainer}>
        <View style={styles.pageHeader}>
          <BackButton color={colors.PRIMARY} />
        </View>
        <View style={styles.pageBody}>
          <Text style={styles.pageTitle2}>Question Details</Text>
          <View style={styles.contentBox}>
            <View style={styles.questionDetails}>
              <Text style={styles.label}>Time:</Text>
              <Text style={styles.value}>{formatDate(createdAt as string)}</Text>
              <Text style={styles.label}>Location:</Text>
              <Text style={styles.value}>{address}</Text>
              <Text style={styles.label}>Question:</Text>
              <Text style={styles.value}>{questionText}</Text>
              <Text style={styles.label}>Answer:</Text>
              <Text style={styles.value}>{answer}</Text>
              <Text style={styles.label}>Answer Rating:</Text>
              <Text style={styles.value}>{answerRating}</Text>
              <Text style={styles.label}>Responder:</Text>
              <Text style={styles.value}>{responderUsername}</Text>
            </View>
            {isOutbox === 'true' && (
              <CustomButton
                text={isPendingBool ? 'pending' : 'Re-ask'}
                onPress={handleReask}
                style={styles.btnSubmit}
                disabled={isPendingBool}
              />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default QuestionDetail;

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: colors.BG_WHITE,
  },
  pageContentContainer: {
    paddingVertical: 20,
    paddingHorizontal: 26,
  },
  pageHeader: {},
  pageBody: {
    marginTop: 40,
  },
  pageTitle2: {
    fontFamily: 'roboto-bold',
    fontSize: 28,
  },
  contentBox: {
    height: '90%',
    marginTop: 20,
  },
  questionDetails: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'roboto-medium',
    fontSize: 16,
    color: colors.DARK_GRAY,
    marginBottom: 5,
  },
  value: {
    fontFamily: 'roboto',
    fontSize: 18,
    marginBottom: 15,
  },
  btnSubmit: {
    marginTop: 20,
  },
});
