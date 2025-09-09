import questions from '@/_playground/questions.json';
import HistoryItem from '@/components/HistoryItem';
import { colors } from '@/constants/colors';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Questions = () => {
  const [activeTab, setActiveTab] = useState('Inbox');
  const router = useRouter();

  const openModal = () => { };

  const newQuestions = questions.slice(0, 3);
  const pastQuestions = questions.slice(3);
  const newQuestionsCount = newQuestions.filter(q => q.isNew).length;

  const handleHistoryItemClick = (item: (typeof questions)[0]) => {
    if (activeTab === 'Inbox') {
      router.push({
        pathname: '/answer',
        params: {
          address: item.address,
          question: item.content,
          createdAt: item.createdAt,
        },
      });
    } else {
      console.log(item.address, ' - ', item.content);
    }
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
            <TouchableOpacity onPress={() => setActiveTab('Inbox')} style={[styles.tab, activeTab === 'Inbox' && styles.activeTab]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.tabText, activeTab === 'Inbox' && styles.activeTabText]}>Inbox</Text>
                {newQuestionsCount > 0 && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>{newQuestionsCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('Outbox')} style={[styles.tab, activeTab === 'Outbox' && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === 'Outbox' && styles.activeTabText]}>Outbox</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={activeTab === 'Inbox' ? newQuestions : pastQuestions}
            renderItem={({ item }) => (
              <View style={styles.qnItemContainer}>
                <HistoryItem
                  onClick={() => handleHistoryItemClick(item)}
                  question={item.content}
                  address={item.address}
                  createdAt={item.createdAt}
                />
                {item.isNew && activeTab === 'Inbox' && <Text style={styles.newTag}>new</Text>}
                {activeTab === 'Outbox' && <Pressable style={styles.arrowRotateIconBtn}>
                  <View style={styles.arrowRotateIconBG}>
                    <FontAwesome6 name="arrow-rotate-left" size={16} color={colors.DARK_GRAY} />
                  </View>
                </Pressable>}
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={{ paddingTop: 20 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Questions;

const styles = StyleSheet.create({
  safeAreaContainer: {
    height: '100%',
    backgroundColor: colors.BG_WHITE
  },
  pageContentContainer: {
    paddingVertical: 20,
    paddingHorizontal: 26,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  pageTitle: {
    fontFamily: 'roboto-bold',
    fontSize: 28,
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
  activeTabText: {

  },
  separator: {
    height: 1,
    backgroundColor: colors.LIGHT_GRAY,
    marginVertical: 20,
  },
  qnItemContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  arrowRotateIconBtn: {
    padding: 10,
  },
  arrowRotateIconBG: {
    padding: 8,
    borderRadius: '50%',
    backgroundColor: colors.LIGHT_GRAY_THIN,

  },
  newBadge: {
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 12,
  },
  newTag: {
    color: 'red',
    fontSize: 16,
    fontFamily: 'roboto-bold',
  },
});