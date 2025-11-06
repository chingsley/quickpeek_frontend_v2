import HistoryItem from '@/components/HistoryItem';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { getInboxQuestions, getOutboxQuestions } from '@/services/questions.services';
import { useQuestionStore } from '@/store/question.store';
import { QuestionStatus, TQuestion } from '@/types/question.types';
import { TabType } from '@/types/ui.types';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

  const { inboxQuestions, outboxQuestions, setInboxQuestions, setOutboxQuestions } = useQuestionStore();

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);

      try {
        const [inboxData, outBoxData] = await Promise.all([getInboxQuestions(), getOutboxQuestions()]);
        setInboxQuestions(inboxData);
        setOutboxQuestions(outBoxData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch questions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [setInboxQuestions, setOutboxQuestions]);

  const openModal = () => { };
  const newQuestionsCount = inboxQuestions.filter((q) => q.status === QuestionStatus.New).length;

  const handleHistoryItemClick = (item: TQuestion) => {
    if (activeTab === TabType.Inbox) {
      if (item.status === QuestionStatus.New) {
        router.push({
          pathname: '/answer',
          params: {
            address: item.address,
            questionText: item.text,
            createdAt: item.createdAt,
            longitude: item.longitude,
            latitude: item.latitude
          },
        });
      } else {
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
            responderUsername: item.responderUsername,
          },
        });
      }
    } else {
      // An outbox history item is clicked
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
          responderUsername: item.responderUsername,
          isOutbox: 'true',
          isPending: item.status === QuestionStatus.Pending ? 'true' : 'false',
        },
      });
    }
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
        renderItem={({ item }) => (
          <View style={styles.qnItemContainer}>
            <View style={styles.historyItemBox}>
              <HistoryItem
                onClick={() => handleHistoryItemClick(item)}
                {...item}
                status={item.status as QuestionStatus}
                activeTab={activeTab}
              />
            </View>
            {activeTab === TabType.Outbox && (
              <Pressable
                style={styles.arrowRotateIconBtn}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/Home',
                    params: {
                      questionText: item.text,
                      address: item.address,
                      longitude: item.longitude,
                      latitude: item.latitude
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
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.pageContentContainer}>
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Questions</Text>
          <Pressable onPress={openModal}>
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
                {newQuestionsCount > 0 && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>{newQuestionsCount}</Text>
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
    flex: 1, // forces the question text to wrap if length is too long
    marginRight: 10,
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
});