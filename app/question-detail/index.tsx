import BackButton from '@/components/shared/BackButton';
import BottomSheet from '@/components/shared/BottomSheet';
import CustomButton from '@/components/shared/CustomButton';
import KeyboardAwareScreen from '@/components/shared/KeyboardAwareScreen';
import { ScreenInfoBanner } from '@/components/shared/ScreenInfoBanner';
import { LocationScopeSummaryText } from '@/components/shared/LocationScopeSummaryText';
import { ScreenTitle } from '@/components/shared/ScreenTitle';
import { useActionSheet } from '@/components/shared/useActionSheet';
import QuestionStatusIcons from '@/components/QuestionStatusIcons';
import { STATUS_ICON_SIZE } from '@/constants/statusIcons';
import StarRating from '@/components/StarRating';
import UserAvatar from '@/components/UserAvatar';
import UserProfileModal from '@/components/UserProfileModal';
import { colors } from '@/constants/colors';
import { chipStyles } from '@/constants/chips';
import { fonts } from '@/constants/fonts';
import { BORDER_RADIUS_INPUT, SCREEN_CHROME_DETAIL_META_MARGIN_BOTTOM, SCREEN_CHROME_DETAIL_STATUS_MARGIN_BOTTOM } from '@/constants/layout';
import { screenChromeStyles } from '@/constants/screenChrome';
import {
  acceptRequest,
  createRequest,
  getIncomingRequests,
  getRejectionReasons,
  rejectRequest,
} from '@/services/requests.services';
import { markMessagesRead } from '@/services/messages.services';
import {
  closeQuestion,
  getCloseReasons,
  getQuestionDetail,
  getRejectedResponders,
  unblockResponder,
} from '@/services/questions.services';
import SocketService from '@/services/socket.services';
import { useAuthStore } from '@/store/auth.store';
import { useActiveViewStore } from '@/store/activeView.store';
import { useLiveLocationStore } from '@/store/liveLocation.store';
import { AnswerRequestStatus, TAnswerRequest } from '@/types/answerRequest.types';
import { LocationScope, QuestionStatus, TRejectedResponder } from '@/types/question.types';
import { formatLocationScopeSummary } from '@/constants/locationScope';
import { resolveScopeRadii, useMarketConfigStore } from '@/store/marketConfig.store';
import { formatDate } from '@/utils/date';
import { LINKED_FROM_CHAT_PARAM, openLinkedChat } from '@/utils/linkedScreenNavigation';
import { normalizeRouteParam } from '@/utils/routeParams';
import { getMainStatusIcons } from '@/utils/questionStatus';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const buildLocationMessage = (
  question: {
    address?: string | null;
    locationScope?: LocationScope;
    scopeRadiusKm?: number | null;
  },
  scopeRadii: Record<string, number>,
): string | null => {
  if (!question.locationScope || question.locationScope === 'ANYWHERE') return null;
  const place = question.address?.trim() || 'the pinned location';
  const scopeSummary = formatLocationScopeSummary(
    question.locationScope,
    question.scopeRadiusKm,
    scopeRadii,
  );
  return `This question needs responders at ${place} — ${scopeSummary}.`;
};

const LOCATION_PROXIMITY_HINT =
  `Enable your location so the system can determine if you're close to this location.`;

const getCanRequestMessage = (
  question: NonNullable<Awaited<ReturnType<typeof getQuestionDetail>>>,
  scopeRadii: Record<string, number>,
): string => {
  switch (question.canRequestReason) {
    case 'OUTSIDE_RADIUS': {
      const base = buildLocationMessage(question, scopeRadii);
      return base ?? 'You are outside the required radius for this question.';
    }
    case 'NO_VIEWER_LOCATION': {
      const base = buildLocationMessage(question, scopeRadii);
      return base ? `${base} ${LOCATION_PROXIMITY_HINT}` : LOCATION_PROXIMITY_HINT;
    }
    case 'ALREADY_REQUESTED':
      return 'You already sent a request for this question.';
    case 'BLOCKED':
      return 'The questioner declined your request. You cannot request again unless they allow it.';
    case 'CLOSED':
      return 'This question has been closed.';
    case 'OWN_QUESTION':
      return 'You cannot request to answer your own question.';
    default:
      return 'You cannot request this question.';
  }
};

