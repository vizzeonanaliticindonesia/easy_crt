import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppNotification, NotificationType } from '@/types';
import { Colors } from '@/constants/Colors';
import { AppCard, useResponsiveSpacing } from '@/components/ui/AppPrimitives';

interface NotificationItemProps {
	notification: AppNotification;
	onPress?: () => void;
}

const ICON_MAP: Record<NotificationType, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
	session_request: { name: 'calendar', color: Colors.primary },
	session_accepted: { name: 'checkmark-circle', color: Colors.secondary },
	teacher_checked_in: { name: 'log-in', color: Colors.statusActive },
	attendance_confirmed: { name: 'people', color: Colors.secondary },
	session_completed: { name: 'flag', color: Colors.statusComplete },
	completion_confirmed: { name: 'ribbon', color: Colors.statusComplete },
	invoice_sent: { name: 'receipt', color: Colors.statusPending },
	payment_uploaded: { name: 'cloud-upload', color: Colors.statusActive },
	payment_confirmed: { name: 'wallet', color: Colors.statusComplete },
	review_received: { name: 'star', color: Colors.warning },
};

export default function NotificationItem({ notification, onPress }: NotificationItemProps) {
	const iconConfig = ICON_MAP[notification.type] || { name: 'notifications' as const, color: Colors.icon };
	const timeAgo = getTimeAgo(notification.created_at);
	const spacing = useResponsiveSpacing();

	return (
		<TouchableOpacity
			style={[
				styles.touchable,
				{
					marginBottom: Math.max(10, spacing.sectionGap - 2),
					paddingHorizontal: spacing.horizontal,
				},
			]}
			onPress={onPress}
			activeOpacity={0.7}
		>
			<AppCard
				variant={notification.is_read === '1' ? 'surface' : 'primaryTint'}
				padding={Math.max(14, spacing.cardPadding - 8)}
				style={styles.card}
			>
				<View style={[styles.iconWrap, { backgroundColor: iconConfig.color + '15' }]}>
					<Ionicons name={iconConfig.name} size={20} color={iconConfig.color} />
				</View>
				<View style={styles.content}>
					<Text style={styles.title}>{notification.title}</Text>
					<Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
					<Text style={styles.time}>{timeAgo}</Text>
				</View>
				{notification.is_read === '0' && <View style={styles.dot} />}
			</AppCard>
		</TouchableOpacity>
	);
}

function getTimeAgo(dateStr: string): string {
	const now = new Date();
	const date = new Date(dateStr);
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	if (diffMins < 1) return 'Just now';
	if (diffMins < 60) return `${diffMins}m ago`;
	const diffHours = Math.floor(diffMins / 60);
	if (diffHours < 24) return `${diffHours}h ago`;
	const diffDays = Math.floor(diffHours / 24);
	return `${diffDays}d ago`;
}

const styles = StyleSheet.create({
	touchable: {
		marginBottom: 10,
		paddingHorizontal: 20,
	},
	card: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	iconWrap: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	content: {
		flex: 1,
		gap: 3,
	},
	title: {
		fontSize: 14,
		fontWeight: '600' as const,
		color: Colors.text,
	},
	message: {
		fontSize: 13,
		color: Colors.textSecondary,
		lineHeight: 18,
	},
	time: {
		fontSize: 12,
		color: Colors.textMuted,
		marginTop: 2,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: Colors.primary,
	},
});
