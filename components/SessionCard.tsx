import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TeachingSession, SessionStatus } from '@/types';
import { Colors } from '@/constants/Colors';
import { AppCard, AppStatusBadge, useResponsiveSpacing } from '@/components/ui/AppPrimitives';


interface SessionCardProps {
	session: TeachingSession;
	onPress?: () => void;
	userRole: 'teacher' | 'school';
}

export default function SessionCard({ session, onPress, userRole }: SessionCardProps) {
	const spacing = useResponsiveSpacing();
	const mappingStatus: Record<string, SessionStatus> = {
		"0": "open",
		"1": "closed"
	};

	return (
		<TouchableOpacity
			style={[styles.touchable, { marginBottom: Math.max(10, spacing.sectionGap - 2) }]}
			onPress={onPress}
			activeOpacity={0.7}
		>
			<AppCard padding={Math.max(14, spacing.cardPadding - 6)} style={styles.card}>
				<View style={styles.header}>
					<View style={styles.subjectRow}>
						<Ionicons name="book-outline" size={18} color={Colors.primary} />
						<Text style={styles.subject}>{session.subject_name}</Text>
					</View>
					<AppStatusBadge status={mappingStatus[session.status]} size="sm" />
				</View>

				<View style={styles.details}>
					<View style={styles.detailRow}>
						<Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
						<Text style={styles.detailText}>{session.request_date}</Text>
					</View>
					{/* <View style={styles.detailRow}>
						<Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
						<Text style={styles.detailText}>{session.start_time} - {session.end_time}</Text>
					</View> */}
					<View style={styles.detailRow}>
						<Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
						<Text style={styles.detailText} numberOfLines={1}>{session.state} , {session.locality} , {session.pcode}</Text>
					</View>
					{userRole === 'teacher' && (
						<View style={styles.detailRow}>
							<Ionicons name="business-outline" size={16} color={Colors.textSecondary} />
							<Text style={styles.detailText}>{session.school_name}</Text>
						</View>
					)}
					{userRole === 'school' && session.teacher_id && (
						<View style={styles.detailRow}>
							<Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
							<Text style={styles.detailText}>{session.teacher_first_name} {session.teacher_last_name}</Text>
						</View>
					)}
				</View>

				{/* {session.invoiceAmount && (
					<View style={styles.amountRow}>
						<Text style={styles.amountLabel}>Amount:</Text>
						<Text style={styles.amount}>${session.invoiceAmount}</Text>
					</View>
				)} */}
			</AppCard>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	touchable: {
		marginBottom: 12,
	},
	card: {
		borderRadius: 14,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	subjectRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		flex: 1,
	},
	subject: {
		fontSize: 17,
		fontWeight: '600' as const,
		color: Colors.text,
	},
	details: {
		gap: 6,
	},
	detailRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	detailText: {
		fontSize: 13,
		color: Colors.textSecondary,
		flex: 1,
	},
	amountRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 14,
		paddingTop: 14,
		borderTopWidth: 1,
		borderTopColor: Colors.borderLight,
	},
	amountLabel: {
		fontSize: 13,
		color: Colors.textSecondary,
	},
	amount: {
		fontSize: 16,
		fontWeight: '700' as const,
		color: Colors.primary,
	},
});
