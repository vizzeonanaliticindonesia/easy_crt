import React, {useState, useEffect} from 'react';
import { View, FlatList, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/contexts/SessionContext';
import { Colors } from '@/constants/Colors';
import NotificationItem from '@/components/NotificationItem';
import { AppEmptyState, AppPageHeader, useResponsiveSpacing } from '@/components/ui/AppPrimitives';
//notification
import { getNotifications, markNotificationAsRead } from '@/lib/services/teacher';
import { useIsFocused } from '@react-navigation/native';

export default function TeacherNotifications() {
	const { user } = useAuth();
	const { getNotificationsForUser, markNotificationRead } = useSession();
	const router = useRouter();
	const isFocused = useIsFocused();
	const insets = useSafeAreaInsets();
	const topPad = Platform.OS === 'web' ? 67 : insets.top;
	const spacing = useResponsiveSpacing();

	const [notifications, setNotifications] = useState<any[]>([]);
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		const fetchNotifications = async () => {
			if (user) {
				const fetchedNotifications = await getNotifications();
				setNotifications(fetchedNotifications.notifications);
			}
		};

		if (user && isFocused) {
			fetchNotifications();
		}
	}, [user, isFocused]);

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			const fetchedNotifications = await getNotifications();
			setNotifications(fetchedNotifications.notifications);
		} finally {
			setRefreshing(false);
		}
	};

	async function handlePress(notif: typeof notifications[0]) {
		await markNotificationAsRead(notif.id);
		if (notif.title.includes('Earnings Scheduled')) {
			router.push({ pathname: '/earnings' });
		} else if (notif.title.includes('New Assignment')) {
			router.push({ pathname: '/sessions' });
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
				refreshing={refreshing}
				onRefresh={onRefresh}
				scrollEnabled={notifications.length > 0}
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
