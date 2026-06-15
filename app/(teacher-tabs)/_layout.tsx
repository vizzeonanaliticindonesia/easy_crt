import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/contexts/SessionContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function TeacherTabLayout() {
  const { user } = useAuth();
   const verificationStatus = Number((user as any)?.verification_status ?? 1);
  const profileOnly = verificationStatus !== 1;
  const { getUnreadCount } = useSession();
  const unreadCount = user ? getUnreadCount(user.id) : 0;
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.tabBarBg,
          borderTopColor: Colors.border,

          // height: Platform.OS === 'web' ? 84 : 60,
          // paddingBottom: Platform.OS === 'web' ? 34 : 8,
          // paddingTop: 8,
          height: 60 + insets.bottom, // ⬅️ biar ikut tinggi safe area
          paddingBottom: insets.bottom, // ⬅️ ini kunci biar ga ketutup
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: profileOnly ? null : undefined,
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          href: profileOnly ? null : undefined,
          title: 'Sessions',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
       <Tabs.Screen
        name="documents"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="subjects"
        options={{
          // href: null,
          href: profileOnly ? null : null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          // href: null,
          href: profileOnly ? null : null,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          href: profileOnly ? null : undefined,
          title: 'Earnings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
