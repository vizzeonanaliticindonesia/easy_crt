import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TeacherProfile } from '@/types';
import { Colors } from '@/constants/Colors';
import { AppCard, AppStatusBadge, useResponsiveSpacing } from '@/components/ui/AppPrimitives';

interface TeacherCardProps {
	teacher: TeacherProfile;
	selected?: boolean;
	onPress?: () => void;
	onToggleSelect?: () => void;
	showSelect?: boolean;
}

export default function TeacherCard({ teacher, selected, onPress, onToggleSelect, showSelect }: TeacherCardProps) {
	const spacing = useResponsiveSpacing();

	return (
		<TouchableOpacity
			style={[styles.touchable, { marginBottom: Math.max(10, spacing.sectionGap - 2) }]}
			onPress={showSelect ? onToggleSelect : onPress}
			activeOpacity={0.7}
		>
			<AppCard
				padding={Math.max(14, spacing.cardPadding - 8)}
				style={[styles.card, selected && styles.cardSelected]}
			>
				<View style={styles.row}>
					{showSelect && (
						<View style={[styles.checkbox, selected && styles.checkboxActive]}>
							{selected && <Ionicons name="checkmark" size={14} color="#FFF" />}
						</View>
					)}
					<View style={styles.avatar}>
						<Text style={styles.avatarText}>
							{`${teacher.first_name?.[0] || ''}${teacher.last_name?.[0] || ''}`.toUpperCase()}
						</Text>
					</View>
					<View style={styles.info}>
						<Text style={styles.name}>{teacher.first_name} {teacher.last_name}</Text>
						<Text style={styles.subjects} numberOfLines={1}>
							{teacher.subject_name}
						</Text>
						<View style={styles.metaRow}>
							<View style={styles.ratingRow}>
								<Ionicons name="star" size={13} color={Colors.warning} />
								<Text style={styles.rating}>{Number(teacher.rating).toFixed(1)}</Text>
								<Text style={styles.reviewCount}>({teacher.reviewCount})</Text>
							</View>
							<View style={styles.locationRow}>
								<Ionicons name="location-outline" size={13} color={Colors.textMuted} />
								<Text style={styles.location}>{teacher.state}, {teacher.locality}, {teacher.pcode}</Text>
							</View>
						</View>
					</View>
					<AppStatusBadge
						label={teacher.isAvailable ? 'Available' : 'Busy'}
						tone={teacher.isAvailable ? 'secondary' : 'error'}
						size="sm"
						showDot
					/>
				</View>
			</AppCard>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	touchable: {
		marginBottom: 10,
	},
	card: {
		borderRadius: 14,
	},
	cardSelected: {
		borderColor: Colors.primary,
		backgroundColor: Colors.primaryBg,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	checkbox: {
		width: 22,
		height: 22,
		borderRadius: 6,
		borderWidth: 2,
		borderColor: Colors.border,
		justifyContent: 'center',
		alignItems: 'center',
	},
	checkboxActive: {
		backgroundColor: Colors.primary,
		borderColor: Colors.primary,
	},
	avatar: {
		width: 46,
		height: 46,
		borderRadius: 23,
		backgroundColor: Colors.primaryBg,
		justifyContent: 'center',
		alignItems: 'center',
	},
	avatarText: {
		fontSize: 15,
		fontWeight: '700' as const,
		color: Colors.primary,
	},
	info: {
		flex: 1,
		gap: 2,
	},
	name: {
		fontSize: 15,
		fontWeight: '600' as const,
		color: Colors.text,
	},
	subjects: {
		fontSize: 13,
		color: Colors.textSecondary,
	},
	metaRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		marginTop: 2,
	},
	ratingRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 3,
	},
	rating: {
		fontSize: 12,
		fontWeight: '600' as const,
		color: Colors.text,
	},
	reviewCount: {
		fontSize: 12,
		color: Colors.textMuted,
	},
	locationRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 2,
	},
	location: {
		fontSize: 12,
		color: Colors.textMuted,
	},
});
