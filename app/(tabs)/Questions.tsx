// app / (tabs) / Questions.tsx

import HistoryItem from '@/components/HistoryItem';
import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { questionService } from '@/services';
import SocketService from '@/services/socket.services';
import { useQuestionStore } from '@/store/question.store';
import { QuestionStatus, TQuestion } from '@/types/question.types';
import { TabType } from '@/types/ui.types';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Questions = () => {
  const [activeTab, setActiveTab] = useState(TabType.Inbox);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const inboxQuestions = useQuestionStore((state) => state.inboxQuestions);
  const outboxQuestions = useQuestionStore((state) => state.outboxQuestions);
  const setInboxQuestions = useQuestionStore((state) => state.setInboxQuestions);
  const prependInboxQuestion = useQuestionStore((state) => state.prependInboxQuestion);
  const updateInboxQuestion = useQuestionStore((state) => state.updateInboxQuestion);
  const updateOutboxQuestion = useQuestionStore((state) => state.updateOutboxQuestion);
  const setOutboxQuestions = useQuestionStore((state) => state.setOutboxQuestions);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const [assignedQuestions, answeredQuestions, postedQuestions] = await Promise.all([
        questionService.getAssignedQuestions(),
        questionService.getInboxQuestions(),
        questionService.getOutboxQuestions(),
      ]);
      setInboxQuestions([...assignedQuestions, ...answeredQuestions]);
      setOutboxQuestions(postedQuestions);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch questions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

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

      const handleExpired = (payload: { questionId: string }) => {
        updateOutboxQuestion(payload.questionId, { status: QuestionStatus.Expired });
        Alert.alert(
          'No response in time',
          'Your responder did not answer in time. You can re-choose someone else.',
          [{ text: 'Re-choose responder', onPress: () => handleRechooseFromExpired(payload.questionId) }],
        );
      };

      socket.on('question:update', handleUpdate);
      socket.on('question:new', handleNewQuestion);
      socket.on('question:expired', handleExpired);
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
      }
    };
  }, []);

  const assignedCount = inboxQuestions.filter((q) => q.status === QuestionStatus.Assigned).length;

  const handleRechooseFromExpired = (questionId?: string) => {
    const item = outboxQuestions.find((q) => q.id === questionId) ||
      outboxQuestions.find((q) => q.status === QuestionStatus.Expired);
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
  };

  const handleHistoryItemClick = (item: TQuestion) => {
    if (activeTab === TabType.Inbox) {
      if (item.status === QuestionStatus.Assigned || item.status === QuestionStatus.Answered) {
        router.push({
          pathname: '/answer',
          params: {
            id: item.id,
            address: item.address,
            questionText: item.text,
            createdAt: item.createdAt,
            assignedAt: item.assignedAt || item.createdAt,
            timeToRespondMs: String(item.timeToRespondMs || 600000),
            status: item.status,
            answer: item.answer || '',
            answerImageUrl: item.answerImageUrl || '',
            readOnly: item.status === QuestionStatus.Answered ? 'true' : 'false',
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
      handleRechooseFromExpired(item.id);
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
      return <ActivityIndicator size="large" color={colors.PRIMARY} />;
    }

    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }

    const data = activeTab === TabType.Inbox ? inboxQuestions : outboxQuestions;

    return (
      <FlatList
        style={styles.itemsContainer}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.qnItemContainer}>
            <View style={styles.historyItemBox}>
              <HistoryItem
                onClick={() => handleHistoryItemClick(item)}
                {...item}
                status={item.status as QuestionStatus}
                activeTab={activeTab}
              />
              {activeTab === TabType.Outbox && item.status === QuestionStatus.Expired && (
                <CustomButton
                  text="Re-choose responder"
                  onPress={() => handleRechooseFromExpired(item.id)}
                  style={styles.rechooseBtn}
                />
              )}
            </View>
            {activeTab === TabType.Outbox && item.status !== QuestionStatus.Expired && (
              <Pressable
                style={styles.arrowRotateIconBtn}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/Home',
                    params: {
                      questionText: item.text,
                      address: item.address,
                      longitude: item.longitude,
                      latitude: item.latitude,
                    },
                  })
                }
              >
                <View style={styles.arrowRotateIconBG}>
                  <FontAwesome6 name="arrow-rotate-left" size={16} color={colors.DARK_GRAY} />
                </View>
              </Pressable>
            )}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingTop: 20 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {activeTab === TabType.Inbox
              ? 'No assigned questions yet.'
              : 'You have not asked any questions yet.'}
          </Text>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.pageContentContainer}>
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Questions</Text>
          <Pressable onPress={() => {}}>
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
          {renderContent()}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Questions;

const styles = StyleSheet.create({
  safeAreaContainer: {
    height: '100%',
    backgroundColor: colors.BG_WHITE,
  },
  pageContentContainer: {
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
    marginBottom: 100,
  },
  tabContainer: {
    marginTop: 25,
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
  separator: {
    height: 1,
    backgroundColor: colors.LIGHT_GRAY,
    marginVertical: 20,
  },
  qnItemContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItemBox: {
    flex: 1,
    marginRight: 10,
  },
  rechooseBtn: {
    marginTop: 12,
  },
  arrowRotateIconBtn: {
    paddingVertical: 10,
    paddingLeft: 10,
  },
  arrowRotateIconBG: {
    padding: 8,
    borderRadius: '50%',
    backgroundColor: colors.LIGHT_GRAY_THIN,
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
