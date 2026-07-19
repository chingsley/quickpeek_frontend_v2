import CustomButton from '@/components/shared/CustomButton';
import PillChip from '@/components/shared/PillChip';
import TagChip from '@/components/shared/TagChip';
import { ALL_QUESTIONS_SECTION_KEY, FEED_SECTION_DEFS } from '@/constants/feedSections';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { getCategories } from '@/services/categories.services';
import { getQuestionFeed } from '@/services/questions.services';
import { getConversations } from '@/services/requests.services';
import SocketService from '@/services/socket.services';
import { useDrawerStore } from '@/store/drawer.store';
import { AnswerRequestStatus } from '@/types/answerRequest.types';
import { TCategory } from '@/types/category.types';
import { TFeedQuestion, TFeedSection } from '@/types/question.types';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const getInteractionChip = (item: TFeedQuestion): { label: string; style: 'pending' | 'approved' | 'answered' | 'rejected' } | null => {
  if (item.incomingRequest) {
    return { label: 'Needs your approval', style: 'pending' };
  }

  const vr = item.viewerRequest;
  if (!vr) return null;

  if (vr.status === AnswerRequestStatus.Pending) {
    return { label: 'Requested', style: 'pending' };
  }
  if (vr.status === AnswerRequestStatus.Accepted) {
    return vr.hasResponded
      ? { label: 'Answered by you', style: 'answered' }
      : { label: 'Approved', style: 'approved' };
  }
  if (vr.status === AnswerRequestStatus.Rejected || vr.isBlocked) {
    return { label: 'Declined', style: 'rejected' };
  }
  return null;
};

