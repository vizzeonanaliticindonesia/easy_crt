import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, TextInput, Image, RefreshControl, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { SchoolProfile } from '@/types';
import { useIsFocused } from '@react-navigation/native';
import { Colors } from '@/constants/Colors';
import { confirmDialog, notify } from '@/lib/dialogs';

import {
	AppButton,
	AppCard,
	AppPageHeader,
	AppSectionHeader,
	AppField,
	AppSearchSelectField,
	useResponsiveSpacing,
} from '@/components/ui/AppPrimitives';
import { getSchoolProfile, getStates, getSuburbs, updateSchoolProfile, uploadProfilePhoto } from '@/lib/services/school';
import { Modal } from 'react-native';

// Location data (same pattern as register-teacher)
const LOCATION_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
const SCHOOL_TYPE_OPTIONS = [
	{ value: 'Primary', label: 'Primary' },
	{ value: 'Secondary', label: 'Secondary' },
	{ value: 'K-12', label: 'K-12' },
];
const SECTOR_OPTIONS = [
	{ value: 'Government', label: 'Government' },
	{ value: 'Catholic', label: 'Catholic' },
	{ value: 'Independent', label: 'Independent' },
];

const SCHOOL_TYPE_LABEL_BY_VALUE = Object.fromEntries(
	SCHOOL_TYPE_OPTIONS.map((item) => [item.value, item.label])
) as Record<string, string>;

const SCHOOL_TYPE_VALUE_BY_LABEL = Object.fromEntries(
	SCHOOL_TYPE_OPTIONS.map((item) => [item.label, item.value])
) as Record<string, string>;

const SECTOR_LABEL_BY_VALUE = Object.fromEntries(
	SECTOR_OPTIONS.map((item) => [item.value, item.label])
) as Record<string, string>;

const SECTOR_VALUE_BY_LABEL = Object.fromEntries(
	SECTOR_OPTIONS.map((item) => [item.label, item.value])
) as Record<string, string>;


