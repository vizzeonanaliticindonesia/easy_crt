import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';
import SessionCard from '@/components/SessionCard';
import { AppEmptyState, AppPageHeader, useResponsiveSpacing } from '@/components/ui/AppPrimitives';

import {
  getDashboardData,
} from '@/lib/services/school';
import { useAuth } from '@/contexts/AuthContext';
import { useIsFocused } from '@react-navigation/native';

export default function TeacherSessions() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const spacing = useResponsiveSpacing();
  const isFocused = useIsFocused();

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await getDashboardData();
      setSessions(res.data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused && user) {
      loadSessions();
    }
  }, [user, isFocused]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadSessions();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPad + spacing.topOffset }]}>
      <View style={{ paddingHorizontal: spacing.horizontal }}>
        <AppPageHeader title="My Sessions" style={styles.title} />
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.request_id}
        contentContainerStyle={{
          paddingHorizontal: spacing.horizontal,
          paddingBottom: spacing.bottomPadding,
        }}
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            userRole="teacher"
           onPress={() => router.push(`/session-detail?id=${item.request_id}`)}
            // 🔥 kirim action ke card
           
          />
        )}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <AppEmptyState
            icon="calendar-outline"
            title="No sessions found"
            subtitle="Your teaching sessions will appear here"
            padding={spacing.cardPadding}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  title: {
    marginBottom: 10,
  },
});