import BackButton from '@/components/shared/BackButton';
import ResponderRow from '@/components/ResponderRow';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { getNearbyResponders } from '@/services/users.services';
import { TResponder } from '@/types/user.types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SortMode = 'proximity' | 'rating';

const RespondersScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const latitude = parseFloat(params.latitude as string);
  const longitude = parseFloat(params.longitude as string);
  const address = params.address as string;
  const questionText = (params.questionText as string) || '';
  const reassignQuestionId = (params.reassignQuestionId as string) || '';

  const [responders, setResponders] = useState<TResponder[]>([]);
  const [sort, setSort] = useState<SortMode>('proximity');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResponders = useCallback(async () => {
    if (!latitude || !longitude) {
      setError('Location is required to browse responders.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getNearbyResponders(longitude, latitude, sort);
      setResponders(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load nearby responders.');
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, sort]);

  useEffect(() => {
    fetchResponders();
  }, [fetchResponders]);

  const openProfile = (responder: TResponder) => {
    router.push({
      pathname: '/responder-profile',
      params: {
        userId: responder.userId,
        distance: String(responder.distance),
        latitude: String(latitude),
        longitude: String(longitude),
        address,
        questionText,
        reassignQuestionId,
      },
    });
  };

  const renderHeader = () => (
    <View style={styles.headerBlock}>
      <Text style={styles.subtitle} numberOfLines={2}>
        {address}
      </Text>
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by</Text>
        <TouchableOpacity
          style={[styles.sortChip, sort === 'proximity' && styles.sortChipActive]}
          onPress={() => setSort('proximity')}
        >
          <Text style={[styles.sortChipText, sort === 'proximity' && styles.sortChipTextActive]}>
            Nearest
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortChip, sort === 'rating' && styles.sortChipActive]}
          onPress={() => setSort('rating')}
        >
          <Text style={[styles.sortChipText, sort === 'rating' && styles.sortChipTextActive]}>
            Top rated
          </Text>
        </TouchableOpacity>
      </View>
      {reassignQuestionId ? (
        <Text style={styles.reassignHint}>Choose a new responder for your expired question.</Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <BackButton color={colors.PRIMARY} />
        </View>
        <Text style={styles.pageTitle}>
          {reassignQuestionId ? 'Choose another responder' : 'Choose a responder'}
        </Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.PRIMARY} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchResponders} style={styles.retryBtn}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={responders}
            keyExtractor={(item) => item.userId}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <ResponderRow responder={item} onPress={() => openProfile(item)} />
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No responders nearby right now. Try again later.</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default RespondersScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.BG_WHITE,
  },
  page: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  topBar: {
    marginBottom: 8,
  },
  pageTitle: {
    fontFamily: 'roboto-bold',
    fontSize: 28,
    color: colors.TEXT_DARK,
    marginBottom: 16,
  },
  headerBlock: {
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    marginBottom: 16,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sortLabel: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.DARK_GRAY,
    marginRight: 4,
  },
  sortChip: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  sortChipActive: {
    backgroundColor: colors.LIGHT_GREEN,
    borderColor: colors.PRIMARY,
  },
  sortChipText: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.DARK_GRAY,
  },
  sortChipTextActive: {
    fontFamily: 'roboto-bold',
    color: colors.PRIMARY,
  },
  reassignHint: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.ACTIVE,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.RED,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 100,
    backgroundColor: colors.PRIMARY,
  },
  retryText: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.BG_WHITE,
  },
  emptyText: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 16,
  },
});