export default function SchoolProfileScreen() {
	const { user, logout, updateUser } = useAuth();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const topPad = Platform.OS === 'web' ? 67 : insets.top;
	const spacing = useResponsiveSpacing();
	const school = user as SchoolProfile | null;
	const [profileImage, setProfileImage] = useState<string>('');
	const isFocused = useIsFocused();
	const avatarSize = spacing.heroIconSize;
	const avatarIconSize = spacing.heroIconSize <= 64 ? 30 : spacing.heroIconSize >= 78 ? 38 : 34;
	const [verificationLogs, setVerificationLogs] = useState<any[]>([]);
	const [showVerifLogs, setShowVerifLogs] = useState(false);
	const [verifStatus, setVerifStatus] = useState<number>(0);

	// Form state (frontend-only, no persistence without backend)
	const [schoolId, setSchoolId] = useState('');
	const [acaraSchoolId, setAcaraSchoolId] = useState('');
	const [schoolName, setSchoolName] = useState('');
	const [schoolType, setSchoolType] = useState('');
	const [location_state, setLocationState] = useState('');
	const [location_suburb_id, setLocationSuburbId] = useState('');
	const [suburbsOptions, setSuburbsOptions] = useState('');
	const [suburbs, setSuburbs] = useState<any[]>([]);
	const [postcode, setPostcode] = useState('');
	const [sector, setSector] = useState('');
	const [address, setAddress] = useState('');
	const [contactEmail, setContactEmail] = useState('');
	const [contactPhone, setContactPhone] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [repeatPassword, setRepeatPassword] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const [docsLoading, setDocsLoading] = useState(true);
	const [loadingProfile, setLoadingProfile] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [stateOptions, setStateOptions] = useState<{ label: string, value: string }[]>([]);

	useEffect(() => {
		if (!user) {
			router.replace('/login');
		}
	}, [user, router]);


	async function fetchProfile() {
		if (user?.role !== 10) return;
		try {
			setLoadingProfile(true);
			const res = await getSchoolProfile();

			if (res.status === 'success') {
				setSchoolId(res.school_id || '');
				setAcaraSchoolId(res.acara_school_id || '');
				setSchoolName(res.school_name || '');
				setSchoolType(res.school_type || '');
				setLocationState(res.state || '');
				if (res.state) {
					await handleStateChange(res.state);
				}
				setLocationSuburbId(res.suburb_id || '');
				setPostcode(res.postcode || '');
				setSector(res.sector || '');
				setAddress(res.address_line1 || '');
				setContactEmail(res.contact_email || '');
				setContactPhone(res.contact_phone || '');
				setProfileImage(res.photo != null ? res.photo : school?.profileImage);
				setVerificationLogs(user.verification_logs || []);
				setVerifStatus(user.verification_status ?? 0);
			}

		} catch (e) {
			console.error('Failed to fetch school profile:', e);
		} finally {
			setLoadingProfile(false);
		}
	}

	useEffect(() => {
		if (user && isFocused) {
			fetchProfile();
		}
	}, [user, isFocused]);

	async function onRefresh() {
		setRefreshing(true);
		try {
			await fetchProfile();
		} finally {
			setRefreshing(false);
		}
	}



	useEffect(() => {
		async function loadStates() {
			try {
				const raw = await getStates()

				const res = typeof raw === 'string' ? JSON.parse(raw) : raw

				// console.log('RES STATES:', res)
				// // console.log('TYPE:', typeof res)
				// console.log('TYPE:', res.state)

				// mapping biar cocok ke component
				const formatted = res.locations.map((item: any) => ({
					label: item.state,
					value: item.state,
				}))

				setStateOptions(formatted)

			} catch (err) {
				console.log('ERROR STATES:', err)
			}
		}

		loadStates()
	}, [])


	async function handleStateChange(nextState: string) {
		setLocationState(nextState);
		setLocationSuburbId('');

		try {
			const raw = await getSuburbs(nextState)

			const res = typeof raw === 'string' ? JSON.parse(raw) : raw

			console.log('SUBURB RES:', res)

			// sesuaikan dengan API kamu nanti
			const list = res.suburbs || []

			const formatted = list.map((item: any) => ({
				label: item.suburb + ' (' + item.postcode + ')',
				value: String(item.id),
				suburb: item.suburb,
				postcode: item.postcode,
				id: String(item.id),
			}))

			setSuburbs(formatted)

		} catch (err) {
			console.log('ERROR SUBURB:', err)
		}
	}

	const suburbsForState = useMemo(() => {
		if (!location_state) return [];
		return suburbs || [];
	}, [location_state, suburbs]);

	const selectedSuburb = useMemo(() => {
		return suburbsForState.find((item) => String(item.value) === String(location_suburb_id)) || null;
	}, [suburbsForState, location_suburb_id]);

	const suburbLabels = useMemo(() => {
		return suburbsForState.map((item) => `${item.suburb} (${item.postcode})`);
	}, [suburbsForState]);

	const suburbOptions = useMemo(
		() => suburbLabels.map((label) => ({ label, value: label })),
		[suburbLabels]
	);

	const selectedSuburbLabel = selectedSuburb
		? selectedSuburb.label
		: '';

	function handleSuburbChange(value: string) {
		const selected = suburbsForState.find((item) => String(item.value) === String(value));
		setLocationSuburbId(selected?.value || '');
		setPostcode(selected?.postcode || '');
	}

	useEffect(() => {
		if (selectedSuburb) {
			setPostcode(selectedSuburb.postcode || '');
		}
	}, [selectedSuburb]);

	async function handleSave() {
		const shouldSave = await confirmDialog({
			title: 'Confirm Changes',
			message:
				'Updating your school profile may require provider re-verification. This could temporarily affect your verification status. Do you want to continue?',
			confirmText: 'Save Changes',
		});

		if (!shouldSave) return;

		if (!schoolName.trim() || !contactEmail.trim()) {
			alert('School Name and Contact Email are required');
			return;
		}

		if (!contactEmail.includes('@')) {
			notify('Error', 'Please enter a valid email');
			return;
		}

		if (password.trim() || repeatPassword.trim()) {
			if (!password.trim() || !repeatPassword.trim()) {
				notify('Error', 'Password and Repeat Password are required');
				return;
			}
			if (password !== repeatPassword) {
				notify('Error', 'Password and Repeat Password must match');
				return;
			}
			if (password.length < 8) {
				notify('Error', 'Password must be at least 8 characters');
				return;
			}
		}

		setIsSaving(true);
		try {
			const updates = await updateSchoolProfile({
				school_name: schoolName.trim(),
				school_type: schoolType.trim(),
				sector: sector.trim(),
				address: address.trim(),
				acara_school_id: acaraSchoolId.trim(),
				contact_email: contactEmail.trim(),
				contact_phone: contactPhone.trim(),
				...(password.trim() ? { password: password.trim() } : {}),
				location_id: (location_suburb_id || '').trim(),
			});

			notify('Success', 'Profile saved successfully');
			setVerifStatus(0);
		} catch (e) {
			const error = e as any;

			notify(
				'Error',
				error?.response?.data?.message ||
				error?.message ||
				'Something went wrong'
			);
		} finally {
			setIsSaving(false);
		}
	}

	async function handleLogout() {
		if (verifStatus == 2) {
			notify('Info', 'Please save your profile before logging out.');
			return;
		}

		const shouldLogout = await confirmDialog({
			title: 'Logout',
			message: 'Are you sure you want to log out?',
			confirmText: 'Logout',
			destructive: true,
		});

		if (!shouldLogout) return;
		await logout();
		router.replace('/login');
	}

	async function handleChangePhoto() {
		try {
			const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (permission.status !== 'granted') {
				notify('Permission required', 'Permission to access photos is required');
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: false,
				aspect: [1, 1],
				quality: 0.8,
			});

			const canceled = (result as any).canceled ?? (result as any).cancelled ?? false;
			if (canceled) return;

			const asset = (result as any).assets?.[0];
			if (!asset?.uri) return;

			const uri = asset.uri;

			const name = asset.fileName || `photo_${Date.now()}.jpg`;
			const type = asset.mimeType || 'image/jpeg';

			console.log('UPLOAD DATA:', { uri, name, type });

			const res = await uploadProfilePhoto({ uri, name, type });

			console.log('UPLOAD RES:', res);

			if (res?.status === 'success') {
				setProfileImage(res.photo); //  dari backend (URL full)
				notify('Success', 'Profile photo updated');
			} else {
				notify('Error', res?.message || 'Upload failed');
			}

		} catch (e) {
			console.error('Failed to pick image', e);
			notify('Error', 'Failed to update photo');
		}
	}

	if (!school) {
		return (
			<View style={[styles.container, styles.loadingState]}>
				<ActivityIndicator size="large" color={Colors.secondary} />
			</View>
		);
	}

	console.log('ver status: ', verifStatus);

	return (
		<View style={{ flex: 1 }}>
			<ScrollView
				style={styles.container}
				contentContainerStyle={[
					styles.content,
					{
						paddingTop: topPad + spacing.topOffset,
						paddingHorizontal: spacing.horizontal,
						paddingBottom: spacing.bottomPadding,
					},
				]}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} progressBackgroundColor={Colors.surface} />}
			>
				<View style={{ alignItems: 'center', marginBottom: spacing.sectionGap }}>
					<Text style={styles.pageTitle}>Profile</Text>
					<Text style={styles.pageSubtitle}>Manage your school information</Text>
				</View>

				{/* Profile Photo Section */}
				<View style={[styles.profileHeader, { marginBottom: spacing.sectionGap }]}>
					<View style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, overflow: 'hidden' }]}>
						{profileImage ? (
							<Image source={{ uri: profileImage }} style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }} />
						) : (
							<Ionicons name="business" size={avatarIconSize} color={Colors.secondary} />
						)}
					</View>
					<TouchableOpacity style={styles.changePhotoBtn} activeOpacity={0.7} onPress={handleChangePhoto}>
						<Ionicons name="camera" size={16} color={Colors.primary} />
						<Text style={styles.changePhotoText}>Change Photo</Text>
					</TouchableOpacity>
				</View>

				{/* Verification Logs Button */}
				{verifStatus != 1 && (
					<TouchableOpacity style={verifStyles.logsBtn} onPress={() => setShowVerifLogs(true)} activeOpacity={0.8}>
						<Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
						<Text style={verifStyles.logsBtnText}>Revision Notes</Text>
						{verificationLogs.length > 0 && (
							<View style={verifStyles.badge}>
								<Text style={verifStyles.badgeText}>{verificationLogs.length}</Text>
							</View>
						)}
						<Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
					</TouchableOpacity>
				)}

				{/* Profile Information Form */}
				<View style={styles.section}>
					<View style={[styles.formCard, { padding: spacing.cardPadding }]}>
						<AppSectionHeader title="School Information" titleSize="md" />
						<View style={styles.formGroup}>
							<Text style={[styles.label, { color: Colors.error }]}>School Name *</Text>
							<TextInput style={styles.input} value={schoolName} onChangeText={setSchoolName} placeholder="Enter school name" placeholderTextColor={Colors.textMuted} />
						</View>
						<View style={styles.formGroup}>
							<Text style={styles.label}>Acara School ID</Text>
							<TextInput style={styles.input} value={acaraSchoolId} onChangeText={setAcaraSchoolId} placeholder="Enter ID" placeholderTextColor={Colors.textMuted} />
						</View>
						<View style={styles.formGroup}>
							<AppSearchSelectField
								label="School Type"
								value={SCHOOL_TYPE_LABEL_BY_VALUE[schoolType] || ''}
								onChange={(label) => setSchoolType(SCHOOL_TYPE_VALUE_BY_LABEL[label] || '')}
								options={SCHOOL_TYPE_OPTIONS}
								placeholder="Select school type"
								searchPlaceholder="Search school type..."
								closeOnSelect
							/>
						</View>

						<AppSectionHeader title="Location Information" titleSize="md" />
						<View style={styles.formGroup}>
							<AppSearchSelectField
								label="Sector"
								value={SECTOR_LABEL_BY_VALUE[sector] || ''}
								onChange={(label) => setSector(SECTOR_VALUE_BY_LABEL[label] || '')}
								options={SECTOR_OPTIONS}
								placeholder="Select sector"
								searchPlaceholder="Search sector..."
								closeOnSelect
							/>
						</View>
						<View style={styles.formGroup}>
							<AppSearchSelectField label="State" value={location_state} onChange={handleStateChange} options={stateOptions} placeholder="Select state" searchPlaceholder="Search state..." closeOnSelect />
						</View>
						<View style={styles.formGroup}>
							<AppSearchSelectField
								label="Suburb"
								value={selectedSuburb?.value || ''}
								onChange={handleSuburbChange}
								options={suburbs}
								placeholder={location_state ? 'Select suburb' : 'Select state first'}
								searchPlaceholder="Search suburb..."
								helperText={location_state ? undefined : 'Choose State first'}
								closeOnSelect
							/>
						</View>
						<View style={styles.formGroup}>
							<AppField label="Postcode" value={postcode} onChangeText={setPostcode} icon="mail-outline" inputProps={{ editable: false }} helperText="Auto-filled from selected suburb" />
						</View>
						<View style={styles.formGroup}>
							<Text style={styles.label}>Address</Text>
							<TextInput style={[styles.input, { minHeight: 80 }]} value={address} onChangeText={setAddress} placeholder="Enter full address" placeholderTextColor={Colors.textMuted} multiline textAlignVertical="top" />
						</View>

						<AppSectionHeader title="Contact Information" titleSize="md" />
						<View style={styles.formGroup}>
							<Text style={styles.label}>Contact Phone</Text>
							<TextInput style={styles.input} value={contactPhone} onChangeText={setContactPhone} placeholder="Enter phone number" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />
						</View>
						<View style={styles.formGroup}>
							<Text style={[styles.label, { color: Colors.error }]}>Contact Email *</Text>
							<TextInput style={styles.input} value={contactEmail} onChangeText={setContactEmail} placeholder="Enter account email" placeholderTextColor={Colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
						</View>

						<AppSectionHeader title="Account Setup" titleSize="md" />
						<View style={styles.formGroup}>
							<Text style={styles.label}>Password</Text>
							<TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
						</View>
						<View style={styles.formGroup}>
							<Text style={styles.label}>Confirm Password</Text>
							<TextInput style={styles.input} value={repeatPassword} onChangeText={setRepeatPassword} secureTextEntry />
						</View>
					</View>

					<AppButton title="Save Profile" onPress={handleSave} loading={isSaving} style={[styles.saveBtn, { marginTop: spacing.sectionGap }]} />
				</View>

				<TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
					<Ionicons name="log-out-outline" size={20} color={Colors.error} />
					<Text style={styles.logoutText}>Logout</Text>
				</TouchableOpacity>
			</ScrollView>

			{/* MODAL - di luar ScrollView */}
			<Modal
				visible={showVerifLogs && verifStatus !== 1}
				transparent
				animationType="fade"
				onRequestClose={() => setShowVerifLogs(false)}
			>
				<View style={verifStyles.overlay}>
					<TouchableWithoutFeedback onPress={() => setShowVerifLogs(false)}>
						<View style={StyleSheet.absoluteFill} />
					</TouchableWithoutFeedback>
					<View style={verifStyles.modal}>
						<View style={verifStyles.modalHeader}>
							<Text style={verifStyles.modalTitle}>
								Revision Notes
							</Text>

							<TouchableOpacity
								onPress={() => setShowVerifLogs(false)}
							>
								<Ionicons
									name="close"
									size={22}
									color={Colors.text}
								/>
							</TouchableOpacity>
						</View>

						<ScrollView
							style={verifStyles.scrollContent}
							contentContainerStyle={{ paddingBottom: 8 }}
							nestedScrollEnabled
							keyboardShouldPersistTaps="handled"
							showsVerticalScrollIndicator={false}
						>
							{verificationLogs.length === 0 ? (
								<Text style={verifStyles.emptyText}>
									No Revision Notes found.
								</Text>
							) : (
								verificationLogs.map((log, index) => (
									<View
										key={log.id}
										style={[
											verifStyles.logItem,
											index !== verificationLogs.length - 1 &&
											verifStyles.logItemBorder,
										]}
									>
										<View style={verifStyles.logRow}>
											<Ionicons
												name="time-outline"
												size={14}
												color={Colors.textSecondary}
											/>

											<Text style={verifStyles.logDate}>
												{new Date(
													log.created_at
												).toLocaleString(
													'en-AU',
													{
														day: '2-digit',
														month: 'short',
														year: 'numeric',
														hour: '2-digit',
														minute: '2-digit',
													}
												)}
											</Text>
										</View>

										<Text style={verifStyles.logNote}>
											{log.verification_notes?.trim() ||
												'No notes provided'}
										</Text>
									</View>
								))
							)}
						</ScrollView>
					</View>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background },
	loadingState: { justifyContent: 'center', alignItems: 'center' },
	content: { paddingBottom: 100 },
	profileHeader: {
		alignItems: 'center',
		marginBottom: 20,
	},
	avatar: {
		backgroundColor: Colors.secondaryBg,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 12,
	},
	changePhotoBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: Colors.primary + '30',
		backgroundColor: Colors.primaryBg,
	},
	changePhotoText: {
		fontSize: 13,
		fontWeight: '600' as const,
		color: Colors.primary,
	},
	section: { marginBottom: 16 },
	formCard: {
		backgroundColor: Colors.surface,
		borderWidth: 1,
		borderColor: Colors.border,
		borderRadius: 14,
	},
	formGroup: {
		marginBottom: 14,
	},
	label: {
		fontSize: 13,
		fontWeight: '600' as const,
		color: Colors.text,
		marginBottom: 6,
	},
	input: {
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderWidth: 1,
		borderColor: Colors.border,
		borderRadius: 10,
		fontSize: 14,
		color: Colors.text,
		backgroundColor: Colors.background,
	},
	saveBtn: {
		marginHorizontal: 0,
	},
	previewTitle: {
		fontSize: 14,
		fontWeight: '700' as const,
		color: Colors.text,
		marginBottom: 12,
	},
	docPreviewItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: Colors.border,
	},
	docInfo: {
		flex: 1,
	},
	docName: {
		fontSize: 13,
		fontWeight: '600' as const,
		color: Colors.text,
		marginBottom: 2,
	},
	docMeta: {
		fontSize: 12,
		color: Colors.textSecondary,
	},
	emptyText: {
		fontSize: 13,
		color: Colors.textMuted,
		fontStyle: 'italic',
	},
	logoutBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		padding: 16,
		borderRadius: 12,
		backgroundColor: Colors.errorBg,
		borderWidth: 1,
		borderColor: Colors.error + '30',
		marginTop: 20,
	},
	quickBtn: {
		flex: 1,
		borderWidth: 1,
		borderColor: Colors.border,
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		backgroundColor: Colors.background,
	},
	quickText: {
		fontSize: 12,
		fontWeight: '600' as const,
		color: Colors.text,
	},
	pageTitle: {
		fontSize: 22,
		fontWeight: '800' as const,
		color: Colors.text,
	},
	pageSubtitle: {
		fontSize: 13,
		color: Colors.textSecondary,
		marginTop: 4,
	},
	logoutText: { fontSize: 15, fontWeight: '600' as const, color: Colors.error },
});

