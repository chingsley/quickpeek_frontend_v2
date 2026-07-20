import BackButton from '@/components/shared/BackButton';
import BottomSheet from '@/components/shared/BottomSheet';
import CustomButton from '@/components/shared/CustomButton';
import StarRating from '@/components/StarRating';
import UserProfileModal from '@/components/UserProfileModal';
import { colors } from '@/constants/colors';
import { chipStyles } from '@/constants/chips';
import { fonts } from '@/constants/fonts';
import {
  acceptRequest,
  createRequest,
  getIncomingRequests,
  getRejectionReasons,
  rejectRequest,
} from '@/services/requests.services';
import { cancelQuestion, getQuestionDetail, getRejectedResponders, markQuestionAnswered, unblockResponder } from '@/services/questions.services';
import SocketService from '@/services/socket.services';
import { useAuthStore } from '@/store/auth.store';
import { AnswerRequestStatus, TAnswerRequest } from '@/types/answerRequest.types';
import { QuestionStatus, TRejectedResponder } from '@/types/question.types';
import { formatDate } from '@/utils/date';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CAN_REQUEST_LABELS: Record<string, string> = {
  OUTSIDE_RADIUS: 'You are outside the answer radius for this question.',
  ALREADY_REQUESTED: 'You already sent a request for this question.',
  BLOCKED: 'The questioner declined your request. You cannot request again unless they allow it.',
  ANSWERED: 'This question has been answered.',
  CANCELLED: 'This question was cancelled.',
  OWN_QUESTION: 'You cannot request to answer your own question.',
  NO_VIEWER_LOCATION: 'Enable location to request location-based questions.',
};

const getResponderStatusMessage = (
  question: NonNullable<Awaited<ReturnType<typeof getQuestionDetail>>>,
): string => {
  const vr = question.viewerRequest;
  if (vr?.status === AnswerRequestStatus.Pending) {
    return 'Your request has been sent. Waiting for the questioner to respond.';
  }
  if (vr?.status === AnswerRequestStatus.Accepted) {
    return vr.hasResponded
      ? 'You are answering this question. Continue in chat.'
      : 'Your request was approved. Open chat to start answering.';
  }
  if (vr?.status === AnswerRequestStatus.Rejected || vr?.isBlocked || question.canRequestReason === 'BLOCKED') {
    const reason = vr?.rejectionReason;
    return reason ? `Declined: ${reason}` : CAN_REQUEST_LABELS.BLOCKED;
  }
  return CAN_REQUEST_LABELS[question.canRequestReason || ''] || 'You cannot request this question.';
};

