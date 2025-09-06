import CustomTextInput2 from '@/components/CustomTextInput2';
import BackButton from '@/components/shared/BackButton';
import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import { formatDate } from '@/utils/date';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const AnswerQuestion = () => {
  const { address, question, createdAt } = useLocalSearchParams();
  const [answer, setAnswer] = useState('');
  const [attachment, setAttachment] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const handleSend = () => {
    console.log('Answer:', answer);
    console.log('Attachment:', attachment);
    // Here you would typically send the answer and attachment to your backend
  };

  const handleAttachment = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setAttachment(result.assets[0]);
      }
    } catch (err) {
      console.log('Error picking image:', err);
    }
  };

  const getTruncatedFilename = (uri: string) => {
    const filename = uri.split('/').pop() || '';
    if (filename.length > 10) {
      return `${filename.substring(0, 10)}...`;
    }
    return filename;
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.pageContentContainer}>
        <View style={styles.pageHeader}>
          <BackButton color={colors.PRIMARY} />
        </View>
        <View style={styles.pageBody}>
          <Text style={styles.pageTitle2}>Respond to this question</Text>
          <View style={styles.contentBox}>
            <View style={styles.questionDetails}>
              <Text style={styles.label}>Time:</Text>
              <Text style={styles.value}>{formatDate(createdAt as string)}</Text>
              <Text style={styles.label}>Location:</Text>
              <Text style={styles.value}>{address}</Text>
              <Text style={styles.label}>Question:</Text>
              <Text style={styles.value}>{question}</Text>
            </View>
            <View style={styles.answerArea}>
              <View style={styles.inputContainer}>
                <CustomTextInput2
                  placeholder='Enter your Response'
                  value={answer}
                  handleTextChange={setAnswer}
                />
                <TouchableOpacity onPress={handleAttachment}>
                  <MaterialCommunityIcons name="attachment" size={24} color="black" />
                </TouchableOpacity>
              </View>
              {attachment && <Text>Selected file: {getTruncatedFilename(attachment.uri)}</Text>}
              <CustomButton
                text='Send'
                onPress={handleSend}
                style={styles.btnSubmit}
              />
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AnswerQuestion;

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
  answerArea: {
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.DARK_GRAY,
    paddingBottom: 10,
  },
  btnSubmit: {
    marginTop: 20,
  }
});
