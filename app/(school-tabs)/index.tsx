import React, {useEffect, useState} from 'react';
import { useIsFocused } from '@react-navigation/native';
import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/contexts/SessionContext';
import { SchoolProfile } from '@/types';
import { Colors } from '@/constants/Colors';
import SessionCard from '@/components/SessionCard';
import { Ionicons } from '@expo/vector-icons';
import {
	AppButton,
	AppEmptyState,
	AppIconButton,
	AppPageHeader,
	AppSectionHeader,
	AppStatCard,
	useResponsiveSpacing,
} from '@/components/ui/AppPrimitives';
import { getDashboardData, getNotifications } from '@/lib/services/school';

export default function SchoolDashboard() {
	const { user } = useAuth();
	const { getSessionsForUser, getUnreadCount } = useSession();
	const isFocused = useIsFocused();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const topPad = Platform.OS === 'web' ? 67 : insets.top;
	const spacing = useResponsiveSpacing();
	const school = user as SchoolProfile | null;

	// const sessions = user ? getSessionsForUser(user.id, 'school') : [];
	const [sessions, setSessions] = useState<any[]>([]);
	const [status, setStatus] = useState<any>('');
	const [unreadCount, setUnreadCount] = useState<number>(0);
	const [refreshing, setRefreshing] = useState(false);
	// const activeSessions = sessions.filter((s) => !['reviewed', 'declined', 'payment_confirmed'].includes(s.status));
	// const pendingSessions = sessions.filter((s) => s.status === 'pending');

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await refreshData(); // fungsi kamu
		} finally {
			setRefreshing(false);
		}
	};

	const refreshData = async () => {
		try {
			const res = await getDashboardData();
			setSessions(res.data);
			setStatus(res);
			const notifications = await getNotifications();
			setUnreadCount(notifications.unread_count);
		}	catch (err) {
			console.error('Error refreshing data:', err);
		}
	}


	useEffect(() => {
		const fetchData = async () => {
				if (!user) return;
				const fetchedSessions = await getDashboardData();
				setSessions(fetchedSessions.data);
				setStatus(fetchedSessions);
				try {
					const fetchedNotifications = await getNotifications();
					setUnreadCount(fetchedNotifications.unread_count);
				} catch (e) {
					console.warn('Failed to fetch notifications for unread count', e);
				}
			};

		if (user && isFocused) {
			fetchData();
		}
	}, [user, isFocused]);

	return (
		<ScrollView
			refreshControl={
				<RefreshControl
				refreshing={refreshing}
				onRefresh={onRefresh}
				/>
			}
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
					subtitle={school?.schoolName || 'School'}
					titleStyle={styles.greetingHello}
					subtitleStyle={styles.greetingName}
					style={styles.greetingBlock}
				/>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
  
  					{/* REFRESH */}
					{/* <TouchableOpacity 
						onPress={refreshData} 
						style={styles.refreshBtn}
					>
						<Ionicons name="refresh" size={spacing.iconGlyphSize} />
					</TouchableOpacity> */}

					{/* NOTIFICATION */}
					<View style={styles.notifWrap}>
						<AppIconButton
						icon="notifications-outline"
						size={spacing.iconGlyphSize}
						containerSize={spacing.iconButtonSize}
						onPress={() => router.push('/(school-tabs)/notifications')}
						/>
						{unreadCount > 0 && (
						<View style={styles.badge}>
							<Text style={styles.badgeText}>{unreadCount}</Text>
						</View>
						)}
					</View>
				</View>
			</View>

			<AppButton
				title="Create Teaching Session"
				onPress={() => router.push('/create-session')} // Atur route/redirect dari button dashboard
				variant="secondary"
				icon="add-circle"
				style={styles.createBtn}
			/>

			<AppButton
				title="Session Confirmations"
				onPress={() => router.push('/session-confirmations')}
				variant="outline"
				icon="checkmark-done-circle"
				style={styles.confirmationBtn}
			/>

			<View style={[styles.statsRow, { gap: spacing.sectionGap - 4 }]}>
				<AppStatCard icon="calendar" label="Active" value={status.active} color={Colors.secondary} style={styles.statBox} />
				<AppStatCard icon="hourglass" label="Pending" value={status.pending} color={Colors.statusPending} style={styles.statBox} />
				<AppStatCard icon="checkmark-circle" label="Completed" value={status.completed} color={Colors.statusComplete} style={styles.statBox} />
			</View>

			<View style={styles.section}>
				<AppSectionHeader
					title="Recent Sessions"
					actionLabel="See All"
					actionColor={Colors.primary}
					onActionPress={() => router.push('/(school-tabs)/sessions')}
				/>
				{sessions.length === 0 ? (
					<AppEmptyState
						icon="calendar-outline"
						title="No sessions yet"
						subtitle="Create a teaching session to get started"
						padding={spacing.cardPadding}
					/>
				) : (
					sessions.slice(0, 3).map((session) => (
						<SessionCard
							key={session.id}
							session={session}
							userRole='school'
							onPress={() => router.push({ pathname: '/session-detail', params: { id: session.id } })}
						/>
					))
				)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background },
	content: { paddingBottom: 100 },
	header: {
		flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
	},
	refreshBtn: {
		padding: 6,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
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
	createBtn: { marginBottom: 20 },
	confirmationBtn: { marginBottom: 20 },
	statsRow: { flexDirection: 'row', marginBottom: 24 },
	statBox: {
		flex: 1, borderRadius: 14,
	},
	section: { marginBottom: 24 },
});