const QuestionDetail = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ questionId: string }>();
  const questionId = params.questionId as string;
  const authUserId = useAuthStore((state) => state.user?.id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [question, setQuestion] = useState<Awaited<ReturnType<typeof getQuestionDetail>> | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<TAnswerRequest[]>([]);
  const [rejectedResponders, setRejectedResponders] = useState<TRejectedResponder[]>([]);

  // Reject modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [presetReasons, setPresetReasons] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Profile modal
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileOpenKey, setProfileOpenKey] = useState(0);
  const [profileRequestId, setProfileRequestId] = useState<string | null>(null);
  const pendingRejectRequestIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!questionId) return;
    setLoading(true);
    try {
      const detail = await getQuestionDetail(questionId);
      setQuestion(detail);
      if (detail.userId === authUserId) {
        const [incoming, rejected] = await Promise.all([
          getIncomingRequests({ questionId }),
          getRejectedResponders(questionId),
        ]);
        setIncomingRequests(incoming.items);
        setRejectedResponders(rejected);
      }
    } catch {
      Alert.alert('Error', 'Could not load question.');
    } finally {
      setLoading(false);
    }
  }, [authUserId, questionId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getRejectionReasons().then(setPresetReasons).catch(() => setPresetReasons([]));
  }, []);

  // Live updates: new/changed request → reload list
  useEffect(() => {
    const socket = SocketService.getSocket();
    if (!socket) return;
    const handler = (payload: { questionId?: string }) => {
      if (payload?.questionId === questionId) load();
    };
    const messageHandler = (payload: { questionId?: string }) => {
      if (payload?.questionId === questionId) load();
    };
    socket.on('request:new', handler);
    socket.on('request:accepted', handler);
    socket.on('request:rejected', handler);
    socket.on('message:new', messageHandler);
    return () => {
      socket.off('request:new', handler);
      socket.off('request:accepted', handler);
      socket.off('request:rejected', handler);
      socket.off('message:new', messageHandler);
    };
  }, [load, questionId]);

  const isOwner = question?.userId === authUserId;

  const handleRequestToAnswer = async () => {
    if (!question) return;
    setSubmitting(true);
    try {
      const result = await createRequest(question.id);
      Alert.alert('Request sent', 'The questioner will review your request.', [
        { text: 'Open chat', onPress: () => router.replace({ pathname: '/chat', params: { requestId: result.id } }) },
        { text: 'OK', onPress: () => load() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Could not send request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    const alreadyAccepted = incomingRequests.filter(
      (r) => r.status === AnswerRequestStatus.Accepted,
    ).length;

    const proceed = async () => {
      try {
        await acceptRequest(requestId);
        Alert.alert('Accepted', 'You can now chat with this responder.', [
          { text: 'Open chat', onPress: () => router.push({ pathname: '/chat', params: { requestId } }) },
          { text: 'OK', onPress: () => load() },
        ]);
        load();
      } catch (error: any) {
        Alert.alert('Error', error?.response?.data?.error || 'Could not accept request.');
      }
    };

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
      proceed();
    }
  };

  const openRejectModal = (requestId: string) => {
    setRejectTargetId(requestId);
    setRejectionReason('');
    setSelectedPreset(null);
    setRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (!rejectTargetId) return;
    const reason = (selectedPreset || rejectionReason).trim();
    if (!reason) return;
    try {
      await rejectRequest(rejectTargetId, reason);
      setRejectModalVisible(false);
      load();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Could not reject request.');
    }
  };

  const handleMarkAnswered = async () => {
    if (!question) return;
    Alert.alert('Mark answered?', 'This will close all pending requests.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await markQuestionAnswered(question.id);
            load();
          } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.error || 'Could not mark answered.');
          }
        },
      },
    ]);
  };

  const handleCancel = async () => {
    if (!question) return;
    Alert.alert('Cancel question?', 'This cannot be undone.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel question',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelQuestion(question.id);
            router.back();
          } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.error || 'Could not cancel.');
          }
        },
      },
    ]);
  };

  const openProfile = (userId: string, requestId?: string) => {
    setProfileUserId(userId);
    setProfileRequestId(requestId ?? null);
    setProfileOpenKey((key) => key + 1);
    setProfileModalVisible(true);
  };

  const handleUnblockResponder = (responderId: string, name: string) => {
    Alert.alert(
      'Allow to request again?',
      `${name} will be able to send a new request for this question.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Allow',
          onPress: async () => {
            try {
              await unblockResponder(questionId, responderId);
              load();
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.error || 'Could not unblock responder.');
            }
          },
        },
      ],
    );
  };

  const requestIdForChat =
    question?.viewerRequest?.id || question?.existingRequestId || null;
  const profilePendingRequest = profileRequestId
    ? incomingRequests.find(
        (r) => r.id === profileRequestId && r.status === AnswerRequestStatus.Pending,
      )
    : null;
  const showOpenChat =
    !!requestIdForChat &&
    (question?.viewerRequest?.status === AnswerRequestStatus.Pending ||
      question?.viewerRequest?.status === AnswerRequestStatus.Accepted ||
      question?.viewerRequest?.status === AnswerRequestStatus.Rejected);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  if (!question) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Question not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pendingRequests = incomingRequests.filter((r) => r.status === AnswerRequestStatus.Pending);
  const acceptedRequests = incomingRequests.filter((r) => r.status === AnswerRequestStatus.Accepted);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <BackButton color={colors.PRIMARY} />
        <Text style={styles.pageTitle}>{question.title}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.price}>${question.price.toFixed(2)}</Text>
          <Text style={styles.status}>{question.status}</Text>
        </View>

        {question.address && (
          <View style={styles.locationCard}>
            <Ionicons name="location-outline" size={16} color={colors.PRIMARY} />
            <Text style={styles.locationText}>{question.address}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Details</Text>
          <Text style={styles.bodyText}>{question.detail}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Acceptance criteria</Text>
          <Text style={styles.bodyText}>{question.acceptanceCriteria}</Text>
        </View>

        {question.questioner && !isOwner && (
          <Pressable
            style={[styles.card, styles.questionerCard]}
            onPress={() => openProfile(question.questioner!.id)}
          >
            <Text style={styles.cardLabel}>Questioner</Text>
            <View style={styles.questionerRow}>
              <Text style={styles.bodyText}>{question.questioner.name}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.MEDIUM_GRAY} />
            </View>
            {question.questioner.asQuestioner.reviewsCount > 0 && (
              <View style={styles.ratingRow}>
                <StarRating rating={question.questioner.asQuestioner.averageRating} size={14} />
                <Text style={styles.ratingText}>
                  {question.questioner.asQuestioner.averageRating.toFixed(1)} ({question.questioner.asQuestioner.reviewsCount})
                </Text>
              </View>
            )}
            <Text style={styles.viewProfileHint}>Tap to view profile</Text>
          </Pressable>
        )}

        <Text style={styles.timestamp}>Posted {formatDate(question.createdAt)}</Text>

        {!isOwner && question.status === QuestionStatus.Open && (
          <View style={styles.actionArea}>
            {question.canRequest ? (
              <CustomButton
                text={submitting ? 'Sending…' : 'Request to answer'}
                onPress={handleRequestToAnswer}
                disabled={submitting}
                loading={submitting}
              />
            ) : (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>{getResponderStatusMessage(question)}</Text>
                {showOpenChat && requestIdForChat && (
                  <CustomButton
                    text="Open chat"
                    onPress={() =>
                      router.push({ pathname: '/chat', params: { requestId: requestIdForChat } })
                    }
                    style={{ marginTop: 12 }}
                  />
                )}
              </View>
            )}
          </View>
        )}

        {isOwner && question.status === QuestionStatus.Open && (
          <>
            <Text style={styles.sectionTitle}>Incoming requests ({pendingRequests.length})</Text>
            {pendingRequests.length === 0 ? (
              <Text style={styles.emptyText}>No pending requests yet.</Text>
            ) : (
              pendingRequests.map((req) => (
                <View key={req.id} style={styles.requestCard}>
                  <Pressable
                    style={styles.requestInfo}
                    onPress={() => req.counterparty && openProfile(req.counterparty.id, req.id)}
                  >
                    <Text style={styles.requestName}>{req.counterparty?.name || 'Responder'}</Text>
                    <Text style={styles.viewProfileHint}>View profile & reviews</Text>
                  </Pressable>
                  <View style={styles.requestActions}>
                    <Pressable style={styles.acceptBtn} onPress={() => handleAccept(req.id)}>
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </Pressable>
                    <Pressable style={styles.rejectBtn} onPress={() => openRejectModal(req.id)}>
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}

            {acceptedRequests.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Active chats ({acceptedRequests.length})</Text>
                {acceptedRequests.map((req) => (
                  <Pressable
                    key={req.id}
                    style={styles.requestCard}
                    onPress={() => router.push({ pathname: '/chat', params: { requestId: req.id } })}
                  >
                    <View>
                      <Text style={styles.requestName}>{req.counterparty?.name || 'Responder'}</Text>
                      <Text style={styles.viewProfileHint}>Open chat</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.MEDIUM_GRAY} />
                  </Pressable>
                ))}
              </>
            )}

            {rejectedResponders.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Rejected responders ({rejectedResponders.length})</Text>
                {rejectedResponders.map((entry) => (
                  <View key={entry.responderId} style={styles.requestCard}>
                    <Pressable
                      style={styles.requestInfo}
                      onPress={() => openProfile(entry.responder.id)}
                    >
                      <Text style={styles.requestName}>{entry.responder.name}</Text>
                      {entry.rejectionReason ? (
                        <Text style={styles.rejectionReason} numberOfLines={2}>
                          {entry.rejectionReason}
                        </Text>
                      ) : null}
                      <Text style={styles.viewProfileHint}>View profile</Text>
                    </Pressable>
                    <Pressable
                      style={styles.unblockBtn}
                      onPress={() => handleUnblockResponder(entry.responderId, entry.responder.name)}
                    >
                      <Text style={styles.unblockBtnText}>Allow again</Text>
                    </Pressable>
                  </View>
                ))}
              </>
            )}

            <View style={styles.actionArea}>
              <CustomButton text="Mark as answered" onPress={handleMarkAnswered} />
              <CustomButton text="Cancel question" onPress={handleCancel} style={{ marginTop: 12 }} />
            </View>
          </>
        )}
      </ScrollView>

      {/* Reject modal */}
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
              const active = selectedPreset === reason;
              return (
                <Pressable
                  key={reason}
                  style={[chipStyles.presetContainer, active && chipStyles.presetContainerActive]}
                  onPress={() => {
                    setSelectedPreset(reason);
                    setRejectionReason('');
                  }}
                >
                  <Text style={[chipStyles.presetText, active && chipStyles.presetTextActive]}>
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
          disabled={!(selectedPreset || rejectionReason.trim())}
        />
      </BottomSheet>

      <UserProfileModal
        visible={profileModalVisible}
        openKey={profileOpenKey}
        userId={profileUserId}
        onClose={() => setProfileModalVisible(false)}
        onClosed={() => {
          const requestId = pendingRejectRequestIdRef.current;
          if (!requestId) return;
          pendingRejectRequestIdRef.current = null;
          openRejectModal(requestId);
        }}
        requestDecision={
          profilePendingRequest
            ? {
                onAccept: () => handleAccept(profilePendingRequest.id),
                onReject: () => {
                  pendingRejectRequestIdRef.current = profilePendingRequest.id;
                  setProfileModalVisible(false);
                },
              }
            : undefined
        }
        primaryActionLabel={profileRequestId && !profilePendingRequest ? 'Go to chat' : undefined}
        onPrimaryAction={
          profileRequestId && !profilePendingRequest
            ? () => {
                setProfileModalVisible(false);
                router.push({ pathname: '/chat', params: { requestId: profileRequestId } });
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
};

export default QuestionDetail;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.BG_WHITE },
  scrollContent: { padding: 24, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontFamily: 'roboto-bold', fontSize: 28, color: colors.TEXT_DARK, marginTop: 12, marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  price: { fontFamily: 'roboto-bold', fontSize: fonts.FONT_SIZE_MEDIUM, color: colors.PRIMARY },
  chip: { backgroundColor: colors.LIGHT_GREEN },
  status: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY, marginLeft: 'auto' },
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  locationText: { flex: 1, fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.TEXT_DARK },
  card: {
    backgroundColor: colors.CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    padding: 16,
    marginBottom: 12,
  },
  cardLabel: { fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_XS, color: colors.MEDIUM_GRAY, marginBottom: 8, textTransform: 'uppercase' },
  bodyText: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.TEXT_DARK, lineHeight: 22 },
  questionerCard: {},
  questionerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  ratingText: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_XS, color: colors.MEDIUM_GRAY },
  viewProfileHint: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_XS, color: colors.PRIMARY, marginTop: 4 },
  timestamp: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY, marginBottom: 20 },
  actionArea: { marginTop: 20 },
  infoBox: { backgroundColor: colors.LIGHT_GREEN, borderRadius: 12, padding: 16 },
  infoText: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.PRIMARY, lineHeight: 20 },
  sectionTitle: { fontFamily: 'roboto-bold', fontSize: fonts.FONT_SIZE_MEDIUM, color: colors.TEXT_DARK, marginTop: 20, marginBottom: 12 },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  requestInfo: { flex: 1 },
  requestName: { fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_SMALL, color: colors.TEXT_DARK },
  requestActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { backgroundColor: colors.PRIMARY, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  acceptBtnText: { fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_XS, color: colors.BG_WHITE },
  rejectBtn: { borderWidth: 1, borderColor: colors.CARD_BORDER, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  rejectBtnText: { fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_XS, color: colors.DARK_GRAY },
  rejectionReason: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_XS, color: colors.MEDIUM_GRAY, marginTop: 4 },
  unblockBtn: { borderWidth: 1, borderColor: colors.PRIMARY, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  unblockBtnText: { fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_XS, color: colors.PRIMARY },
  emptyText: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY, textAlign: 'center', marginTop: 20 },
  modalSheet: { backgroundColor: colors.BG_WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontFamily: 'roboto-bold', fontSize: fonts.FONT_SIZE_MEDIUM, color: colors.TEXT_DARK, marginBottom: 4 },
  modalSubtitle: { fontFamily: 'roboto-light', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY, marginBottom: 16 },
  presetWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: 100,
    padding: 12,
    minHeight: 80,
    marginBottom: 16,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    textAlignVertical: 'top',
  },
});
