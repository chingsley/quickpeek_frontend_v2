import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import useDebounce from '@/hooks/useDebounce';
import Ionicons from '@expo/vector-icons/Ionicons';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from '@/components/MapViewWrapper';

const COLLAPSED_SNAP = 0;
const EXPANDED_SNAP = 1;

/** Default map viewport before the user selects a question location. */
const DEFAULT_MAP_REGION = {
  latitude: 44.6126,
  longitude: -63.6193,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const HomeScreen = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['38%', '62%'], []);
  const params = useLocalSearchParams();
  const router = useRouter();

  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const [inputAddressText, setInputAddressText] = useState('');
  const [reaskQuestionText, setReaskQuestionText] = useState('');
  const [addressCoordinates, setAddressCoordinates] = useState({
    latitude: DEFAULT_MAP_REGION.latitude,
    longitude: DEFAULT_MAP_REGION.longitude,
  });
  const [region, setRegion] = useState(DEFAULT_MAP_REGION);

  const debouncedAddressText = useDebounce(inputAddressText, 600);

  const { questionText: questionTextParam, address: addressParam, longitude: longitudeParam, latitude: latitudeParam } =
    params;

  useEffect(() => {
    if (addressParam && longitudeParam && latitudeParam) {
      const latitude = parseFloat(latitudeParam as string);
      const longitude = parseFloat(longitudeParam as string);
      setInputAddressText(addressParam as string);
      setAddressCoordinates({ latitude, longitude });
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      if (questionTextParam) {
        setReaskQuestionText(questionTextParam as string);
      }
      setIsAddressSelected(true);
      bottomSheetRef.current?.snapToIndex(EXPANDED_SNAP);
      router.setParams({
        questionText: '',
        address: '',
        longitude: '',
        latitude: '',
      });
    }
  }, [questionTextParam, addressParam, longitudeParam, latitudeParam]);

  useEffect(() => {
    if (debouncedAddressText.length > 2 && !isAddressSelected) {
      const fetchSuggestions = async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${debouncedAddressText}&format=json&limit=5`,
          );
          const data = await response.json();
          setAddressSuggestions(data);
        } catch (error) {
          console.error('Error fetching location addressSuggestions:', error);
        }
      };

      fetchSuggestions();
    } else {
      setAddressSuggestions([]);
    }
  }, [debouncedAddressText, isAddressSelected]);

  const handleLocationChange = (text: string) => {
    if (isAddressSelected) {
      setIsAddressSelected(false);
    }
    setInputAddressText(text);
  };

  const handleSheetChanges = useCallback((index: number) => {
    if (index === COLLAPSED_SNAP) {
      Keyboard.dismiss();
    }
  }, []);

  const handleAddressBlur = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  useEffect(() => {
    const eventName = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subscription = Keyboard.addListener(eventName, () => {
      bottomSheetRef.current?.snapToIndex(EXPANDED_SNAP);
    });

    return () => subscription.remove();
  }, []);

  const handleContinue = () => {
    Keyboard.dismiss();
    router.push({
      pathname: '/responders',
      params: {
        latitude: String(addressCoordinates.latitude),
        longitude: String(addressCoordinates.longitude),
        address: inputAddressText,
        questionText: reaskQuestionText,
      },
    });
  };

  const onSuggestionPress = (item: any) => {
    try {
      setInputAddressText(item.display_name);
      setAddressCoordinates({
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      });
      setAddressSuggestions([]);
      setIsAddressSelected(true);
      setRegion({
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      Keyboard.dismiss();
    } catch (error) {
      console.error('onSuggestionPress error', error);
    }
  };

  const isLocationValid = isAddressSelected && inputAddressText.trim().length > 0;

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region}>
        {isAddressSelected && <Marker coordinate={addressCoordinates} />}
      </MapView>

      <BottomSheet
        ref={bottomSheetRef}
        index={EXPANDED_SNAP}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        enablePanDownToClose={false}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="none"
        android_keyboardInputMode="adjustResize"
        enableBlurKeyboardOnGesture
      >
        <BottomSheetView style={styles.contentContainer}>
          <View style={styles.editContainer}>
            <BottomSheetScrollView
              style={styles.editScroll}
              contentContainerStyle={styles.editScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.pageTitle}>Choose Question Location</Text>
              <Text style={styles.pageSubtitle}>
                First choose where you want to know about, then pick a nearby responder.
              </Text>

              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="location-outline" size={20} color={colors.PRIMARY} />
                </View>
                <Text style={styles.sectionLabel}>Choose a location</Text>
              </View>

              <View style={styles.searchContainer}>
                <BottomSheetTextInput
                  style={styles.searchInput}
                  placeholder="Search for a place or address"
                  placeholderTextColor={colors.MEDIUM_GRAY}
                  value={inputAddressText}
                  onChangeText={handleLocationChange}
                  onBlur={handleAddressBlur}
                  returnKeyType="search"
                />
              </View>

              {addressSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {addressSuggestions.map((item, index) => (
                    <React.Fragment key={String(item.place_id)}>
                      {index > 0 && <View style={styles.suggestionSeparator} />}
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => onSuggestionPress(item)}
                      >
                        <Ionicons
                          name="location-outline"
                          size={16}
                          color={colors.MEDIUM_GRAY}
                          style={styles.suggestionIcon}
                        />
                        <Text style={styles.suggestionText} numberOfLines={2}>
                          {item.display_name}
                        </Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  ))}
                </View>
              )}
              {isLocationValid && (
                <CustomButton
                  text="Browse responders"
                  onPress={handleContinue}
                  style={{ paddingBottom: Math.max(insets.bottom, 16) }}
                />
              )}
            </BottomSheetScrollView>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    flex: 1,
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
    marginTop: 8,
  },
  editContainer: {
    flex: 1,
  },
  editScroll: {
    flex: 1,
  },
  editScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  pageTitle: {
    fontFamily: 'roboto-bold',
    fontSize: 28,
    color: colors.TEXT_DARK,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    marginBottom: 28,
    lineHeight: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionLabel: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: 10,
    padding: 14,
    paddingRight: 40,
    fontSize: fonts.FONT_SIZE_SMALL,
    fontFamily: 'roboto',
    color: colors.TEXT_DARK,
    backgroundColor: colors.BG_WHITE,
  },
  suggestionsContainer: {
    marginTop: 4,
    backgroundColor: colors.BG_WHITE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    maxHeight: 240,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  suggestionIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  suggestionText: {
    flex: 1,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.DARK_GRAY,
    fontFamily: 'roboto',
    lineHeight: 20,
  },
  suggestionSeparator: {
    height: 1,
    backgroundColor: colors.CARD_BORDER,
    marginHorizontal: 14,
  },
});
