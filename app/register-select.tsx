import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { AppCard, AppIconButton, useResponsiveSpacing } from '@/components/ui/AppPrimitives';

export default function RegisterSelectScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const topPad = Platform.OS === 'web' ? 67 : insets.top;
	const spacing = useResponsiveSpacing();
	const roleIconSize = spacing.heroIconSize <= 64 ? 30 : spacing.heroIconSize >= 78 ? 38 : 34;
	const arrowSize = spacing.iconGlyphSize;
	const arrowWrapSize = Math.max(36, spacing.iconButtonSize - 2);

	return (
		<ScrollView
			style={styles.flex}
			contentContainerStyle={[
				styles.container,
				{
					paddingTop: topPad + spacing.topOffset,
					paddingHorizontal: spacing.horizontal,
					paddingBottom: spacing.bottomPadding + insets.bottom,
				},
			]}
			showsVerticalScrollIndicator={false}
		>
			<AppIconButton
				icon="arrow-back"
				onPress={() => router.replace('/')}
				size={spacing.iconGlyphSize}
				containerSize={spacing.iconButtonSize}
			/>

			<View style={[styles.header, { marginBottom: spacing.sectionGap * 2 }]}>
				<Text style={[styles.title, { fontSize: spacing.titleSize }]}>Join SubTeach</Text>
				<Text style={styles.subtitle}>Select your role to get started</Text>
			</View>

			<View style={[styles.cards, { gap: spacing.sectionGap, marginBottom: spacing.sectionGap * 2 }]}>
				<TouchableOpacity
					style={styles.roleCardTouchable}
					onPress={() => router.push('/register-teacher')}
					activeOpacity={0.8}
				>
					<AppCard variant="surface" padding={spacing.cardPadding} style={styles.roleCard}>
						<View
							style={[
								styles.roleIcon,
								{
									backgroundColor: Colors.primaryBg,
									width: spacing.heroIconSize,
									height: spacing.heroIconSize,
									borderRadius: spacing.heroIconSize / 2,
								},
							]}
						>
							<Ionicons name="person" size={roleIconSize} color={Colors.primary} />
						</View>
						<Text style={styles.roleTitle}>I&apos;m a Teacher</Text>
						<Text style={styles.roleDesc}>
							Register as a substitute teacher, set your subjects and availability
						</Text>
						<View style={[styles.roleArrow, { width: arrowWrapSize, height: arrowWrapSize, borderRadius: arrowWrapSize / 2 }]}>
							<Ionicons name="arrow-forward" size={arrowSize} color={Colors.primary} />
						</View>
					</AppCard>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.roleCardTouchable}
					onPress={() => router.push('/register-school')}
					activeOpacity={0.8}
				>
					<AppCard variant="surface" padding={spacing.cardPadding} style={styles.roleCard}>
						<View
							style={[
								styles.roleIcon,
								{
									backgroundColor: Colors.secondaryBg,
									width: spacing.heroIconSize,
									height: spacing.heroIconSize,
									borderRadius: spacing.heroIconSize / 2,
								},
							]}
						>
							<Ionicons name="business" size={roleIconSize} color={Colors.secondary} />
						</View>
						<Text style={styles.roleTitle}>I&apos;m a School</Text>
						<Text style={styles.roleDesc}>
							Register your school, find and hire qualified substitute teachers
						</Text>
						<View style={[styles.roleArrow, { width: arrowWrapSize, height: arrowWrapSize, borderRadius: arrowWrapSize / 2, backgroundColor: Colors.secondaryBg }]}>
							<Ionicons name="arrow-forward" size={arrowSize} color={Colors.secondary} />
						</View>
					</AppCard>
				</TouchableOpacity>
			</View>

			<View style={styles.footer}>
				<Text style={styles.footerText}>Already have an account?</Text>
				<TouchableOpacity onPress={() => router.replace('/login')}>
					<Text style={styles.footerLink}>Sign In</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	flex: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	container: {
		flexGrow: 1,
	},
	header: {
		marginTop: 16,
	},
	title: {
		fontSize: 28,
		fontWeight: '800' as const,
		color: Colors.text,
		marginBottom: 6,
	},
	subtitle: {
		fontSize: 15,
		color: Colors.textSecondary,
	},
	cards: {
		gap: 16,
	},
	roleCardTouchable: {
		width: '100%',
	},
	roleCard: {
		alignItems: 'center',
		borderRadius: 16,
	},
	roleIcon: {
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
	},
	roleTitle: {
		fontSize: 20,
		fontWeight: '700' as const,
		color: Colors.text,
		marginBottom: 8,
	},
	roleDesc: {
		fontSize: 14,
		color: Colors.textSecondary,
		textAlign: 'center',
		lineHeight: 20,
		marginBottom: 12,
	},
	roleArrow: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: Colors.primaryBg,
		justifyContent: 'center',
		alignItems: 'center',
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 4,
		marginTop: 32,
	},
	footerText: {
		fontSize: 14,
		color: Colors.textSecondary,
	},
	footerLink: {
		fontSize: 14,
		color: Colors.primary,
		fontWeight: '600' as const,
	},
});
