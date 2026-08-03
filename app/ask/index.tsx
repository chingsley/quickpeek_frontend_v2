import FormField from '@/components/ask/FormField';
import BackButton from '@/components/shared/BackButton';
import CustomButton from '@/components/shared/CustomButton';
import KeyboardAwareScreen from '@/components/shared/KeyboardAwareScreen';
import { ScreenTitle } from '@/components/shared/ScreenTitle';
import QuestionPublishedSheet from '@/components/ask/QuestionPublishedSheet';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { BORDER_RADIUS_INPUT } from '@/constants/layout';
import { createQuestion } from '@/services/questions.services';
import useAppStore from '@/store/app.store';
import { formatMoney } from '@/utils/payment.utils';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Mirrors the backend question validation (questionMiddleware). */
const MAX_PRICE = 10_000;
const TITLE_MAX = 120;
const DETAIL_MAX = 2000;
const CRITERIA_MAX = 1000;

/** Digits and a single decimal point — what a money amount may contain. */
const sanitizePrice = (text: string): string => {
  const digitsAndDot = text.replace(/[^0-9.]/g, '');
  const [whole, ...decimals] = digitsAndDot.split('.');
  return decimals.length > 0 ? `${whole}.${decimals.join('')}` : whole;
};

const AskScreen = () => {
  const router = useRouter();
  const { loading, setLoading } = useAppStore();

  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [price, setPrice] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [includeLocation, setIncludeLocation] = useState(false);
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number; } | null>(null);
  // When true (default), only viewers the backend can verify are within the
  // market near-me radius of `coords` may request to answer.
  const [restrictToNearby, setRestrictToNearby] = useState(true);
  const [successVisible, setSuccessVisible] = useState(false);
  /** Inline publish feedback — Alert.alert is a no-op on web. */
  const [submitError, setSubmitError] = useState<string | null>(null);

  const priceNum = parseFloat(price);
  const priceError =
    !isNaN(priceNum) && priceNum > MAX_PRICE
      ? `Price cannot exceed ${formatMoney(MAX_PRICE, 'USD')}`
      : null;

  const isValid =
    title.trim().length > 0 &&
    detail.trim().length > 0 &&
    !isNaN(priceNum) &&
    priceNum > 0 &&
    priceNum <= MAX_PRICE &&
    acceptanceCriteria.trim().length > 0;

  const captureLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Location permission is required to add a location.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    const [place] = await Location.reverseGeocodeAsync({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });
    if (place) {
      const parts = [place.name, place.street, place.city, place.region].filter(Boolean);
      setAddress(parts.join(', '));
    }
    setIncludeLocation(true);
  };

  const clearForm = () => {
    setTitle('');
    setDetail('');
    setPrice('');
    setAcceptanceCriteria('');
    setIncludeLocation(false);
    setAddress('');
    setCoords(null);
    setRestrictToNearby(true);
    setSubmitError(null);
  };

  const handlePublish = async () => {
    // Reachable only when valid — the button is disabled otherwise.
    setLoading(true);
    setSubmitError(null);
    try {
      const payload = {
        title: title.trim(),
        detail: detail.trim(),
        price: priceNum,
        acceptanceCriteria: acceptanceCriteria.trim(),
        ...(includeLocation && coords
          ? {
            latitude: coords.lat,
            longitude: coords.lng,
            address: address.trim() || null,
            restrictToNearby,
          }
          : {}),
      };
      await createQuestion(payload);
      clearForm();
      setSuccessVisible(true);
    } catch (error: any) {
      // The backend sends { error }; show it where the user is looking.
      setSubmitError(
        error?.response?.data?.error ?? 'Failed to publish. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScreen contentContainerStyle={styles.scrollContent}>
        <BackButton />
        <ScreenTitle title="Ask a question" style={styles.pageTitleSpacing} />
        <Text style={styles.subtitle}>Post a question to responders.</Text>

        <FormField
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Short summary of what you need"
          maxLength={TITLE_MAX}
          testID="title-input"
        />

        <FormField
          label="Price ($)"
          value={price}
          onChangeText={(text) => setPrice(sanitizePrice(text))}
          placeholder="Amount you want to pay for the information ? e.g. 5.00"
          keyboardType="decimal-pad"
          error={priceError}
          testID="price-input"
        />

        <FormField
          label="Details"
          value={detail}
          onChangeText={setDetail}
          placeholder="Describe what you want to know..."
          maxLength={DETAIL_MAX}
          multiline
          testID="detail-input"
        />

        <FormField
          label="Acceptance criteria"
          value={acceptanceCriteria}
          onChangeText={setAcceptanceCriteria}
          placeholder="What counts as a good answer?"
          maxLength={CRITERIA_MAX}
          multiline
          testID="criteria-input"
        />

        <Pressable style={styles.locationToggle} onPress={includeLocation ? () => setIncludeLocation(false) : captureLocation}>
          <View style={styles.iconCircle}>
            <Ionicons name="location-outline" size={16} color={colors.PRIMARY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationToggleText}>
              {includeLocation ? 'Location added' : 'Add location (optional)'}
            </Text>
            {includeLocation && address ? (
              <Text style={styles.locationAddress} numberOfLines={2}>{address}</Text>
            ) : null}
          </View>
          <Ionicons name={includeLocation ? 'checkmark-circle' : 'add-circle-outline'} size={22} color={colors.PRIMARY} />
        </Pressable>

        {includeLocation && (
          <>
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextWrap}>
                <Text style={styles.label}>Only allow users close to this location to answer</Text>
                <Text style={styles.helperText}>
                  Everyone can see the question. Only users who share their live location and are within the market near-me radius can request to answer.
                </Text>
              </View>
              <Switch
                value={restrictToNearby}
                onValueChange={setRestrictToNearby}
                trackColor={{ false: colors.LIGHT_GRAY, true: colors.PRIMARY }}
                thumbColor={colors.BG_WHITE}
                testID="restrict-nearby-switch"
              />
            </View>
          </>
        )}

        {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

        <CustomButton
          text={loading ? 'Publishing…' : 'Publish question'}
          onPress={handlePublish}
          disabled={!isValid || loading}
          loading={loading}
          style={styles.publishBtn}
        />
      </KeyboardAwareScreen>

      <QuestionPublishedSheet
        visible={successVisible}
        onPostAnother={() => setSuccessVisible(false)}
        onReturnHome={() => {
          setSuccessVisible(false);
          router.replace('/(tabs)/Home');
        }}
      />
    </SafeAreaView>
  );
};

export default AskScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.BG_WHITE },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 20, paddingBottom: 40 },
  pageTitleSpacing: { marginTop: 12, marginBottom: 8 },
  subtitle: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY, marginBottom: 24 },
  label: { fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_SMALL, color: colors.TEXT_DARK, marginBottom: 8, marginTop: 12 },
  locationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    borderRadius: BORDER_RADIUS_INPUT,
    padding: 14,
    marginTop: 16,
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.SECONDARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationToggleText: { fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_SMALL, color: colors.TEXT_DARK },
  locationAddress: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_XS, color: colors.MEDIUM_GRAY, marginTop: 4 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  toggleTextWrap: { flex: 1 },
  helperText: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    marginTop: 4,
  },
  submitError: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.RED,
    marginTop: 16,
    textAlign: 'center',
  },
  publishBtn: { marginTop: 28 },
});
