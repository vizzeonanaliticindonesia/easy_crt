import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	Platform,
	ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
	SafeAreaView,
	useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';
import {
	AppButton,
	AppCard,
	AppPageHeader,
	useResponsiveSpacing,
} from '@/components/ui/AppPrimitives';

export default function WelcomeScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const spacing = useResponsiveSpacing();

	const logoSize = spacing.heroIconSize + 20;

	const logoIconSize =
		spacing.heroIconSize <= 64
			? 42
			: spacing.heroIconSize >= 78
			? 54
			: 48;

	const featureIconSize = spacing.iconGlyphSize + 1;

	return (
		<SafeAreaView
			style={styles.safe}
			edges={['top', 'bottom']}
		>
			<ScrollView
				style={styles.flex}
				contentContainerStyle={[
					styles.container,
					{
						paddingTop:
							Platform.OS === 'web'
								? 67
								: spacing.topOffset,

						paddingHorizontal: spacing.horizontal,

						// IMPORTANT:
						// extra bottom padding supaya aman di Android release build
						paddingBottom:
							spacing.bottomPadding +
							Math.max(insets.bottom, 16) +
							20,
					},
				]}
				showsVerticalScrollIndicator={false}
			>
				<View>
					<View
						style={[
							styles.logoSection,
							{
								marginBottom:
									spacing.sectionGap + 12,
							},
						]}
					>
						<View
							style={[
								styles.logoCircle,
								{
									width: logoSize,
									height: logoSize,
									borderRadius:
										logoSize / 2,
								},
							]}
						>
							<Ionicons
								name="school"
								size={logoIconSize}
								color={Colors.primary}
							/>
						</View>

						<AppPageHeader
							title="SubTeach"
							subtitle="Connecting schools with qualified substitute teachers"
							centered
							style={styles.headerTextBlock}
						/>
					</View>

					<View
						style={[
							styles.features,
							{
								gap: spacing.sectionGap,
							},
						]}
					>
						<FeatureItem
							icon="person-add-outline"
							title="Easy Registration"
							desc="Quick setup for teachers and schools"
							padding={spacing.cardPadding}
							iconSize={featureIconSize}
						/>

						<FeatureItem
							icon="calendar-outline"
							title="Session Management"
							desc="Create and manage teaching sessions"
							padding={spacing.cardPadding}
							iconSize={featureIconSize}
						/>

						<FeatureItem
							icon="shield-checkmark-outline"
							title="Verified Profiles"
							desc="Document verification for trust and safety"
							padding={spacing.cardPadding}
							iconSize={featureIconSize}
						/>
					</View>
				</View>

				<View style={styles.actions}>
					<AppButton
						title="Create Account"
						onPress={() =>
							router.push('/register-select')
						}
						variant="primary"
					/>

					<AppButton
						title="Sign In"
						onPress={() => router.push('/login')}
						variant="outline"
					/>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

function FeatureItem({
	icon,
	title,
	desc,
	padding,
	iconSize,
}: {
	icon: keyof typeof Ionicons.glyphMap;
	title: string;
	desc: string;
	padding: number;
	iconSize: number;
}) {
	return (
		<AppCard
			padding={padding}
			style={styles.featureRow}
		>
			<View style={styles.featureIconWrap}>
				<View style={styles.featureIcon}>
					<Ionicons
						name={icon}
						size={iconSize}
						color={Colors.primary}
					/>
				</View>

				<View style={styles.featureText}>
					<Text style={styles.featureTitle}>
						{title}
					</Text>

					<Text style={styles.featureDesc}>
						{desc}
					</Text>
				</View>
			</View>
		</AppCard>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: Colors.background,
	},

	flex: {
		flex: 1,
		backgroundColor: Colors.background,
	},

	container: {
		flexGrow: 1,
		justifyContent: 'space-between',
	},

	logoSection: {
		alignItems: 'center',
		marginBottom: 24,
		paddingTop: 6,
	},

	headerTextBlock: {
		marginBottom: 0,
	},

	logoCircle: {
		backgroundColor: Colors.primaryBg,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
	},

	features: {
		marginBottom: 26,
	},

	featureRow: {
		padding: 0,
	},

	featureIconWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 14,
	},

	featureIcon: {
		width: 42,
		height: 42,
		borderRadius: 12,
		backgroundColor: Colors.primaryBg,
		justifyContent: 'center',
		alignItems: 'center',
	},

	featureText: {
		flex: 1,
	},

	featureTitle: {
		fontSize: 15,
		fontWeight: '600',
		color: Colors.text,
	},

	featureDesc: {
		fontSize: 13,
		color: Colors.textSecondary,
		marginTop: 2,
	},

	actions: {
		gap: 12,
		paddingBottom: 12,
	},
});