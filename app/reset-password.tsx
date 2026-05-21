import React, { useState } from 'react';
import {
	View, Text, TouchableOpacity, StyleSheet,
	KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { notify } from '@/lib/dialogs';
import {
	AppButton,
	AppCard,
	AppField,
	AppIconButton,
	AppPageHeader,
	useResponsiveSpacing,
} from '@/components/ui/AppPrimitives';
import { useAuth } from '@/contexts/AuthContext';

export default function ResetPasswordScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const spacing = useResponsiveSpacing();

	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [loading, setLoading] = useState(false);
	const { reset_password } = useAuth();
	const { email, reset_hash } = useLocalSearchParams();

	const topPad = Platform.OS === 'web' ? 67 : insets.top;

	async function handleSubmit() {
		if (!password.trim() || !confirm.trim()) {
			notify('Error', 'Please fill in all fields.');
			return;
		}

		if (password.length < 8) {
			notify('Error', 'Password must be at least 8 characters.');
			return;
		}

		if (password !== confirm) {
			notify('Error', 'Passwords do not match.');
			return;
		}

		setLoading(true);

		// TODO: connect ke API reset password
		try {
			const result = await reset_password({
				email: String(email),
				reset_hash: String(reset_hash),
				password,
			});

			if (result.success) {
				notify('Success', result.message, () => {
					router.replace('/login');
				});
			} else {
				notify('Error', result.message);
			}
		} catch (err) {
			console.log(err);
			notify('Error', 'Something went wrong');
		}

		setLoading(false);
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

				{/* Back Button */}
				<AppIconButton
					icon="arrow-back"
					onPress={() => router.back()}
					size={spacing.iconGlyphSize}
					containerSize={spacing.iconButtonSize}
					style={styles.backBtn}
				/>

				{/* Header */}
				<AppPageHeader
					title="Reset Password"
					subtitle="Create a new secure password"
					style={styles.header}
				/>
				<Text style={{ marginBottom: spacing.sectionGap, color: 'red', fontSize: 12 }}>
					{`*Due to security reasons, you must choose a new password for your account (${email}).`}
				</Text>

				{/* Form */}
				<AppCard padding={spacing.cardPadding} style={[styles.form, { marginBottom: spacing.sectionGap + 8 }]}>

					{/* Password */}
					<AppField
						label="New Password"
						icon="lock-closed-outline"
						value={password}
						onChangeText={setPassword}
						placeholder="Enter new password"
						secureTextEntry={!showPassword}
						trailing={(
							<TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
								<Ionicons
									name={showPassword ? 'eye-off-outline' : 'eye-outline'}
									size={18}
									color={Colors.textMuted}
								/>
							</TouchableOpacity>
						)}
					/>
					<Text style={{ color: 'red', fontSize: 11 }}>
					Password must contain at least 8 characters, 1 uppercase, 1 lowercase, and 1 number.
					</Text>

					{/* Confirm Password */}
					<AppField
						label="Confirm Password"
						icon="lock-closed-outline"
						value={confirm}
						onChangeText={setConfirm}
						placeholder="Confirm password"
						secureTextEntry={!showConfirm}
						trailing={(
							<TouchableOpacity onPress={() => setShowConfirm(prev => !prev)}>
								<Ionicons
									name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
									size={18}
									color={Colors.textMuted}
								/>
							</TouchableOpacity>
						)}
					/>

					{/* Button */}
					<AppButton
						title="Set Password"
						onPress={handleSubmit}
						variant="primary"
						loading={loading}
					/>
				</AppCard>

				{/* Footer */}
				<View style={styles.footer}>
					<Text style={styles.footerText}>Remember your password?</Text>
					<TouchableOpacity onPress={() => router.replace('/login')}>
						<Text style={styles.footerLink}>Back to login</Text>
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
});