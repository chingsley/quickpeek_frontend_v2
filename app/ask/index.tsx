import FormField from '@/components/shared/FormField';
import LocationPickerModal, { LocationPick } from '@/components/ask/LocationPickerModal';
import BackButton from '@/components/shared/BackButton';
import CustomButton from '@/components/shared/CustomButton';
import KeyboardAwareScreen from '@/components/shared/KeyboardAwareScreen';
import { ScreenTitle } from '@/components/shared/ScreenTitle';
import QuestionPublishedSheet from '@/components/ask/QuestionPublishedSheet';
import { colors } from '@/constants/colors';
import { formFieldLabelStyles, FORM_FIELD_INPUT_PADDING_HORIZONTAL } from '@/constants/formField';
import { fonts } from '@/constants/fonts';
import { SWITCH_APPEARANCE_PROPS } from '@/constants/switch';
import { PRICE_INPUT_PROPS } from '@/constants/textInput';
import { createQuestion } from '@/services/questions.services';
import useAppStore from '@/store/app.store';
import { formatMoney } from '@/utils/payment.utils';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
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

type AskFieldKey = 'title' | 'price' | 'detail' | 'acceptanceCriteria';

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
  const [restrictToNearby, setRestrictToNearby] = useState(true);
  const [successVisible, setSuccessVisible] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [showFieldErrors, setShowFieldErrors] = useState(false);

  const priceNum = parseFloat(price);

  const fieldErrors = useMemo(() => {
    const errors: Partial<Record<AskFieldKey, string>> = {};

    if (!title.trim()) errors.title = 'Enter a title.';
    if (!detail.trim()) errors.detail = 'Add details about what you need.';
    if (!acceptanceCriteria.trim()) {
      errors.acceptanceCriteria = 'Describe what counts as a good answer.';
    }

    if (!price.trim()) errors.price = 'Enter a price.';
    else if (isNaN(priceNum) || priceNum <= 0) errors.price = 'Enter a price greater than $0.';
    else if (priceNum > MAX_PRICE) {
      errors.price = `Price cannot exceed ${formatMoney(MAX_PRICE, 'USD')}`;
    }

    return errors;
  }, [title, detail, acceptanceCriteria, price, priceNum]);

  const isValid = Object.keys(fieldErrors).length === 0;

  const fieldError = (key: AskFieldKey): string | null => {
    const message = fieldErrors[key];
    if (!message) return null;
    if (key === 'price' && price.trim() && !isNaN(priceNum) && priceNum > MAX_PRICE) {
      return message;
    }
    return showFieldErrors ? message : null;
  };

  const handleApplyLocation = (pick: LocationPick) => {
    if (!pick.address.trim()) {
      setPickerVisible(false);
      return;
    }
    setCoords({ lat: pick.latitude, lng: pick.longitude });
    setAddress(pick.address);
    setIncludeLocation(true);
    setPickerVisible(false);
  };

  const clearLocation = () => {
    setIncludeLocation(false);
    setAddress('');
    setCoords(null);
    setRestrictToNearby(true);
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
    setShowFieldErrors(false);
  };

  const handlePublish = async () => {
    if (!isValid) {
      setShowFieldErrors(true);
      return;
    }

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
            address: address.trim(),
            restrictToNearby,
          }
          : {}),
      };
      await createQuestion(payload);
      clearForm();
      setSuccessVisible(true);
    } catch (error: any) {
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
          error={fieldError('title')}
          testID="title-input"
        />

        <FormField
          label="Price ($)"
          value={price}
          onChangeText={(text) => setPrice(sanitizePrice(text))}
          placeholder="Amount you want to pay for the information ? e.g. 5.00"
          keyboardType={PRICE_INPUT_PROPS.keyboardType}
          inputMode={PRICE_INPUT_PROPS.inputMode}
          error={fieldError('price')}
          testID="price-input"
        />

        <FormField
          label="Details"
          value={detail}
          onChangeText={setDetail}
          placeholder="Describe what you want to know..."
          maxLength={DETAIL_MAX}
          multiline
          error={fieldError('detail')}
          testID="detail-input"
        />

        <FormField
          label="Acceptance criteria"
          value={acceptanceCriteria}
          onChangeText={setAcceptanceCriteria}
          placeholder="What counts as a good answer?"
          maxLength={CRITERIA_MAX}
          multiline
          error={fieldError('acceptanceCriteria')}
          testID="criteria-input"
        />

        <Text style={formFieldLabelStyles.label}>Location (optional)</Text>
        <Pressable
          style={styles.locationField}
          onPress={() => setPickerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Choose location"
        >
          <Ionicons name="location-outline" size={18} color={colors.PRIMARY} />
          <Text
            style={[
              styles.locationFieldText,
              !(includeLocation && address) && styles.locationFieldPlaceholder,
            ]}
            numberOfLines={2}
          >
            {includeLocation && address ? address : 'Search for a location'}
          </Text>
          {includeLocation && address ? (
            <Pressable
              onPress={clearLocation}
              accessibilityLabel="Remove location"
              accessibilityRole="button"
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color={colors.MEDIUM_GRAY} />
            </Pressable>
          ) : (
            <Ionicons name="chevron-down" size={18} color={colors.MEDIUM_GRAY} />
          )}
        </Pressable>

        {includeLocation && (
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={formFieldLabelStyles.label}>Only allow users close to this location to answer</Text>
              <Text style={styles.helperText}>
                Everyone can see the question. Only users who share their live location and are within the market near-me radius can request to answer.
              </Text>
            </View>
            <Switch
              {...SWITCH_APPEARANCE_PROPS}
              value={restrictToNearby}
              onValueChange={setRestrictToNearby}
              testID="restrict-nearby-switch"
            />
          </View>
        )}

        {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

        <CustomButton
          text={loading ? 'Publishing…' : 'Publish question'}
          onPress={handlePublish}
          disabled={loading}
          loading={loading}
          style={styles.publishBtn}
        />
      </KeyboardAwareScreen>

      <LocationPickerModal
        visible={pickerVisible}
        initial={
          includeLocation && coords
            ? { latitude: coords.lat, longitude: coords.lng, address }
            : null
        }
        onApply={handleApplyLocation}
        onClose={() => setPickerVisible(false)}
      />

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
  locationField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: 100,
    paddingHorizontal: FORM_FIELD_INPUT_PADDING_HORIZONTAL,
    paddingVertical: 12,
    gap: 10,
  },
  locationFieldText: {
    flex: 1,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
  locationFieldPlaceholder: {
    color: colors.LIGHT_GRAY,
  },
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
