import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import BottomSheet from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const HomeScreen = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [location, setLocation] = useState('');
  const [question, setQuestion] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const snapPoints = useMemo(() => ['33%', '66%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);

  const handleFocus = () => {
    bottomSheetRef.current?.snapToIndex(1);
    setIsFocused(true);
  };

  const handleDone = () => {
    bottomSheetRef.current?.snapToIndex(0);
    setIsFocused(false);
  };

  const handlePost = () => {
    console.log({ location, question });
  };

  const handleLocationChange = async (text: string) => {
    setLocation(text);
    if (text.length > 2) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${text}&format=json&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
    }
  };

  const onSuggestionPress = (item: any) => {
    setLocation(item.display_name);
    setRegion({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
    setSuggestions([]);
  };

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
      >
        <View style={styles.contentContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter location"
            value={location}
            onChangeText={handleLocationChange}
            onFocus={handleFocus}
          />
          {suggestions.length > 0 && isFocused && (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => String(item.place_id)}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => onSuggestionPress(item)}>
                  <Text style={styles.suggestion}>{item.display_name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
          {isFocused && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter your question"
                value={question}
                onChangeText={setQuestion}
              />
              <CustomButton text="Done" onPress={handleDone} />
            </>
          )}
          {!isFocused && <CustomButton text="Post" onPress={handlePost} />}
        </View>
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
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  input: {
    width: '100%',
    borderColor: colors.DARK_GRAY,
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  suggestion: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.LIGHT_GRAY,
  },
});

export default HomeScreen;