const getResponderStatusMessage = (
  question: NonNullable<Awaited<ReturnType<typeof getQuestionDetail>>>,
  scopeRadii: Record<string, number>,
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
    return reason ? `Declined: ${reason}` : getCanRequestMessage(question, scopeRadii);
  }
  return getCanRequestMessage(question, scopeRadii);
};

type RequestSectionProps = {
  title: string;
  count: number;
  description: string;
  note?: string;
  itemLabel?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
};

/** Springy accordion feel — gentle overshoot on open/close. */
const SECTION_SPRING_CONFIG = { damping: 16, stiffness: 170, mass: 0.8 };
const CHEVRON_SPRING_CONFIG = { damping: 14, stiffness: 260, mass: 0.6 };

const RequestSection = ({
  title,
  count,
  description,
  note,
  itemLabel = 'item',
  defaultExpanded = true,
  children,
}: RequestSectionProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const open = useSharedValue(defaultExpanded ? 1 : 0);
  const contentHeight = useSharedValue(0);
  const hintHeight = useSharedValue(0);

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    open.value = next ? 1 : 0;
  };

  // Body and hint spring in opposite directions at the same time, so no
  // layout change ever happens instantly — the header keeps a constant
  // footprint and the page never jumps, from any scroll position.
  const animatedHeight = useDerivedValue(() =>
    withSpring(open.value ? contentHeight.value : 0, SECTION_SPRING_CONFIG),
  );
  const bodyOpacity = useDerivedValue(() =>
    withTiming(open.value ? 1 : 0, { duration: 180 }),
  );
  const animatedHintHeight = useDerivedValue(() =>
    withSpring(open.value ? 0 : hintHeight.value, SECTION_SPRING_CONFIG),
  );
  const hintOpacity = useDerivedValue(() =>
    withTiming(open.value ? 0 : 1, { duration: 160 }),
  );
  const chevronRotation = useDerivedValue(() =>
    withSpring(open.value * 180, CHEVRON_SPRING_CONFIG),
  );

  const bodyStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    opacity: bodyOpacity.value,
    overflow: 'hidden',
  }));
  const hintStyle = useAnimatedStyle(() => ({
    height: animatedHintHeight.value,
    opacity: hintOpacity.value,
    overflow: 'hidden',
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const itemWord = count === 1 ? itemLabel : `${itemLabel}s`;
  const collapsedHint =
    count === 0 ? 'Tap to expand' : `Tap to show ${count} ${itemWord}`;

  return (
    <View style={styles.requestSection}>
      <Pressable
        style={({ pressed }) => [styles.sectionHeader, pressed && styles.sectionHeaderPressed]}
        onPress={toggleExpanded}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}, ${count} ${itemWord}. ${expanded ? 'Collapse' : 'Expand'} section`}
      >
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {title} ({count})
          </Text>
          <Animated.View style={[styles.sectionChevron, chevronStyle]}>
            <Ionicons name="chevron-down" size={20} color={colors.MEDIUM_GRAY} />
          </Animated.View>
        </View>
        <Animated.View style={hintStyle}>
          {/* Measured like the body so the hint springs in/out instead of
              swapping instantly and reflowing the page. */}
          <View
            style={styles.sectionMeasure}
            onLayout={(event) => {
              const measured = event.nativeEvent.layout.height;
              if (measured > 0 && hintHeight.value !== measured) {
                hintHeight.value = measured;
              }
            }}
          >
            <Text style={styles.sectionCollapsedHint}>{collapsedHint}</Text>
          </View>
        </Animated.View>
      </Pressable>

      <Animated.View style={bodyStyle}>
        {/* position:absolute so the animated container owns the height while
            this view still measures at its natural size (reanimated's
            AnimateHeight pattern). */}
        <View
          style={styles.sectionMeasure}
          onLayout={(event) => {
            const measured = event.nativeEvent.layout.height;
            if (measured > 0 && contentHeight.value !== measured) {
              contentHeight.value = measured;
            }
          }}
        >
          <Text style={styles.sectionDescription}>{description}</Text>
          {note ? (
            <View style={styles.sectionNote}>
              <Ionicons name="information-circle-outline" size={17} color={colors.PRIMARY} />
              <Text style={styles.sectionNoteText}>{note}</Text>
            </View>
          ) : null}
          <View style={styles.requestSectionContent}>{children}</View>
        </View>
      </Animated.View>
    </View>
  );
};

const requestRowStyles = (isLast: boolean) => [styles.requestRow, isLast && styles.requestRowLast];

type ResponderIdentityProps = {
  name: string;
  profileImageUrl?: string | null;
  onPress: () => void;
  subtitle?: string;
  asResponder?: { averageRating: number; reviewsCount: number; };
};

const ResponderIdentity = ({
  name,
  profileImageUrl,
  onPress,
  subtitle,
  asResponder,
}: ResponderIdentityProps) => (
  <Pressable style={styles.responderIdentity} onPress={onPress}>
    <UserAvatar imageUrl={profileImageUrl} size={40} />
    <View style={styles.responderIdentityText}>
      <Text style={styles.requestName} numberOfLines={1}>
        {name}
      </Text>
      <View style={styles.responderRatingRow}>
        <StarRating rating={asResponder?.averageRating ?? 0} size={14} />
      </View>
      {subtitle ? (
        <Text style={styles.rejectionReason} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  </Pressable>
);

const QuestionDetail = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    questionId: string;
    section?: string;
    [LINKED_FROM_CHAT_PARAM]?: string;
  }>();
  const questionId = normalizeRouteParam(params.questionId);
  const focusSection = params.section;
  const linkedFromChat = normalizeRouteParam(params[LINKED_FROM_CHAT_PARAM]);
  const authUserId = useAuthStore((state) => state.user?.id);
  const scopeRadii = resolveScopeRadii(useMarketConfigStore((state) => state.config));
  const { showActionSheet, actionSheet } = useActionSheet();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [question, setQuestion] = useState<Awaited<ReturnType<typeof getQuestionDetail>> | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<TAnswerRequest[]>([]);
  const [rejectedResponders, setRejectedResponders] = useState<TRejectedResponder[]>([]);

  // Decline modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectPresetReasons, setRejectPresetReasons] = useState<string[]>([]);
  const [selectedRejectPreset, setSelectedRejectPreset] = useState<string | null>(null);

  // Close question modal
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [closePresetReasons, setClosePresetReasons] = useState<string[]>([]);
  const [selectedClosePreset, setSelectedClosePreset] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  // Profile modal
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileOpenKey, setProfileOpenKey] = useState(0);
  const [profileRequestId, setProfileRequestId] = useState<string | null>(null);
  const pendingRejectRequestIdRef = useRef<string | null>(null);

  const openChat = useCallback(
    (requestId: string) => {
      openLinkedChat(router, requestId, { replace: !!linkedFromChat });
    },
    [linkedFromChat, router],
  );

  const load = useCallback(async () => {
    if (!questionId) {
      setLoading(false);
      return;
    }
    const id = questionId;
    setLoading(true);
    try {
      const detail = await getQuestionDetail(id);
      setQuestion(detail);

      const liveCoords = await useLiveLocationStore.getState().ensureCoords();
      console.log('[QuestionDetail] liveCoords:', liveCoords);
      if (liveCoords) {
        try {
          const enriched = await getQuestionDetail(id, liveCoords);
          console.log('[QuestionDetail] enriched canRequest:', enriched.canRequest, 'reason:', enriched.canRequestReason, 'eligible:', enriched.eligible);
          setQuestion(enriched);
        } catch (err) {
          console.warn('[QuestionDetail] enrich failed', err);
          /* keep detail without distance enrichment */
        }
      } else if (detail.locationScope && detail.locationScope !== 'ANYWHERE') {
        // Scoped question needs location to show the request button. Ask for
        // permission once; the enriched call then runs on next load.
        console.warn('[QuestionDetail] no liveCoords — prompting for location permission');
        await useLiveLocationStore.getState().promptForCoords();
        // Reload with the newly granted coords so the button state updates.
        const retryCoords = await useLiveLocationStore.getState().ensureCoords();
        if (retryCoords) {
          try {
            const enriched = await getQuestionDetail(id, retryCoords);
            setQuestion(enriched);
          } catch {
            /* keep detail without distance enrichment */
          }
        }
      }

      if (detail.userId === authUserId) {
        const [incoming, rejected] = await Promise.all([
          getIncomingRequests({ questionId: id }),
          getRejectedResponders(id),
        ]);
        setIncomingRequests(incoming.items);
        setRejectedResponders(rejected);
      }
    } catch {
      showActionSheet({ title: 'Error', message: 'Could not load question.', tone: 'error' });
    } finally {
      setLoading(false);
    }
  }, [authUserId, questionId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getRejectionReasons().then(setRejectPresetReasons).catch(() => setRejectPresetReasons([]));
    getCloseReasons().then(setClosePresetReasons).catch(() => setClosePresetReasons([]));
  }, []);

  // Mark this question as in-view so its own push banners are suppressed.
  // Kept independent of the socket effect below, which bails out when the
  // socket isn't connected yet.
  useEffect(() => {
    if (!questionId) return;
    useActiveViewStore.getState().setActiveQuestionId(questionId);
    return () => useActiveViewStore.getState().clearActiveQuestionId(questionId);
  }, [questionId]);

  // Live updates: new/changed request → reload list
  useEffect(() => {
    const socket = SocketService.getSocket();
    if (!socket) return;
    const handler = (payload: { questionId?: string; }) => {
      if (payload?.questionId === questionId) load();
    };
    const messageHandler = (payload: { questionId?: string; }) => {
      if (payload?.questionId === questionId) load();
    };
    socket.on('request:new', handler);
    socket.on('request:accepted', handler);
    socket.on('request:rejected', handler);
    socket.on('question:closed', handler);
    socket.on('message:new', messageHandler);
    return () => {
      socket.off('request:new', handler);
      socket.off('request:accepted', handler);
      socket.off('request:rejected', handler);
      socket.off('question:closed', handler);
      socket.off('message:new', messageHandler);
    };
  }, [load, questionId]);

  const isOwner = question?.userId === authUserId;

  const acceptedRequestIds = useMemo(
    () =>
      incomingRequests
        .filter((r) => r.status === AnswerRequestStatus.Accepted)
        .map((req) => req.id),
    [incomingRequests],
  );

  useEffect(() => {
    if (focusSection !== 'active-chats' || !isOwner || acceptedRequestIds.length === 0) return;
    Promise.all(acceptedRequestIds.map((id) => markMessagesRead(id))).catch(() => undefined);
  }, [acceptedRequestIds, focusSection, isOwner]);

  const handleRequestToAnswer = async () => {
    if (!question) return;
    setSubmitting(true);
    try {
      const liveCoords = await useLiveLocationStore.getState().ensureCoords();
      const result = await createRequest(
        question.id,
        liveCoords ?? undefined,
      );
      showActionSheet({
        title: 'Request sent',
        message: 'The questioner will review your request.',
        tone: 'success',
        buttons: [
          { label: 'Open chat', onPress: () => openChat(result.id) },
          { label: 'OK', onPress: () => load(), role: 'secondary' },
        ],
      });
    } catch (error: any) {
      showActionSheet({
        title: 'Error',
        message: error?.response?.data?.error || 'Could not send request.',
        tone: 'error',
      });
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
        showActionSheet({
          title: 'Accepted',
          message: 'You can now chat with this responder.',
          tone: 'success',
          buttons: [
            { label: 'Open chat', onPress: () => openChat(requestId) },
            { label: 'OK', onPress: () => load(), role: 'secondary' },
          ],
        });
        load();
      } catch (error: any) {
        showActionSheet({
          title: 'Error',
          message: error?.response?.data?.error || 'Could not accept request.',
          tone: 'error',
        });
      }
    };

    if (alreadyAccepted > 0) {
      showActionSheet({
        title: 'Multiple responders',
        message:
          `You have already accepted ${alreadyAccepted} responder${alreadyAccepted === 1 ? '' : 's'}. ` +
          'Each accepted responder whose answer meets your acceptance criteria will need to be paid. ' +
          'Continue accepting this request?',
        tone: 'info',
        buttons: [
          { label: 'Accept', onPress: proceed },
          { label: 'Cancel', role: 'secondary' },
        ],
      });
    } else {
      proceed();
    }
  };

  const openRejectModal = (requestId: string) => {
    setRejectTargetId(requestId);
    setRejectionReason('');
    setSelectedRejectPreset(null);
    setRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (!rejectTargetId) return;
    const reason = (selectedRejectPreset || rejectionReason).trim();
    if (!reason) return;
    try {
      await rejectRequest(rejectTargetId, reason);
      setRejectModalVisible(false);
      load();
    } catch (error: any) {
      showActionSheet({
        title: 'Error',
        message: error?.response?.data?.error || 'Could not decline request.',
        tone: 'error',
      });
    }
  };

  const openCloseModal = () => {
    setCloseReason('');
    setSelectedClosePreset(null);
    setCloseModalVisible(true);
  };

  const handleCloseQuestion = async () => {
    if (!question) return;
    const reason = (selectedClosePreset || closeReason).trim();
    if (!reason) return;
    setClosing(true);
    try {
      await closeQuestion(question.id, reason);
      setCloseModalVisible(false);
      router.back();
    } catch (error: any) {
      showActionSheet({
        title: 'Error',
        message: error?.response?.data?.error || 'Could not close question.',
        tone: 'error',
      });
    } finally {
      setClosing(false);
    }
  };

  const openProfile = (userId: string, requestId?: string) => {
    setProfileUserId(userId);
    setProfileRequestId(requestId ?? null);
    setProfileOpenKey((key) => key + 1);
    setProfileModalVisible(true);
  };

  const handleUnblockResponder = (responderId: string, name: string) => {
    if (!questionId) return;
    const id = questionId;
    showActionSheet({
      title: 'Allow to request again?',
      message: `${name} will be able to send a new request for this question.`,
      tone: 'info',
      buttons: [
        {
          label: 'Allow',
          onPress: async () => {
            try {
              await unblockResponder(id, responderId);
              load();
            } catch (error: any) {
              showActionSheet({
                title: 'Error',
                message: error?.response?.data?.error || 'Could not unblock responder.',
                tone: 'error',
              });
            }
          },
        },
        { label: 'Cancel', role: 'secondary' },
      ],
    });
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

  if (!questionId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={screenChromeStyles.actionRow}>
          <BackButton />
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Invalid question link.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={screenChromeStyles.actionRow}>
          <BackButton />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  if (!question) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={screenChromeStyles.actionRow}>
          <BackButton />
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Question not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pendingRequests = incomingRequests.filter((r) => r.status === AnswerRequestStatus.Pending);
  const acceptedRequests = incomingRequests.filter((r) => r.status === AnswerRequestStatus.Accepted);

  // Status icons for the detail view. Outgoing questions pass the live pending
  // count so the pending icon stays fresh as the owner approves/declines.
  const mainStatusIcons = getMainStatusIcons(question, authUserId, {
    outgoingPendingCount: isOwner ? pendingRequests.length : undefined,
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={screenChromeStyles.actionRow}>
        <BackButton />
      </View>
      <KeyboardAwareScreen contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={screenChromeStyles.titleRowInset}>
          <ScreenTitle title={question.title} />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.price}>${question.price.toFixed(2)}</Text>
          <Text style={styles.metaTimestamp} numberOfLines={1}>
            Posted {formatDate(question.createdAt)}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <QuestionStatusIcons icons={mainStatusIcons} size={STATUS_ICON_SIZE} withLabels />
        </View>

        <ScreenInfoBanner
          iconName="location-outline"
          label={question.address?.trim() || 'No location'}
          style={styles.locationBanner}
          secondaryRow={
            question.locationScope
              ? {
                iconName: 'navigate-circle-outline',
                labelContent: (
                  <LocationScopeSummaryText
                    scope={question.locationScope}
                    radiusKm={question.scopeRadiusKm}
                    radii={scopeRadii}
                    style={styles.locationScopeSummary}
                  />
                ),
              }
              : undefined
          }
        />

        <View style={styles.contentSection}>
          <View style={styles.sectionLabelHeader}>
            <Text style={styles.sectionLabel}>Details</Text>
          </View>
          <Text style={styles.bodyText}>{question.detail}</Text>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.sectionLabelHeader}>
            <Text style={styles.sectionLabel}>Acceptance criteria</Text>
          </View>
          <Text style={styles.bodyText}>{question.acceptanceCriteria}</Text>
        </View>

        {question.questioner && !isOwner && (
          <Pressable
            style={styles.contentSection}
            onPress={() => openProfile(question.questioner!.id)}
          >
            <View style={styles.sectionLabelHeader}>
              <Text style={styles.sectionLabel}>Questioner</Text>
            </View>
            <View style={styles.questionerRow}>
              <UserAvatar imageUrl={question.questioner.profileImageUrl} size={40} />
              <View style={styles.questionerBody}>
                <View style={styles.questionerTitleRow}>
                  <Text style={styles.questionerName} numberOfLines={1}>
                    {question.questioner.name}
                  </Text>
                  <View style={styles.viewProfileLink}>
                    <Text style={styles.viewProfileHint}>Tap to view profile</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.MEDIUM_GRAY} />
                  </View>
                </View>
                <View style={styles.questionerRatingRow}>
                  <StarRating rating={question.questioner.asQuestioner.averageRating} size={14} />
                  {question.questioner.asQuestioner.reviewsCount > 0 && (
                    <Text style={styles.ratingText}>
                      {question.questioner.asQuestioner.averageRating.toFixed(1)} (
                      {question.questioner.asQuestioner.reviewsCount})
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </Pressable>
        )}

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
                <Text style={styles.infoText}>{getResponderStatusMessage(question, scopeRadii)}</Text>
                {showOpenChat && requestIdForChat && (
                  <Pressable
                    style={styles.infoOpenChatBtn}
                    onPress={() => openChat(requestIdForChat)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.infoOpenChatBtnText}>Open chat</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.PRIMARY} />
                  </Pressable>
                )}
              </View>
            )}
          </View>
        )}

        {isOwner && question.status === QuestionStatus.Open && (
          <>
            <RequestSection
              title="Answer requests"
              count={pendingRequests.length}
              itemLabel="request"
              description="These people want to answer your question. Review their profile before you approve or decline."
              note="If you approve more than one person, you may need to pay each responder whose answer meets your acceptance criteria."
              defaultExpanded={focusSection !== 'active-chats'}
            >
              {pendingRequests.length === 0 ? (
                <Text style={styles.sectionEmptyText}>No one has requested to answer yet.</Text>
              ) : (
                pendingRequests.map((req, index) => (
                  <View
                    key={req.id}
                    style={requestRowStyles(index === pendingRequests.length - 1)}
                  >
                    <ResponderIdentity
                      name={req.counterparty?.name || 'Responder'}
                      profileImageUrl={req.counterparty?.profileImageUrl}
                      asResponder={req.counterparty?.asResponder}
                      onPress={() => req.counterparty && openProfile(req.counterparty.id, req.id)}
                    />
                    <View style={styles.requestActions}>
                      <Pressable style={styles.acceptBtn} onPress={() => handleAccept(req.id)}>
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </Pressable>
                      <Pressable style={styles.rejectBtn} onPress={() => openRejectModal(req.id)}>
                        <Text style={styles.rejectBtnText}>Decline</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </RequestSection>

            <RequestSection
              title="Active chats"
              count={acceptedRequests.length}
              itemLabel="chat"
              description="Responders you've approved. Open a chat to continue the conversation."
              defaultExpanded={focusSection !== 'answer-requests'}
            >
              {acceptedRequests.length === 0 ? (
                <Text style={styles.sectionEmptyText}>No active chats yet. Approve a request to start one.</Text>
              ) : (
                acceptedRequests.map((req, index) => (
                  <View
                    key={req.id}
                    style={requestRowStyles(index === acceptedRequests.length - 1)}
                  >
                    <ResponderIdentity
                      name={req.counterparty?.name || 'Responder'}
                      profileImageUrl={req.counterparty?.profileImageUrl}
                      asResponder={req.counterparty?.asResponder}
                      onPress={() => req.counterparty && openProfile(req.counterparty.id, req.id)}
                    />
                    <Pressable
                      style={styles.openChatBtn}
                      onPress={() => openChat(req.id)}
                    >
                      <Text style={styles.openChatBtnText}>Open chat</Text>
                      <Ionicons name="chevron-forward" size={18} color={colors.MEDIUM_GRAY} />
                    </Pressable>
                  </View>
                ))
              )}
            </RequestSection>

            <RequestSection
              title="Declined responders"
              count={rejectedResponders.length}
              itemLabel="responder"
              defaultExpanded={false}
              description="People you declined. They can't send a new request unless you allow them again."
            >
              {rejectedResponders.length === 0 ? (
                <Text style={styles.sectionEmptyText}>No declined responders.</Text>
              ) : (
                rejectedResponders.map((entry, index) => (
                  <View
                    key={entry.responderId}
                    style={requestRowStyles(index === rejectedResponders.length - 1)}
                  >
                    <ResponderIdentity
                      name={entry.responder.name}
                      profileImageUrl={entry.responder.profileImageUrl}
                      asResponder={entry.responder.asResponder}
                      onPress={() => openProfile(entry.responder.id)}
                      subtitle={entry.rejectionReason || undefined}
                    />
                    <Pressable
                      style={styles.unblockBtn}
                      onPress={() => handleUnblockResponder(entry.responderId, entry.responder.name)}
                    >
                      <Text style={styles.unblockBtnText}>Allow again</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </RequestSection>

            <View style={styles.actionArea}>
              <CustomButton text="Close question" onPress={openCloseModal} />
            </View>
          </>
        )}
      </KeyboardAwareScreen>

      {/* Decline modal */}
      <BottomSheet
        visible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        sheetStyle={styles.modalSheet}
      >
        <Text style={styles.modalTitle}>Decline request</Text>
        <Text style={styles.modalSubtitle}>Choose a reason or write your own.</Text>

        {rejectPresetReasons.length > 0 && (
          <View style={styles.presetWrap}>
            {rejectPresetReasons.map((reason) => {
              const active = selectedRejectPreset === reason;
              return (
                <Pressable
                  key={reason}
                  style={[chipStyles.presetContainer, active && chipStyles.presetContainerActive]}
                  onPress={() => {
                    setSelectedRejectPreset(reason);
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
            setSelectedRejectPreset(null);
          }}
          multiline
        />
        <CustomButton
          text="Decline"
          onPress={handleReject}
          disabled={!(selectedRejectPreset || rejectionReason.trim())}
        />
      </BottomSheet>

      <BottomSheet
        visible={closeModalVisible}
        onClose={() => setCloseModalVisible(false)}
        sheetStyle={styles.modalSheet}
      >
        <Text style={styles.modalTitle}>Close question</Text>
        <Text style={styles.modalSubtitle}>
          This cannot be undone. Pending answer requests will be declined. Choose why you are closing
          this question.
        </Text>

        {closePresetReasons.length > 0 && (
          <View style={styles.presetWrap}>
            {closePresetReasons.map((reason) => {
              const active = selectedClosePreset === reason;
              return (
                <Pressable
                  key={reason}
                  style={[chipStyles.presetContainer, active && chipStyles.presetContainerActive]}
                  onPress={() => {
                    setSelectedClosePreset(reason);
                    setCloseReason('');
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
          value={closeReason}
          onChangeText={(text) => {
            setCloseReason(text);
            setSelectedClosePreset(null);
          }}
          multiline
        />
        <CustomButton
          text={closing ? 'Closing…' : 'Close question'}
          onPress={handleCloseQuestion}
          disabled={closing || !(selectedClosePreset || closeReason.trim())}
          loading={closing}
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
              openChat(profileRequestId);
            }
            : undefined
        }
      />

      {actionSheet}
    </SafeAreaView>
  );
};

export default QuestionDetail;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.BG_WHITE },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: SCREEN_CHROME_DETAIL_META_MARGIN_BOTTOM,
  },
  price: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.PRIMARY,
    flexShrink: 0,
  },
  metaTimestamp: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    flexShrink: 1,
    textAlign: 'right',
  },
  statusRow: {
    marginBottom: SCREEN_CHROME_DETAIL_STATUS_MARGIN_BOTTOM,
  },
  chip: { backgroundColor: colors.SECONDARY },
  locationBanner: { marginBottom: 20 },
  locationScopeSummary: {
    flex: 1,
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
  contentSection: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  sectionLabelHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.CARD_BORDER,
    paddingBottom: 8,
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.DARK_GRAY,
    textTransform: 'capitalize',
  },
  bodyText: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.TEXT_DARK, lineHeight: 22 },
  questionerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  questionerBody: { flex: 1, minWidth: 0 },
  questionerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionerName: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
  viewProfileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  questionerRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  ratingText: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_XS, color: colors.MEDIUM_GRAY },
  viewProfileHint: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.PRIMARY,
  },
  actionArea: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.CARD_BORDER
  },
  infoBox: {
    backgroundColor: colors.CARD_BG,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoText: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.TEXT_DARK, lineHeight: 20 },
  infoOpenChatBtn: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.CARD_BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoOpenChatBtnText: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.PRIMARY,
  },
  requestSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.CARD_BORDER,
  },
  sectionHeader: {
    gap: 8,
    marginBottom: 16,
    paddingVertical: 4,
    marginHorizontal: -4,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  sectionHeaderPressed: {
    backgroundColor: colors.CARD_BG,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.CARD_BG,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCollapsedHint: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    lineHeight: 20,
  },
  // Detached from layout flow so the animated wrapper owns the height while
  // this view measures at its natural size.
  sectionMeasure: {
    position: 'absolute',
    width: '100%',
  },
  requestSectionContent: {},
  sectionTitle: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.PRIMARY,
  },
  sectionDescription: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    lineHeight: 22,
  },
  sectionNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: colors.PRIMARY,
    marginTop: 4,
  },
  sectionNoteText: {
    flex: 1,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.DARK_GRAY,
    lineHeight: 22,
  },
  sectionEmptyText: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    lineHeight: 22,
    paddingVertical: 8,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.CARD_BORDER,
  },
  requestRowLast: {
    borderBottomWidth: 0,
  },
  responderIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 12,
  },
  responderIdentityText: {
    flex: 1,
  },
  responderRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  openChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openChatBtnText: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.PRIMARY,
  },
  requestInfo: { flex: 1 },
  requestName: { fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_SMALL, color: colors.TEXT_DARK },
  requestActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { backgroundColor: colors.PRIMARY, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  acceptBtnText: { fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_SMALL, color: colors.BG_WHITE },
  rejectBtn: { borderWidth: 1, borderColor: colors.CARD_BORDER, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  rejectBtnText: { fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_SMALL, color: colors.DARK_GRAY },
  rejectionReason: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY, marginTop: 4, lineHeight: 20 },
  unblockBtn: { borderWidth: 1, borderColor: colors.PRIMARY, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  unblockBtnText: { fontFamily: 'roboto-medium', fontSize: fonts.FONT_SIZE_SMALL, color: colors.PRIMARY },
  emptyText: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY, textAlign: 'center', marginTop: 20 },
  modalSheet: { backgroundColor: colors.BG_WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontFamily: 'roboto-bold', fontSize: fonts.FONT_SIZE_MEDIUM, color: colors.TEXT_DARK, marginBottom: 4 },
  modalSubtitle: { fontFamily: 'roboto', fontSize: fonts.FONT_SIZE_SMALL, color: colors.MEDIUM_GRAY, marginBottom: 16 },
  presetWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: BORDER_RADIUS_INPUT,
    padding: 12,
    minHeight: 80,
    marginBottom: 16,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    textAlignVertical: 'top',
  },
});
