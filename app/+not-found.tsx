import { Stack, useRouter } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { AppButton, AppPageHeader, useResponsiveSpacing } from '@/components/ui/AppPrimitives';

export default function NotFoundScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const spacing = useResponsiveSpacing();
	const topPad = Platform.OS === 'web' ? 67 : insets.top;

	return (
		<>
			<Stack.Screen options={{ title: 'Oops!' }} />
			<View
				style={[
					styles.container,
					{
						paddingTop: topPad + spacing.topOffset,
						paddingHorizontal: spacing.horizontal,
						paddingBottom: spacing.bottomPadding,
					},
				]}
			>
				<AppPageHeader
					title="This screen does not exist."
					subtitle="The route may be invalid or has moved."
					centered
					style={[styles.header, { marginBottom: spacing.sectionGap }]}
				/>
				<View style={styles.actions}>
					<AppButton title="Go To Home Screen" onPress={() => router.replace('/')} />
				</View>
			</View>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 0,
		backgroundColor: Colors.background,
	},
	header: {
		marginBottom: 8,
	},
	actions: {
		width: '100%',
		maxWidth: 420,
	},
});
