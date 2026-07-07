import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import useDebounce from '@/hooks/useDebounce';
import { postQuestion } from '@/services/questions.services';
import useAppStore from '@/store/app.store';
import { useQuestionStore } from '@/store/question.store';
import Ionicons from '@expo/vector-icons/Ionicons';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from '@/components/MapViewWrapper';

const MAX_QUESTION_LENGTH = 200;
const COLLAPSED_SNAP = 0;
const EXPANDED_SNAP = 1;

const HomeScreen = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const scrollViewRef = useRef<any>(null);
  const questionInputRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const snapPoints = useMemo(() => ['18%', '92%'], []);
  const params = useLocalSearchParams();
  const router = useRouter();
  const { dispatchNewQuestion } = useQuestionStore();
  const { loading, setLoading, setError } = useAppStore();

  const [questionText, setQuestionText] = useState('DELETE: Is there a long queue at the bank?');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const [inputAddressText, setInputAddressText] = useState('');
  const [addressCoordinates, setAddressCoordinates] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
  });
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const debouncedAddressText = useDebounce(inputAddressText, 600);

  const { questionText: questionTextParam, address: addressParam, longitude: longitudeParam, latitude: latitudeParam } =
    params;

  useEffect(() => {
    if (questionTextParam && addressParam && longitudeParam && latitudeParam) {
      const [latitude, longitude] = [latitudeParam as string, longitudeParam as string].map(parseFloat);
      setInputAddressText(addressParam as string);
      setAddressCoordinates({ latitude, longitude });
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setQuestionText(questionTextParam as string);
      setMode('preview');
      setIsAddressSelected(true);
      setIsFormExpanded(true);
      bottomSheetRef.current?.snapToIndex(EXPANDED_SNAP);
      router.setParams({ questionTextParam: '', addressParam: '', locationParam: '' });
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
      setIsFormExpanded(false);
      Keyboard.dismiss();
    } else {
      setIsFormExpanded(true);
    }
  }, []);

  const expandSheet = () => {
    setIsFormExpanded(true);
    bottomSheetRef.current?.snapToIndex(EXPANDED_SNAP);
  };

  const handleAddressFocus = () => {
    setIsFormExpanded(true);
    bottomSheetRef.current?.snapToIndex(EXPANDED_SNAP);
  };

  const handleQuestionFocus = () => {
    bottomSheetRef.current?.snapToIndex(EXPANDED_SNAP);
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  };

  const handleReview = () => {
    setMode('preview');
    Keyboard.dismiss();
    bottomSheetRef.current?.snapToIndex(EXPANDED_SNAP);
    setRegion((prev) => ({ ...prev, ...addressCoordinates }));
  };

  const handlePost = async () => {
    setLoading(true);
    try {
      const questionData = {
        text: questionText,
        address: inputAddressText,
        ...addressCoordinates,
      };

      const response = await postQuestion(questionData);

      if (response && response.data) {
        const { data } = response;
        await dispatchNewQuestion(data);
        setInputAddressText('');
        setQuestionText('');
        setMode('edit');
        setIsFormExpanded(false);
        bottomSheetRef.current?.snapToIndex(COLLAPSED_SNAP);
      } else {
        Alert.alert('Error', 'Invalid response from server');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while posting the question.');
      Alert.alert('Error', error.message || 'An error occurred while posting the question.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setMode('edit');
    setIsFormExpanded(true);
    bottomSheetRef.current?.snapToIndex(EXPANDED_SNAP);
  };

  const focusQuestionInput = () => {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
      questionInputRef.current?.focus();
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
      setTimeout(focusQuestionInput, 150);
    } catch (error) {
      console.error('onSuggestionPress error', error);
    }
  };

  const isEditValid = isAddressSelected && questionText.trim().length > 0;
  const questionCharCount = questionText.length;
  const isQuestionNearLimit = questionCharCount > MAX_QUESTION_LENGTH * 0.85;

  const isCollapsed = mode === 'edit' && !isFormExpanded;

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region}>
        <Marker coordinate={region} />
      </MapView>

      <BottomSheet
        ref={bottomSheetRef}
        index={COLLAPSED_SNAP}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        enablePanDownToClose={false}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        enableBlurKeyboardOnGesture
      >
        <BottomSheetView style={styles.contentContainer}>
          {/* ── Collapsed View ── */}
          {isCollapsed ? (
              <View style={styles.collapsedContent}>
                <TouchableOpacity
                  style={styles.collapsedPrompt}
                  onPress={expandSheet}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionIconCircle}>
                    <Ionicons name="add" size={22} color={colors.PRIMARY} />
                  </View>
                  <View style={styles.collapsedTextBlock}>
                    <Text style={styles.collapsedTitle}>Ask a Question</Text>
                    <Text style={styles.collapsedSubtitle}>
                      Find out what's happening nearby
                    </Text>
                  </View>
                  <Ionicons name="chevron-up" size={20} color={colors.MEDIUM_GRAY} />
                </TouchableOpacity>
              </View>
          ) : mode === 'edit' ? (
            /* ── Edit Mode (Expanded) ── */
            <View style={styles.editContainer}>
              <BottomSheetScrollView
                ref={scrollViewRef}
                style={styles.editScroll}
                contentContainerStyle={styles.editScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.pageTitle}>Ask a Question</Text>

                {/* Location Section */}
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
                    onFocus={handleAddressFocus}
                    returnKeyType="search"
                  />
                </View>

                {isAddressSelected && (
                  <View style={styles.selectedChip}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.PRIMARY} />
                    <Text style={styles.selectedChipText} numberOfLines={1}>
                      Location selected
                    </Text>
                  </View>
                )}

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

                {/* Question Section */}
                <View style={styles.questionSectionHeader}>
                  <View style={styles.sectionIconCircle}>
                    <Ionicons name="help-circle-outline" size={20} color={colors.PRIMARY} />
                  </View>
                  <Text style={styles.sectionLabel}>What do you want to know?</Text>
                </View>

                <View style={styles.questionInputWrapper}>
                  <BottomSheetTextInput
                    ref={questionInputRef}
                    style={styles.questionInput}
                    placeholder="e.g. Is there a long queue at the bank?"
                    placeholderTextColor={colors.LIGHT_GRAY}
                    value={questionText}
                    onChangeText={setQuestionText}
                    multiline
                    textAlignVertical="top"
                    maxLength={MAX_QUESTION_LENGTH}
                    onFocus={handleQuestionFocus}
                  />
                  <View style={styles.questionFooter}>
                    <Text style={[styles.charCount, isQuestionNearLimit && styles.charCountWarn]}>
                      {questionCharCount}/{MAX_QUESTION_LENGTH}
                    </Text>
                  </View>
                </View>
              </BottomSheetScrollView>

              <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <CustomButton
                  text="Review & Continue"
                  onPress={handleReview}
                  disabled={!isEditValid}
                />
              </View>
            </View>
          ) : (
            /* ── Preview Mode ── */
            <BottomSheetScrollView
              style={styles.editScroll}
              contentContainerStyle={[
                styles.previewScrollContent,
                { paddingBottom: Math.max(insets.bottom, 24) },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.previewHeader}>
                <Ionicons name="checkmark-circle" size={28} color={colors.PRIMARY} />
                <Text style={styles.previewTitle}>Your question is ready</Text>
                <Text style={styles.previewSubtitle}>Review before posting</Text>
              </View>

              <View style={styles.previewCard}>
                <View style={styles.previewCardHeader}>
                  <View style={styles.previewLabelRow}>
                    <View style={styles.iconCircleSmall}>
                      <Ionicons name="location-outline" size={16} color={colors.PRIMARY} />
                    </View>
                    <Text style={styles.previewLabel}>Location</Text>
                  </View>
                  <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                    <Ionicons name="pencil" size={16} color={colors.PRIMARY} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.previewText}>{inputAddressText}</Text>
              </View>

              <View style={styles.previewCard}>
                <View style={styles.previewCardHeader}>
                  <View style={styles.previewLabelRow}>
                    <View style={styles.iconCircleSmall}>
                      <Ionicons name="help-circle-outline" size={16} color={colors.PRIMARY} />
                    </View>
                    <Text style={styles.previewLabel}>Question</Text>
                  </View>
                  <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                    <Ionicons name="pencil" size={16} color={colors.PRIMARY} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.previewTextLarge}>{questionText}</Text>
              </View>

              <CustomButton
                text={loading ? 'Posting...' : 'Post Question'}
                onPress={handlePost}
                style={[styles.actionButton, styles.previewActionButton]}
                disabled={loading}
                loading={loading}
              />
            </BottomSheetScrollView>
          )}
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

  /* Bottom Sheet */
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

  /* ── Collapsed View ── */
  collapsedContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  collapsedPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.BG_WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  collapsedTextBlock: {
    flex: 1,
    marginLeft: 14,
  },
  collapsedTitle: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
    marginBottom: 2,
  },
  collapsedSubtitle: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
  },

  /* ── Edit Mode ── */
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
  stickyFooter: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.CARD_BORDER,
    backgroundColor: colors.BG_WHITE,
  },
  previewScrollContent: {
    paddingBottom: 24,
  },

  pageTitle: {
    fontFamily: 'roboto-bold',
    fontSize: 28,
    color: colors.TEXT_DARK,
    marginBottom: 32,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  questionSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
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

  /* Search */
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

  /* Selected Chip */
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.LIGHT_GREEN,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  selectedChipText: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.PRIMARY,
    flex: 1,
  },

  /* Suggestions */
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

  /* Question Input */
  questionInputWrapper: {
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: 10,
    backgroundColor: colors.BG_WHITE,
    overflow: 'hidden',
  },
  questionInput: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    minHeight: 100,
    lineHeight: 22,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  charCount: {
    fontFamily: 'roboto-light',
    fontSize: 12,
    color: colors.MEDIUM_GRAY,
  },
  charCountWarn: {
    color: colors.ACTIVE,
  },

  /* Action Button */
  actionButton: {
    marginTop: 20,
  },
  previewActionButton: {
    marginHorizontal: 24,
  },

  /* ── Preview Mode ── */

  previewHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
    paddingHorizontal: 24,
  },
  previewTitle: {
    fontFamily: 'roboto-bold',
    fontSize: 24,
    color: colors.TEXT_DARK,
    marginTop: 12,
    marginBottom: 4,
  },
  previewSubtitle: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
  },

  previewCard: {
    backgroundColor: colors.BG_WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 14,
    marginHorizontal: 24,
  },
  previewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLabel: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  editButton: {
    padding: 8,
  },
  previewText: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
    lineHeight: 24,
  },
  previewTextLarge: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
    lineHeight: 26,
  },
});
