import ReviewModal from '@/components/ReviewModal';
import MessageBubble, { MessageGroupPosition } from '@/components/chat/MessageBubble';
import RatingCard from '@/components/chat/RatingCard';
import { StatusIconGlyph } from '@/components/QuestionStatusIcons';
import UserAvatar from '@/components/UserAvatar';
import UserProfileModal from '@/components/UserProfileModal';
import BackButton from '@/components/shared/BackButton';
import CustomButton from '@/components/shared/CustomButton';
import OverflowMenu, { OverflowMenuItem } from '@/components/shared/OverflowMenu';
import BottomSheet from '@/components/shared/BottomSheet';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { BORDER_RADIUS_INPUT, CHAT_AVATAR_SIZE } from '@/constants/layout';
import { screenChromeStyles } from '@/constants/screenChrome';
import { STATUS_ICON_SIZE, STATUS_ICON_VISUALS } from '@/constants/statusIcons';
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
import { formatDaySeparator, getDayKey } from '@/utils/date';
import { StatusIconKey } from '@/utils/questionStatus';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

type ChatListItem =
  | { kind: 'day'; id: string; label: string; }
  | { kind: 'message'; message: TMessage; groupPosition: MessageGroupPosition; }
  | { kind: 'rating'; id: string; };

type SystemMessageFlagTone = 'pending' | 'approved' | 'declined';

const SYSTEM_MESSAGE_FLAG_ICON_KEYS: Record<SystemMessageFlagTone, StatusIconKey> = {
  pending: 'request_pending',
  approved: 'request_approved',
  declined: 'request_denied',
};

/** Within this distance from the bottom, new messages auto-scroll into view. */
const CHAT_SCROLL_NEAR_BOTTOM_THRESHOLD = 80;

