import CustomTextInput from '@/components/CustomTextInput';
import CustomButton from '@/components/shared/CustomButton';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

const NewAsk = () => {
  return (
    <SafeAreaView>
      <View style={styles.newAskContainer}>
        <View style={styles.contentBox}>
          <Text style={styles.txt2}>Location: {'Zenith Bank, First Avenue, Gwarinpa'}</Text>
          <Text style={styles.txt2}>Question: {'How long is the queue in Zenith bank, gwarinpa, First Av.?'}</Text>
          <Text style={styles.txt2}>Time: {Date()}</Text>
          <View style={styles.answerArea}>
            <Text style={styles.txt2}>Answer</Text>
            <CustomTextInput
              placeholder='Enter your answer'
              value={''}
              handleTextChange={() => console.log('testing')}
            />
            <CustomButton
              text='Send'
              onPress={() => console.log('testing')}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default NewAsk;

const styles = StyleSheet.create({
  newAskContainer: {
    borderWidth: 1,
    borderColor: 'red',
    height: '100%',

    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentBox: {
    // borderWidth: 1,
    marginHorizontal: 10,
  },
  txt2: {
    fontFamily: 'roboto',
    fontSize: 20,
  },
  answerArea: {
    marginTop: 20,
  }
});