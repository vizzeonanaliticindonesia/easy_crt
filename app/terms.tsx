import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { AppButton, AppCard, AppPageHeader, useResponsiveSpacing } from '@/components/ui/AppPrimitives';
import { fetchTerms } from '@/lib/services/terms';
import { notify } from '@/lib/dialogs';
import { useRouter } from 'expo-router';

export default function TermsScreen() {
	const { acceptTerms, logout, updateUser, user } = useAuth();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const topPad = Platform.OS === 'web' ? 67 : insets.top;
	const spacing = useResponsiveSpacing();
	const headerIconSize = spacing.heroIconSize <= 64 ? 30 : spacing.heroIconSize >= 78 ? 36 : 32;

	const [terms, setTerms] = useState<any | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setLoading(true);
				const res = await fetchTerms();
				if (mounted) setTerms(res);
			} catch (e: any) {
				if (mounted) setError(e?.message || 'Gagal memuat terms');
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	async function handleAccept() {
		try {
		setLoading(true);

		const res = await acceptTerms();

		if (res?.status === 'success') {

			// 🔥 update local state
			await updateUser({ termsAccepted: true });

			// 🔥 redirect berdasarkan role
			if (user?.role === 10) {
				router.replace('/(school-tabs)');
			} else if (user?.role === 9) {
				router.replace('/(teacher-tabs)');
			} else {
				router.replace('/');
			}

		} else {
			notify('Error', res?.message || 'Failed to accept terms');
		}

		} catch (err) {
			console.log(err);
			notify('Error', 'Something went wrong');
		} finally {
			setLoading(false);
		}
	}

	async function handleDecline() {
		await logout();
	}

	return (
		<View style={[styles.container, { paddingTop: topPad + spacing.topOffset, paddingHorizontal: spacing.horizontal }]}>
			<View style={styles.header}>
				<Ionicons name="document-text" size={headerIconSize} color={Colors.primary} />
				<AppPageHeader
					title="Terms & Conditions"
					subtitle="Please read and accept to continue"
					centered
					style={styles.headerText}
				/>
			</View>

			<ScrollView style={styles.scrollContent} 
			contentContainerStyle={{ paddingBottom: spacing.sectionGap * 2 }}
			showsVerticalScrollIndicator={false}>
				{loading ? (
					<AppCard padding={spacing.cardPadding} style={styles.termsCard}>
						<ActivityIndicator size="large" color={Colors.primary} />
					</AppCard>
				) : error ? (
					<AppCard padding={spacing.cardPadding} style={styles.termsCard}>
						<Text style={styles.termsText}>{error}</Text>
					</AppCard>
				) : (
					<AppCard padding={spacing.cardPadding} style={styles.termsCard}>
						{terms?.title ? <Text style={styles.termsHeading}>{terms.title}</Text> : null}
						<Text style={styles.termsText}>{terms?.document_text}</Text>
					</AppCard>
				)}
			</ScrollView>

			<View style={[styles.actions, { paddingVertical: spacing.sectionGap,
			paddingBottom: Math.max(insets.bottom, 12)
			 }]}>
				<TouchableOpacity style={styles.declineBtn} onPress={handleDecline} activeOpacity={0.8}>
					<Text style={styles.declineBtnText}>Decline & Logout</Text>
				</TouchableOpacity>
				<AppButton title="Accept & Continue" onPress={handleAccept} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	header: {
		alignItems: 'center',
		marginBottom: 20,
		gap: 4,
	},
	headerText: {
		marginBottom: 0,
	},
	scrollContent: {
		flex: 1,
	},
	termsCard: {
		marginBottom: 20,
	},
	termsHeading: {
		fontSize: 15,
		fontWeight: '700' as const,
		color: Colors.text,
		marginTop: 16,
		marginBottom: 6,
	},
	termsText: {
		fontSize: 14,
		color: Colors.textSecondary,
		lineHeight: 22,
	},
	actions: {
		flexDirection: 'row',
		gap: 12,
		paddingVertical: 20,
	},
	declineBtn: {
		flex: 1,
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: 'center',
		backgroundColor: Colors.surface,
		borderWidth: 1,
		borderColor: Colors.border,
	},
	declineBtnText: {
		fontSize: 15,
		fontWeight: '600' as const,
		color: Colors.error,
	},
});
