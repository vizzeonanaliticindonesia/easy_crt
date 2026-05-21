import React, { useState } from 'react';
import {
	View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
	Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { notify } from '@/lib/dialogs';
import { AppButton, AppCard, AppField, AppIconButton, AppPageHeader, useResponsiveSpacing } from '@/components/ui/AppPrimitives';

export default function LoginScreen() {
	const router = useRouter();
	const { login, user } = useAuth();
	const insets = useSafeAreaInsets();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const topPad = Platform.OS === 'web' ? 67 : insets.top;
	const spacing = useResponsiveSpacing();

	async function handleLogin() {
		if (!email.trim() || !password.trim()) {
			notify('Error', 'Please fill in all fields.');
			return;
		}
		setLoading(true);

		const result = await login(email.trim(), password.trim());
		setLoading(false);
		if (!result.success) {
			if (result.status === 'force_reset') {
				console.log('GO TO RESET PASSWORD');
				router.replace({
					pathname: '/reset-password',
					params: {
						email: result.email,
						reset_hash: result.reset_hash,
					},
				});
				return;
			}
			notify('Login Failed', result.message);
			return;
		}

	}

	return (
		<KeyboardAvoidingView
			style={styles.flex}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
		>
			<ScrollView
				style={styles.flex}
				contentContainerStyle={[
					styles.container,
					{
						paddingTop: topPad + spacing.topOffset,
						paddingHorizontal: spacing.horizontal,
						paddingBottom: spacing.bottomPadding,
					},
				]}
				keyboardShouldPersistTaps="handled"
			>
				<AppIconButton
					icon="arrow-back"
					onPress={() => router.replace('/')}
					size={spacing.iconGlyphSize}
					containerSize={spacing.iconButtonSize}
					style={styles.backBtn}
				/>

				<AppPageHeader title="Welcome Back" subtitle="Sign in to your account" style={styles.header} />

				<AppCard padding={spacing.cardPadding} style={[styles.form, { marginBottom: spacing.sectionGap + 8 }]}>
					<AppField
						label="Email"
						icon="mail-outline"
						value={email}
						onChangeText={setEmail}
						placeholder="Enter your email"
						keyboardType="email-address"
						inputProps={{ autoCapitalize: 'none' }}
					/>

					<AppField
						label="Password"
						icon="lock-closed-outline"
						value={password}
						onChangeText={setPassword}
						placeholder="Enter your password"
						secureTextEntry={!showPassword}
						trailing={(
							<TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
								<Ionicons
									name={showPassword ? 'eye-off-outline' : 'eye-outline'}
									size={18}
									color={Colors.textMuted}
								/>
							</TouchableOpacity>
						)}
					/>

					<AppButton title="Sign In" onPress={handleLogin} variant="primary" loading={loading} />
				</AppCard>

				<View style={styles.footer}>
					<Text style={styles.footerText}>Don&apos;t have an account?</Text>
					<TouchableOpacity onPress={() => router.replace('/register-select')}>
						<Text style={styles.footerLink}>Create Account</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1, backgroundColor: Colors.background },
	container: {
		paddingBottom: 40,
	},
	backBtn: {
		marginBottom: 24,
	},
	header: {
		marginBottom: 20,
	},
	form: {
		gap: 18,
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 4,
		marginBottom: 24,
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
	demoBox: {
		borderRadius: 14,
	},
	demoTitle: {
		fontSize: 13,
		fontWeight: '600' as const,
		color: Colors.primary,
		marginBottom: 6,
	},
	demoText: {
		fontSize: 12,
		color: Colors.textSecondary,
		lineHeight: 18,
	},
});
