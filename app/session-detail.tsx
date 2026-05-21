import React, { useState, useEffect } from 'react';
import {
	View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/contexts/SessionContext';
import { Colors } from '@/constants/Colors';
import { confirmDialog, notify } from '@/lib/dialogs';
import {
	AppButton,
	AppCard,
	AppInfoRow,
	AppStatusBadge,
	AppTopBar,
	useResponsiveSpacing,
} from '@/components/ui/AppPrimitives';
import { getDashboardData } from '@/lib/services/school';
import { SessionStatus } from '@/types';
import {
	acceptSession,
	declineSession,
	checkInSlot,
	checkOutSlot
} from '@/lib/services/teacher';

export default function SessionDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { user } = useAuth();
	const insets = useSafeAreaInsets();
	const topPad = Platform.OS === 'web' ? 67 : insets.top;
	const spacing = useResponsiveSpacing();
	const [sessions, setSessions] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const mappingStatus: Record<string, SessionStatus> = {
		"0": "open",
		"1": "closed"
	};

	const fetchData = async () => {
		if (user) {
			const fetchedSessions = await getDashboardData();
			setSessions(fetchedSessions.data);
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [user]);

	const session = React.useMemo(
		() => sessions.find((s) => s.request_id == id),
		[sessions, id]
	);

	const scheduleSlots = React.useMemo(() => {
		if (!session?.schedules?.length) return [];
		return session.schedules.map((slot: any) => ({
			id: slot.id,
			date: slot.schedule_date,
			startTime: slot.start_time,
			endTime: slot.end_time,
			status: slot.attendance_status
		}));
	}, [session]);

	if (loading) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<Text style={{ color: Colors.textSecondary }}>Loading session details...</Text>
			</View>
		);
	}

	if (!session) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<Text style={{ color: Colors.textSecondary }}>Session not found</Text>
			</View>
		);
	}

	const isTeacher = user?.role == 9;
	const isSchool = user?.role == 10;

	async function handleTeacherAction(action: string) {
		if (!user || !session) return;

		switch (action) {
			case 'accept': {
				const shouldAccept = await confirmDialog({
					title: 'Accept Session',
					message: 'Do you want to accept this teaching request?',
					confirmText: 'Accept',
				});

				if (!shouldAccept) break;

				const res = await acceptSession(session.rn_id);

				if (res.status !== 'success') {
					notify('Error', res.message || 'Failed to accept session');
					break;
				}

				notify('Success', 'You have accepted the session.');

				await fetchData();

				break;
			}
			case 'decline': {
				const shouldDecline = await confirmDialog({
					title: 'Decline Session',
					message: 'Are you sure you want to decline?',
					confirmText: 'Decline',
					destructive: true,
				});
				if (!shouldDecline) break;

				const res = await declineSession(session.rn_id);
				console.log('decline res:', res);

				await fetchData(); // ← refresh dulu
				router.replace('/sessions');     // ← baru back
				break;
			}
		}
	}

	return (
		<View style={[styles.container, { paddingTop: topPad }]}>
			<AppTopBar
				title="Session Details"
				onBack={() => router.replace('/sessions')}
				horizontalPadding={spacing.horizontal}
				verticalPadding={spacing.topBarVertical}
				iconButtonSize={spacing.iconButtonSize}
				iconSize={spacing.iconGlyphSize}
			/>

			<ScrollView
				contentContainerStyle={[
					styles.content,
					{
						paddingHorizontal: spacing.horizontal,
						paddingBottom: spacing.bottomPadding,
					},
				]}
			>
				<AppCard padding={spacing.cardPadding} style={styles.card}>
					<View style={styles.header}>
						<View style={styles.subjectRow}>
							<Text style={styles.subject}>{session.subject_name}</Text>
						</View>
						<AppStatusBadge status={mappingStatus[String(session.status)] ?? "open"} size="md" showDot />
					</View>
					<AppInfoRow icon="location-outline" label="Location" value={`${session.state}, ${session.locality}, ${session.pcode}`} labelWidth={70} />
					<AppInfoRow icon="business-outline" label="School" value={session.school_name} labelWidth={70} />
					{session.teacher_first_name && (
						<AppInfoRow icon="person-outline" label="Teacher" value={`${session.teacher_first_name} ${session.teacher_last_name}`} labelWidth={70} />
					)}
					{session.invoiceAmount && (
						<AppInfoRow icon="wallet-outline" label="Amount" value={`${session.invoiceAmount}`} labelWidth={70} />
					)}
				</AppCard>

				<AppCard padding={spacing.cardPadding} style={styles.card}>
					<Text style={styles.cardTitle}>Schedule Date</Text>
					{scheduleSlots.map((slot: any, index: number) => (
						<View key={slot.id} style={{ marginBottom: 12 }}>

							<AppInfoRow
								icon="calendar-outline"
								label={`Date ${index + 1}`}
								value={slot.date}
							/>

							<AppInfoRow
								icon="time-outline"
								label={`Time ${index + 1}`}
								value={`${slot.startTime} - ${slot.endTime}`}
							/>

							{/* CHECK IN */}
							{isTeacher &&
								session.request_status === 'accepted' &&
								String(session.teacher_user_id) === String(user?.id) &&
								slot.status === null && (
									<AppButton
										title="Check In"
										onPress={async () => {
											const res = await checkInSlot(slot.id);
											await fetchData();
											if (res?.success === true) {
												notify('Success', 'You have checked in successfully.');
											} else {
												notify('Error', res?.message || 'Check in failed.');
											}
										}}
										style={{ marginTop: 6 }}
									/>
								)}

							{/* CHECK OUT */}
							{isTeacher &&
								session.request_status === 'accepted' &&
								String(session.teacher_user_id) === String(user?.id) &&
								(slot.status === '0' || slot.status === 0) && (
									<AppButton
										title="Check Out"
										onPress={async () => {
											const res = await checkOutSlot(slot.id);
											await fetchData();
											if (res?.success === true) {
												notify('Success', 'You have checked out successfully.');
											} else {
												notify('Error', res?.message || 'Check out failed.');
											}
										}}
										style={{ marginTop: 6 }}
									/>
								)}			

							{/* DONE */}
							{(slot.status === '1' || slot.status === 1) && (
								<Text style={{ color: 'green', marginTop: 6 }}>✓ Done</Text>
							)}

						</View>
					))}
				</AppCard>

				{session.termsAndConditions && (
					<AppCard padding={spacing.cardPadding} style={styles.card}>
						<Text style={styles.cardTitle}>Terms & Conditions</Text>
						<Text style={styles.cardBody}>{session.termsAndConditions}</Text>
					</AppCard>
				)}

				{session.review && (
					<AppCard padding={spacing.cardPadding} style={styles.card}>
						<Text style={styles.cardTitle}>Review</Text>
						<View style={styles.reviewStars}>
							{[1, 2, 3, 4, 5].map((star) => (
								<Ionicons
									key={star}
									name={star <= session.review!.rating ? 'star' : 'star-outline'}
									size={20}
									color={Colors.warning}
								/>
							))}
						</View>
						<Text style={styles.cardBody}>{session.review.comment}</Text>
					</AppCard>
				)}

				{isTeacher && session.request_status == 'pending' && String(session.notification_status) === '1' && (
					<View style={styles.actionRow}>
						<TouchableOpacity
							style={[styles.actionBtn, styles.declineBtn]}
							onPress={() => handleTeacherAction('decline')}
						>
							<Ionicons name="close" size={18} color={Colors.error} />
							<Text style={[styles.actionBtnText, { color: Colors.error }]}>Decline</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.actionBtn, styles.acceptBtn]}
							onPress={() => handleTeacherAction('accept')}
						>
							<Ionicons name="checkmark" size={18} color="#FFF" />
							<Text style={[styles.actionBtnText, { color: '#FFF' }]}>Accept</Text>
						</TouchableOpacity>
					</View>
				)}

			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	subjectRow: {
		flex: 1,
	},
	container: { flex: 1, backgroundColor: Colors.background },
	content: { paddingBottom: 40 },
	statusBanner: {
		alignItems: 'flex-start',
		marginBottom: 16,
	},
	card: {
		marginBottom: 16,
	},
	subject: { fontSize: 22, fontWeight: '800' as const, color: Colors.text, marginBottom: 16 },
	cardTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginBottom: 8 },
	cardBody: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
	reviewStars: { flexDirection: 'row', gap: 4, marginBottom: 8 },
	errorText: { fontSize: 16, color: Colors.error, textAlign: 'center', padding: 40 },
	actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
	actionBtn: {
		flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
		paddingVertical: 16, borderRadius: 12,
	},
	declineBtn: { backgroundColor: Colors.errorBg, borderWidth: 1, borderColor: Colors.error + '30' },
	acceptBtn: { backgroundColor: Colors.primary },
	actionBtnText: { fontSize: 15, fontWeight: '700' as const },
	actionBtnSingle: { marginTop: 8 },
});