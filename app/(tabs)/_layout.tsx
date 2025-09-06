import { colors } from '@/constants/colors';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
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
          height: 100,
          backgroundColor: colors.DARK_WHITE
        }
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: 'Home',
          headerShown: false, // comment this out to show 'Home' as title of this page. Note if Tabs.Screen is not provided for the rest of the routes (Question, Settings, etc), they will show by default
          tabBarIcon: ({ focused, size }) => <Ionicons name="home-outline" size={size} color={focused ? colors.ACTIVE : colors.PRIMARY} />
        }}
      />
      <Tabs.Screen
        name="Questions"
        options={{
          title: 'Questions',
          headerShown: false, // comment this out to show 'Home' as title of this page. Note if Tabs.Screen is not provided for the rest of the routes (Questions, Settings, etc), they will show by default
          tabBarIcon: ({ focused, size }) => <FontAwesome6 name="person-circle-question" size={size} color={focused ? colors.ACTIVE : colors.PRIMARY} />,
          tabBarLabel: 'Questions'
        }}
      />
      <Tabs.Screen
        name="Settings"
        options={{
          title: 'Settings',
          // headerShown: false, // comment this out to show 'Home' as title of this page. Note if Tabs.Screen is not provided for the rest of the routes (Question, Settings, etc), they will show by default
          tabBarIcon: ({ focused, size }) => <Ionicons name="settings-outline" size={size} color={focused ? colors.ACTIVE : colors.PRIMARY} />,
          tabBarLabel: 'Settings'
        }}
      />
    </Tabs>
  );
};

export default _layout;

