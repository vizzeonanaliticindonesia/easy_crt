import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/contexts/SessionContext';
import { Colors } from '@/constants/Colors';
import SessionCard from '@/components/SessionCard';
import { AppEmptyState, AppPageHeader, useResponsiveSpacing } from '@/components/ui/AppPrimitives';
import { getDashboardData } from '@/lib/services/school';
import { useIsFocused } from '@react-navigation/native';


export default function SchoolSessions() {
	const { user } = useAuth();
	const { getSessionsForUser } = useSession();
	const isFocused = useIsFocused();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const topPad = Platform.OS === 'web' ? 67 : insets.top;
	const spacing = useResponsiveSpacing();

	const [sessions, setSessions] = useState<any[]>([]);
	const [refreshing, setRefreshing] = useState(false);

	const loadSessions = async () => {
		try {
			const sessionsData = await getDashboardData();
			setSessions(sessionsData.data);
		} catch (err) {
			console.error('Error fetching sessions:', err);
		}
	};

	useEffect(() => {
		if (isFocused) {
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
				keyExtractor={(item) => item.id}
				contentContainerStyle={[styles.list, { paddingHorizontal: spacing.horizontal, paddingBottom: spacing.bottomPadding }]}
				scrollEnabled={sessions.length > 0}
				refreshing={refreshing}
				onRefresh={onRefresh}
				renderItem={({ item }) => (
					<SessionCard
						session={item}
						userRole="school"
						onPress={() => router.push({ pathname: '/session-detail', params: { id: item.id } })}
					/>
				)}
				ListEmptyComponent={
					<AppEmptyState
						icon="calendar-outline"
						title="No sessions yet"
						subtitle="Create a teaching session to get started"
						padding={spacing.cardPadding}
					/>
				}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background },
	title: { marginBottom: 8 },
	list: { paddingBottom: 100 },
});
