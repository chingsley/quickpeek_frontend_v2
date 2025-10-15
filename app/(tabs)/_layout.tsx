import { colors } from '@/constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';

const _layout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 2,
          color: colors.PRIMARY,
        },
        tabBarItemStyle: {
          // borderWidth: 1,
        },
        tabBarStyle: {
          // borderWidth: 1,
          // borderColor: 'red',
          borderTopWidth: 2,
          borderTopColor: colors.LIGHT_GRAY,
          height: 100,
          paddingTop: 10,
          paddingBottom: 10,
          backgroundColor: colors.BG_WHITE,
          // display: 'none', // to hide the bottom tabs
        }
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: 'Home',
          headerShown: false, // comment this out to show 'Home' as title of this page. Note if Tabs.Screen is not provided for the rest of the routes (Question, Settings, etc), they will show by default
          tabBarIcon: ({ focused, size }) =>
            focused ? <Ionicons name="home" size={size} color={colors.PRIMARY} /> :
              <Ionicons name="home-outline" size={size} color={colors.PRIMARY} />
        }}
      />
      <Tabs.Screen
        name="Questions"
        options={{
          title: 'Questions',
          headerShown: false, // comment this out to show 'Home' as title of this page. Note if Tabs.Screen is not provided for the rest of the routes (Questions, Settings, etc), they will show by default
          tabBarIcon: ({ focused, size }) =>
            focused ? <Ionicons name="list-circle" size={size + 5} color={colors.PRIMARY} /> :
              <Ionicons name="list-circle-outline" size={size + 5} color={colors.PRIMARY} />,
          tabBarLabel: 'Questions'
        }}
      />
      <Tabs.Screen
        name="Settings"
        options={{
          title: 'Settings',
          // headerShown: false, // comment this out to show 'Home' as title of this page. Note if Tabs.Screen is not provided for the rest of the routes (Question, Settings, etc), they will show by default
          tabBarIcon: ({ focused, size }) =>
            focused ? <Ionicons name="settings" size={size} color={colors.PRIMARY} /> :
              <Ionicons name="settings-outline" size={size} color={colors.PRIMARY} />,
          tabBarLabel: 'Settings'
        }}
      />
    </Tabs>
  );
};

export default _layout;

