import CustomButton from '@/components/shared/CustomButton';
import PillChip from '@/components/shared/PillChip';
import TagChip from '@/components/shared/TagChip';
import { ALL_QUESTIONS_SECTION_KEY, FEED_SECTION_DEFS } from '@/constants/feedSections';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { getQuestionFeed } from '@/services/questions.services';
import { getConversations } from '@/services/requests.services';
import SocketService from '@/services/socket.services';
import { useDrawerStore } from '@/store/drawer.store';
import { selectIsLoggedIn, useAuthStore } from '@/store/auth.store';
import { AnswerRequestStatus } from '@/types/answerRequest.types';
import { TFeedQuestion, TFeedSection } from '@/types/question.types';
import { formatRelativeTime } from '@/utils/date';
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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const getInteractionChip = (item: TFeedQuestion): { label: string; style: 'pending' | 'approved' | 'answered' | 'rejected'; } | null => {
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
  const isLoggedIn = useAuthStore(selectIsLoggedIn);
  const authUserId = useAuthStore((state) => state.user?.id);
  const [sections, setSections] = useState<TFeedSection[]>([]);
  const [nearMe, setNearMe] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number; } | null>(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [search, setSearch] = useState('');

  const loadUnreadCount = useCallback(async () => {
    try {
      const data = await getConversations();
      setUnreadChatCount(data.unreadTotal);
    } catch {
      setUnreadChatCount(0);
    }
  }, []);

  const loadFeed = useCallback(async () => {
    if (!isLoggedIn) return;

    setLoading(true);
    try {
      const feedParams: Parameters<typeof getQuestionFeed>[0] = {};
      if (nearMe) {
        feedParams.nearMe = true;
        if (coords) {
          feedParams.lat = coords.lat;
          feedParams.lng = coords.lng;
        }
      }
      const data = await getQuestionFeed(feedParams);
      setSections(data.sections);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setLoading(false);
    }
  }, [coords, isLoggedIn, nearMe]);

  const refreshAll = useCallback(() => {
    if (!isLoggedIn) return;
    loadUnreadCount();
    loadFeed();
  }, [isLoggedIn, loadFeed, loadUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, [refreshAll]),
  );

  useEffect(() => {
    if (!isLoggedIn) return;
    loadFeed();
  }, [isLoggedIn, loadFeed]);

  useEffect(() => {
    if (!isLoggedIn) return;

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
  }, [isLoggedIn, refreshAll]);

  const toggleNearMe = async () => {
    if (!nearMe) {
      setNearMe(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({});
        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch (error) {
        console.warn('Could not retrieve current location; falling back to saved location', error);
      }
    } else {
      setNearMe(false);
    }
  };

  const handleQuestionPress = (item: TFeedQuestion) => {
    router.push({ pathname: '/question-detail', params: { questionId: item.id } });
  };

  const displayedSections = useMemo(() => {
    if (selectedSectionKey === ALL_QUESTIONS_SECTION_KEY) {
      return sections.filter((section) => section.items.length > 0);
    }

    const match = sections.find((section) => section.key === selectedSectionKey);
    if (match) {
      return [match];
    }

    const fallback = FEED_SECTION_DEFS.find((def) => def.key === selectedSectionKey);
    if (!fallback) {
      return [];
    }

    return [{ key: fallback.key, title: fallback.title, items: [] }];
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
    const drawerSections = FEED_SECTION_DEFS.map((def) => {
      const match = sections.find((section) => section.key === def.key);
      return {
        key: def.key,
        title: match?.title ?? def.title,
        count: match?.items.length ?? 0,
      };
    });

    setMenuSections([
      { key: ALL_QUESTIONS_SECTION_KEY, title: 'All Questions', count: totalCount },
      ...drawerSections,
    ]);
  }, [sections, setMenuSections]);

  useEffect(() => {
    if (sectionListData.length === 0) return;
    sectionListRef.current?.scrollToLocation({ sectionIndex: 0, itemIndex: 0, animated: false });
  }, [selectedSectionKey, sectionListData.length]);

  const renderQuestion = ({ item }: { item: TFeedQuestion; }) => {
    const chip = getInteractionChip(item);
    const unread = item.incomingRequest?.unreadCount ?? item.viewerRequest?.unreadCount ?? 0;
    const postedAt = formatRelativeTime(item.createdAt);
    const authorLabel = item.questioner
      ? item.questioner.id === authUserId
        ? 'You'
        : `${item.questioner.name}`
      : null;
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
        <View style={styles.cardMeta}>
          {authorLabel && (
            <Text style={styles.questioner} numberOfLines={1}>
              {authorLabel}
            </Text>
          )}
          {authorLabel && <Text style={styles.metaDivider}>|</Text>}
          <Text style={styles.postedAt}>{postedAt}</Text>
        </View>
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={toggleDrawer} style={styles.menuBtn} accessibilityLabel="Open menu">
          <Ionicons name="menu" size={26} color={colors.PRIMARY} />
        </Pressable>
        <View style={styles.headerActions}>
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

      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Questions</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.MEDIUM_GRAY} style={styles.searchIcon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search"
          placeholderTextColor={colors.MEDIUM_GRAY}
          style={styles.searchInput}
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>

      <View style={styles.filterWrap}>
        <PillChip
          label="All"
          active={!nearMe}
          onPress={() => setNearMe(false)}
        />
        <PillChip
          label="Near me"
          active={nearMe}
          icon={<Ionicons name="navigate-outline" size={14} color={nearMe ? colors.BG_WHITE : colors.PRIMARY} />}
          onPress={toggleNearMe}
        />
        <Pressable
          onPress={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
          style={styles.viewModeBtn}
          accessibilityLabel="Toggle view mode"
        >
          <Ionicons
            name={viewMode === 'card' ? 'list-outline' : 'grid-outline'}
            size={22}
            color={colors.PRIMARY}
          />
        </Pressable>
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
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No open questions yet.</Text>
              <CustomButton
                text="Ask a question"
                onPress={() => router.push('/ask')}
                style={styles.emptyAskBtn}
                noTopMargin
              />
            </View>
          }
        />
      )}

      <Pressable
        style={styles.floatingAskBtn}
        onPress={() => router.push('/ask')}
        accessibilityLabel="Ask a Question"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={18} color={colors.BG_WHITE} />
        <Text style={styles.floatingAskBtnText}>Ask a Question</Text>
      </Pressable>
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
    paddingBottom: 4,
    gap: 8,
  },
  titleRow: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: 100,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.BG_WHITE,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    paddingVertical: 10,
  },
  menuBtn: { padding: 4, marginRight: 4 },
  pageTitle: { fontFamily: 'roboto-bold', fontSize: 28, color: colors.TEXT_DARK },
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
  viewModeBtn: {
    padding: 4,
    marginLeft: 'auto',
  },
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
    backgroundColor: colors.BG_WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.BG_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  listItem: {
    backgroundColor: colors.BG_WHITE,
    borderBottomWidth: 1,
    borderBottomColor: colors.CARD_BORDER,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.RED },
  cardTitle: { flex: 1, fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_MEDIUM, color: colors.TEXT_DARK, marginRight: 8 },
  price: { fontFamily: 'roboto-bold', fontSize: fonts.FONT_SIZE_MEDIUM, color: colors.PRIMARY },
  cardDetail: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY, lineHeight: 20, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  questioner: {
    flexShrink: 1,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.PRIMARY,
  },
  metaDivider: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
  },
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
  distance: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    marginLeft: 'auto',
  },
  postedAt: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_XS, color: colors.MEDIUM_GRAY },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyAskBtn: { marginTop: 16, alignSelf: 'center' },
  emptyText: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY },
  floatingAskBtn: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.PRIMARY,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 18,
    shadowColor: colors.BG_BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  floatingAskBtnText: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.BG_WHITE,
  },
});
