import HistoryItem from '@/components/HistoryItem';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { getMyQuestions } from '@/services/questions.services';
import { getIncomingRequests, getOutgoingRequests } from '@/services/requests.services';
import SocketService from '@/services/socket.services';
import { useQuestionStore } from '@/store/question.store';
import { useRequestStore } from '@/store/request.store';
import { AnswerRequestStatus, TAnswerRequest } from '@/types/answerRequest.types';
import { QuestionStatus, TQuestion } from '@/types/question.types';
import { TabType } from '@/types/ui.types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  const [activeTab, setActiveTab] = useState(TabType.MyQuestions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();

  const myQuestions = useQuestionStore((state) => state.myQuestions);
  const setMyQuestions = useQuestionStore((state) => state.setMyQuestions);
  const updateMyQuestion = useQuestionStore((state) => state.updateMyQuestion);
  const outgoingRequests = useRequestStore((state) => state.outgoingRequests);
  const setOutgoingRequests = useRequestStore((state) => state.setOutgoingRequests);
  const updateOutgoingRequest = useRequestStore((state) => state.updateOutgoingRequest);
  const prependIncomingRequest = useRequestStore((state) => state.prependIncomingRequest);
  const updateIncomingRequest = useRequestStore((state) => state.updateIncomingRequest);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [questions, outgoing] = await Promise.all([
        getMyQuestions(),
        getOutgoingRequests(),
      ]);
      setMyQuestions(questions);
      setOutgoingRequests(outgoing.items);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [setMyQuestions, setOutgoingRequests]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  useEffect(() => {
    if (params.tab === 'requests') {
      setActiveTab(TabType.MyRequests);
      router.setParams({ tab: '' });
    }
  }, [params.tab, router]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        fetchData();
        SocketService.connect();
      }
    });
    return () => subscription.remove();
  }, [fetchData]);

  useEffect(() => {
    let socket = SocketService.getSocket();
    let intervalId: ReturnType<typeof setInterval>;

    const setupListener = () => {
      if (!socket) return;

      socket.on('request:new', (payload: TAnswerRequest) => {
        prependIncomingRequest(payload);
        updateMyQuestion(payload.questionId, {
          requestCounts: {
            PENDING: ((myQuestions.find((q) => q.id === payload.questionId)?.requestCounts?.PENDING) ?? 0) + 1,
          },
        });
        fetchData();
      });

      socket.on('request:accepted', (payload: { requestId: string; questionId: string }) => {
        updateOutgoingRequest(payload.requestId, { status: AnswerRequestStatus.Accepted });
        fetchData();
      });

      socket.on('request:rejected', (payload: { requestId: string }) => {
        updateOutgoingRequest(payload.requestId, { status: AnswerRequestStatus.Rejected });
        fetchData();
      });

      socket.on('question:answered', (payload: { questionId: string }) => {
        updateMyQuestion(payload.questionId, { status: QuestionStatus.Answered });
        fetchData();
      });

      socket.on('question:cancelled', (payload: { questionId: string }) => {
        updateMyQuestion(payload.questionId, { status: QuestionStatus.Cancelled });
        fetchData();
      });
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
        socket.off('request:new');
        socket.off('request:accepted');
        socket.off('request:rejected');
        socket.off('question:answered');
        socket.off('question:cancelled');
      }
    };
  }, [fetchData, myQuestions, prependIncomingRequest, updateIncomingRequest, updateMyQuestion, updateOutgoingRequest]);

  const pendingIncomingCount = myQuestions.reduce(
    (sum, q) => sum + (q.requestCounts?.PENDING ?? 0),
    0,
  );

  const handleQuestionClick = (item: TQuestion) => {
    router.push({ pathname: '/question-detail', params: { questionId: item.id } });
  };

  const handleRequestClick = (item: TAnswerRequest) => {
    if (item.status === AnswerRequestStatus.Accepted) {
      router.push({ pathname: '/chat', params: { requestId: item.id } });
      return;
    }
    if (item.questionId) {
      router.push({ pathname: '/question-detail', params: { questionId: item.questionId } });
    }
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

    if (activeTab === TabType.MyQuestions) {
      return (
        <FlatList
          style={styles.itemsContainer}
          data={myQuestions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HistoryItem
              kind="question"
              item={item}
              onClick={() => handleQuestionClick(item)}
              displayName={item.title}
              profileImageUrl={null}
              isNew={(item.requestCounts?.PENDING ?? 0) > 0}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>You have not published any questions yet.</Text>
          }
        />
      );
    }

    return (
      <FlatList
        style={styles.itemsContainer}
        data={outgoingRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HistoryItem
            kind="request"
            item={item}
            onClick={() => handleRequestClick(item)}
            displayName={item.counterparty?.name || item.question?.title || 'Question'}
            profileImageUrl={item.counterparty?.profileImageUrl}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>You have not sent any answer requests yet.</Text>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.pageContentContainer}>
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Questions</Text>
          <Pressable onPress={() => router.push('/ask')}>
            <Ionicons name="add-circle-outline" size={28} color={colors.PRIMARY} />
          </Pressable>
        </View>
        <View style={styles.tabContainer}>
          <View style={styles.tabHeader}>
            <TouchableOpacity
              onPress={() => setActiveTab(TabType.MyQuestions)}
              style={[styles.tab, activeTab === TabType.MyQuestions && styles.activeTab]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.tabText, activeTab === TabType.MyQuestions && styles.activeTabText]}>
                  My Questions
                </Text>
                {pendingIncomingCount > 0 && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>{pendingIncomingCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab(TabType.MyRequests)}
              style={[styles.tab, activeTab === TabType.MyRequests && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === TabType.MyRequests && styles.activeTabText]}>
                My Requests
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listContainer}>{renderContent()}</View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Questions;

const styles = StyleSheet.create({
  safeAreaContainer: { flex: 1, backgroundColor: colors.BG_WHITE },
  pageContentContainer: { flex: 1, paddingVertical: 20, paddingHorizontal: 26 },
  titleSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontFamily: 'roboto-bold', fontSize: 28 },
  itemsContainer: { flex: 1 },
  listContainer: { flex: 1, minHeight: 0 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabContainer: { flex: 1, marginTop: 25, minHeight: 0 },
  tabHeader: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: colors.LIGHT_GRAY },
  tab: { paddingVertical: 10, marginRight: 20 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.PRIMARY },
  tabText: { fontFamily: 'roboto-medium', fontSize: 20, color: colors.DARK_GRAY },
  activeTabText: { color: colors.PRIMARY },
  listContent: { paddingTop: 4, paddingBottom: 100 },
  newBadge: {
    backgroundColor: colors.RED,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  newBadgeText: { color: colors.BG_WHITE, fontSize: fonts.FONT_SIZE_SMALL, fontWeight: 'bold' },
  errorText: { textAlign: 'center', marginTop: 20, color: colors.RED, fontSize: fonts.FONT_SIZE_SMALL },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
  },
});
