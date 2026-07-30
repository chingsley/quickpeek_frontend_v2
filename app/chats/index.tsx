import Searchbar from '@/components/Searchbar';
import BackButton from '@/components/shared/BackButton';
import OverflowMenuButton from '@/components/shared/OverflowMenuButton';
import { ScreenTitle } from '@/components/shared/ScreenTitle';
import ChatsListBottomSpacer from '@/components/ChatsListBottomSpacer';
import { FilterTabletGroup } from '@/components/FilterTablet';
import UserAvatar from '@/components/UserAvatar';
import { CHATS_CHROME_FADE_OUT_END, CHATS_COLLAPSED_HEADER_HEIGHT } from '@/constants/chatsChrome';
import { colors } from '@/constants/colors';
import {
  CHAT_FILTER_TABLET_ITEMS,
  ChatFilterKey,
  filterTabletBarStyles,
  SEARCH_FILTER_HEADER_GAP,
} from '@/constants/filterTablets';
import { fonts } from '@/constants/fonts';
import { images } from '@/constants/images';
import { screenChromeStyles } from '@/constants/screenChrome';
import { SCREEN_CHROME_ACTION_ROW_MARGIN_BOTTOM } from '@/constants/layout';
import { useChatsScrollChrome } from '@/hooks/useChatsScrollChrome';
import { getConversations } from '@/services/requests.services';
import SocketService from '@/services/socket.services';
import { chatsChromeProgress } from '@/store/chatsChrome.store';
import { AnswerRequestStatus, TConversation } from '@/types/answerRequest.types';
import { formatListTime } from '@/utils/date';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import Animated, { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const CHAT_LIST_AVATAR_SIZE = 48;
/** Shared horizontal inset for Chats header, search, and list rows. */
const CHATS_PAGE_GUTTER = 20;
/** Centered toolbar logo — height matches Home `logoStrip`; width preserves wordmark aspect. */
const LOGO_SIZE = 40;
const CHATS_TOOLBAR_LOGO_WIDTH = 184;

const previewText = (conv: TConversation): string => {
  if (conv.lastMessage?.text) {
    return conv.lastMessage.text;
  }
  if (conv.status === AnswerRequestStatus.Pending) {
    return conv.role === 'incoming'
      ? `${conv.counterparty.name} wants to answer your question`
      : 'Your request has been sent';
  }
  return 'No messages yet';
};

const matchesSearch = (item: TConversation, query: string): boolean => {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;

  const haystack = [
    item.counterparty.name,
    item.counterparty.username,
    item.question.title,
    item.lastMessage?.text ?? '',
    previewText(item),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(trimmed);
};

const matchesFilters = (item: TConversation, activeFilters: Set<ChatFilterKey>): boolean => {
  if (activeFilters.size === 0) return true;

  for (const key of activeFilters) {
    if (key === 'unread' && !item.hasUnread && item.unreadCount <= 0) return false;
    if (key === 'requests' && item.status !== AnswerRequestStatus.Pending) return false;
    if (key === 'approved' && item.status !== AnswerRequestStatus.Accepted) return false;
    if (key === 'declined' && item.status !== AnswerRequestStatus.Rejected) return false;
  }

  return true;
};

const ChatsScreen = () => {
  const router = useRouter();
  const listRef = useRef<Animated.FlatList<TConversation>>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<TConversation[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<ChatFilterKey>>(new Set());
  const {
    scrollHandler,
    headerShellStyle,
    headerChromeSlideStyle,
    toolbarChromeFadeStyle,
    toolbarStripStyle,
    onHeaderLayout,
    resetChrome,
  } = useChatsScrollChrome();

  // The toolbar row fades out with the chrome — once faded it must stop
  // receiving touches so the invisible back/menu buttons don't swallow taps
  // meant for the chat rows underneath.
  const [toolbarTouchEnabled, setToolbarTouchEnabled] = useState(true);
  useAnimatedReaction(
    () => chatsChromeProgress.value,
    (progress) => {
      runOnJS(setToolbarTouchEnabled)(progress < CHATS_CHROME_FADE_OUT_END + 0.15);
    },
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getConversations();
      setConversations(data.items);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useFocusEffect(
    useCallback(() => {
      const socket = SocketService.getSocket();
      if (!socket) return;
      const refresh = () => load();
      socket.on('message:new', refresh);
      socket.on('request:new', refresh);
      socket.on('request:accepted', refresh);
      socket.on('request:rejected', refresh);
      socket.on('question:closed', refresh);
      return () => {
        socket.off('message:new', refresh);
        socket.off('request:new', refresh);
        socket.off('request:accepted', refresh);
        socket.off('request:rejected', refresh);
        socket.off('question:closed', refresh);
      };
    }, [load]),
  );

  const toggleFilter = useCallback((key: ChatFilterKey) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleToolbarMenuPress = () => {
    console.log('menu item in progress');
  };

  useEffect(() => {
    resetChrome();
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [activeFilters, resetChrome]);

  const displayedConversations = useMemo(
    () =>
      conversations.filter(
        (item) => matchesSearch(item, search) && matchesFilters(item, activeFilters),
      ),
    [activeFilters, conversations, search],
  );

  const hasActiveQuery = search.trim().length > 0 || activeFilters.size > 0;

  const renderItem = ({ item }: { item: TConversation; }) => {
    const isBold = item.hasUnread;
    const titleStyle = isBold ? styles.titleBold : styles.titleNormal;
    const subtitleStyle = isBold ? styles.subtitleBold : styles.subtitleNormal;

    return (
      <Pressable
        style={styles.row}
        onPress={() => router.push({ pathname: '/chat', params: { requestId: item.requestId } })}
      >
        <UserAvatar imageUrl={item.counterparty.profileImageUrl} size={CHAT_LIST_AVATAR_SIZE} />
        <View style={styles.rowBody}>
          <View style={styles.content}>
            <Text style={[styles.title, titleStyle]} numberOfLines={1}>
              {item.counterparty.name}
            </Text>
            <Text style={[styles.questionTitle, subtitleStyle]} numberOfLines={1}>
              {item.question.title}
            </Text>
            <Text style={[styles.preview, subtitleStyle]} numberOfLines={1}>
              {previewText(item)}
            </Text>
          </View>
          <View style={styles.trailing}>
            <Text style={styles.time}>{formatListTime(item.sortAt)}</Text>
            {item.unreadCount > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      );
    }

    return (
      <View style={styles.centered}>
        <Ionicons name="chatbubbles-outline" size={48} color={colors.LIGHT_GRAY} />
        <Text style={styles.emptyText}>
          {hasActiveQuery ? 'No chats match your search or filters.' : 'No chats yet.'}
        </Text>
        <Text style={styles.emptyHint}>
          {hasActiveQuery
            ? 'Try a different search or clear the filters above.'
            : 'Request to answer a question or wait for incoming requests.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <TouchableWithoutFeedback accessible={false} onPress={() => KeyboardController.dismiss()}>
        <View style={styles.screenBody}>
          {/*
            Header shell is in normal flow ABOVE the list: as it collapses,
            the list viewport grows and the content slides up glued to the
            shell's bottom edge — no gap can open at any progress, and a
            release settle can complete in either direction from any scroll
            position. The footer spacer (ChatsListBottomSpacer) grows by the
            deficit between the header height and the list's scrollable
            distance, so the collapse works on short chat lists too without a
            flicker loop. The overlay strip keeps only the centered logo
            pinned; the back and menu buttons fade out with the chrome (and
            stop receiving touches once invisible).
          */}
          <Animated.View style={[styles.headerShell, headerShellStyle]}>
            <View
              style={styles.headerMeasureWrap}
              onLayout={(event) => onHeaderLayout(event.nativeEvent.layout.height)}
            >
              <Animated.View style={headerChromeSlideStyle}>
                <View style={screenChromeStyles.titleRow}>
                  <ScreenTitle title="Chats" />
                </View>

                <Searchbar
                  placeholder="Search chats"
                  inputValue={search}
                  setValue={setSearch}
                  style={styles.searchBarPlacement}
                />

                <FilterTabletGroup
                  items={CHAT_FILTER_TABLET_ITEMS}
                  activeKeys={activeFilters}
                  onToggle={toggleFilter}
                  barStyle={filterTabletBarStyles.chatsPlacement}
                />
              </Animated.View>
            </View>
          </Animated.View>

          <Animated.FlatList
            ref={listRef}
            style={styles.list}
            data={loading ? [] : displayedConversations}
            keyExtractor={(item) => item.requestId}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.listContent,
              (loading || displayedConversations.length === 0) && styles.listContentEmpty,
            ]}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={ChatsListBottomSpacer}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            onScroll={scrollHandler}
            scrollEventThrottle={16}
          />

          <Animated.View
            style={[styles.pinnedToolbar, toolbarStripStyle]}
            pointerEvents="box-none"
          >
            <View style={styles.logoOverlay} pointerEvents="none">
              <Image
                source={images.logo}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="QuickPeek"
              />
            </View>
            <Animated.View
              style={[screenChromeStyles.actionRowInset, styles.toolbarRow, toolbarChromeFadeStyle]}
              pointerEvents={toolbarTouchEnabled ? 'auto' : 'none'}
            >
              <View style={styles.toolbarSide}>
                <BackButton />
              </View>
              <View style={styles.toolbarCenter} />
              <View style={[styles.toolbarSide, styles.toolbarSideRight]}>
                <OverflowMenuButton onPress={handleToolbarMenuPress} />
              </View>
            </Animated.View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default ChatsScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.BG_WHITE },
  screenBody: { flex: 1 },
  headerShell: {
    overflow: 'hidden',
    backgroundColor: colors.BG_WHITE,
    zIndex: 2,
    position: 'relative',
  },
  headerMeasureWrap: {
    position: 'absolute',
    top: CHATS_COLLAPSED_HEADER_HEIGHT + SCREEN_CHROME_ACTION_ROW_MARGIN_BOTTOM,
    left: 0,
    right: 0,
  },
  pinnedToolbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CHATS_COLLAPSED_HEADER_HEIGHT,
    zIndex: 3,
    justifyContent: 'center',
  },
  logoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  toolbarSide: {
    width: 72,
    zIndex: 1,
  },
  toolbarSideRight: {
    alignItems: 'flex-end',
  },
  toolbarCenter: {
    flex: 1,
  },
  logo: {
    height: LOGO_SIZE,
    width: CHATS_TOOLBAR_LOGO_WIDTH,
  },
  searchBarPlacement: {
    marginHorizontal: CHATS_PAGE_GUTTER,
    marginBottom: SEARCH_FILTER_HEADER_GAP,
  },
  list: { flex: 1 },
  listContent: { paddingBottom: 24 },
  listContentEmpty: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: CHATS_PAGE_GUTTER,
    paddingRight: CHATS_PAGE_GUTTER,
    paddingTop: 10,
    gap: 12,
  },
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
    minHeight: CHAT_LIST_AVATAR_SIZE,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.CARD_BORDER,
  },
  content: {
    flex: 1,
    minWidth: 0,
    height: CHAT_LIST_AVATAR_SIZE,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: fonts.FONT_SIZE_SMALL,
    lineHeight: 17,
  },
  titleBold: { fontFamily: 'roboto-bold' },
  titleNormal: { fontFamily: 'roboto' },
  questionTitle: {
    fontSize: fonts.FONT_SIZE_XS,
    lineHeight: 15,
    color: colors.DARK_GRAY,
  },
  subtitleBold: { fontFamily: 'roboto-medium' },
  subtitleNormal: { fontFamily: 'roboto' },
  preview: {
    fontSize: fonts.FONT_SIZE_XS,
    lineHeight: 15,
    color: colors.MEDIUM_GRAY,
  },
  trailing: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHAT_LIST_AVATAR_SIZE,
    gap: 8,
    minWidth: 40,
  },
  time: { fontFamily: 'roboto', fontSize: 11, color: colors.PRIMARY },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: colors.RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: { color: colors.BG_WHITE, fontSize: 10, fontWeight: 'bold' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.DARK_GRAY,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyHint: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
