import { colors } from '@/constants/colors';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const HomeScreen = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [location, setLocation] = useState('');
  const [question, setQuestion] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const snapPoints = useMemo(() => ['20%', '50%', '90%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === 0) {
      setIsFocused(false);
      Keyboard.dismiss();
    }
  }, []);

  const handleFocus = () => {
    bottomSheetRef.current?.snapToIndex(3);
    setIsFocused(true);
  };

  const handleBlur = () => {
    // if (!question) {
    //   bottomSheetRef.current?.snapToIndex(0);
    // } else {
    //   bottomSheetRef.current?.snapToIndex(1);
    // }
    bottomSheetRef.current?.snapToIndex(1);
    setIsFocused(false);
    Keyboard.dismiss();
  };

  const handlePost = () => {
    console.log({ location, question });
    // Reset form after posting
    setLocation('');
    setQuestion('');
    setSuggestions([]);
    bottomSheetRef.current?.snapToIndex(0);
  };

  const handleLocationChange = async (text: string) => {
    setLocation(text);
    if (text.length > 2) {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${text}&format=json&limit=5`
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const onSuggestionPress = (item: any) => {
    try {
      setLocation(item.display_name);
      setRegion({
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setSuggestions([]);
      Keyboard.dismiss();
      bottomSheetRef.current?.snapToIndex(0);
    } catch (error) {
      console.log('onSuggestionPress error', error);
    }

  };

  const renderSuggestionItem = ({ item }: { item: any; }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => onSuggestionPress(item)}
    >
      <Text style={styles.suggestionText}>{item.display_name}</Text>
    </TouchableOpacity>
  );

  console.log('suggestions: ', suggestions);

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region}>
        <Marker coordinate={region} />
      </MapView>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        enablePanDownToClose={false}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <BottomSheetView style={styles.contentContainer}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Choose a location"
                placeholderTextColor={colors.MEDIUM_GRAY}
                value={location}
                onChangeText={handleLocationChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              {isLoading && <ActivityIndicator size="small" color={colors.PRIMARY} style={styles.loader} />}
            </View>

            {suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  data={suggestions}
                  keyExtractor={(item) => String(item.place_id)}
                  renderItem={renderSuggestionItem}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            )}

            {/* <TextInput
              style={styles.questionInput}
              placeholder="Enter your question"
              placeholderTextColor={colors.MEDIUM_GRAY}
              value={question}
              onChangeText={setQuestion}
              multiline
              onFocus={() => bottomSheetRef.current?.snapToIndex(2)}
              onBlur={handleBlur}
            /> */}

            {/* <CustomButton
              text="Post Question"
              onPress={handlePost}
              style={styles.postButton}
              disabled={!location || !question}
            /> */}
          </BottomSheetView>
        </KeyboardAvoidingView>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 30,
  },
  bottomSheetBackground: {
    backgroundColor: colors.BG_WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: colors.LIGHT_GRAY,
    width: 40,
    height: 4,
  },
  searchContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: colors.DARK_GRAY,
    backgroundColor: colors.BG_WHITE,
  },
  questionInput: {
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: colors.DARK_GRAY,
    backgroundColor: colors.BG_WHITE,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  loader: {
    position: 'absolute',
    right: 12,
  },
  suggestionsContainer: {
    maxHeight: 150,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: colors.BG_WHITE,
    shadowColor: colors.BG_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.LIGHT_GRAY_THIN,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.DARK_GRAY,
  },
  postButton: {
    marginTop: 8,
  },
});

export default HomeScreen;