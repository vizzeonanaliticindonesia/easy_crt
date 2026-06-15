import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/contexts/SessionContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function SchoolTabLayout() {
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
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.tabBarBg,
          borderTopColor: Colors.border,

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
        name="teachers"
        options={{
          href: profileOnly ? null : undefined,
          title: 'Teachers',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          // href: null,
          href: profileOnly ? null : null,
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          href: profileOnly ? null : undefined,
          title: 'Invoices',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />
      {/* <Tabs.Screen
        name="documents"
        options={{
          href: null,
          // href: profileOnly ? null : undefined,
        }}
      /> */}
      <Tabs.Screen
        name="notifications"
        options={{
          // href: null,
          href: profileOnly ? null : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
