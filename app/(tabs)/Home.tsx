import CustomTextInput from "@/components/CustomTextInput";
import HistoryItem from "@/components/HistoryItem";
import Searchbar from "@/components/Searchbar";
import CustomButton from "@/components/shared/CustomButton";
import { colors } from "@/constants/colors";
import { images } from "@/constants/images";
import { drawBorder } from "@/utils";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

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
      <Image style={styles.locationContentImage} source={images.map} />
      <View style={styles.content}>
        <View style={styles.locationContent}>
          <Searchbar placeholder="Find the location for your question" inputValue={address} setValue={setAddress} />
        </View>
        <View style={styles.bottomContainer}>
          <View style={styles.qnItemsBox}>
            <Text style={styles.questionContentCaption}>What do you want to ask</Text>
            <CustomTextInput
              placeholder="Enter your question"
              value={question}
              handleTextChange={setQuestion}
            />
            <CustomButton text="Submit" onPress={() => console.log('testing')} />
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
            {/* <HistoryItem
              address={'Nnamdi Azikiwe Airport, Abuja'}
              question={'Is there traffic at the toll gate?'}
              onClick={onRecentHistoryClick}
            /> */}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  homeScreen: {
    flex: 1,
    backgroundColor: colors.BG_WHITE,
    ...drawBorder('blue'),
  },
  content: {
    flex: 1,
    padding: 2, // for outline. could be removed,
    ...drawBorder('red'),
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  locationContent: {
    ...drawBorder(),
    marginHorizontal: 5,
    height: '50%',
    display: 'flex',
    justifyContent: 'center',
  },
  bottomContainer: {
    ...drawBorder('yellow'),
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    height: '50%',
    backgroundColor: colors.BG_WHITE,
    borderTopRightRadius: 25,
    borderTopLeftRadius: 25,
  },
  qnItemsBox: {
    padding: 15,
  },
  historyConent: {
    marginTop: 20,
    // borderTopWidth: 2,
    // borderTopColor: '#999',
    paddingTop: 10,
  },
  locationContentImage: {
    height: '100%',
    width: '100%',
    borderRadius: 20,
  },
  questionContentCaption: {
    fontSize: 20,
    color: '#333',
    marginVertical: 20,
  },
});
