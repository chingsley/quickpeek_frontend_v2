import { colors } from '@/constants/colors';
import HomeDrawerLayout from '@/components/HomeDrawerLayout';
import { selectIsLoggedIn, useAuthStore } from '@/store/auth.store';
import { useQuestionStore } from '@/store/question.store';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const TabLayout = () => {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isLoggedIn = useAuthStore(selectIsLoggedIn);
  const myQuestions = useQuestionStore((state) => state.myQuestions);

  const pendingCount = myQuestions.reduce(
    (sum, q) => sum + (q.requestCounts?.PENDING ?? 0),
    0,
  );

  if (!hasHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/signin" />;
  }

  return (
    <HomeDrawerLayout>
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
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
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
    </HomeDrawerLayout>
  );
};

export default TabLayout;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.BG_WHITE,
  },
});
