// app / (tabs) / Questions.tsx

import HistoryItem from '@/components/HistoryItem';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { questionService } from '@/services';
import SocketService from '@/services/socket.services';
import { useAuthStore } from '@/store/auth.store';
import { useQuestionStore } from '@/store/question.store';
import { useQuestionVisibilityStore } from '@/store/question-visibility.store';
import { useUserStore } from '@/store/user.store';
import { QuestionStatus, TQuestion } from '@/types/question.types';
import { TabType } from '@/types/ui.types';
import {
  filterAndSortQuestions,
  INBOX_FILTERS,
  isAssignmentTtrActive,
  isUnseenNewQuestion,
  OUTBOX_FILTERS,
  QUESTION_FILTER_LABELS,
  QuestionFilter,
  DEFAULT_TTR_MS,
} from '@/utils/questions';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Questions = () => {
  const [activeTab, setActiveTab] = useState(TabType.Inbox);
  const [activeFilter, setActiveFilter] = useState(QuestionFilter.All);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; }>();

  const inboxQuestions = useQuestionStore((state) => state.inboxQuestions);
  const outboxQuestions = useQuestionStore((state) => state.outboxQuestions);
  const setInboxQuestions = useQuestionStore((state) => state.setInboxQuestions);
  const prependInboxQuestion = useQuestionStore((state) => state.prependInboxQuestion);
  const updateInboxQuestion = useQuestionStore((state) => state.updateInboxQuestion);
  const updateOutboxQuestion = useQuestionStore((state) => state.updateOutboxQuestion);
  const setOutboxQuestions = useQuestionStore((state) => state.setOutboxQuestions);
  const removeInboxQuestion = useQuestionStore((state) => state.removeInboxQuestion);
  const seenQuestionIds = useQuestionVisibilityStore((state) => state.seenQuestionIds);
  const markQuestionSeen = useQuestionVisibilityStore((state) => state.markQuestionSeen);
  const authUser = useAuthStore((state) => state.user);
  const profile = useUserStore((state) => state.profile);

  const currentUserName = profile?.name || authUser?.name || 'You';
  const currentUserProfileImageUrl = profile?.profileImageUrl ?? authUser?.profileImageUrl ?? null;

  const getListItemMeta = useCallback((item: TQuestion) => {
    if (activeTab === TabType.Outbox) {
      return {
        displayName: currentUserName,
        profileImageUrl: item.questionerProfileImageUrl ?? currentUserProfileImageUrl,
      };
    }

    return {
      displayName: item.questionerName || item.questionerUsername || 'Questioner',
      profileImageUrl: item.questionerProfileImageUrl ?? null,
    };
  }, [activeTab, currentUserName, currentUserProfileImageUrl]);

  const pruneExpiredInboxAssignments = useCallback(() => {
    const currentInbox = useQuestionStore.getState().inboxQuestions;
    const prunedInbox = currentInbox.filter(
      (question) =>
        question.status === QuestionStatus.Answered || isAssignmentTtrActive(question),
    );

    if (prunedInbox.length !== currentInbox.length) {
      setInboxQuestions(prunedInbox);
    }
  }, [setInboxQuestions]);

  const handleRechooseFromExpired = useCallback((questionId?: string) => {
    const item = useQuestionStore.getState().outboxQuestions.find((q) => q.id === questionId) ||
      useQuestionStore.getState().outboxQuestions.find((q) => q.status === QuestionStatus.Expired);
    if (!item) return;

    router.push({
      pathname: '/responders',
      params: {
        latitude: String(item.latitude),
        longitude: String(item.longitude),
        address: item.address,
        reassignQuestionId: item.id,
      },
    });
  }, [router]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [assignedQuestions, answeredQuestions, postedQuestions] = await Promise.all([
        questionService.getAssignedQuestions(),
        questionService.getInboxQuestions(),
        questionService.getOutboxQuestions(),
      ]);
      setInboxQuestions([
        ...assignedQuestions.filter(isAssignmentTtrActive),
        ...answeredQuestions,
      ]);

      const apiOutboxIds = new Set(postedQuestions.map((question: TQuestion) => question.id));
      const optimisticOutbox = useQuestionStore
        .getState()
        .outboxQuestions.filter((question) => !apiOutboxIds.has(question.id));
      setOutboxQuestions([...postedQuestions, ...optimisticOutbox]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch questions. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [setInboxQuestions, setOutboxQuestions]);

  useFocusEffect(
    useCallback(() => {
      fetchQuestions();
      useUserStore.getState().fetchProfile();
    }, [fetchQuestions]),
  );

  useEffect(() => {
    if (params.tab === 'outbox') {
      setActiveTab(TabType.Outbox);
      router.setParams({ tab: '' });
    }
  }, [params.tab, router]);

  useEffect(() => {
    setActiveFilter(QuestionFilter.All);
  }, [activeTab]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        fetchQuestions();
        SocketService.connect();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let socket = SocketService.getSocket();
    let intervalId: ReturnType<typeof setInterval>;

    const setupListener = () => {
      if (!socket) return;

      const handleUpdate = (payload: any) => {
        const { questionId, status, answer, answerId } = payload;
        updateInboxQuestion(questionId, {
          status,
          ...(answer !== undefined ? { answer } : {}),
          ...(answerId !== undefined ? { answerId } : {}),
        });
        updateOutboxQuestion(questionId, {
          status,
          ...(answer !== undefined ? { answer } : {}),
          ...(answerId !== undefined ? { answerId } : {}),
        });
      };

      const handleNewQuestion = (newQuestionObj: TQuestion) => {
        prependInboxQuestion(newQuestionObj);
      };

      const handleExpired = (payload: { questionId: string; }) => {
        removeInboxQuestion(payload.questionId);
        updateOutboxQuestion(payload.questionId, { status: QuestionStatus.Expired });
        Alert.alert(
          'No response in time',
          'Your responder did not answer in time. You can re-choose someone else.',
          [{ text: 'Choose another responder', onPress: () => handleRechooseFromExpired(payload.questionId) }],
        );
      };

      const handleAssignmentExpired = (payload: { questionId: string; }) => {
        removeInboxQuestion(payload.questionId);
      };

      socket.on('question:update', handleUpdate);
      socket.on('question:new', handleNewQuestion);
      socket.on('question:expired', handleExpired);
      socket.on('question:assignment-expired', handleAssignmentExpired);
    };

    if (socket) {
      setupListener();
    } else {
      intervalId = setInterval(() => {
        socket = SocketService.getSocket();
        if (socket) {
          clearInterval(intervalId);
          setupListener();
        }
      }, 500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (socket) {
        socket.off('question:update');
        socket.off('question:new');
        socket.off('question:expired');
        socket.off('question:assignment-expired');
      }
    };
  }, [handleRechooseFromExpired, prependInboxQuestion, removeInboxQuestion, updateInboxQuestion, updateOutboxQuestion]);

  useEffect(() => {
    pruneExpiredInboxAssignments();
    const intervalId = setInterval(pruneExpiredInboxAssignments, 15000);
    return () => clearInterval(intervalId);
  }, [pruneExpiredInboxAssignments]);

  const assignedCount = inboxQuestions.filter(
    (question) => isUnseenNewQuestion(question, TabType.Inbox, seenQuestionIds),
  ).length;
  const availableFilters = activeTab === TabType.Inbox ? INBOX_FILTERS : OUTBOX_FILTERS;

  const displayedQuestions = useMemo(
    () =>
      filterAndSortQuestions(
        activeTab === TabType.Inbox ? inboxQuestions : outboxQuestions,
        activeFilter,
        activeTab,
        seenQuestionIds,
      ),
    [activeFilter, activeTab, inboxQuestions, outboxQuestions, seenQuestionIds],
  );

  const getEmptyListMessage = () => {
    if (activeFilter !== QuestionFilter.All) {
      return `No ${QUESTION_FILTER_LABELS[activeFilter].toLowerCase()} questions found.`;
    }

    return activeTab === TabType.Inbox
      ? 'No assigned questions yet.'
      : 'You have not asked any questions yet.';
  };

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {availableFilters.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {QUESTION_FILTER_LABELS[filter]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const handleHistoryItemClick = (item: TQuestion) => {
    markQuestionSeen(item.id);

    if (activeTab === TabType.Inbox) {
      if (item.status === QuestionStatus.Answered) {
        router.push({
          pathname: '/answer',
          params: {
            id: item.id,
            address: item.address,
            questionText: item.text,
            createdAt: item.createdAt,
            assignedAt: item.assignedAt || item.createdAt,
            timeToRespondMs: String(item.timeToRespondMs || DEFAULT_TTR_MS),
            status: item.status,
            answer: item.answer || '',
            answerImageUrl: item.answerImageUrl || '',
            readOnly: 'true',
          },
        });
        return;
      }

      if (isAssignmentTtrActive(item)) {
        router.push({
          pathname: '/answer',
          params: {
            id: item.id,
            address: item.address,
            questionText: item.text,
            createdAt: item.createdAt,
            assignedAt: item.assignedAt as string,
            timeToRespondMs: String(item.timeToRespondMs ?? DEFAULT_TTR_MS),
            status: item.status,
            answer: item.answer || '',
            answerImageUrl: item.answerImageUrl || '',
            readOnly: 'false',
          },
        });
        return;
      }

      router.push({
        pathname: '/question-detail',
        params: {
          address: item.address,
          questionText: item.text,
          longitude: item.longitude,
          latitude: item.latitude,
          createdAt: item.createdAt,
          answer: item.answer,
          answerRating: item.answerRating,
          answerId: item.answerId,
          responderUsername: item.responderUsername,
          responderId: item.responderId,
          responderAverageRating: item.responderAverageRating,
        },
      });
      return;
    }

    if (item.status === QuestionStatus.Expired) {
      router.push({
        pathname: '/question-detail',
        params: {
          questionId: item.id,
          address: item.address,
          questionText: item.text,
          longitude: item.longitude,
          latitude: item.latitude,
          createdAt: item.createdAt,
          answer: item.answer,
          answerRating: item.answerRating,
          answerId: item.answerId,
          responderUsername: item.responderUsername,
          responderId: item.responderId,
          responderAverageRating: item.responderAverageRating,
          isOutbox: 'true',
          isExpired: 'true',
        },
      });
      return;
    }

    router.push({
      pathname: '/question-detail',
      params: {
        address: item.address,
        questionText: item.text,
        longitude: item.longitude,
        latitude: item.latitude,
        createdAt: item.createdAt,
        answer: item.answer,
        answerRating: item.answerRating,
        answerId: item.answerId,
        responderUsername: item.responderUsername,
        responderId: item.responderId,
        responderAverageRating: item.responderAverageRating,
        isOutbox: 'true',
        isPending: item.status === QuestionStatus.Assigned ? 'true' : 'false',
      },
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      );
    }

    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }

    const data = displayedQuestions;

    return (
      <FlatList
        style={styles.itemsContainer}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const { displayName, profileImageUrl } = getListItemMeta(item);
          return (
            <HistoryItem
              onClick={() => handleHistoryItemClick(item)}
              {...item}
              status={item.status as QuestionStatus}
              activeTab={activeTab}
              displayName={displayName}
              profileImageUrl={profileImageUrl}
              isNew={isUnseenNewQuestion(item, activeTab, seenQuestionIds)}
            />
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>{getEmptyListMessage()}</Text>}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.pageContentContainer}>
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Questions</Text>
          <Pressable onPress={() => { }}>
            <Ionicons name="information-circle-outline" size={28} color={colors.DARK_GRAY} />
          </Pressable>
        </View>
        <View style={styles.tabContainer}>
          <View style={styles.tabHeader}>
            <TouchableOpacity
              onPress={() => setActiveTab(TabType.Inbox)}
              style={[styles.tab, activeTab === TabType.Inbox && styles.activeTab]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.tabText, activeTab === TabType.Inbox && styles.activeTabText]}>
                  Inbox
                </Text>
                {assignedCount > 0 && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>{assignedCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab(TabType.Outbox)}
              style={[styles.tab, activeTab === TabType.Outbox && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === TabType.Outbox && styles.activeTabText]}>
                Outbox
              </Text>
            </TouchableOpacity>
          </View>
          {renderFilterChips()}
          <View style={styles.listContainer}>{renderContent()}</View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Questions;

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: colors.BG_WHITE,
  },
  pageContentContainer: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 26,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontFamily: 'roboto-bold',
    fontSize: 28,
  },
  itemsContainer: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    minHeight: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flex: 1,
    marginTop: 25,
    minHeight: 0,
  },
  tabHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: colors.LIGHT_GRAY,
  },
  tab: {
    paddingVertical: 10,
    marginRight: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.PRIMARY,
  },
  tabText: {
    fontFamily: 'roboto-medium',
    fontSize: 20,
    color: colors.DARK_GRAY,
  },
  activeTabText: {},
  filterContainer: {
    flexShrink: 0,
    flexGrow: 0,
  },
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
    minHeight: 44,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.LIGHT_GRAY,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.BG_WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  filterChipActive: {
    borderColor: colors.PRIMARY,
    backgroundColor: colors.LIGHT_GREEN,
  },
  filterChipText: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.DARK_GRAY,
    lineHeight: 18,
  },
  filterChipTextActive: {
    color: colors.PRIMARY,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 100,
  },
  newBadge: {
    backgroundColor: colors.RED,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  newBadgeText: {
    color: colors.BG_WHITE,
    fontSize: fonts.FONT_SIZE_SMALL,
    fontWeight: 'bold',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    color: colors.RED,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
  },
});
