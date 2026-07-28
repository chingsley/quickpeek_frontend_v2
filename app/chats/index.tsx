import BackButton from '@/components/shared/BackButton';
import UserAvatar from '@/components/UserAvatar';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { getConversations } from '@/services/requests.services';
import SocketService from '@/services/socket.services';
import { AnswerRequestStatus, TConversation } from '@/types/answerRequest.types';
import { formatListTime } from '@/utils/date';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CHAT_LIST_AVATAR_SIZE = 48;

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

const ChatsScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<TConversation[]>([]);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.pageTitle}>Chats</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.requestId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.LIGHT_GRAY} />
              <Text style={styles.emptyText}>No chats yet.</Text>
              <Text style={styles.emptyHint}>
                Request to answer a question or wait for incoming requests.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default ChatsScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.BG_WHITE },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerSpacer: { width: 40 },
  pageTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
  },
  listContent: { paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 20,
    paddingRight: 20,
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
    color: colors.PRIMARY,
  },
  titleBold: { fontFamily: 'roboto-bold' },
  titleNormal: { fontFamily: 'roboto' },
  questionTitle: {
    fontSize: fonts.FONT_SIZE_XS,
    lineHeight: 15,
    color: colors.DARK_GRAY,
  },
  subtitleBold: { fontFamily: 'roboto-medium' },
  subtitleNormal: { fontFamily: 'roboto-light' },
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
  time: { fontFamily: 'roboto-light', fontSize: 11, color: colors.MEDIUM_GRAY },
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyText: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.DARK_GRAY,
    marginTop: 12,
  },
  emptyHint: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
