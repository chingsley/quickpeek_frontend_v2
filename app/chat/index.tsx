import ReviewModal from '@/components/ReviewModal';
import UserAvatar from '@/components/UserAvatar';
import UserProfileModal from '@/components/UserProfileModal';
import CustomButton from '@/components/shared/CustomButton';
import BottomSheet from '@/components/shared/BottomSheet';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import {
  getMessages,
  getRequestThread,
  markMessagesRead,
  sendMessage,
} from '@/services/messages.services';
import {
  acceptRequest,
  getIncomingRequests,
  getRejectionReasons,
  rejectRequest,
} from '@/services/requests.services';
import { getReviewEligibility } from '@/services/reviews.services';
import SocketService from '@/services/socket.services';
import { useAuthStore } from '@/store/auth.store';
import { AnswerRequestStatus } from '@/types/answerRequest.types';
import { TMessage, TRequestThread } from '@/types/message.types';
import { TReviewEligibility } from '@/types/review.types';
import { formatDaySeparator, formatMessageTime, getDayKey } from '@/utils/date';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ChatListItem =
  | { kind: 'day'; id: string; label: string; }
  | { kind: 'message'; message: TMessage; };

const ChatScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ requestId: string; }>();
  const requestId = params.requestId as string;
  const authUserId = useAuthStore((state) => state.user?.id);

  const [thread, setThread] = useState<TRequestThread | null>(null);
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [eligibility, setEligibility] = useState<TReviewEligibility | null>(null);
  const [profileVisible, setProfileVisible] = useState(false);
  const [profileOpenKey, setProfileOpenKey] = useState(0);
  const [accepting, setAccepting] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [presetReasons, setPresetReasons] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const listRef = useRef<FlatList>(null);
  const openRejectAfterProfileCloseRef = useRef(false);

  const loadThread = useCallback(async () => {
    if (!requestId) return;
    const [threadData, messageData, eligibilityData] = await Promise.all([
      getRequestThread(requestId),
      getMessages(requestId),
      getReviewEligibility(requestId).catch(() => null),
    ]);
    setThread(threadData);
    setMessages(messageData);
    setEligibility(eligibilityData);
    await markMessagesRead(requestId).catch(() => undefined);
  }, [requestId]);

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        await loadThread();
      } catch (err: any) {
        Alert.alert('Error', err?.response?.data?.error || 'Failed to load chat.');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [loadThread, requestId, router]);

  useEffect(() => {
    if (!requestId) return;
    const socket = SocketService.getSocket();
    if (!socket) return;

    const handleNewMessage = (message: TMessage) => {
      if (message.answerRequestId !== requestId) return;
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });
      if (message.senderId !== authUserId) {
        markMessagesRead(requestId).catch(() => undefined);
      }
      getReviewEligibility(requestId).then(setEligibility).catch(() => undefined);
    };

    socket.on('message:new', handleNewMessage);
    socket.on('request:accepted', loadThread);
    socket.on('request:rejected', loadThread);
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('request:accepted', loadThread);
      socket.off('request:rejected', loadThread);
    };
  }, [authUserId, loadThread, requestId]);

  useEffect(() => {
    if (!rejectModalVisible) return;
    getRejectionReasons()
      .then(setPresetReasons)
      .catch(() => setPresetReasons([]));
  }, [rejectModalVisible]);

  const canType = thread?.canType ?? false;
  const isClosed =
    thread?.status === AnswerRequestStatus.ClosedAnswered ||
    thread?.status === AnswerRequestStatus.Rejected;
  const isPending = thread?.status === AnswerRequestStatus.Pending;
  const isQuestioner = thread?.questionerId === authUserId;

  const chatItems = useMemo(() => {
    const items: ChatListItem[] = [];
    let lastDayKey = '';
    for (const message of messages) {
      const dayKey = getDayKey(message.createdAt);
      if (dayKey !== lastDayKey) {
        items.push({ kind: 'day', id: `day-${dayKey}`, label: formatDaySeparator(message.createdAt) });
        lastDayKey = dayKey;
      }
      items.push({ kind: 'message', message });
    }
    return items;
  }, [messages]);

  const openRejectModal = () => {
    setRejectionReason('');
    setSelectedPreset(null);
    setRejectModalVisible(true);
  };

  const handleAccept = async () => {
    if (!thread || accepting) return;

    const proceed = async () => {
      setAccepting(true);
      try {
        await acceptRequest(requestId);
        setProfileVisible(false);
        await loadThread();
      } catch (err: any) {
        Alert.alert('Error', err?.response?.data?.error || 'Could not accept request.');
      } finally {
        setAccepting(false);
      }
    };

    try {
      const incoming = await getIncomingRequests({
        questionId: thread.question.id,
        status: AnswerRequestStatus.Accepted,
      });
      const alreadyAccepted = incoming.items.length;

      if (alreadyAccepted > 0) {
        Alert.alert(
          'Multiple responders',
          `You have already accepted ${alreadyAccepted} responder${alreadyAccepted === 1 ? '' : 's'}. ` +
          'Each accepted responder whose answer meets your acceptance criteria will need to be paid. ' +
          'Continue accepting this request?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Accept', onPress: proceed },
          ],
        );
      } else {
        await proceed();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not accept request.');
    }
  };

  const handleReject = async () => {
    const reason = (selectedPreset || rejectionReason).trim();
    if (!reason || rejecting) return;

    setRejecting(true);
    try {
      await rejectRequest(requestId, reason);
      setRejectModalVisible(false);
      setProfileVisible(false);
      await loadThread();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not reject request.');
    } finally {
      setRejecting(false);
    }
  };

  const openProfileModal = useCallback(() => {
    setProfileOpenKey((key) => key + 1);
    setProfileVisible(true);
  }, []);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending || !canType) return;
    setSending(true);
    setInputText('');
    try {
      const message = await sendMessage(requestId, text);
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not send message.');
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = (message: TMessage) => {
    const isSystem = message.type === 'SYSTEM';
    const isMine = message.senderId === authUserId;

    if (isSystem) {
      // Make the "View profile" call to action in the questioner's first system message clickable.
      const isPendingQuestionerPrompt =
        isPending &&
        isQuestioner &&
        thread?.counterparty &&
        message.text.includes('View their profile');

      return (
        <View style={styles.systemBubble}>
          <Text style={styles.systemText}>{message.text}</Text>
          {isPendingQuestionerPrompt && (
            <Pressable
              style={styles.viewProfileBtn}
              onPress={openProfileModal}
            >
              <Text style={styles.viewProfileBtnText}>View {thread?.counterparty?.name}'s profile</Text>
              <Ionicons name="chevron-forward" size={12} color={colors.PRIMARY} />
            </Pressable>
          )}
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={[styles.messageText, isMine && styles.messageTextMine]}>{message.text}</Text>
          <Text style={[styles.messageTime, isMine && styles.messageTimeMine]}>
            {formatMessageTime(message.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.PRIMARY} />
        </Pressable>
        {thread?.counterparty && (
          <Pressable
            style={styles.headerInfo}
            onPress={openProfileModal}
          >
            <UserAvatar imageUrl={thread.counterparty.profileImageUrl} size={36} />
            <View>
              <Text style={styles.headerName}>{thread.counterparty.name}</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {thread.question.title}
              </Text>
            </View>
          </Pressable>
        )}
        {thread?.question && (
          <Pressable
            style={styles.goToQuestionLink}
            onPress={() =>
              router.push({ pathname: '/question-detail', params: { questionId: thread.question.id } })
            }
          >
            <Text style={styles.goToQuestionLinkText}>Go to Question</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.PRIMARY} />
          </Pressable>
        )}
      </View>

      {isClosed && (
        <View style={styles.closedBanner}>
          <Text style={styles.closedText}>
            {thread?.status === AnswerRequestStatus.Rejected
              ? 'This request was rejected.'
              : 'This question has been answered.'}
          </Text>
        </View>
      )}

      {isPending && !isClosed && (
        <View style={styles.pendingBanner}>
          <Ionicons name="lock-closed" size={14} color={colors.PRIMARY} />
          <Text style={styles.pendingText}>
            {isQuestioner
              ? 'Review the request — chat unlocks once you accept.'
              : 'Waiting for the questioner to accept your request.'}
          </Text>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={chatItems}
        keyExtractor={(item) => (item.kind === 'day' ? item.id : item.message.id)}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) =>
          item.kind === 'day' ? (
            <Text style={styles.daySeparator}>{item.label}</Text>
          ) : (
            renderMessage(item.message)
          )
        }
      />

      {eligibility?.canReview && (
        <CustomButton
          text="Rate this user"
          onPress={() => setReviewVisible(true)}
          style={styles.reviewBtn}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={canType ? 'Type a message…' : isClosed ? 'Chat closed' : 'Chat locked'}
            placeholderTextColor={colors.LIGHT_GRAY}
            value={inputText}
            onChangeText={setInputText}
            editable={canType && !sending}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, (!canType || !inputText.trim()) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!canType || !inputText.trim() || sending}
          >
            <Ionicons name="send" size={20} color={colors.BG_WHITE} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ReviewModal
        visible={reviewVisible}
        requestId={requestId}
        onClose={() => setReviewVisible(false)}
        onSubmitted={() => {
          setReviewVisible(false);
          getReviewEligibility(requestId).then(setEligibility).catch(() => undefined);
        }}
      />

      <UserProfileModal
        visible={profileVisible}
        openKey={profileOpenKey}
        userId={thread?.counterparty?.id ?? null}
        onClose={() => setProfileVisible(false)}
        onClosed={() => {
          if (!openRejectAfterProfileCloseRef.current) return;
          openRejectAfterProfileCloseRef.current = false;
          openRejectModal();
        }}
        requestDecision={
          isPending && isQuestioner
            ? {
              onAccept: handleAccept,
              onReject: () => {
                openRejectAfterProfileCloseRef.current = true;
                setProfileVisible(false);
              },
              acceptLoading: accepting,
              rejectLoading: rejecting,
            }
            : undefined
        }
      />

      <BottomSheet
        visible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        sheetStyle={styles.modalSheet}
      >
        <Text style={styles.modalTitle}>Reject request</Text>
        <Text style={styles.modalSubtitle}>Choose a reason or write your own.</Text>

        {presetReasons.length > 0 && (
          <View style={styles.presetWrap}>
            {presetReasons.map((reason) => {
              const selected = selectedPreset === reason;
              return (
                <Pressable
                  key={reason}
                  style={[styles.presetChip, selected && styles.presetChipSelected]}
                  onPress={() => {
                    setSelectedPreset(reason);
                    setRejectionReason('');
                  }}
                >
                  <Text style={[styles.presetChipText, selected && styles.presetChipTextSelected]}>
                    {reason}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <TextInput
          style={styles.modalInput}
          placeholder="Or write a custom reason…"
          value={rejectionReason}
          onChangeText={(text) => {
            setRejectionReason(text);
            setSelectedPreset(null);
          }}
          multiline
        />
        <CustomButton
          text="Reject"
          onPress={handleReject}
          loading={rejecting}
          disabled={!(selectedPreset || rejectionReason.trim())}
        />
      </BottomSheet>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.BG_WHITE },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.CARD_BORDER,
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goToQuestionLink: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  goToQuestionLinkText: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.PRIMARY,
  },
  headerName: { fontFamily: 'roboto-bold', fontSize: fonts.FONT_SIZE_SMALL, color: colors.TEXT_DARK },
  headerSubtitle: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_XS, color: colors.MEDIUM_GRAY, maxWidth: 220 },
  closedBanner: { backgroundColor: colors.LIGHT_GREEN, padding: 10, alignItems: 'center' },
  closedText: { fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_XS, color: colors.PRIMARY },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.LIGHT_BLUE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  pendingText: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_XS, color: colors.PRIMARY },
  listContent: { padding: 16, paddingBottom: 8 },
  daySeparator: {
    textAlign: 'center',
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    marginVertical: 12,
  },
  messageRow: { marginBottom: 8 },
  messageRowMine: { alignItems: 'flex-end' },
  messageRowOther: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: colors.PRIMARY, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.CARD_BG, borderBottomLeftRadius: 4 },
  messageText: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.TEXT_DARK, lineHeight: 20 },
  messageTextMine: { color: colors.BG_WHITE },
  messageTime: { fontFamily: 'roboto-light', fontSize: 10, color: colors.MEDIUM_GRAY, marginTop: 4, alignSelf: 'flex-end' },
  messageTimeMine: { color: 'rgba(255,255,255,0.7)' },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: colors.LIGHT_GREEN,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginVertical: 8,
    maxWidth: '90%',
  },
  systemText: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_XS, color: colors.PRIMARY, textAlign: 'center', lineHeight: 18 },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.CARD_BORDER,
    gap: 4,
  },
  viewProfileBtnText: { fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_XS, color: colors.PRIMARY },
  reviewBtn: { marginHorizontal: 16, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.CARD_BORDER,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  modalSheet: { backgroundColor: colors.BG_WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontFamily: 'roboto-bold', fontSize: fonts.FONT_SIZE_MEDIUM, color: colors.TEXT_DARK, marginBottom: 4 },
  modalSubtitle: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY, marginBottom: 16 },
  presetWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  presetChip: {
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetChipSelected: { backgroundColor: colors.LIGHT_GREEN, borderColor: colors.PRIMARY },
  presetChipText: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_XS, color: colors.DARK_GRAY },
  presetChipTextSelected: { color: colors.PRIMARY },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: 100,
    padding: 12,
    minHeight: 80,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
});
