import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { postQuestion } from '@/services/questions.services';
import { useQuestionStore } from '@/store/question.store';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const snapPoints = useMemo(() => ['20%', '50%', '90%'], []);
  const params = useLocalSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { dispatchNewQuestion } = useQuestionStore();

  const [questionText, setQuestionText] = useState('DELETE: Is there a long queue at the bank?');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const [inputAddressText, setInputAddressText] = useState('');
  const [addressCoordinates, setAddressCoordinates] = useState({
    // determine what should be the best reasonable default
    latitude: 37.78825,
    longitude: -122.4324,
  });
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });



  useEffect(() => {
    const { questionTextParam, addressParam, locationParam } = params;
    if (questionTextParam && addressParam && locationParam && typeof locationParam === 'string') {
      const [latitude, longitude] = locationParam.split(',').map(parseFloat);
      console.log({ longitude, latitude, addressParam });
      setInputAddressText(addressParam as string);
      setAddressCoordinates({
        latitude: 37.78825,
        longitude: -122.4324,
      });
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922, // ??? what is this value? should it be static?
        longitudeDelta: 0.0421, // ??? what is this value? should it be static?
      });
      setQuestionText(questionTextParam as string);
      setMode('preview');
      setIsAddressSelected(true);
      bottomSheetRef.current?.snapToIndex(1);
      router.setParams({ questionTextParam: '', addressParam: '', locationParam: '' });
    }
  }, [params]);


  const handleSheetChanges = useCallback((index: number) => {
    if (index === 0) {
      Keyboard.dismiss();
    }
  }, []);

  const handleFocus = () => {
    bottomSheetRef.current?.snapToIndex(3);
  };

  const handleBlur = () => {
  };

  const handleDone = () => {
    setMode('preview');
    Keyboard.dismiss();
    bottomSheetRef.current?.snapToIndex(1);
    setRegion(prev => ({ ...prev, addressCoordinates }));
  };

  const handlePost = async () => {
    const questionData = {
      text: questionText,
      address: inputAddressText,
      ...addressCoordinates,
    };

    const response = await postQuestion(questionData);

    if (response && response.data) {
      const { data } = response;
      await dispatchNewQuestion(data);
      // Reset form after posting
      setInputAddressText('');
      setQuestionText('');
      setMode('edit');
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      Alert.alert('Error', 'Invalid response from server');
    }


  };

  const handleEdit = () => {
    setMode('edit');
    bottomSheetRef.current?.snapToIndex(3);
  };

  // TODO: Implelment debouncing to call map only if user stops typing for 300ms
  const handleLocationChange = async (text: string) => {
    if (isAddressSelected) setIsAddressSelected(false);
    setInputAddressText(text);
    setIsAddressSelected(false);
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
      setInputAddressText(item.display_name);
      setAddressCoordinates({
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      });
      setSuggestions([]);
      setIsAddressSelected(true);
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
            {mode === 'edit' ? (
              <>
                <Text style={styles.inputLabel}>Choose a location for your question</Text>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Choose a location for your question"
                    placeholderTextColor={colors.MEDIUM_GRAY}
                    value={inputAddressText}
                    onChangeText={handleLocationChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                  {isLoading && <ActivityIndicator size="small" color={colors.PRIMARY} style={styles.loader} />}
                </View>
                <View style={styles.suggestionsContainerParent}>
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
                </View>
                <View style={styles.questNButtonContainer}>
                  <Text style={styles.inputLabel}>What do you want to know about this location?</Text>
                  <TextInput
                    style={styles.questionInput}
                    placeholder="Enter your question"
                    placeholderTextColor={colors.MEDIUM_GRAY}
                    value={questionText}
                    onChangeText={setQuestionText}
                    multiline
                    onFocus={handleFocus}
                  />
                  <CustomButton
                    text="Done"
                    onPress={handleDone}
                    style={styles.postButton}
                    disabled={!isAddressSelected || !questionText}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>Preview</Text>
                </View>

                <View style={styles.previewSection}>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewValue}>{inputAddressText}</Text>
                    <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                      <FontAwesome name="pencil" size={16} color={colors.PRIMARY} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.previewSection}>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewValue}>{questionText}</Text>
                    <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                      <FontAwesome name="pencil" size={16} color={colors.PRIMARY} />
                    </TouchableOpacity>
                  </View>
                </View>

                <CustomButton
                  text="Post Question"
                  onPress={handlePost}
                  style={styles.postButton}
                />
              </>
            )}
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
  inputLabel: {
    fontFamily: 'roboto-bold',
    fontSize: 18,
    marginBottom: 10,
    color: colors.DARK_GRAY,
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
    borderWidth: 2,
    borderColor: colors.LIGHT_GRAY_THIN,
    borderRadius: 8,
    padding: 10,
    fontSize: 18,
    fontFamily: 'roboto',
    color: colors.DARK_GRAY,
    backgroundColor: colors.BG_WHITE,
    height: 50,
  },
  loader: {
    position: 'absolute',
    right: 12,
  },
  suggestionsContainerParent: {
    position: 'relative',
  },
  suggestionsContainer: {
    height: 550,
    marginBottom: 12,
    backgroundColor: colors.BG_WHITE,
    elevation: 3,
    position: 'absolute',
    top: 1,
    zIndex: 100,
    width: '100%',
  },
  suggestionItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.LIGHT_GRAY_THIN,
  },
  suggestionText: {
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.DARK_GRAY,
  },
  questNButtonContainer: {
    marginTop: 20,
  },
  questionInput: {
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: 10,
    padding: 12,
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.DARK_GRAY,
    backgroundColor: colors.BG_WHITE,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  postButton: {
    marginTop: 0,
  },
  previewHeader: {
    marginBottom: 20,
  },
  previewTitle: {
    fontFamily: 'roboto-bold',
    fontSize: 24,
    color: colors.DARK_GRAY,
  },
  previewSection: {
    marginBottom: 5,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.LIGHT_GRAY_THIN,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: colors.BG_WHITE,
  },
  previewValue: {
    flex: 1,
    lineHeight: 22,
    fontSize: fonts.FONT_SIZE_MEDIUM,
    fontFamily: 'roboto',
    color: colors.DARK_GRAY,
    maxWidth: '90%',
  },
  editButton: {
    padding: 8,
  },
});

export default HomeScreen;