const verifStyles = StyleSheet.create({
	scrollContent: {
		maxHeight: 360,
	},
	logsBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: Colors.primary + '30',
		backgroundColor: Colors.primaryBg,
		marginBottom: 16,
	},
	logsBtnText: {
		fontSize: 14,
		fontWeight: '600',
		color: Colors.primary,
		flex: 1,
	},
	badge: {
		backgroundColor: Colors.primary,
		borderRadius: 10,
		minWidth: 20,
		height: 20,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 5,
	},
	badgeText: {
		fontSize: 11,
		fontWeight: '700',
		color: '#fff',
	},
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.45)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 20,
	},
	modal: {
		backgroundColor: Colors.surface,
		borderRadius: 16,
		padding: 20,
		width: '100%',
		maxHeight: '85%',
		shadowColor: '#000',
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	modalTitle: {
		marginRight: 50,
		fontSize: 18,
		fontWeight: '700',
		color: Colors.text,
	},
	logItem: {
		paddingVertical: 12,
		gap: 6,
	},
	logItemBorder: {
		borderBottomWidth: 1,
		borderBottomColor: Colors.border,
	},
	logRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
	},
	logDate: {
		fontSize: 12,
		color: Colors.textSecondary,
	},
	logNote: {
		fontSize: 14,
		color: Colors.text,
		lineHeight: 20,
	},
	logNoteEmpty: {
		fontSize: 14,
		color: Colors.textMuted,
		fontStyle: 'italic',
	},
	emptyText: {
		fontSize: 14,
		color: Colors.textMuted,
		fontStyle: 'italic',
		textAlign: 'center',
		paddingVertical: 20,
	},
});