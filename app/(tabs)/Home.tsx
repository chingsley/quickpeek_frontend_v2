import CustomButton from '@/components/shared/CustomButton';
import PillChip from '@/components/shared/PillChip';
import { ALL_QUESTIONS_CATEGORY_KEY, FEED_CATEGORY_DEFS, INCOMING_CATEGORY_KEY, OUTGOING_CATEGORY_KEY } from '@/constants/feedCategories';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { images } from '@/constants/images';
import HomeListBottomSpacer from '@/components/HomeListBottomSpacer';
import { useHomeFloatingAskStyle, useHomeScrollChrome } from '@/hooks/useHomeScrollChrome';
import { getQuestionFeed, searchQuestions } from '@/services/questions.services';
import { getConversations } from '@/services/requests.services';
import SocketService from '@/services/socket.services';
import { homeChromeProgress } from '@/store/homeChrome.store';
import { useDrawerStore } from '@/store/drawer.store';
import { selectIsLoggedIn, useAuthStore } from '@/store/auth.store';
import { TFeedCounts, TFeedQuestion } from '@/types/question.types';
import { formatRelativeTime } from '@/utils/date';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { KeyboardAvoidingView, KeyboardController } from 'react-native-keyboard-controller';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = () => {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const feedListRef = useRef<Animated.FlatList<TFeedQuestion>>(null);
  const searchRequestIdRef = useRef(0);
  const { scrollHandler, headerShellStyle, chromeFadeStyle, onHeaderLayout } = useHomeScrollChrome();
  const { fabContainerStyle, fabTextStyle } = useHomeFloatingAskStyle(tabBarHeight);
  const setMenuCategories = useDrawerStore((state) => state.setMenuCategories);
  const toggleDrawer = useDrawerStore((state) => state.toggle);
  const selectedCategoryKey = useDrawerStore((state) => state.selectedCategoryKey);
  const isLoggedIn = useAuthStore(selectIsLoggedIn);
  const authUserId = useAuthStore((state) => state.user?.id);
  const [feedItems, setFeedItems] = useState<TFeedQuestion[]>([]);
  const [feedCounts, setFeedCounts] = useState<TFeedCounts>({ all: 0, incoming: 0, outgoing: 0 });
  const [nearMe, setNearMe] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number; } | null>(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<TFeedQuestion[]>([]);
  const [searching, setSearching] = useState(false);

  const isSearchActive = search.trim().length > 0;

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
      setFeedItems(data.items);
      setFeedCounts(data.counts);
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

  // Debounced fuzzy search. Fires 300ms after the user stops typing.
  useEffect(() => {
    const trimmed = search.trim();

    if (trimmed.length < 2) {
      setSearching(false);
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const requestId = ++searchRequestIdRef.current;
    const handle = setTimeout(async () => {
      try {
        const data = await searchQuestions(trimmed);
        if (requestId !== searchRequestIdRef.current) return;
        setSearchResults(data.items);
      } catch (error) {
        if (requestId !== searchRequestIdRef.current) return;
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setSearching(false);
        }
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [search]);

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

  const displayedItems = useMemo(() => {
    if (selectedCategoryKey === ALL_QUESTIONS_CATEGORY_KEY) {
      return feedItems;
    }
    if (selectedCategoryKey === INCOMING_CATEGORY_KEY) {
      return feedItems.filter((item) => item.userId !== authUserId);
    }
    if (selectedCategoryKey === OUTGOING_CATEGORY_KEY) {
      return feedItems.filter((item) => item.userId === authUserId);
    }
    return feedItems;
  }, [authUserId, feedItems, selectedCategoryKey]);

  useEffect(() => {
    setMenuCategories(
      FEED_CATEGORY_DEFS.map((def) => ({
        key: def.key,
        title: def.title,
        count: feedCounts[def.key],
      })),
    );
  }, [feedCounts, setMenuCategories]);

  useEffect(() => {
    homeChromeProgress.value = 0;
    feedListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [selectedCategoryKey]);

  const activeCategory = useMemo(
    () => FEED_CATEGORY_DEFS.find((def) => def.key === selectedCategoryKey) ?? FEED_CATEGORY_DEFS[0],
    [selectedCategoryKey],
  );

  const categorySubtitle =
    selectedCategoryKey === INCOMING_CATEGORY_KEY
      ? 'From other people'
      : selectedCategoryKey === OUTGOING_CATEGORY_KEY
        ? 'Asked by you'
        : null;

  const renderQuestion = ({ item }: { item: TFeedQuestion; }) => {
    const unread = item.incomingRequest?.unreadCount ?? item.viewerRequest?.unreadCount ?? 0;
    const postedAt = formatRelativeTime(item.createdAt);
    const authorLabel = item.questioner
      ? item.questioner.id === authUserId
        ? 'You'
        : `${item.questioner.name}`
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
          {item.detail}
        </Text>
        {item.distanceKm != null && (
          <View style={styles.cardFooter}>
            <Text style={styles.distance}>{item.distanceKm.toFixed(1)} km</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const listData = isSearchActive ? searchResults : displayedItems;
  const showFeedLoading = !isSearchActive && loading;
  const listGrows = showFeedLoading || listData.length === 0;

  const renderListEmpty = () => {
    if (showFeedLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      );
    }

    if (isSearchActive) {
      if (searching) return null;
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No questions match "{search.trim()}".</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No open questions yet.</Text>
        <CustomButton
          text="Ask a question"
          onPress={() => router.push('/ask')}
          style={styles.emptyAskBtn}
          noTopMargin
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <TouchableWithoutFeedback
        accessible={false}
        onPress={() => KeyboardController.dismiss()}
      >
        <View style={styles.screenBody}>
          <Animated.View style={[styles.headerShell, headerShellStyle]}>
            <View
              style={styles.headerMeasureWrap}
              onLayout={(event) => onHeaderLayout(event.nativeEvent.layout.height)}
            >
              <View style={styles.header}>
                <Animated.View style={[styles.headerSide, chromeFadeStyle]}>
                  <Pressable onPress={toggleDrawer} style={styles.menuBtn} accessibilityLabel="Open menu">
                    <Ionicons name="menu" size={30} color={colors.PRIMARY} />
                  </Pressable>
                </Animated.View>
                <View style={styles.headerCenter} pointerEvents="none">
                  <Image source={images.logo} style={styles.logo} resizeMode="contain" accessibilityLabel="QuickPeek" />
                </View>
                <Animated.View style={[styles.headerSide, styles.headerSideRight, chromeFadeStyle]}>
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
                </Animated.View>
              </View>

              <Animated.View style={chromeFadeStyle} pointerEvents="box-none">
                <View style={styles.titleRow}>
                  <Text style={styles.pageTitle}>{activeCategory.title}</Text>
                  {categorySubtitle ? (
                    <Text style={styles.categorySubtitle}>{categorySubtitle}</Text>
                  ) : null}
                </View>

                <View style={styles.searchWrap}>
                  <Ionicons name="search-outline" size={18} color={colors.MEDIUM_GRAY} style={styles.searchIcon} />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search questions"
                    placeholderTextColor={colors.MEDIUM_GRAY}
                    style={styles.searchInput}
                    returnKeyType="search"
                    autoCorrect={false}
                  />
                  {search.length > 0 && (
                    <Pressable onPress={() => setSearch('')} style={styles.searchClearBtn} accessibilityLabel="Clear search">
                      <Ionicons name="close-circle" size={18} color={colors.MEDIUM_GRAY} />
                    </Pressable>
                  )}
                </View>

                <View style={styles.filterWrap}>
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

                {isSearchActive && searching ? (
                  <View style={styles.searchLoadingRow}>
                    <ActivityIndicator size="small" color={colors.PRIMARY} />
                    <Text style={styles.searchLoadingText}>Searching…</Text>
                  </View>
                ) : null}
                {isSearchActive && !searching && searchResults.length > 0 ? (
                  <Text style={styles.resultCountText}>
                    {searchResults.length} result{searchResults.length === 1 ? '' : 's'}
                  </Text>
                ) : null}
              </Animated.View>
            </View>
          </Animated.View>

          <KeyboardAvoidingView
            behavior="padding"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            style={styles.listAvoider}
          >
            <Animated.FlatList
              ref={feedListRef}
              data={showFeedLoading ? [] : listData}
              keyExtractor={(item) => item.id}
              renderItem={renderQuestion}
              contentContainerStyle={[
                styles.listContent,
                listGrows && styles.listContentGrow,
              ]}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={renderListEmpty}
              ListFooterComponent={HomeListBottomSpacer}
              onScroll={scrollHandler}
              scrollEventThrottle={16}
            />
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.floatingAskBtn, fabContainerStyle]}>
        <Pressable
          style={styles.floatingAskBtnInner}
          onPress={() => router.push('/ask')}
          accessibilityLabel="Ask a Question"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={22} color={colors.BG_WHITE} />
          <Animated.Text style={[styles.floatingAskBtnText, fabTextStyle]} numberOfLines={1}>
            Ask a Question
          </Animated.Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.BG_WHITE },
  screenBody: { flex: 1 },
  headerShell: {
    overflow: 'hidden',
    backgroundColor: colors.BG_WHITE,
    zIndex: 2,
  },
  headerMeasureWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerSide: {
    width: 72,
    zIndex: 1,
  },
  headerSideRight: {
    alignItems: 'flex-end',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    height: 40,
    width: 184,
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
  searchClearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  searchLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  searchLoadingText: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
  },
  resultCountText: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    paddingVertical: 6,
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
  categorySubtitle: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    marginTop: 2,
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
  viewModeBtn: {
    padding: 4,
    marginLeft: 'auto',
  },
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listAvoider: { flex: 1 },
  listContent: { paddingHorizontal: 16 },
  listContentGrow: { flexGrow: 1 },
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.PRIMARY,
    shadowColor: colors.BG_BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  floatingAskBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    paddingHorizontal: 4,
  },
  floatingAskBtnText: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.BG_WHITE,
    overflow: 'hidden',
  },
});
