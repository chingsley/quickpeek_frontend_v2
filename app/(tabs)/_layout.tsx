import { colors } from '@/constants/colors';
import { useQuestionStore } from '@/store/question.store';
import { QuestionStatus } from '@/types/question.types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';

const TabLayout = () => {
  const assignedCount = useQuestionStore((state) =>
    state.inboxQuestions.filter((q) => q.status === QuestionStatus.Assigned).length,
  );

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 2,
          color: colors.PRIMARY,
        },
        tabBarStyle: {
          borderTopWidth: 2,
          borderTopColor: colors.LIGHT_GRAY,
          height: 100,
          paddingTop: 10,
          paddingBottom: 10,
          backgroundColor: colors.BG_WHITE,
        },
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ focused, size }) =>
            focused ? (
              <Ionicons name="home" size={size} color={colors.PRIMARY} />
            ) : (
              <Ionicons name="home-outline" size={size} color={colors.PRIMARY} />
            ),
        }}
      />
      <Tabs.Screen
        name="Questions"
        options={{
          title: 'Questions',
          headerShown: false,
          tabBarBadge: assignedCount > 0 ? assignedCount : undefined,
          tabBarIcon: ({ focused, size }) =>
            focused ? (
              <Ionicons name="list-circle" size={size + 5} color={colors.PRIMARY} />
            ) : (
              <Ionicons name="list-circle-outline" size={size + 5} color={colors.PRIMARY} />
            ),
          tabBarLabel: 'Questions',
        }}
      />
      <Tabs.Screen
        name="Settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, size }) =>
            focused ? (
              <Ionicons name="settings" size={size} color={colors.PRIMARY} />
            ) : (
              <Ionicons name="settings-outline" size={size} color={colors.PRIMARY} />
            ),
          tabBarLabel: 'Settings',
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
