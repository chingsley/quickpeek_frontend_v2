import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import { FORM_FIELD_INPUT_PADDING_HORIZONTAL, formFieldLabelStyles } from '@/constants/formField';
import { fonts } from '@/constants/fonts';
import { TEXT_INPUT_CLIPBOARD_PROPS } from '@/constants/textInput';
import {
  getAddressLabel,
  getLocationSuggestions,
  LocationSuggestion,
} from '@/services/location.services';
import { useDebouncedValue } from '@/utils/useDebouncedValue';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
} from 'react-native';
import LocationPickerMap from '@/components/ask/LocationPickerMap';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type LocationPick = {
  latitude: number;
  longitude: number;
  address: string;
};

type LocationPickerModalProps = {
  visible: boolean;
  initial?: LocationPick | null;
  onApply: (pick: LocationPick) => void;
  onClose: () => void;
};

const MIN_QUERY_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 500;
/** Market default when nothing has been picked yet (Halifax). */
const DEFAULT_COORDS = { latitude: 44.65, longitude: -63.57 };
const MAP_DELTA = { latitudeDelta: 0.05, longitudeDelta: 0.05 };
const MAP_PICK_HINT = 'Enter address or drag the map over the pin to choose location.';
const LOCATION_APPLY_ERROR =
  'Enter address or drag the map to choose a location. Click "X" to Cancel.';

/**
 * Marketplace-style location picker: debounced address suggestions, a
 * drag-to-choose map with a fixed center pin, GPS shortcut, and Apply. All
 * network races use latest-request-wins so stale results never render.
 */
