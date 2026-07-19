import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { getCategories } from '@/services/categories.services';
import { getQuestionFeed } from '@/services/questions.services';
import { getConversations } from '@/services/requests.services';
import SocketService from '@/services/socket.services';
import { useQuestionStore } from '@/store/question.store';
import { TCategory } from '@/types/category.types';
import { TQuestion } from '@/types/question.types';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = () => {
  const router = useRouter();
  const { feedQuestions, setFeedQuestions } = useQuestionStore();
  const [categories, setCategories] = useState<TCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [nearMe, setNearMe] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const data = await getConversations();
      setUnreadChatCount(data.unreadTotal);
    } catch {
      setUnreadChatCount(0);
    }
  }, []);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const feedParams: Parameters<typeof getQuestionFeed>[0] = {
        categoryId: selectedCategoryId ?? undefined,
        page: 1,
        limit: 30,
      };
      if (nearMe && coords) {
        feedParams.lat = coords.lat;
        feedParams.lng = coords.lng;
        feedParams.radiusKm = 10;
      }
      const data = await getQuestionFeed(feedParams);
      setFeedQuestions(data.items);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setLoading(false);
    }
  }, [coords, nearMe, selectedCategoryId, setFeedQuestions]);

  useFocusEffect(
    useCallback(() => {
      getCategories().then(setCategories).catch(() => {});
      loadUnreadCount();
    }, [loadUnreadCount]),
  );

  useEffect(() => {
    const socket = SocketService.getSocket();
    if (!socket) return;
    const refresh = () => loadUnreadCount();
    socket.on('message:new', refresh);
    socket.on('request:new', refresh);
    socket.on('request:accepted', refresh);
    socket.on('request:rejected', refresh);
    socket.on('question:answered', refresh);
    return () => {
      socket.off('message:new', refresh);
      socket.off('request:new', refresh);
      socket.off('request:accepted', refresh);
      socket.off('request:rejected', refresh);
      socket.off('question:answered', refresh);
    };
  }, [loadUnreadCount]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const toggleNearMe = async () => {
    if (!nearMe) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      setNearMe(true);
    } else {
      setNearMe(false);
    }
  };

  const renderQuestion = ({ item }: { item: TQuestion }) => (
    <TouchableOpacity
      style={viewMode === 'card' ? styles.card : styles.listItem}
      onPress={() => router.push({ pathname: '/question-detail', params: { questionId: item.id } })}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      </View>
      <Text style={styles.cardDetail} numberOfLines={viewMode === 'card' ? 3 : 2}>{item.detail}</Text>
      <View style={styles.cardFooter}>
        {item.category && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{item.category.name}</Text>
          </View>
        )}
        {item.nearMe && (
          <View style={[styles.chip, styles.nearMeChip]}>
            <Text style={[styles.chipText, styles.nearMeText]}>Near me</Text>
          </View>
        )}
        {item.distanceKm != null && (
          <Text style={styles.distance}>{item.distanceKm.toFixed(1)} km</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Questions</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setViewMode(viewMode === 'card' ? 'list' : 'card')} style={styles.iconBtn}>
            <Ionicons
              name={viewMode === 'card' ? 'list-outline' : 'grid-outline'}
              size={22}
              color={colors.PRIMARY}
            />
          </Pressable>
          <Pressable onPress={() => router.push('/ask')} style={styles.askBtn}>
            <Ionicons name="add" size={20} color={colors.BG_WHITE} />
            <Text style={styles.askBtnText}>Ask</Text>
          </Pressable>
          <Pressable
            style={styles.chatIconBtn}
            onPress={() => router.push('/chats')}
            accessibilityLabel="Open chats"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={26} color={colors.PRIMARY} />
            {unreadChatCount > 0 && (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>
                  {unreadChatCount > 99 ? '99+' : unreadChatCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        <Pressable
          style={[styles.filterChip, !selectedCategoryId && styles.filterChipActive]}
          onPress={() => setSelectedCategoryId(null)}
        >
          <Text style={[styles.filterChipText, !selectedCategoryId && styles.filterChipTextActive]}>All</Text>
        </Pressable>
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            style={[styles.filterChip, selectedCategoryId === cat.id && styles.filterChipActive]}
            onPress={() => setSelectedCategoryId(cat.id === selectedCategoryId ? null : cat.id)}
          >
            <Text style={[styles.filterChipText, selectedCategoryId === cat.id && styles.filterChipTextActive]}>
              {cat.name}
            </Text>
          </Pressable>
        ))}
        <Pressable
          style={[styles.filterChip, nearMe && styles.filterChipActive]}
          onPress={toggleNearMe}
        >
          <Ionicons name="navigate-outline" size={14} color={nearMe ? colors.BG_WHITE : colors.PRIMARY} />
          <Text style={[styles.filterChipText, nearMe && styles.filterChipTextActive]}>Near me</Text>
        </Pressable>
      </ScrollView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={feedQuestions}
          keyExtractor={(item) => item.id}
          renderItem={renderQuestion}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No open questions yet.</Text>
              <CustomButton text="Ask a question" onPress={() => router.push('/ask')} style={{ marginTop: 16 }} />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.BG_WHITE },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
  },
  chatIconBtn: { padding: 4, position: 'relative' },
  chatBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBadgeText: { color: colors.BG_WHITE, fontSize: 10, fontWeight: 'bold' },
  pageTitle: { fontFamily: 'roboto-bold', fontSize: 28, color: colors.TEXT_DARK },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { padding: 8 },
  askBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  askBtnText: { fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_SMALL, color: colors.BG_WHITE },
  filterRow: { maxHeight: 44, marginBottom: 8 },
  filterContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    backgroundColor: colors.BG_WHITE,
    gap: 4,
  },
  filterChipActive: { backgroundColor: colors.PRIMARY, borderColor: colors.PRIMARY },
  filterChipText: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.DARK_GRAY },
  filterChipTextActive: { color: colors.BG_WHITE },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: colors.CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    padding: 16,
    marginBottom: 12,
  },
  listItem: {
    backgroundColor: colors.BG_WHITE,
    borderBottomWidth: 1,
    borderBottomColor: colors.CARD_BORDER,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardTitle: { flex: 1, fontFamily: 'roboto-bold', fontSize: fonts.FONT_SIZE_MEDIUM, color: colors.TEXT_DARK, marginRight: 8 },
  price: { fontFamily: 'roboto-bold', fontSize: fonts.FONT_SIZE_MEDIUM, color: colors.PRIMARY },
  cardDetail: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY, lineHeight: 20, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: colors.LIGHT_GREEN, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  nearMeChip: { backgroundColor: colors.LIGHT_BLUE },
  chipText: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_XS, color: colors.PRIMARY },
  nearMeText: { color: colors.DARK_GRAY },
  distance: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_XS, color: colors.MEDIUM_GRAY, marginLeft: 'auto' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY },
});
