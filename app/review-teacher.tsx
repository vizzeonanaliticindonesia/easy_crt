import React, { useState } from 'react';
import {
	View, Text, TextInput, TouchableOpacity, StyleSheet, Platform,
	KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/contexts/SessionContext';
import { Colors } from '@/constants/Colors';
import { notify } from '@/lib/dialogs';
import { AppButton, AppCard, AppTopBar, useResponsiveSpacing } from '@/components/ui/AppPrimitives';
import { insertReview } from '@/lib/services/school';

export default function ReviewTeacherScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { sessions, updateSessionStatus, addNotification } = useSession();
	const insets = useSafeAreaInsets();
	const topPad = Platform.OS === 'web' ? 67 : insets.top;
	const spacing = useResponsiveSpacing();
	const starSize = spacing.titleSize <= 25 ? 34 : spacing.titleSize >= 30 ? 44 : 40;
	const commentBoxHeight = spacing.titleSize <= 25 ? 110 : spacing.titleSize >= 30 ? 140 : 120;

	const session = sessions.find((s) => s.id === id);
	const [rating, setRating] = useState(0);
	const [comment, setComment] = useState('');
	const [loading, setLoading] = useState(false);

	async function handleSubmit() {
		if (rating === 0) {
			notify('Error', 'Please select a rating.');
			return;
		}

		if (!comment.trim()) {
			notify('Error', 'Please write a review comment.');
			return;
		}

		if (!id) return;

		setLoading(true);

		try {
			await insertReview({
				booking_id: id,
				rating,
				review: comment.trim(),
			});

			setLoading(false);

			notify('Thank You', 'Your review has been submitted.');

			router.back(); 

		} catch (error) {
			console.error(error);
			setLoading(false);
			notify('Error', 'Failed to submit review.');
		}
}

	return (
		<View style={[styles.container, { paddingTop: topPad }]}>
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<AppTopBar
					title="Review Teacher"
					onBack={() => router.back()}
					horizontalPadding={spacing.horizontal}
					verticalPadding={spacing.topBarVertical}
					iconButtonSize={spacing.iconButtonSize}
					iconSize={spacing.iconGlyphSize}
				/>

				<ScrollView
					style={styles.flex}
					contentContainerStyle={[
						styles.content,
						{
							paddingHorizontal: spacing.horizontal,
							paddingBottom: spacing.bottomPadding,
						},
					]}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					{session && (
						<AppCard variant="surface" padding={spacing.cardPadding} style={[styles.sessionInfo, { marginBottom: spacing.sectionGap * 2 }]}>
							<Text style={styles.teacherName}>{session.teacherName}</Text>
							<Text style={styles.sessionSubject}>{session.subject} - {session.date}</Text>
						</AppCard>
					)}

					<Text style={styles.ratingLabel}>How was the experience?</Text>
					<View style={[styles.stars, { gap: spacing.sectionGap / 2 }]}>
						{[1, 2, 3, 4, 5].map((star) => (
							<TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
								<Ionicons
									name={star <= rating ? 'star' : 'star-outline'}
									size={starSize}
									color={star <= rating ? Colors.warning : Colors.border}
								/>
							</TouchableOpacity>
						))}
					</View>
					<Text style={[styles.ratingText, { marginBottom: spacing.sectionGap * 2 }]}>
						{rating === 0 && 'Tap a star to rate'}
						{rating === 1 && 'Poor'}
						{rating === 2 && 'Fair'}
						{rating === 3 && 'Good'}
						{rating === 4 && 'Very Good'}
						{rating === 5 && 'Excellent'}
					</Text>

					<Text style={styles.commentLabel}>Write your review</Text>
					<View style={[styles.textAreaWrap, { height: commentBoxHeight, marginBottom: spacing.sectionGap + 8 }]}>
						<TextInput
							style={styles.textArea}
							placeholder="Share your experience with this teacher..."
							placeholderTextColor={Colors.textMuted}
							value={comment}
							onChangeText={setComment}
							multiline
							textAlignVertical="top"
						/>
					</View>

					<AppButton
						title="Submit Review"
						onPress={handleSubmit}
						loading={loading}
						variant="primary"
					/>
				</ScrollView>
			</KeyboardAvoidingView>
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	container: { flex: 1, backgroundColor: Colors.background },
	content: { paddingBottom: 32 },
	sessionInfo: { alignItems: 'center' },
	teacherName: { fontSize: 22, fontWeight: '800' as const, color: Colors.text },
	sessionSubject: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
	ratingLabel: { fontSize: 16, fontWeight: '600' as const, color: Colors.text, textAlign: 'center', marginBottom: 16 },
	stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
	ratingText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 32 },
	commentLabel: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, marginBottom: 8 },
	textAreaWrap: {
		backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1,
		borderColor: Colors.border, padding: 14, height: 120,
	},
	textArea: { flex: 1, fontSize: 15, color: Colors.text },
});
