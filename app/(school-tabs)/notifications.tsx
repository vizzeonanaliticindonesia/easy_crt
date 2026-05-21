import React, {useState, useEffect} from 'react';
import { View, FlatList, StyleSheet, Platform, RefreshControl } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/contexts/SessionContext';
import { Colors } from '@/constants/Colors';
import NotificationItem from '@/components/NotificationItem';
import { AppEmptyState, AppPageHeader, useResponsiveSpacing } from '@/components/ui/AppPrimitives';
import { getNotifications, markNotificationRead } from '@/lib/services/school';

export default function SchoolNotifications() {
	const { user } = useAuth();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const topPad = Platform.OS === 'web' ? 67 : insets.top;
	const spacing = useResponsiveSpacing();
	const isFocused = useIsFocused();

	const [notifications, setNotifications] = useState<any[]>([]);
	const [refreshing, setRefreshing] = useState(false);

	const loadNotifications = async () => {
		try {
			if (!user) return;
			const fetchedNotifications = await getNotifications();
			setNotifications(fetchedNotifications.notifications);
		} catch (err) {
			console.error('Failed to load notifications:', err);
		}
	};

	useEffect(() => {
		if (user && isFocused) {
			loadNotifications();
		}
	}, [user, isFocused]);

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await loadNotifications();
		} finally {
			setRefreshing(false);
		}
	};

	async function handlePress(notif: typeof notifications[0]) {
		await markNotificationRead(notif.id);
		if (notif.title.includes('Session Confirmation Required')) {
			// router.push({ pathname: '/session-confirmations', params: { id: notif.sessionId } });
			router.push({ pathname: '/session-confirmations' });
		} else if (notif.title.includes('New Payment')) {
			// router.push({ pathname: '/session-confirmations', params: { id: notif.sessionId } });
			router.push({ pathname: '/invoices' });
		} 
	}

	return (
		<View style={[styles.container, { paddingTop: topPad + spacing.topOffset }]}>
			<View style={{ paddingHorizontal: spacing.horizontal }}>
				<AppPageHeader title="Notifications" style={styles.title} />
			</View>

			<FlatList
				data={notifications}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ paddingBottom: spacing.bottomPadding }}
				scrollEnabled={notifications.length > 0}
				refreshControl={
					<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					/>
				}
				renderItem={({ item }) => (
					<NotificationItem notification={item} onPress={() => handlePress(item)} />
				)}
				ListEmptyComponent={
					<View style={{ paddingHorizontal: spacing.horizontal }}>
						<AppEmptyState
							icon="notifications-off-outline"
							title="No notifications"
							subtitle="You're all caught up"
							padding={spacing.cardPadding}
						/>
					</View>
				}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background },
	title: { marginBottom: 8 },
});