const LocationPickerModal = ({ visible, initial, onApply, onClose }: LocationPickerModalProps) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [resultTerm, setResultTerm] = useState<string | null>(null);
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [center, setCenter] = useState(DEFAULT_COORDS);
  const [addressLabel, setAddressLabel] = useState('');
  const [gpsError, setGpsError] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  /** True once the user has actually chosen something (suggestion, drag, GPS). */
  const [hasPicked, setHasPicked] = useState(false);

  const suppressSearchRef = useRef(false);
  const searchSeq = useRef(0);
  const geocodeSeq = useRef(0);
  /** Ignore programmatic map settles — only user drags count as a pick. */
  const userMovedMapRef = useRef(false);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  // Reset whenever the picker opens.
  useEffect(() => {
    if (!visible) return;
    const start = initial
      ? { latitude: initial.latitude, longitude: initial.longitude }
      : DEFAULT_COORDS;
    suppressSearchRef.current = !!initial?.address;
    setQuery(initial?.address ?? '');
    setSuggestions([]);
    setSearching(false);
    setSearchError(false);
    setResultTerm(null);
    setGpsError(false);
    setApplyError(null);
    setCoords(start);
    setCenter(start);
    setAddressLabel(initial?.address ?? '');
    setHasPicked(!!initial);
    userMovedMapRef.current = false;
  }, [visible, initial]);

  // Debounced suggestion search, latest request wins.
  useEffect(() => {
    if (suppressSearchRef.current) {
      suppressSearchRef.current = false;
      setSuggestions([]);
      setResultTerm(null);
      return;
    }
    const term = debouncedQuery.trim();
    if (term.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setResultTerm(null);
      setSearchError(false);
      return;
    }
    const seq = ++searchSeq.current;
    setSearching(true);
    setSearchError(false);
    getLocationSuggestions(term)
      .then((results) => {
        if (seq !== searchSeq.current) return;
        setSuggestions(results);
        setResultTerm(term);
        setSearching(false);
      })
      .catch(() => {
        if (seq !== searchSeq.current) return;
        setSuggestions([]);
        setResultTerm(null);
        setSearching(false);
        setSearchError(true);
      });
  }, [debouncedQuery]);

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (applyError) setApplyError(null);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setResultTerm(null);
    setSearchError(false);
  };

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    suppressSearchRef.current = true;
    const next = { latitude: suggestion.latitude, longitude: suggestion.longitude };
    setQuery(suggestion.label);
    setSuggestions([]);
    setCoords(next);
    setCenter(next);
    setAddressLabel(suggestion.label);
    setHasPicked(true);
    setApplyError(null);
    Keyboard.dismiss();
  };

  const reverseGeocodeIntoLabel = (latitude: number, longitude: number) => {
    const seq = ++geocodeSeq.current;
    getAddressLabel(latitude, longitude).then((label) => {
      if (seq === geocodeSeq.current) {
        setAddressLabel(label);
      }
    });
  };

  const handlePanDrag = () => {
    userMovedMapRef.current = true;
  };

  const handleRegionChangeComplete = (region: {
    latitude: number;
    longitude: number;
  }) => {
    setCoords({ latitude: region.latitude, longitude: region.longitude });
    if (!userMovedMapRef.current) return;
    setHasPicked(true);
    setApplyError(null);
    reverseGeocodeIntoLabel(region.latitude, region.longitude);
  };

  const handleUseCurrentLocation = async () => {
    setGpsError(false);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setGpsError(true);
      return;
    }
    const position = await Location.getCurrentPositionAsync({});
    const next = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    setCoords(next);
    setCenter(next);
    setHasPicked(true);
    setApplyError(null);
    reverseGeocodeIntoLabel(next.latitude, next.longitude);
  };

  const handleApply = () => {
    if (!hasPicked) {
      setApplyError(LOCATION_APPLY_ERROR);
      return;
    }
    setApplyError(null);
    onApply({
      latitude: coords.latitude,
      longitude: coords.longitude,
      // A drag applies the viewport center; if the reverse geocode hasn't
      // resolved yet, fall back to the coordinates so the pick is never empty.
      address:
        addressLabel ||
        `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
    });
  };

  // Context-derived insets (not SafeAreaView) — a Modal's window reports
  // zero insets on first presentation, which pushed the header under the
  // notch and the Apply button under the home indicator.
  const insets = useSafeAreaInsets();

  const showNotFound =
    resultTerm !== null &&
    resultTerm === debouncedQuery.trim() &&
    !searching &&
    !searchError &&
    suggestions.length === 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Close location picker"
            accessibilityRole="button"
            style={styles.headerButton}
          >
            <Ionicons name="close" size={24} color={colors.TEXT_DARK} />
          </Pressable>
          <Text style={styles.headerTitle}>Location</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.searchSection}>
          <Text style={[formFieldLabelStyles.label, styles.fieldLabel]}>{MAP_PICK_HINT}</Text>
          <View style={[styles.searchRow, applyError ? styles.searchRowError : null]}>
            <Ionicons name="search" size={18} color={colors.MEDIUM_GRAY} />
            <TextInput
              {...TEXT_INPUT_CLIPBOARD_PROPS}
              testID="location-search-input"
              style={[styles.searchInput, Platform.OS === 'web' && styles.searchInputWeb]}
              placeholder="Search by city, neighborhood or ZIP code"
              placeholderTextColor={colors.PLACEHOLDER}
              value={query}
              onChangeText={handleChangeText}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 ? (
              <Pressable
                onPress={handleClear}
                accessibilityLabel="Clear search"
                accessibilityRole="button"
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={18} color={colors.MEDIUM_GRAY} />
              </Pressable>
            ) : null}
          </View>
          {applyError ? <Text style={styles.fieldError}>{applyError}</Text> : null}
        </View>

        {searchError ? (
          <Text style={styles.searchMessage}>
            Could not search places. Check your connection and try again.
          </Text>
        ) : null}
        {showNotFound ? (
          <Text style={styles.searchMessage}>
            No places found for “{debouncedQuery.trim()}”.
          </Text>
        ) : null}

        {suggestions.length > 0 ? (
          <View style={styles.suggestions}>
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion.label}
                style={styles.suggestionRow}
                onPress={() => handleSelectSuggestion(suggestion)}
                accessibilityRole="button"
              >
                <Ionicons name="location-outline" size={20} color={colors.PRIMARY} />
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {suggestion.label}
                </Text>
              </Pressable>
            ))}
            <Text style={styles.attribution}>© OpenStreetMap contributors</Text>
          </View>
        ) : null}

        <View style={styles.mapWrap}>
          {Platform.OS === 'web' ? (
            <View style={styles.webFallback}>
              <Ionicons name="map-outline" size={40} color={colors.PRIMARY} />
              <Text style={styles.webFallbackText}>
                Map preview is available in the mobile app.
              </Text>
            </View>
          ) : (
            <>
              <LocationPickerMap
                testID="picker-map"
                key={`${center.latitude},${center.longitude}`}
                style={StyleSheet.absoluteFill}
                initialRegion={{ ...center, ...MAP_DELTA }}
                onPanDrag={handlePanDrag}
                onRegionChangeComplete={handleRegionChangeComplete}
              />
              <View pointerEvents="none" style={styles.centerPin}>
                <Ionicons name="location" size={40} color={colors.AMBER} />
              </View>
            </>
          )}

          {addressLabel ? (
            <View style={styles.addressPill} pointerEvents="none">
              <Text style={styles.addressPillText} numberOfLines={2}>
                {addressLabel}
              </Text>
            </View>
          ) : null}

          {Platform.OS !== 'web' ? (
            <Pressable
              style={styles.gpsButton}
              onPress={handleUseCurrentLocation}
              accessibilityLabel="Use current location"
              accessibilityRole="button"
            >
              <Ionicons name="navigate-outline" size={22} color={colors.PRIMARY} />
            </Pressable>
          ) : null}
        </View>

        {gpsError ? (
          <Text style={styles.gpsError}>
            Location permission is needed to use your current location.
          </Text>
        ) : null}

        <View style={styles.footer}>
          <CustomButton
            text="Apply"
            onPress={handleApply}
            noTopMargin
          />
        </View>
      </View>
    </Modal>
  );
};

export default LocationPickerModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.BG_WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.FONT_FAMILY_BOLD,
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
  },
  searchSection: {
    marginTop: 4,
  },
  fieldLabel: {
    marginBottom: 0,
    marginTop: 0,
    marginHorizontal: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.INPUT_BG,
    borderRadius: 100,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: colors.TRANSPARENT,
  },
  searchRowError: {
    borderColor: colors.RED,
  },
  fieldError: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.RED,
    textAlign: 'left',
    marginTop: 6,
    marginHorizontal: 16,
    paddingLeft: FORM_FIELD_INPUT_PADDING_HORIZONTAL,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    paddingVertical: 0,
  },
  searchInputWeb: {
    userSelect: 'text',
  } as TextStyle,
  clearButton: {
    padding: 4,
  },
  searchMessage: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 24,
  },
  suggestions: {
    marginTop: 8,
    marginHorizontal: 16,
    backgroundColor: colors.BG_WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.CARD_BORDER,
  },
  suggestionText: {
    flex: 1,
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
  attribution: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  mapWrap: {
    flex: 1,
    marginTop: 16,
    backgroundColor: colors.MAP_PLACEHOLDER_BG,
  },
  centerPin: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  webFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  webFallbackText: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
  },
  addressPill: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    maxWidth: '85%',
    backgroundColor: colors.BG_WHITE,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: colors.BG_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  addressPillText: {
    fontFamily: fonts.FONT_FAMILY_BOLD,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    textAlign: 'center',
  },
  gpsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.BG_WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.BG_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  gpsError: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.RED,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
});
