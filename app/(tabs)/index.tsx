import Searchbar from "@/components/Searchbar";
import { colors } from "@/constants/colors";
import { images } from "@/constants/images";
import { Image, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={styles.homeScreen}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={{
          borderWidth: 1,
          height: 50,
          width: 50,
          borderRadius: '50%',
          position: 'absolute',
        }}>
          <Text>menu</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.locationPrompt}>Find the location for your question</Text>
          <View style={styles.location}>
            <View style={styles.locationMap}>
              <Image style={styles.locationMapImage} source={images.map} />
              <View style={styles.locationMapSearchArea}>
                <View style={styles.locationMapSearchContainer}>
                  <Searchbar placeholder="Enter Address" />
                </View>
              </View>
            </View>
          </View>
          <View style={styles.question}>
            <Text>Ask your question</Text>
          </View>
          <View style={styles.extras}>
            <Text>Ask your question</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  homeScreen: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'red',
    backgroundColor: colors.BG_WHITE,
    fontFamily: 'Roboto' // TODO: setup font
  },
  safeArea: {
    flex: 1,
    marginTop: 60,
    marginBottom: 40,
    marginLeft: 20,
    marginRight: 20,
    borderWidth: 1,
    borderColor: 'blue',
  },
  content: {
    flex: 1,
    padding: 2, // for outline. could be removed,
    marginTop: 50,
    borderWidth: 1,
  },
  location: {
    height: '40%',
    // marginTop: 20,
    borderWidth: 1,
  },
  question: {
    borderWidth: 1,
    borderColor: 'red'
    // height: '20%',
  },
  extras: {
    borderWidth: 1,
    // height: '30%',
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
  locationMap: {
    // backgroundImage: images.map,
    height: '100%',
    borderWidth: 1,
    borderColor: 'blue'
    // position: 'relative',
  },
  locationMapImage: {
    height: '100%',
    width: '100%',
  },
  locationMapSearchArea: {
    position: 'absolute',
    width: '100%',
    flex: 1,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // borderWidth: 1,
  },
  locationMapSearchContainer: {
    width: '95%',
    // borderWidth: 1,
  },
});
