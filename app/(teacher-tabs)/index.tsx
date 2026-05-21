import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/contexts/SessionContext';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons'
import SessionCard from '@/components/SessionCard';
import {
	AppEmptyState,
	AppIconButton,
	AppPageHeader,
	AppSectionHeader,
	AppStatCard,
	useResponsiveSpacing,
} from '@/components/ui/AppPrimitives';
import { getDashboardData } from '@/lib/services/school';
import { getNotifications } from '@/lib/services/teacher';
import { useIsFocused } from '@react-navigation/native';

export default function TeacherDashboard() {
	const { user } = useAuth();
	const { getSessionsForUser, getUnreadCount } = useSession();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const topPad = Platform.OS === 'web' ? 67 : insets.top;
	const spacing = useResponsiveSpacing();
	const isFocused = useIsFocused();
	

	const [sessions, setSessions] = useState<any[]>([]);
	const [statusCounts, setStatusCounts] = useState<any>('');
	const [unreadCount, setUnreadCount] = useState<number>(0);
	const [refreshing, setRefreshing] = useState(false);
	const refreshData = async () => {
		try {
			const res = await getDashboardData();
			setSessions(res.data);
			setStatusCounts(res);
			const notifications = await getNotifications();
			setUnreadCount(notifications.unread_count);
		}	catch (err) {
			console.error('Error refreshing data:', err);
		}
	}
	useEffect(() => {
		const fetchSessions = async () => {
			try {
				const res = await getDashboardData();
				const notifications = await getNotifications();
				setUnreadCount(notifications.unread_count);
				setSessions(res.data);
				setStatusCounts(res);
			} catch (err) {
				console.error(err);
			}
		};

		if (user && isFocused) {
			fetchSessions();
		}
	}, [user, isFocused]);

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await refreshData();
		} finally {
			setRefreshing(false);
		}
	};
	// const activeSessions = sessions.filter((s) => !['reviewed', 'declined', 'payment_confirmed'].includes(s.status));
	// const pendingSessions = sessions.filter((s) => s.status === 'pending');

	return (
		<ScrollView
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} progressBackgroundColor={Colors.surface} />}
			style={styles.container}
			contentContainerStyle={[
				styles.content,
				{
					paddingTop: topPad + spacing.topOffset,
					paddingHorizontal: spacing.horizontal,
					paddingBottom: spacing.bottomPadding,
				},
			]}
		>
			<View style={styles.header}>
				<AppPageHeader
					title="Hello,"
					subtitle={user?.teacherName || 'Teacher'}
					titleStyle={styles.greetingHello}
					subtitleStyle={styles.greetingName}
					style={styles.greetingBlock}
				/>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
  
  					{/* REFRESH */}
					<TouchableOpacity 
						onPress={refreshData} 
						style={styles.refreshBtn}
					>
						<Ionicons name="refresh" size={spacing.iconGlyphSize} />
					</TouchableOpacity>
					
					<View style={styles.notifWrap}>
						<AppIconButton
							icon="notifications-outline"
							size={spacing.iconGlyphSize}
							containerSize={spacing.iconButtonSize}
							onPress={() => router.push('/(teacher-tabs)/notifications')}
						/>
						{unreadCount > 0 && (
							<View style={styles.badge}>
								<Text style={styles.badgeText}>{unreadCount}</Text>
							</View>
						)}
					</View>
				</View>
			</View>

			<View style={[styles.statsRow, { gap: spacing.sectionGap - 4 }]}>
				<AppStatCard icon="calendar" label="Active" value={statusCounts.active} color={Colors.primary} style={styles.statBox} />
				<AppStatCard icon="hourglass" label="Pending" value={statusCounts.pending} color={Colors.statusPending} style={styles.statBox} />
				<AppStatCard icon="checkmark-circle" label="Completed" value={statusCounts.completed} color={Colors.statusComplete} style={styles.statBox} />
			</View>

			<View style={styles.section}>
				<AppSectionHeader
					title="Recent Sessions"
					actionLabel="See All"
					actionColor={Colors.primary}
					onActionPress={() => router.push('/(teacher-tabs)/sessions')}
				/>
				{sessions.length === 0 ? (
					<AppEmptyState
						icon="calendar-outline"
						title="No sessions yet"
						subtitle="When schools send you requests, they'll appear here"
						padding={spacing.cardPadding}
					/>
				) : (
					sessions.slice(0, 3).map((session) => (
						<SessionCard
							key={session.request_id}
							session={session}
							userRole="teacher"
							onPress={() => router.push({ pathname: '/session-detail', params: { id: session.request_id } })}
						/>
					))
				)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	refreshBtn: {
		padding: 6,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
	container: { flex: 1, backgroundColor: Colors.background },
	content: { paddingBottom: 100 },
	header: {
		flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
		marginBottom: 24,
	},
	greetingBlock: { marginBottom: 0 },
	greetingHello: {
		fontSize: 14,
		fontWeight: '600' as const,
		color: Colors.textSecondary,
	},
	greetingName: {
		fontSize: 28,
		fontWeight: '800' as const,
		color: Colors.text,
	},
	notifWrap: { position: 'relative' },
	badge: {
		position: 'absolute', top: -2, right: -2, backgroundColor: Colors.error,
		borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
	},
	badgeText: { fontSize: 10, fontWeight: '700' as const, color: '#FFF' },
	statsRow: { flexDirection: 'row', marginBottom: 24 },
	statBox: {
		flex: 1, borderRadius: 14,
	},
	section: { marginBottom: 24 },
});