import Searchbar from '@/components/Searchbar';
import QuestionStatusIcons, { STATUS_ICON_VISUALS, StatusIconGlyph } from '@/components/QuestionStatusIcons';
import { ALL_QUESTIONS_CATEGORY_KEY, CLOSED_QUESTIONS_CATEGORY_KEY, FEED_CATEGORY_DEFS, INCOMING_CATEGORY_KEY, OUTGOING_CATEGORY_KEY } from '@/constants/feedCategories';
import { filterTabletColors, filterTabletStyles, FILTER_TABLET_ICON_SIZE } from '@/constants/filterTablets';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { images } from '@/constants/images';
import {
  STATUS_ICON_NEUTRAL_COLOR,
  STATUS_ICON_QUESTION_ITEM_SIZE,
} from '@/constants/statusIcons';
import HomeListBottomSpacer from '@/components/HomeListBottomSpacer';
import { useHomeFloatingAskStyle, useHomeScrollChrome } from '@/hooks/useHomeScrollChrome';
import { getMyClosedQuestions, getQuestionFeed, searchQuestions } from '@/services/questions.services';
import { getConversations } from '@/services/requests.services';
import SocketService from '@/services/socket.services';
import { useDrawerStore } from '@/store/drawer.store';
import { useLiveLocationStore } from '@/store/liveLocation.store';
import { selectIsLoggedIn, useAuthStore } from '@/store/auth.store';
import { QuestionStatus, TFeedCounts, TFeedQuestion } from '@/types/question.types';
import { formatRelativeTime } from '@/utils/date';
import { drawBorder } from '@/utils';
import {
  STATUS_TAG_DEFS,
  getMainStatusIcons,
  questionMatchesTag,
  StatusTagKey,
} from '@/utils/questionStatus';
import {
  questionHasFeedAttention,
  resolveQuestionCardPress,
} from '@/utils/questionFeedAttention';
import { sortFeedByDefaultPriority } from '@/utils/questionFeedSort';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { KeyboardAvoidingView, KeyboardController } from 'react-native-keyboard-controller';
import Animated, { runOnJS, useAnimatedScrollHandler, useComposedEventHandler } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = () => {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const feedListRef = useRef<Animated.FlatList<TFeedQuestion>>(null);
  const searchInputRef = useRef<TextInput>(null);
  const searchRequestIdRef = useRef(0);
  const feedScrollOffsetRef = useRef(0);
  const shouldRestoreFeedScrollRef = useRef(false);
  const lastPressedQuestionIdRef = useRef<string | null>(null);
  const hasLoadedFeedRef = useRef(false);
  const { scrollHandler, headerShellStyle, headerChromeSlideStyle, logoSlideStyle, onHeaderLayout, resetChrome, expandedHeaderHeight } =
    useHomeScrollChrome();
  const { fabContainerStyle, fabTextStyle } = useHomeFloatingAskStyle(tabBarHeight);
  const setMenuCategories = useDrawerStore((state) => state.setMenuCategories);
  const toggleDrawer = useDrawerStore((state) => state.toggle);
  const selectedCategoryKey = useDrawerStore((state) => state.selectedCategoryKey);
  const isLoggedIn = useAuthStore(selectIsLoggedIn);
  const authUserId = useAuthStore((state) => state.user?.id);
  const [feedItems, setFeedItems] = useState<TFeedQuestion[]>([]);
  const [closedItems, setClosedItems] = useState<TFeedQuestion[]>([]);
  const [feedCounts, setFeedCounts] = useState<TFeedCounts>({ all: 0, incoming: 0, outgoing: 0, closed: 0 });
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [loading, setLoading] = useState(false);
  const [closedLoading, setClosedLoading] = useState(false);
  const coords = useLiveLocationStore((s) => s.coords);
  const ensureLiveCoords = useLiveLocationStore((s) => s.ensureCoords);
  const refreshCoords = useLiveLocationStore((s) => s.refreshCoords);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<TFeedQuestion[]>([]);
  const [searching, setSearching] = useState(false);
  // Active status-filter tags (multi-select). Toggling `near_me` requests the
  // viewer's location if it isn't already available, then filters server-side.
  const [activeTags, setActiveTags] = useState<Set<StatusTagKey>>(new Set());

  const isSearchActive = search.trim().length > 0;
  const isClosedCategory = selectedCategoryKey === CLOSED_QUESTIONS_CATEGORY_KEY;

  // True when the near-me filter is engaged. Derived from activeTags so the
  // existing `toggleNearMe` flow stays single-source.
  const nearMe = activeTags.has('near_me');

  const dismissSearchFocus = useCallback(() => {
    if (!isSearchActive || searching) return;
    searchInputRef.current?.blur();
    KeyboardController.dismiss();
  }, [isSearchActive, searching]);

  const searchDismissScrollHandler = useAnimatedScrollHandler({
    onBeginDrag: () => {
      runOnJS(dismissSearchFocus)();
    },
  });

  const persistFeedScrollOffset = useCallback((offset: number) => {
    feedScrollOffsetRef.current = offset;
  }, []);

  const trackFeedScrollOffsetHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      runOnJS(persistFeedScrollOffset)(event.contentOffset.y);
    },
  });

  const feedScrollHandler = useComposedEventHandler([
    scrollHandler,
    searchDismissScrollHandler,
    trackFeedScrollOffsetHandler,
  ]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const data = await getConversations();
      setUnreadChatCount(data.unreadTotal);
    } catch {
      setUnreadChatCount(0);
    }
  }, []);

  const loadFeed = useCallback(async (options?: { silent?: boolean; }) => {
    if (!isLoggedIn) return;

    const silent = options?.silent ?? false;
    if (!silent) {
      setLoading(true);
    }

    try {
      const feedParams: Parameters<typeof getQuestionFeed>[0] = {};
      if (coords) {
        feedParams.lat = coords.lat;
        feedParams.lng = coords.lng;
      }
      if (nearMe) {
        feedParams.nearMe = true;
      }
      const data = await getQuestionFeed(feedParams);
      setFeedItems(data.items);
      setFeedCounts(data.counts);
      hasLoadedFeedRef.current = true;
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [coords, isLoggedIn, nearMe]);

  const loadClosedQuestions = useCallback(async () => {
    if (!isLoggedIn) return;

    setClosedLoading(true);
    try {
      const data = await getMyClosedQuestions();
      setClosedItems(data.items);
    } catch (error) {
      console.error('Failed to load closed questions:', error);
      setClosedItems([]);
    } finally {
      setClosedLoading(false);
    }
  }, [isLoggedIn]);

  const refreshAll = useCallback(async () => {
    if (!isLoggedIn) return;
    void loadUnreadCount();
    await Promise.all([
      loadFeed({ silent: hasLoadedFeedRef.current }),
      loadClosedQuestions(),
    ]);
  }, [isLoggedIn, loadClosedQuestions, loadFeed, loadUnreadCount]);

  useEffect(() => {
    if (!isLoggedIn) return;
    // Pre-warm live GPS so the feed can show distances without waiting for
    // the user to toggle Near me. Does NOT prompt — only reads if permission
    // was already granted.
    void refreshCoords();
  }, [isLoggedIn, refreshCoords]);

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
    socket.on('question:closed', refreshAll);
    return () => {
      socket.off('message:new', refreshAll);
      socket.off('request:new', refreshAll);
      socket.off('request:accepted', refreshAll);
      socket.off('request:rejected', refreshAll);
      socket.off('question:closed', refreshAll);
    };
  }, [isLoggedIn, refreshAll]);

  const toggleNearMe = async () => {
    if (!activeTags.has('near_me')) {
      const next = await ensureLiveCoords();
      if (!next) return; // permission denied — don't activate the tag
      setActiveTags((prev) => new Set(prev).add('near_me'));
    } else {
      setActiveTags((prev) => {
        const next = new Set(prev);
        next.delete('near_me');
        return next;
      });
    }
  };

  const toggleTag = useCallback(
    async (key: StatusTagKey) => {
      if (key === 'near_me') {
        toggleNearMe();
        return;
      }
      setActiveTags((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    [activeTags],
  );

  const handleQuestionPress = (item: TFeedQuestion) => {
    shouldRestoreFeedScrollRef.current = true;
    lastPressedQuestionIdRef.current = item.id;
    const route = resolveQuestionCardPress(item, authUserId);
    router.push(route);
  };

  const displayedItems = useMemo(() => {
    if (isClosedCategory) {
      return closedItems;
    }

    let items = feedItems;

    // Direction filter from the side drawer (All / Incoming / Outgoing).
    if (selectedCategoryKey === INCOMING_CATEGORY_KEY) {
      items = items.filter((item) => item.userId !== authUserId);
    } else if (selectedCategoryKey === OUTGOING_CATEGORY_KEY) {
      items = items.filter((item) => item.userId === authUserId);
    }

    // Status-tag filters from the chip bar (AND-combined across active tags).
    // Each tag uses the same predicate that decides whether the matching icon
    // renders, so the filtered list always agrees with what's on the cards.
    if (activeTags.size > 0) {
      items = items.filter((item) => {
        for (const tag of activeTags) {
          if (!questionMatchesTag(item, authUserId, tag)) return false;
        }
        return true;
      });
    }

    const isDefaultFeedView =
      selectedCategoryKey === ALL_QUESTIONS_CATEGORY_KEY && activeTags.size === 0;
    if (isDefaultFeedView) {
      items = sortFeedByDefaultPriority(items, authUserId);
    }

    return items;
  }, [activeTags, authUserId, closedItems, feedItems, isClosedCategory, selectedCategoryKey]);

  const restoreFeedScrollPosition = useCallback(() => {
    const listRef = feedListRef.current;
    if (!listRef) return;

    const questionId = lastPressedQuestionIdRef.current;
    const data = isSearchActive ? searchResults : displayedItems;
    const index = questionId ? data.findIndex((item) => item.id === questionId) : -1;

    if (index >= 0) {
      listRef.scrollToIndex({ index, animated: false, viewPosition: 0.25 });
      return;
    }

    if (feedScrollOffsetRef.current > 0) {
      listRef.scrollToOffset({ offset: feedScrollOffsetRef.current, animated: false });
    }
  }, [displayedItems, isSearchActive, searchResults]);

  const restoreFeedScrollPositionRef = useRef(restoreFeedScrollPosition);
  restoreFeedScrollPositionRef.current = restoreFeedScrollPosition;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const run = async () => {
        const shouldRestore = shouldRestoreFeedScrollRef.current;
        await refreshAll();
        if (cancelled || !shouldRestore) return;

        shouldRestoreFeedScrollRef.current = false;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!cancelled) {
              restoreFeedScrollPositionRef.current();
            }
          });
        });
      };

      void run();

      return () => {
        cancelled = true;
      };
    }, [refreshAll]),
  );

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
    resetChrome();
    shouldRestoreFeedScrollRef.current = false;
    feedListRef.current?.scrollToOffset({ offset: 0, animated: false });
    if (selectedCategoryKey === CLOSED_QUESTIONS_CATEGORY_KEY) {
      setSearch('');
      setSearchResults([]);
      setActiveTags(new Set());
      searchInputRef.current?.blur();
    }
  }, [resetChrome, selectedCategoryKey]);

  const activeCategory = useMemo(
    () => FEED_CATEGORY_DEFS.find((def) => def.key === selectedCategoryKey) ?? FEED_CATEGORY_DEFS[0],
    [selectedCategoryKey],
  );

  const categorySubtitle =
    selectedCategoryKey === INCOMING_CATEGORY_KEY
      ? 'From other people'
      : selectedCategoryKey === OUTGOING_CATEGORY_KEY
        ? 'Asked by you'
        : selectedCategoryKey === CLOSED_QUESTIONS_CATEGORY_KEY
          ? 'Only you can view these'
          : null;

  const renderQuestion = ({ item }: { item: TFeedQuestion; }) => {
    const showAttentionDot = questionHasFeedAttention(item);
    const postedAt =
      item.status === QuestionStatus.Closed && item.closedAt
        ? `Closed ${formatRelativeTime(item.closedAt)}`
        : formatRelativeTime(item.createdAt);
    const authorLabel = item.questioner
      ? item.questioner.id === authUserId
        ? 'You'
        : `${item.questioner.name}`
      : null;
    const mainIcons = getMainStatusIcons(item, authUserId);
    // Distance label only when the questioner limited answers to nearby users.
    const isOutgoing = item.userId === authUserId;
    const showDistance =
      !isOutgoing &&
      item.restrictToNearby === true &&
      item.latitude != null &&
      item.longitude != null &&
      item.distanceKm != null;

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
            {showAttentionDot && <View style={styles.unreadDot} />}
            <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          </View>
        </View>
        <Text style={styles.cardDetail} numberOfLines={viewMode === 'card' ? 3 : 2}>
          {item.detail}
        </Text>
        {(mainIcons.length > 0 || showDistance) && (
          <View style={styles.cardFooter}>
            {mainIcons.length > 0 && (
              <QuestionStatusIcons icons={mainIcons} size={STATUS_ICON_QUESTION_ITEM_SIZE} />
            )}
            {showDistance && (
              <Text style={styles.distance}>{item.distanceKm!.toFixed(1)} km away</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const listData = isClosedCategory ? closedItems : isSearchActive ? searchResults : displayedItems;
  const showFeedLoading = isClosedCategory
    ? closedLoading && closedItems.length === 0
    : !isSearchActive && loading && feedItems.length === 0;
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

    if (isClosedCategory) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>You have no closed questions yet.</Text>
          <Text style={styles.emptyHelper}>
            When you close a question, it moves here and is hidden from responders.
          </Text>
        </View>
      );
    }

    if (nearMe && !coords) {
      // The backend already returns an empty list in this case, but the
      // message is what actually helps the user understand why.
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Enable your location to see questions close to you.
          </Text>
        </View>
      );
    }

    if (nearMe) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No open questions close to you right now. Try turning off the Near me filter to see more.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No open questions yet.</Text>
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
          {/*
            List is absolutely positioned and sits underneath the header so that
            as the header collapses, cards scroll up and visibly pass under the
            remaining (translucent) logo strip. paddingTop is the static expanded
            header height — constant during collapse to avoid a contentSize
            feedback loop (animating it would shrink maxY and re-trigger the
            chrome's short-list guard).
          */}
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
                { paddingTop: expandedHeaderHeight },
              ]}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={renderListEmpty}
              ListFooterComponent={HomeListBottomSpacer}
              onScroll={feedScrollHandler}
              scrollEventThrottle={16}
              onScrollToIndexFailed={(info) => {
                feedListRef.current?.scrollToOffset({
                  offset: Math.max(0, info.averageItemLength * info.index),
                  animated: false,
                });
              }}
            />
          </KeyboardAvoidingView>

          <Animated.View style={[styles.headerShell, headerShellStyle]}>
            <View
              style={styles.headerMeasureWrap}
              onLayout={(event) => onHeaderLayout(event.nativeEvent.layout.height)}
            >
              <Animated.View style={headerChromeSlideStyle}>
                <View style={styles.header}>
                  <View style={styles.headerSide}>
                    <Pressable onPress={toggleDrawer} style={styles.menuBtn} accessibilityLabel="Open menu">
                      <Ionicons name="menu" size={30} color={colors.PRIMARY} />
                    </Pressable>
                  </View>
                  <View style={styles.headerCenter} />
                  <View style={[styles.headerSide, styles.headerSideRight]}>
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
                  <Text style={styles.pageTitle}>{activeCategory.title}</Text>
                  {categorySubtitle ? (
                    <Text style={styles.categorySubtitle}>{categorySubtitle}</Text>
                  ) : null}
                </View>

                {!isClosedCategory ? (
                  <Searchbar
                    ref={searchInputRef}
                    placeholder="Search questions"
                    inputValue={search}
                    setValue={setSearch}
                    style={styles.searchBarPlacement}
                  />
                ) : null}

                {!isClosedCategory ? (
                  <View style={styles.tagsWrap}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.tagsContent}
                    >
                      {STATUS_TAG_DEFS.map((def) => {
                        const active = activeTags.has(def.key);
                        const visual = STATUS_ICON_VISUALS[def.key];
                        return (
                          <Pressable
                            key={def.key}
                            onPress={() => toggleTag(def.key)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            style={[
                              filterTabletStyles.container,
                              active && filterTabletStyles.containerActive,
                            ]}
                          >
                            <StatusIconGlyph
                              visual={visual}
                              size={FILTER_TABLET_ICON_SIZE}
                              color={
                                visual.color !== STATUS_ICON_NEUTRAL_COLOR
                                  ? visual.color
                                  : active
                                    ? filterTabletColors.iconActive
                                    : filterTabletColors.icon
                              }
                            />
                            <Text style={[filterTabletStyles.text, active && filterTabletStyles.textActive]}>
                              {def.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : null}

                {!isClosedCategory ? (
                  <>
                    {isSearchActive && searching ? (
                      <View style={styles.searchLoadingRow}>
                        <ActivityIndicator size="small" color={colors.PRIMARY} />
                        <Text style={styles.searchLoadingText}>Searching…</Text>
                      </View>
                    ) : null}

                    <View style={styles.filterWrap}>
                      {isSearchActive && !searching && searchResults.length > 0 ? (
                        <Text style={styles.resultCountText}>
                          {searchResults.length} result{searchResults.length === 1 ? '' : 's'}
                        </Text>
                      ) : null}
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
                  </>
                ) : (
                  <View style={styles.filterWrap}>
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
                )}
              </Animated.View>
            </View>

            <Animated.View style={[styles.logoPinned, logoSlideStyle]} pointerEvents="none">
              <Image source={images.logo} style={styles.logo} resizeMode="contain" accessibilityLabel="QuickPeek" />
            </Animated.View>
          </Animated.View>
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
    zIndex: 2,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerMeasureWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  logoPinned: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    // ...drawBorder('red', true),
    marginBottom: 12,
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
    paddingVertical: 8,
    // ...drawBorder('red', true),
    marginBottom: 12,
  },
  searchBarPlacement: {
    marginHorizontal: 16,
    marginBottom: 12,
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
    flex: 1,
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
  },
  menuBtn: { paddingTop: 4, paddingBottom: 4, paddingRight: 4 },
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
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tagsWrap: {
    marginBottom: 10,
  },
  tagsContent: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  listAvoider: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
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
  emptyText: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY, textAlign: 'center' },
  emptyHelper: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
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
  },
  floatingAskBtnText: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.BG_WHITE,
    overflow: 'hidden',
  },
});
