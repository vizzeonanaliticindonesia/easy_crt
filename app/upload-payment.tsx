import React, { useState } from 'react';
import {
	View, Text, TouchableOpacity, StyleSheet, Platform,
	Image, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/contexts/SessionContext';
import { Colors } from '@/constants/Colors';
import { notify } from '@/lib/dialogs';
import {
	AppButton,
	AppCard,
	AppSectionTitle,
	AppTopBar,
	AppUploadArea,
	useResponsiveSpacing,
} from '@/components/ui/AppPrimitives';

export default function UploadPaymentScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { user } = useAuth();
	const { sessions, updateSessionStatus, addNotification } = useSession();
	const insets = useSafeAreaInsets();
	const topPad = Platform.OS === 'web' ? 67 : insets.top;
	const spacing = useResponsiveSpacing();
	const previewHeight = spacing.titleSize <= 25 ? 180 : spacing.titleSize >= 30 ? 220 : 200;

	const session = sessions.find((s) => s.id === id);
	const [imageUri, setImageUri] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function pickImage() {
		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ['images'],
				allowsEditing: true,
				quality: 0.8,
			});
			if (!result.canceled && result.assets?.[0]) {
				setImageUri(result.assets[0].uri);
			}
		} catch {
			notify('Error', 'Failed to pick image');
		}
	}

	async function handleSubmit() {
		if (!imageUri || !session || !user) {
			notify('Error', 'Please select a payment proof image.');
			return;
		}
		setLoading(true);
		await updateSessionStatus(session.id, 'payment_uploaded', { paymentProofUri: imageUri });

		setTimeout(async () => {
			await updateSessionStatus(session.id, 'payment_confirmed');
			await addNotification({
				userId: session.schoolId,
				type: 'payment_confirmed',
				title: 'Payment Confirmed',
				message: `Payment for ${session.subject} session has been confirmed by the provider.`,
				sessionId: session.id,
			});
			if (session.teacherId) {
				await addNotification({
					userId: session.teacherId,
					type: 'payment_confirmed',
					title: 'Payment Received',
					message: `Payment for ${session.subject} session has been confirmed. The provider will redirect the payment to you.`,
					sessionId: session.id,
				});
			}
		}, 2000);

		setLoading(false);
		notify('Uploaded', 'Payment proof uploaded. The provider will verify your payment shortly.', () => router.back());
	}

	return (
		<View style={[styles.container, { paddingTop: topPad }]}>
			<AppTopBar
				title="Upload Payment"
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
				showsVerticalScrollIndicator={false}
			>
				{session && (
					<AppCard variant="primaryTint" padding={spacing.cardPadding} style={[styles.invoiceCard, { marginBottom: spacing.sectionGap + 8 }]}>
						<Text style={styles.invoiceLabel}>Invoice Amount</Text>
						<Text style={styles.invoiceAmount}>${session.invoiceAmount}</Text>
						<Text style={styles.invoiceSession}>
							{session.subject} - {session.date}
						</Text>
					</AppCard>
				)}

				<AppSectionTitle title="Payment Proof" size="md" style={styles.sectionTitle} />
				<Text style={[styles.sectionDesc, { marginBottom: spacing.sectionGap }]}>
					Upload a screenshot or photo of your payment receipt
				</Text>

				{imageUri ? (
					<View style={[styles.previewWrap, { marginBottom: spacing.sectionGap + 8 }]}>
						<Image source={{ uri: imageUri }} style={[styles.preview, { height: previewHeight }]} resizeMode="cover" />
						<TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
							<Ionicons name="camera" size={16} color={Colors.primary} />
							<Text style={styles.changeBtnText}>Change</Text>
						</TouchableOpacity>
					</View>
				) : (
					<AppUploadArea
						label="Tap to select image"
						onPress={pickImage}
						tone="secondary"
						iconSize={44}
						style={{ marginBottom: spacing.sectionGap + 8 }}
					/>
				)}

				<AppButton
					title="Submit Payment Proof"
					onPress={handleSubmit}
					loading={loading}
					disabled={!imageUri}
					variant="secondary"
				/>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	container: { flex: 1, backgroundColor: Colors.background },
	content: { paddingBottom: 32 },
	invoiceCard: {
		alignItems: 'center',
	},
	invoiceLabel: { fontSize: 13, color: Colors.textSecondary },
	invoiceAmount: { fontSize: 36, fontWeight: '800' as const, color: Colors.primary, marginVertical: 4 },
	invoiceSession: { fontSize: 14, color: Colors.textSecondary },
	sectionTitle: { marginBottom: 4 },
	sectionDesc: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16 },
	previewWrap: { marginBottom: 24 },
	preview: { width: '100%', height: 200, borderRadius: 12 },
	changeBtn: {
		flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
		padding: 10, marginTop: 8,
	},
	changeBtnText: { fontSize: 14, color: Colors.primary, fontWeight: '600' as const },
});
