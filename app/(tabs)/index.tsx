import CustomTextInput from "@/components/CustomTextInput";
import HistoryItem from "@/components/HistoryItem";
import RoundButton from "@/components/RoundButton";
import Searchbar from "@/components/Searchbar";
import { colors } from "@/constants/colors";
import { images } from "@/constants/images";
import { drawBorder } from "@/utils";
import { useState } from "react";
import { Image, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const [address, setAddress] = useState('');
  const [question, setQuestion] = useState('');

  const onRecentHistoryClick = (addr: string, questn: string) => {
    setAddress(addr);
    setQuestion(questn);
  };

  const postQuestion = () => {
    console.log({ address, question });
  };

  return (
    <View
      style={styles.homeScreen}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={{
          height: 50,
          width: 50,
          borderRadius: '50%',
          borderWidth: 1,
          position: 'absolute',
        }}>
          <Text>menu</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.locationPrompt}>Find the location for your question</Text>
          <View style={styles.locationContent}>
            <View style={styles.locationContentMap}>
              <Image style={styles.locationContentImage} source={images.map} />
              <View style={styles.locationContentSearchArea}>
                <View style={styles.locationContentSearchContainer}>
                  <Searchbar placeholder="Enter Address" inputValue={address} setValue={setAddress} />
                </View>
              </View>
            </View>
          </View>
          <View style={styles.questionContent}>
            <View>
              <Text style={styles.questionContentCaption}>What do you want to ask</Text>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between'
              }}>
                <View style={{
                  width: '85%'
                }}>
                  <CustomTextInput
                    placeholder="Enter your question"
                    value={question}
                    handleTextChange={setQuestion}
                  />
                </View>
                <RoundButton onPress={postQuestion} />
              </View>
            </View>
          </View>
          <View style={styles.historyConent}>
            <HistoryItem
              address={'CBS Plaza, Wuse 2, Abuja'}
              question={'Is there space to park a car?'}
              onClick={onRecentHistoryClick}
            />
            <HistoryItem
              address={'First Bank PLC, CBD, Abuja'}
              question={'How crowded is the bank?'}
              onClick={onRecentHistoryClick}
            />
            <HistoryItem
              address={'Nnamdi Azikiwe Airport, Abuja'}
              question={'Is there traffic at the toll gate?'}
              onClick={onRecentHistoryClick}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  homeScreen: {
    flex: 1,
    ...drawBorder('red'),
    backgroundColor: colors.BG_WHITE,
    fontFamily: 'roboto' // TODO: setup font
  },
  safeArea: {
    flex: 1,
    marginTop: 60,
    marginBottom: 40,
    marginLeft: 20,
    marginRight: 20,
    ...drawBorder('blue'),
  },
  content: {
    flex: 1,
    padding: 2, // for outline. could be removed,
    marginTop: 50,
    ...drawBorder(),
  },
  locationContent: {
    height: '40%',
    ...drawBorder(),
  },
  questionContent: {
    ...drawBorder('red'),
    marginVertical: 40,
  },
  historyConent: {
    // ...drawBorder(),
  },
  locationPrompt: {
    fontSize: 20,
    color: '#333',
    fontFamily: 'Roboto',
    fontStyle: 'normal',
    fontWeight: '400',
    letterSpacing: -0.16,
    marginVertical: 20,
  },
  locationContentMap: {
    height: '100%',
    ...drawBorder('blue'),
  },
  locationContentImage: {
    height: '100%',
    width: '100%',
    borderRadius: 20,
  },
  locationContentSearchArea: {
    position: 'absolute',
    width: '100%',
    flex: 1,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // ...drawBorder(),
  },
  locationContentSearchContainer: {
    width: '95%',
    // ...drawBorder(),
  },
  questionContentCaption: {
    fontSize: 20,
    color: '#333',
    marginBottom: 20,
  },
});