/** Maps request lifecycle system copy to the shared status icon set. */
const getSystemMessageFlagTone = (text: string): SystemMessageFlagTone | null => {
  if (text.startsWith('Your request was declined:') || text.startsWith("You declined @")) {
    return 'declined';
  }
  if (
    text.startsWith('Your request to answer the question has been sent') ||
    text.startsWith('You have a request by ')
  ) {
    return 'pending';
  }
  if (text.startsWith('You approved @') || text.startsWith('Request accepted.')) {
    return 'approved';
  }
  return null;
};

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
  /** Star count the review sheet opens with (set by the timeline rating card). */
  const [reviewInitialStars, setReviewInitialStars] = useState(0);
  const [eligibility, setEligibility] = useState<TReviewEligibility | null>(null);
  const [profileVisible, setProfileVisible] = useState(false);
  const [profileOpenKey, setProfileOpenKey] = useState(0);
  const [accepting, setAccepting] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [presetReasons, setPresetReasons] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  /** Message currently being replied to (shown above the composer). */
  const [replyTarget, setReplyTarget] = useState<TMessage | null>(null);

  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const openRejectAfterProfileCloseRef = useRef(false);
  const initialScrollDoneRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const userSentMessageRef = useRef(false);
  const awaitingSendScrollRef = useRef(false);

  const scrollToBottom = useCallback((animated: boolean) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated });
      });
    });
  }, []);

  const handleListScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    isNearBottomRef.current = distanceFromBottom <= CHAT_SCROLL_NEAR_BOTTOM_THRESHOLD;
  }, []);

  useEffect(() => {
    initialScrollDoneRef.current = false;
    isNearBottomRef.current = true;
    userSentMessageRef.current = false;
    awaitingSendScrollRef.current = false;
    setReplyTarget(null);
  }, [requestId]);

  useEffect(() => {
    if (loading || messages.length === 0) return;

    if (!initialScrollDoneRef.current) {
      scrollToBottom(false);
      initialScrollDoneRef.current = true;
      return;
    }

    if (userSentMessageRef.current) {
      userSentMessageRef.current = false;
      return;
    }

    if (isNearBottomRef.current) {
      scrollToBottom(true);
    }
  }, [loading, messages, scrollToBottom]);

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

  const refreshEligibility = useCallback(() => {
    if (!requestId) return;
    getReviewEligibility(requestId).then(setEligibility).catch(() => undefined);
  }, [requestId]);

  const handleReviewWindowExpired = useCallback(() => {
    refreshEligibility();
  }, [refreshEligibility]);

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

    // Consecutive USER messages from the same sender on the same day form a
    // bubble group — the tail and the wider gap only land on the last one.
    const sameGroup = (a: TMessage | undefined, b: TMessage | undefined) =>
      !!a &&
      !!b &&
      a.type === 'USER' &&
      b.type === 'USER' &&
      a.senderId === b.senderId &&
      getDayKey(a.createdAt) === getDayKey(b.createdAt);

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const dayKey = getDayKey(message.createdAt);
      if (dayKey !== lastDayKey) {
        items.push({ kind: 'day', id: `day-${dayKey}`, label: formatDaySeparator(message.createdAt) });
        lastDayKey = dayKey;
      }
      const prevInGroup = sameGroup(messages[i - 1], message);
      const nextInGroup = sameGroup(message, messages[i + 1]);
      const groupPosition: MessageGroupPosition = prevInGroup
        ? nextInGroup
          ? 'middle'
          : 'last'
        : nextInGroup
          ? 'first'
          : 'single';
      items.push({ kind: 'message', message, groupPosition });
    }

    // When reviews are unlocked and the user hasn't submitted yet, surface the
    // rating prompt at the end of the conversation — including when the window
    // has ended so they see why they can no longer rate.
    const showRatingCard = eligibility?.unlocked && !eligibility?.alreadyReviewed;
    if (showRatingCard) {
      items.push({ kind: 'rating', id: 'rating-card' });
    }
    return items;
  }, [eligibility?.alreadyReviewed, eligibility?.unlocked, messages]);

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
      Alert.alert('Error', err?.response?.data?.error || 'Could not decline request.');
    } finally {
      setRejecting(false);
    }
  };

  const openProfileModal = useCallback(() => {
    setProfileOpenKey((key) => key + 1);
    setProfileVisible(true);
  }, []);

  const resolveSenderName = useCallback(
    (senderId: string) =>
      senderId === authUserId ? 'You' : thread?.counterparty?.name ?? 'User',
    [authUserId, thread],
  );

  const handleSwipeReply = useCallback((message: TMessage) => {
    setReplyTarget(message);
    inputRef.current?.focus();
  }, []);

  /** Opens the review sheet, preselecting stars when tapped on the rating card. */
  const handleRateStars = useCallback((value: number) => {
    if (!eligibility?.canReview) return;
    setReviewInitialStars(value);
    setReviewVisible(true);
  }, [eligibility?.canReview]);

  const headerMenuItems = useMemo((): OverflowMenuItem[] => {
    const items: OverflowMenuItem[] = [];

    if (thread?.question) {
      items.push({
        key: 'go-to-question',
        label: 'Go to Question',
        icon: 'document-text-outline',
        onPress: () =>
          router.push({ pathname: '/question-detail', params: { questionId: thread.question.id } }),
      });
    }

    if (eligibility?.canReview) {
      const counterpartyName = thread?.counterparty?.name ?? 'this user';
      items.push({
        key: 'rate',
        label: `Rate ${counterpartyName}`,
        icon: 'star-outline',
        iconColor: colors.STAR_GOLD,
        onPress: () => handleRateStars(0),
      });
    }

    return items;
  }, [eligibility?.canReview, handleRateStars, router, thread?.counterparty?.name, thread?.question]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending || !canType) return;

    userSentMessageRef.current = true;
    awaitingSendScrollRef.current = true;
    setSending(true);
    setInputText('');
    inputRef.current?.focus();

    try {
      const message = await sendMessage(requestId, text, replyTarget?.id);
      setReplyTarget(null);
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not send message.');
      setInputText(text);
      userSentMessageRef.current = false;
      awaitingSendScrollRef.current = false;
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const renderMessage = (message: TMessage, groupPosition: MessageGroupPosition) => {
    const isSystem = message.type === 'SYSTEM';
    const isMine = message.senderId === authUserId;

    if (isSystem) {
      // Make the "View profile" call to action in the questioner's first system message clickable.
      const isPendingQuestionerPrompt =
        isPending &&
        isQuestioner &&
        thread?.counterparty &&
        message.text.includes('View their profile');

      const flagTone = getSystemMessageFlagTone(message.text);

      return (
        <View style={styles.systemBubble}>
          <View style={[styles.systemContentRow, !flagTone && styles.systemContentRowCentered]}>
            {flagTone ? (
              <StatusIconGlyph
                visual={STATUS_ICON_VISUALS[SYSTEM_MESSAGE_FLAG_ICON_KEYS[flagTone]]}
                size={STATUS_ICON_SIZE}
              />
            ) : null}
            <View style={flagTone ? styles.systemTextWrap : undefined}>
              <Text style={[styles.systemText, flagTone && styles.systemTextWithFlag]}>
                {message.text}
              </Text>
            </View>
          </View>
          {isPendingQuestionerPrompt && (
            <Pressable
              style={styles.viewProfileBtn}
              onPress={openProfileModal}
            >
              <Text style={styles.viewProfileBtnText}>{`View ${thread?.counterparty?.name}'s profile`}</Text>
              <Ionicons name="chevron-forward" size={12} color={colors.PRIMARY} />
            </Pressable>
          )}
        </View>
      );
    }

    return (
      <MessageBubble
        message={message}
        isMine={isMine}
        groupPosition={groupPosition}
        resolveSenderName={resolveSenderName}
        onSwipeReply={handleSwipeReply}
      />
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
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.chatBody}
      >
        <View style={styles.header}>
          <BackButton />
          {thread?.counterparty && (
            <Pressable
              style={styles.headerInfo}
              onPress={openProfileModal}
            >
              <UserAvatar imageUrl={thread.counterparty.profileImageUrl} size={CHAT_AVATAR_SIZE} />
              <View>
                <Text style={styles.headerName}>{thread.counterparty.name}</Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {thread.question.title}
                </Text>
              </View>
            </Pressable>
          )}
          {headerMenuItems.length > 0 && (
            <OverflowMenu items={headerMenuItems} style={styles.headerMenu} />
          )}
        </View>

        {isClosed && (
          <View style={styles.statusBanner}>
            <Ionicons name="lock-closed" size={14} color={colors.PRIMARY} />
            <Text style={styles.statusBannerText}>
              {thread?.status === AnswerRequestStatus.Rejected
                ? 'This request was declined.'
                : 'This question has been answered.'}
            </Text>
          </View>
        )}

        {isPending && !isClosed && (
          <View style={styles.statusBanner}>
            <Ionicons name="lock-closed" size={14} color={colors.PRIMARY} />
            <Text style={styles.statusBannerText}>
              {isQuestioner
                ? 'Review the request — chat unlocks once you accept.'
                : 'Waiting for the questioner to accept your request.'}
            </Text>
          </View>
        )}

        <FlatList
          ref={listRef}
          style={styles.messageList}
          data={chatItems}
          keyExtractor={(item) => (item.kind === 'message' ? item.message.id : item.id)}
          contentContainerStyle={styles.listContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onScroll={handleListScroll}
          scrollEventThrottle={16}
          onContentSizeChange={() => {
            if (!awaitingSendScrollRef.current) return;
            awaitingSendScrollRef.current = false;
            scrollToBottom(true);
          }}
          renderItem={({ item }) => {
            if (item.kind === 'day') {
              return <Text style={styles.daySeparator}>{item.label}</Text>;
            }
            if (item.kind === 'rating') {
              return (
                <RatingCard
                  name={thread?.counterparty?.name ?? 'this user'}
                  profileImageUrl={thread?.counterparty?.profileImageUrl ?? null}
                  reviewWindowEndsAt={eligibility?.reviewWindowEndsAt ?? null}
                  reviewWindowOpen={eligibility?.reviewWindowOpen ?? false}
                  onRate={handleRateStars}
                  onWindowExpired={handleReviewWindowExpired}
                />
              );
            }
            return renderMessage(item.message, item.groupPosition);
          }}
        />

        <View style={styles.composerWrap}>
          {replyTarget && (
            <View style={styles.replyPreview}>
              <View style={styles.replyPreviewBody}>
                <Text style={styles.replyPreviewName} numberOfLines={1}>
                  {resolveSenderName(replyTarget.senderId)}
                </Text>
                <Text style={styles.replyPreviewText} numberOfLines={1}>
                  {replyTarget.text}
                </Text>
              </View>
              <Pressable
                onPress={() => setReplyTarget(null)}
                hitSlop={8}
                accessibilityLabel="Cancel reply"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={18} color={colors.MEDIUM_GRAY} />
              </Pressable>
            </View>
          )}

          <View style={styles.inputRow}>
            <View style={[styles.inputShell, canType && styles.inputShellActive]}>
              {!canType ? (
                <Ionicons name="lock-closed" size={14} color={colors.PRIMARY} />
              ) : null}
              <TextInput
                ref={inputRef}
                style={[styles.input, !canType && styles.inputLocked]}
                placeholder={canType ? 'Type a message…' : isClosed ? 'Chat closed' : 'Chat locked'}
                placeholderTextColor={canType ? colors.PLACEHOLDER : colors.LIGHT_GRAY}
                value={inputText}
                onChangeText={setInputText}
                editable={canType}
                multiline={canType}
                blurOnSubmit={false}
              />
            </View>
            <Pressable
              style={[styles.sendBtn, (!canType || !inputText.trim()) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!canType || !inputText.trim() || sending}
              onPressOut={() => inputRef.current?.focus()}
            >
              <Ionicons name="send" size={20} color={colors.BG_WHITE} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ReviewModal
        visible={reviewVisible}
        requestId={requestId}
        initialStars={reviewInitialStars}
        reviewWindowEndsAt={eligibility?.reviewWindowEndsAt ?? null}
        reviewWindowOpen={eligibility?.reviewWindowOpen ?? false}
        reviewWindowDays={eligibility?.reviewWindowDays ?? 14}
        onClose={() => setReviewVisible(false)}
        onSubmitted={() => {
          setReviewVisible(false);
          refreshEligibility();
        }}
        onWindowExpired={handleReviewWindowExpired}
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
        <Text style={styles.modalTitle}>Decline request</Text>
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
          text="Decline"
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
  chatBody: { flex: 1 },
  messageList: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    ...screenChromeStyles.actionRowInset,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.CARD_BORDER,
    gap: 8,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  headerMenu: {
    marginLeft: 'auto',
  },
  headerName: { fontFamily: 'roboto-bold', fontSize: fonts.FONT_SIZE_SMALL, color: colors.TEXT_DARK },
  headerSubtitle: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_XS, color: colors.MEDIUM_GRAY, maxWidth: 220 },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.CHAT_MUTED_BG,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  statusBannerText: { fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_XS, color: colors.TEXT_DARK },
  listContent: { padding: 16, paddingBottom: 8 },
  daySeparator: {
    textAlign: 'center',
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.MEDIUM_GRAY,
    marginVertical: 12,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.CARD_BG,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
  },
  replyPreviewBody: { flex: 1, marginRight: 8 },
  replyPreviewName: {
    fontFamily: 'roboto-medium',
    fontSize: 11,
    color: colors.PRIMARY,
    marginBottom: 2,
  },
  replyPreviewText: {
    fontFamily: 'roboto',
    fontSize: 12,
    color: colors.MEDIUM_GRAY,
  },
  systemBubble: {
    alignSelf: 'center',
    width: '90%',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.CARD_BG,
  },
  systemContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  systemContentRowCentered: {
    justifyContent: 'center',
  },
  systemTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  systemText: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.TEXT_DARK,
    textAlign: 'center',
    lineHeight: 18,
  },
  systemTextWithFlag: {
    textAlign: 'left',
  },
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
  viewProfileBtnText: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.PRIMARY
  },

  composerWrap: {
    flexShrink: 0,

  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.CARD_BORDER,
    gap: 8,
  },
  inputShell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: BORDER_RADIUS_INPUT,
    paddingHorizontal: 12,
    minHeight: 42,
  },
  inputShellActive: {
    borderColor: colors.BORDER_GRAY,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    maxHeight: 100,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
  inputLocked: {
    paddingVertical: 0,
    textAlignVertical: 'center',
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
  modalSubtitle: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY, marginBottom: 16 },
  presetWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  presetChip: {
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetChipSelected: { backgroundColor: colors.SECONDARY, borderColor: colors.PRIMARY },
  presetChipText: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_XS, color: colors.DARK_GRAY },
  presetChipTextSelected: { color: colors.PRIMARY },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: BORDER_RADIUS_INPUT,
    padding: 12,
    minHeight: 80,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
});