const HomeScreen = () => {
  const router = useRouter();
  const sectionListRef = useRef<SectionList<TFeedQuestion>>(null);
  const setMenuSections = useDrawerStore((state) => state.setMenuSections);
  const toggleDrawer = useDrawerStore((state) => state.toggle);
  const selectedSectionKey = useDrawerStore((state) => state.selectedSectionKey);
  const [sections, setSections] = useState<TFeedSection[]>([]);
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
      };
      if (nearMe && coords) {
        feedParams.lat = coords.lat;
        feedParams.lng = coords.lng;
        feedParams.radiusKm = 10;
      }
      const data = await getQuestionFeed(feedParams);
      setSections(data.sections);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setLoading(false);
    }
  }, [coords, nearMe, selectedCategoryId]);

  const refreshAll = useCallback(() => {
    loadUnreadCount();
    loadFeed();
  }, [loadFeed, loadUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      getCategories().then(setCategories).catch(() => {});
      refreshAll();
    }, [refreshAll]),
  );

  useEffect(() => {
    const socket = SocketService.getSocket();
    if (!socket) return;
    socket.on('message:new', refreshAll);
    socket.on('request:new', refreshAll);
    socket.on('request:accepted', refreshAll);
    socket.on('request:rejected', refreshAll);
    socket.on('question:answered', refreshAll);
    return () => {
      socket.off('message:new', refreshAll);
      socket.off('request:new', refreshAll);
      socket.off('request:accepted', refreshAll);
      socket.off('request:rejected', refreshAll);
      socket.off('question:answered', refreshAll);
    };
  }, [refreshAll]);

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

  const handleQuestionPress = (item: TFeedQuestion) => {
    const vr = item.viewerRequest;
    const requestId = item.incomingRequest?.id || vr?.id || item.existingRequestId;
    const openChat =
      requestId &&
      (item.incomingRequest ||
        (vr &&
          (vr.status === AnswerRequestStatus.Pending ||
            vr.status === AnswerRequestStatus.Accepted)));

    if (openChat) {
      router.push({ pathname: '/chat', params: { requestId } });
      return;
    }
    router.push({ pathname: '/question-detail', params: { questionId: item.id } });
  };

  const displayedSections = useMemo(() => {
    if (selectedSectionKey === ALL_QUESTIONS_SECTION_KEY) {
      return sections;
    }
    return sections.filter((section) => section.key === selectedSectionKey);
  }, [sections, selectedSectionKey]);

  const sectionListData = useMemo(
    () =>
      displayedSections.map((section, index) => ({
        ...section,
        data: section.items,
        sectionIndex: index,
      })),
    [displayedSections],
  );

  useEffect(() => {
    const totalCount = sections.reduce((sum, section) => sum + section.items.length, 0);
    const filteredSections = FEED_SECTION_DEFS.map((def) => {
      const match = sections.find((section) => section.key === def.key);
      return {
        key: def.key,
        title: match?.title ?? def.title,
        count: match?.items.length ?? 0,
      };
    }).filter((section) => section.count > 0);

    setMenuSections([
      { key: ALL_QUESTIONS_SECTION_KEY, title: 'All Questions', count: totalCount },
      ...filteredSections,
    ]);
  }, [sections, setMenuSections]);

  useEffect(() => {
    if (sectionListData.length === 0) return;
    sectionListRef.current?.scrollToLocation({ sectionIndex: 0, itemIndex: 0, animated: false });
  }, [selectedSectionKey, sectionListData.length]);

  const renderQuestion = ({ item }: { item: TFeedQuestion }) => {
    const chip = getInteractionChip(item);
    const unread = item.incomingRequest?.unreadCount ?? item.viewerRequest?.unreadCount ?? 0;
    const chipStyle =
      chip?.style === 'pending'
        ? { chip: styles.chip_pending, text: styles.chipText_pending }
        : chip?.style === 'approved'
          ? { chip: styles.chip_approved, text: styles.chipText_approved }
          : chip?.style === 'answered'
            ? { chip: styles.chip_answered, text: styles.chipText_answered }
            : chip?.style === 'rejected'
              ? { chip: styles.chip_rejected, text: styles.chipText_rejected }
              : null;

    return (
      <TouchableOpacity
        style={viewMode === 'card' ? styles.card : styles.listItem}
        onPress={() => handleQuestionPress(item)}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.headerRight}>
            {unread > 0 && <View style={styles.unreadDot} />}
            <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          </View>
        </View>
        <Text style={styles.cardDetail} numberOfLines={viewMode === 'card' ? 3 : 2}>
          {item.incomingRequest
            ? `${item.incomingRequest.responder.name} requested to answer your question.`
            : chip?.style === 'rejected' && item.viewerRequest?.rejectionReason
              ? item.viewerRequest.rejectionReason
              : item.detail}
        </Text>
        <View style={styles.cardFooter}>
          {chip && chipStyle && (
            <TagChip label={chip.label} style={[styles.chip, chipStyle.chip]} textStyle={chipStyle.text} />
          )}
          {item.category && <TagChip label={item.category.name} style={styles.chip} />}
          {item.nearMe && (
            <TagChip label="Near me" style={[styles.chip, styles.nearMeChip]} textStyle={styles.nearMeText} />
          )}
          {item.distanceKm != null && (
            <Text style={styles.distance}>{item.distanceKm.toFixed(1)} km</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={toggleDrawer} style={styles.menuBtn} accessibilityLabel="Open menu">
          <Ionicons name="menu" size={26} color={colors.PRIMARY} />
        </Pressable>
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

      <View style={styles.filterWrap}>
        <PillChip
          label="All"
          active={!selectedCategoryId}
          onPress={() => setSelectedCategoryId(null)}
        />
        {categories.map((cat) => (
          <PillChip
            key={cat.id}
            label={cat.name}
            active={selectedCategoryId === cat.id}
            onPress={() => setSelectedCategoryId(cat.id === selectedCategoryId ? null : cat.id)}
          />
        ))}
        <PillChip
          label="Near me"
          active={nearMe}
          icon={<Ionicons name="navigate-outline" size={14} color={nearMe ? colors.BG_WHITE : colors.PRIMARY} />}
          onPress={toggleNearMe}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      ) : (
        <SectionList
          ref={sectionListRef}
          sections={sectionListData}
          keyExtractor={(item) => item.id}
          renderItem={renderQuestion}
          renderSectionHeader={({ section }) => (
            <View
              style={[
                styles.sectionHeader,
                section.sectionIndex > 0 && styles.sectionHeaderSeparated,
              ]}
            >
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
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
  menuBtn: { padding: 4, marginRight: 4 },
  pageTitle: { flex: 1, fontFamily: 'roboto-bold', fontSize: 28, color: colors.TEXT_DARK },
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
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: colors.BG_WHITE,
  },
  sectionHeaderSeparated: {
    marginTop: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.RED },
  cardTitle: { flex: 1, fontFamily: 'roboto-bold', fontSize: fonts.FONT_SIZE_MEDIUM, color: colors.TEXT_DARK, marginRight: 8 },
  price: { fontFamily: 'roboto-bold', fontSize: fonts.FONT_SIZE_MEDIUM, color: colors.PRIMARY },
  cardDetail: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY, lineHeight: 20, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: colors.LIGHT_GREEN },
  chip_pending: { backgroundColor: colors.LIGHT_PINK },
  chip_approved: { backgroundColor: colors.LIGHT_GREEN },
  chip_answered: { backgroundColor: colors.LIGHT_BLUE },
  chip_rejected: { backgroundColor: colors.DARK_WHITE },
  nearMeChip: { backgroundColor: colors.LIGHT_BLUE },
  chipText_pending: { color: colors.ACTIVE },
  chipText_approved: { color: colors.PRIMARY },
  chipText_answered: { color: colors.PRIMARY },
  chipText_rejected: { color: colors.MEDIUM_GRAY },
  nearMeText: { color: colors.DARK_GRAY },
  distance: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_XS, color: colors.MEDIUM_GRAY, marginLeft: 'auto' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY },
});
