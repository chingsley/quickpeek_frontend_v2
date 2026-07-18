import ResponseWindowPicker from '@/components/ResponseWindowPicker';
import ReviewModal from '@/components/ReviewModal';
import UserAvatar from '@/components/UserAvatar';
import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import { RESPONSE_WINDOW_VARIANT } from '@/constants/responseWindow';
import { fonts } from '@/constants/fonts';
import {
  getMessages,
  getQuestionThread,
  markMessagesRead,
  sendMessage,
  setResponseWindow,
} from '@/services/messages.services';
import { assignQuestion, postQuestion } from '@/services/questions.services';
import {
  getReviewEligibility,
  markQuestionAnswered,
} from '@/services/reviews.services';
import SocketService from '@/services/socket.services';
import { useAuthStore } from '@/store/auth.store';
import { TMessage, TQuestionThread } from '@/types/message.types';
import { TReviewEligibility } from '@/types/review.types';
import { QuestionStatus } from '@/types/question.types';
import {
  formatDaySeparator,
  formatMessageTime,
  getDayKey,
} from '@/utils/date';
import { getRemainingTtrMs } from '@/utils/questions';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ChatListItem =
  | { kind: 'day'; id: string; label: string }
  | { kind: 'message'; message: TMessage };

const formatCountdown = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const ChatScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const initialQuestionId = (params.questionId as string) || '';
  const isDraftParam = params.draft === 'true';
  const fromSelection = (params.fromSelection as string) || '';
  const responderId = (params.responderId as string) || '';
  const responderName = (params.responderName as string) || '';
  const responderProfileImageUrl = (params.responderProfileImageUrl as string) || '';
  const draftLatitude = parseFloat(params.latitude as string);
  const draftLongitude = parseFloat(params.longitude as string);
  const draftAddress = (params.address as string) || '';
  const authUserId = useAuthStore((state) => state.user?.id);

  const [activeQuestionId, setActiveQuestionId] = useState(initialQuestionId || undefined);
  const [committed, setCommitted] = useState(Boolean(initialQuestionId));
  const [thread, setThread] = useState<TQuestionThread | null>(null);
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(Boolean(initialQuestionId));
  const [sending, setSending] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [windowPickerVisible, setWindowPickerVisible] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [eligibility, setEligibility] = useState<TReviewEligibility | null>(null);
  const [countdownMs, setCountdownMs] = useState(0);
  const [now, setNow] = useState(Date.now());

  const listRef = useRef<FlatList>(null);
  const committedRef = useRef(committed);
  const fromSelectionRef = useRef(fromSelection);
  const skipBeforeRemoveRef = useRef(false);

  const isDraft = isDraftParam && !activeQuestionId;

  useEffect(() => {
    committedRef.current = committed;
  }, [committed]);

  useEffect(() => {
    fromSelectionRef.current = fromSelection;
  }, [fromSelection]);

  const loadThread = useCallback(async () => {
    if (!activeQuestionId) return;

    const [threadData, messageData, eligibilityData] = await Promise.all([
      getQuestionThread(activeQuestionId),
      getMessages(activeQuestionId),
      getReviewEligibility(activeQuestionId).catch(() => null),
    ]);
    setThread(threadData);
    setMessages(messageData);
    setEligibility(eligibilityData);
    await markMessagesRead(activeQuestionId).catch(() => undefined);
  }, [activeQuestionId]);

  useEffect(() => {
    if (!activeQuestionId) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        await loadThread();
      } catch (err: any) {
        Alert.alert('Error', err?.response?.data?.error || 'Failed to load chat.');
      } finally {
        setLoading(false);
      }
    })();
  }, [activeQuestionId, loadThread]);

  useEffect(() => {
    if (!activeQuestionId) return;

    const socket = SocketService.getSocket();
    if (!socket) return;

    const handleNewMessage = (message: TMessage) => {
      if (message.questionId !== activeQuestionId) return;
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });
      if (message.senderId !== authUserId) {
        markMessagesRead(activeQuestionId).catch(() => undefined);
      }
      getReviewEligibility(activeQuestionId).then(setEligibility).catch(() => undefined);
    };

    const handleWindowSet = (payload: {
      questionId: string;
      respondByAt: string;
      timeToRespondMs: number;
    }) => {
      if (payload.questionId !== activeQuestionId) return;
      setThread((prev) =>
        prev
          ? {
              ...prev,
              respondByAt: payload.respondByAt,
              timeToRespondMs: payload.timeToRespondMs,
            }
          : prev,
      );
      setWindowPickerVisible(false);
    };

    const handleExpired = (payload: { questionId: string }) => {
      if (payload.questionId !== activeQuestionId) return;
      setThread((prev) => (prev ? { ...prev, status: QuestionStatus.Expired } : prev));
      loadThread().catch(() => undefined);
    };

    socket.on('message:new', handleNewMessage);
    socket.on('question:window-set', handleWindowSet);
    socket.on('question:expired', handleExpired);
    socket.on('question:assignment-expired', handleExpired);
    socket.on('question:update', handleExpired);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('question:window-set', handleWindowSet);
      socket.off('question:expired', handleExpired);
      socket.off('question:assignment-expired', handleExpired);
      socket.off('question:update', handleExpired);
    };
  }, [activeQuestionId, authUserId, loadThread]);

  const goToOutbox = useCallback(() => {
    skipBeforeRemoveRef.current = true;
    router.replace({
      pathname: '/(tabs)/Questions',
      params: { tab: 'outbox' },
    });
  }, [router]);

  const goBack = useCallback(() => {
    if (fromSelection === 'true' && committed) {
      goToOutbox();
      return;
    }

    router.back();
  }, [committed, fromSelection, goToOutbox, router]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (skipBeforeRemoveRef.current) {
        return;
      }

      if (fromSelectionRef.current !== 'true' || !committedRef.current) {
        return;
      }

      event.preventDefault();
      goToOutbox();
    });

    return unsubscribe;
  }, [goToOutbox, navigation]);

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const isQuestioner = thread?.userId === authUserId;
  const isExpired = thread?.status === QuestionStatus.Expired;
  const responderHasReplied = useMemo(
    () =>
      Boolean(
        thread?.assignedResponderId &&
          messages.some(
            (message) =>
              message.type === 'USER' && message.senderId === thread.assignedResponderId,
          ),
      ),
    [messages, thread?.assignedResponderId],
  );
  const canSetWindow =
    Boolean(activeQuestionId) &&
    isQuestioner &&
    thread?.status === QuestionStatus.Assigned &&
    !thread.respondByAt &&
    !responderHasReplied;
  const showCountdown =
    thread?.status === QuestionStatus.Assigned &&
    Boolean(thread.respondByAt) &&
    !responderHasReplied &&
    !isExpired;

  useEffect(() => {
    if (!showCountdown || !thread?.respondByAt) {
      setCountdownMs(0);
      return;
    }

    setCountdownMs(getRemainingTtrMs({ respondByAt: thread.respondByAt } as any, now));
  }, [now, showCountdown, thread?.respondByAt]);

  const draftAddressMessage = useMemo((): TMessage | null => {
    if (!isDraft || !draftAddress || !authUserId) {
      return null;
    }

    return {
      id: 'draft-address',
      questionId: '',
      senderId: authUserId,
      text: draftAddress,
      type: 'USER',
      createdAt: new Date().toISOString(),
      readAt: null,
    };
  }, [authUserId, draftAddress, isDraft]);

  const chatItems = useMemo(() => {
    const items: ChatListItem[] = [];
    let lastDayKey = '';
    const displayMessages = draftAddressMessage ? [draftAddressMessage, ...messages] : messages;

    for (const message of displayMessages) {
      const dayKey = getDayKey(message.createdAt);
      if (dayKey !== lastDayKey) {
        items.push({
          kind: 'day',
          id: `day-${dayKey}`,
          label: formatDaySeparator(message.createdAt),
        });
        lastDayKey = dayKey;
      }
      items.push({ kind: 'message', message });
    }

    return items;
  }, [draftAddressMessage, messages]);

  const handleSetWindow = async (timeToRespondMs: number) => {
    if (!activeQuestionId) return;

    try {
      const result = await setResponseWindow(activeQuestionId, timeToRespondMs);
      setThread((prev) =>
        prev
          ? {
              ...prev,
              respondByAt: result.respondByAt,
              timeToRespondMs,
            }
          : prev,
      );
      setMessages((prev) => {
        if (prev.some((item) => item.id === result.systemMessage.id)) return prev;
        return [...prev, result.systemMessage];
      });
      setWindowPickerVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not set response window.');
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending || isExpired) return;

    setSending(true);
    setInputText('');

    try {
      if (isDraft) {
        if (!responderId || !draftAddress) {
          throw new Error('Missing responder or location details.');
        }

        // Follow-up message commits the question; assign seeds address + question text on the backend.
        const createResponse = await postQuestion({
          text,
          longitude: draftLongitude,
          latitude: draftLatitude,
          address: draftAddress,
        });
        const created = createResponse?.data;
        if (!created?.id) {
          throw new Error('Could not create question.');
        }

        await assignQuestion(created.id, responderId);
        setActiveQuestionId(created.id);
        setCommitted(true);
        return;
      }

      if (!activeQuestionId) return;

      const message = await sendMessage(activeQuestionId, text);
      setMessages((prev) => [...prev, message]);
      await getReviewEligibility(activeQuestionId).then(setEligibility).catch(() => undefined);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || err?.message || 'Failed to send message.');
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const handleMarkAnswered = async () => {
    if (!activeQuestionId) return;

    setMenuVisible(false);
    try {
      await markQuestionAnswered(activeQuestionId);
      await loadThread();
      Alert.alert('Marked as answered', 'You can now rate each other when ready.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not mark as answered.');
    }
  };

  const handleChooseAnotherResponder = () => {
    if (!thread) return;
    router.push({
      pathname: '/responders',
      params: {
        latitude: String(thread.latitude),
        longitude: String(thread.longitude),
        address: thread.address,
        reassignQuestionId: thread.id,
      },
    });
  };

  const openCounterpartyProfile = () => {
    const profileUserId = thread?.counterparty?.id || responderId;
    if (!profileUserId) return;

    router.push({
      pathname: '/responder-profile',
      params: {
        userId: profileUserId,
        distance: '0',
        latitude: String(thread?.latitude ?? draftLatitude),
        longitude: String(thread?.longitude ?? draftLongitude),
        address: thread?.address ?? draftAddress,
      },
    });
  };

  const headerName =
    thread?.counterparty?.name || thread?.counterparty?.username || responderName || 'Responder';
  const headerImageUrl = thread?.counterparty?.profileImageUrl || responderProfileImageUrl || null;
  const headerAddress = thread?.address || draftAddress;

  const composerDisabled = isExpired;

  if (loading && !isDraft) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isDraft && !thread) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.header}>
          <Pressable onPress={goBack} style={styles.backBtn}>
            <FontAwesome6 name="arrow-left-long" size={28} color={colors.PRIMARY} />
          </Pressable>
          <Pressable style={styles.headerCenter} onPress={openCounterpartyProfile}>
            <UserAvatar imageUrl={headerImageUrl} size={40} />
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerName} numberOfLines={1}>
                {headerName}
              </Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                {headerAddress}
              </Text>
            </View>
          </Pressable>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuBtn}>
            <Ionicons name="ellipsis-vertical" size={22} color={colors.DARK_GRAY} />
          </TouchableOpacity>
        </View>

        {showCountdown && (
          <View style={styles.countdownBanner}>
            <Ionicons name="timer-outline" size={16} color={colors.PRIMARY} />
            <Text style={styles.countdownText}>
              Response window: {formatCountdown(countdownMs)} remaining
            </Text>
          </View>
        )}

        {isExpired && (
          <View style={styles.expiredBanner}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.ACTIVE} />
            <Text style={styles.expiredBannerText}>
              {isQuestioner
                ? 'The response window has expired. Choose another responder to try again.'
                : 'The time to respond has expired.'}
            </Text>
          </View>
        )}

        <FlatList
          ref={listRef}
          data={chatItems}
          keyExtractor={(item) => (item.kind === 'day' ? item.id : item.message.id)}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            RESPONSE_WINDOW_VARIANT === 'inline' && canSetWindow ? (
              <ResponseWindowPicker onSelect={handleSetWindow} />
            ) : null
          }
          renderItem={({ item }) => {
            if (item.kind === 'day') {
              return (
                <View style={styles.daySeparatorWrap}>
                  <Text style={styles.daySeparator}>{item.label}</Text>
                </View>
              );
            }

            const message = item.message;
            if (message.type === 'SYSTEM') {
              return (
                <View style={styles.systemPillWrap}>
                  <Text style={styles.systemPill}>{message.text}</Text>
                </View>
              );
            }

            const isMine = message.senderId === authUserId;
            return (
              <View
                style={[
                  styles.messageRow,
                  isMine ? styles.messageRowMine : styles.messageRowTheirs,
                ]}
              >
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.messageText, isMine && styles.messageTextMine]}>
                    {message.text}
                  </Text>
                  <Text style={[styles.messageTime, isMine && styles.messageTimeMine]}>
                    {formatMessageTime(message.createdAt)}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {isExpired && isQuestioner && (
          <View style={styles.expiredAction}>
            <CustomButton
              text="Choose another responder"
              onPress={handleChooseAnotherResponder}
            />
          </View>
        )}

        {RESPONSE_WINDOW_VARIANT === 'composer' && canSetWindow && (
          <ResponseWindowPicker onSelect={handleSetWindow} compact />
        )}

        {!composerDisabled && (
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              placeholder={isDraft ? 'Ask your question' : 'Type a message'}
              placeholderTextColor={colors.MEDIUM_GRAY}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              <Ionicons name="send" size={18} color={colors.BG_WHITE} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      <Modal visible={menuVisible} transparent animationType="fade">
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuCard}>
            {RESPONSE_WINDOW_VARIANT === 'menu' && canSetWindow && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  setWindowPickerVisible(true);
                }}
              >
                <Text style={styles.menuItemText}>Set response time</Text>
              </TouchableOpacity>
            )}
            {isQuestioner && thread && thread.status !== QuestionStatus.Answered && !isExpired && (
              <TouchableOpacity style={styles.menuItem} onPress={handleMarkAnswered}>
                <Text style={styles.menuItemText}>Mark as answered</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.menuItem}
              disabled={!eligibility?.canReview}
              onPress={() => {
                setMenuVisible(false);
                setReviewVisible(true);
              }}
            >
              <Text
                style={[
                  styles.menuItemText,
                  !eligibility?.canReview && styles.menuItemDisabled,
                ]}
              >
                Rate this user
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={windowPickerVisible} transparent animationType="fade">
        <Pressable style={styles.menuOverlay} onPress={() => setWindowPickerVisible(false)}>
          <Pressable style={styles.windowModalCard} onPress={(event) => event.stopPropagation()}>
            <ResponseWindowPicker onSelect={handleSetWindow} />
          </Pressable>
        </Pressable>
      </Modal>

      {activeQuestionId ? (
        <ReviewModal
          visible={reviewVisible}
          questionId={activeQuestionId}
          onClose={() => setReviewVisible(false)}
          onSubmitted={() => {
            setReviewVisible(false);
            getReviewEligibility(activeQuestionId).then(setEligibility).catch(() => undefined);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.BG_WHITE,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.CARD_BORDER,
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerName: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
  headerSub: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
  },
  menuBtn: {
    padding: 8,
  },
  countdownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.LIGHT_GREEN,
    borderBottomWidth: 1,
    borderBottomColor: colors.CARD_BORDER,
  },
  countdownText: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.PRIMARY,
  },
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF8F0',
    borderBottomWidth: 1,
    borderBottomColor: colors.CARD_BORDER,
  },
  expiredBannerText: {
    flex: 1,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.DARK_GRAY,
    lineHeight: 18,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  daySeparatorWrap: {
    alignItems: 'center',
    marginVertical: 8,
  },
  daySeparator: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    backgroundColor: colors.LIGHT_GRAY_THIN,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    overflow: 'hidden',
  },
  systemPillWrap: {
    alignItems: 'center',
    marginVertical: 4,
  },
  systemPill: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    backgroundColor: colors.LIGHT_GRAY_THIN,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    textAlign: 'center',
    maxWidth: '90%',
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  bubbleMine: {
    backgroundColor: colors.PRIMARY,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.LIGHT_GRAY_THIN,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTextMine: {
    color: colors.BG_WHITE,
  },
  messageTime: {
    fontFamily: 'roboto-light',
    fontSize: 10,
    color: colors.MEDIUM_GRAY,
    alignSelf: 'flex-end',
  },
  messageTimeMine: {
    color: 'rgba(255,255,255,0.75)',
  },
  expiredAction: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.CARD_BORDER,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.CARD_BORDER,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    backgroundColor: colors.BG_WHITE,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 16,
  },
  menuCard: {
    backgroundColor: colors.BG_WHITE,
    borderRadius: 12,
    minWidth: 200,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
  },
  windowModalCard: {
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    marginHorizontal: 24,
    backgroundColor: colors.BG_WHITE,
    borderRadius: 16,
    padding: 4,
    width: '88%',
    maxWidth: 420,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemText: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
  menuItemDisabled: {
    color: colors.MEDIUM_GRAY,
  },
});
