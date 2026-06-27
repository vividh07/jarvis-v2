import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import ChatScreen from '../screens/ChatScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useSocket } from '../hooks/useSocket';
import { useNotifications } from '../hooks/useNotifications';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const Tab = createBottomTabNavigator();

const TAB_LABELS: Record<string, string> = {
  Chat: 'Chat',
  Dashboard: 'Home',
  History: 'History',
  Settings: 'Settings',
};

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const icons: Record<string, string> = {
    Chat: '💬',
    Dashboard: '🏠',
    History: '🕓',
    Settings: '⚙️',
  };
  return (
    <View style={styles.iconWrap}>
      <Text style={styles.iconEmoji}>{icons[name]}</Text>
      <Text
        numberOfLines={1}
        style={[styles.iconLabel, { color: focused ? colors.accent.cyan : colors.text.muted }]}
      >
        {TAB_LABELS[name] ?? name}
      </Text>
    </View>
  );
};

export default function TabNavigator() {
  useSocket();
  useNotifications();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarItemStyle: styles.tabBarItem,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Chat" focused={focused} /> }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Dashboard" focused={focused} /> }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="History" focused={focused} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Settings" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bg.secondary,
    borderTopColor: colors.border.default,
    borderTopWidth: 1,
    height: 64,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    gap: 3,
  },
  iconEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  iconLabel: {
    fontSize: 10,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
});
