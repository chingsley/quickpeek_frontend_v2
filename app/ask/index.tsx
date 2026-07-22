import BackButton from '@/components/shared/BackButton';
import CustomButton from '@/components/shared/CustomButton';
import KeyboardAwareScreen from '@/components/shared/KeyboardAwareScreen';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { BORDER_RADIUS_INPUT } from '@/constants/layout';
import { createQuestion } from '@/services/questions.services';
import useAppStore from '@/store/app.store';
import { useQuestionStore } from '@/store/question.store';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AskScreen = () => {
  const router = useRouter();
  const { loading, setLoading } = useAppStore();
  const { prependMyQuestion } = useQuestionStore();

  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [price, setPrice] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [includeLocation, setIncludeLocation] = useState(false);
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number; } | null>(null);
  const [answerRadiusKm, setAnswerRadiusKm] = useState('5');

  const priceNum = parseFloat(price);

  const isValid =
    title.trim().length > 0 &&
    detail.trim().length > 0 &&
    !isNaN(priceNum) &&
    priceNum > 0 &&
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

  const handlePublish = async () => {
    if (!isValid) return;
    setLoading(true);
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
            answerRadiusKm: parseFloat(answerRadiusKm) || 5,
          }
          : {}),
      };
      const question = await createQuestion(payload);
      prependMyQuestion(question);
      Alert.alert('Published', 'Your question is now live on the marketplace.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/Questions') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || error?.message || 'Failed to publish.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScreen contentContainerStyle={styles.scrollContent}>
          <BackButton color={colors.PRIMARY} />
          <Text style={styles.pageTitle}>Ask a question</Text>
          <Text style={styles.subtitle}>Publish to the marketplace for responders to answer.</Text>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Short summary of what you need"
            placeholderTextColor={colors.LIGHT_GRAY}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />

          <Text style={styles.label}>Price ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 5.00"
            placeholderTextColor={colors.LIGHT_GRAY}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Details</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Describe what you want to know..."
            placeholderTextColor={colors.LIGHT_GRAY}
            value={detail}
            onChangeText={setDetail}
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />

          <Text style={styles.label}>Acceptance criteria</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="What counts as a good answer?"
            placeholderTextColor={colors.LIGHT_GRAY}
            value={acceptanceCriteria}
            onChangeText={setAcceptanceCriteria}
            multiline
            textAlignVertical="top"
            maxLength={500}
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
              <Text style={styles.label}>Answer radius (km)</Text>
              <TextInput
                style={styles.input}
                value={answerRadiusKm}
                onChangeText={setAnswerRadiusKm}
                keyboardType="decimal-pad"
              />
            </>
          )}

          <CustomButton
            text={loading ? 'Publishing…' : 'Publish question'}
            onPress={handlePublish}
            disabled={!isValid || loading}
            loading={loading}
            style={styles.publishBtn}
          />
      </KeyboardAwareScreen>
    </SafeAreaView>
  );
};

export default AskScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.BG_WHITE },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 20, paddingBottom: 40 },
  pageTitle: { fontFamily: 'roboto-bold', fontSize: 28, color: colors.TEXT_DARK, marginTop: 12, marginBottom: 8 },
  subtitle: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY, marginBottom: 24 },
  label: { fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_SMALL, color: colors.TEXT_DARK, marginBottom: 8, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    backgroundColor: colors.BG_WHITE,
  },
  multiline: {
    minHeight: 100,
    lineHeight: 22,
    borderRadius: BORDER_RADIUS_INPUT,
  },
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
    backgroundColor: colors.LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationToggleText: { fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_SMALL, color: colors.TEXT_DARK },
  locationAddress: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_XS, color: colors.MEDIUM_GRAY, marginTop: 4 },
  publishBtn: { marginTop: 28 },
});
