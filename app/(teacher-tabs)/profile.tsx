import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, TextInput, Image, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { TeacherProfile } from '@/types';
import { Colors } from '@/constants/Colors';
import { confirmDialog, notify } from '@/lib/dialogs';
import { profileRepository } from '@/lib/repositories/profileRepository';
import {
	AppButton,
	AppCard,
	AppPageHeader,
	AppSectionHeader,
	AppField,
	AppSearchSelectField,
	AppDateField,
	useResponsiveSpacing,
} from '@/components/ui/AppPrimitives';
import { getStates, getSuburbs, getTeacherProfile, updateTeacherProfile, uploadProfilePhoto } from '@/lib/services/teacher';
import { useIsFocused } from '@react-navigation/native';

const ACCREDITATION_LEVEL_OPTIONS = [
	{ value: 'Graduate Teacher', label: 'Graduate Teacher' },
	{ value: 'Proficient Teacher', label: 'Proficient Teacher' },
	{ value: 'Highly Accomplished Teacher', label: 'Highly Accomplished Teacher' },
	{ value: 'Lead Teacher', label: 'Lead Teacher' },
];

const QUALIFICATION_LEVEL_OPTIONS = [
	{ value: 'Bachelor Degree', label: 'Bachelor Degree' },
	{ value: 'Graduate Diploma', label: 'Graduate Diploma' },
	{ value: 'Master Degree', label: 'Master Degree' },
	{ value: 'Post Graduate', label: 'Post Graduate' },
];

const ACCREDITATION_LABEL_BY_VALUE = Object.fromEntries(
	ACCREDITATION_LEVEL_OPTIONS.map((item) => [item.value, item.label])
) as Record<string, string>;

const ACCREDITATION_VALUE_BY_LABEL = Object.fromEntries(
	ACCREDITATION_LEVEL_OPTIONS.map((item) => [item.label, item.value])
) as Record<string, string>;

const QUALIFICATION_LABEL_BY_VALUE = Object.fromEntries(
	QUALIFICATION_LEVEL_OPTIONS.map((item) => [item.value, item.label])
) as Record<string, string>;

const QUALIFICATION_VALUE_BY_LABEL = Object.fromEntries(
	QUALIFICATION_LEVEL_OPTIONS.map((item) => [item.label, item.value])
) as Record<string, string>;



export default function TeacherProfileScreen() {
	const { user, logout, updateUser } = useAuth();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const topPad = Platform.OS === 'web' ? 67 : insets.top;
	const spacing = useResponsiveSpacing();
	const teacher = user as TeacherProfile | null;
	const [profileImage, setProfileImage] = useState<string>(teacher?.profileImage || '');
	const avatarSize = spacing.heroIconSize;
	const avatarIconSize = spacing.heroIconSize <= 64 ? 30 : spacing.heroIconSize >= 78 ? 38 : 34;

	// Form state (frontend-only, no persistence without backend)


	// Teacher Information
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [preferredName, setPreferredName] = useState('');
	const [dateOfBirth, setDateOfBirth] = useState('');
	const [gender, setGender] = useState('');
	const [teacherRegistrationNumber, setTeacherRegistrationNumber] = useState('');
	const [accreditation_level, set_accreditation_level] = useState('');
	const [qualification_level, set_qualification_level] = useState('');
	const [loadingProfile, setLoadingProfile] = useState(true);
	const [loadingRating, setLoadingRating] = useState<number | null>(null);

	// Contact Information
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');

	// Location
	const [location_state, setLocationState] = useState('');
	const [location_suburb_id, setLocationSuburbId] = useState('');
	const [postcode, setPostcode] = useState('');
	const [address, setAddress] = useState('');
	const [suburbs, setSuburbs] = useState<any[]>([]);
	const [stateOptions, setStateOptions] = useState([]);

	// Account Setup
	const [password, setPassword] = useState('');
	const [repeatPassword, setRepeatPassword] = useState('');

	// UI State
	const [isSaving, setIsSaving] = useState(false);
	const isFocused = useIsFocused();
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		if (!user) {
			router.replace('/login');
		}
	}, [user, router]);


	// Keep local form state in sync when user changes (persisted data)
	const fetchTeacherProfile = async () => {
		if (user?.role !== 9) return;
		setLoadingProfile(true);
		try {
			const res = await getTeacherProfile();

			setFirstName(res.first_name || '');
			setLastName(res.last_name || '');
			setPreferredName(res.preferred_name || '');
			setDateOfBirth(res.date_of_birth || '');
			setGender(res.gender || '');
			setTeacherRegistrationNumber(res.teacher_registration_number || '');
			set_accreditation_level(res.accreditation_level || '');
			set_qualification_level(res.qualification_level || '');
			setEmail(res.email || '');
			setPhone(res.phone || '');
			setLocationState(res.state || '');
			if (res.state) {
				await handleStateChange(res.state); // load suburbs
			}
			setLocationSuburbId(res.suburb_id || '');
			setPostcode(res.postcode || '');
			setPassword('');
			setRepeatPassword('');
			setProfileImage(res.photo != null ? res.photo : teacher?.profileImage);
			setLoadingRating(Number(res.rating) || 0);
		} catch (e) {
			console.error('Failed to fetch profile:', e);
		} finally {
			setLoadingProfile(false);
		}
	};

	useEffect(() => {
		if (isFocused) {
			fetchTeacherProfile();
		}
	}, [user, isFocused]);

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await fetchTeacherProfile();
		} finally {
			setRefreshing(false);
		}
	};

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
				value: item.id,
				suburb: item.suburb,
				postcode: item.postcode,
				id: item.id,
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
		return suburbsForState.find((item) => item.value === location_suburb_id) || null;
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

	function handleSuburbChange(label: string) {
		const selected = suburbsForState.find((item) => item.label === label);
		setLocationSuburbId(selected?.value || '');
		setPostcode(selected?.postcode || '');
	}

	useEffect(() => {
		if (selectedSuburb) {
			setPostcode(selectedSuburb.postcode || '');
		}
	}, [selectedSuburb]);

	async function handleSave() {
		if (!firstName.trim() || !lastName.trim()) {
			alert('First Name and Last Name are required');
			return;
		}

		if (!email.includes('@')) {
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
			const updates = await updateTeacherProfile({
				first_name: firstName.trim(),
				last_name: lastName.trim(),
				email: email.trim(),
				preferred_name: preferredName.trim(),
				date_of_birth: dateOfBirth.trim(),
				gender: gender.trim(),
				phone: phone.trim(),
				teacher_registration_number: teacherRegistrationNumber.trim(),
				accreditation_level: accreditation_level.trim(),
				qualification_level: qualification_level.trim(),
				location_id: location_suburb_id.trim(),
				...(password.trim() ? { password: password.trim() } : {}),
			});

			notify('Success', 'Profile saved successfully');
		} catch (e) {
			console.error('Failed to save profile:', e);
			notify('Error', 'Failed to save profile');
		} finally {
			setIsSaving(false);
		}
	}

	async function handleLogout() {
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
				allowsEditing: true,
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

	if (!teacher) {
		return (
			<View style={[styles.container, styles.loadingState]}>
				<ActivityIndicator size="large" color={Colors.secondary} />
			</View>
		);
	}
	return (
		<ScrollView
			style={styles.container}
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
			contentContainerStyle={[
				styles.content,
				{
					paddingTop: topPad + spacing.topOffset,
					paddingHorizontal: spacing.horizontal,
					paddingBottom: spacing.bottomPadding,
				},
			]}
		>
			<View style={{ alignItems: 'center', marginBottom: spacing.sectionGap }}>
				<Text style={styles.pageTitle}>Profile</Text>
				<Text style={styles.pageSubtitle}>Manage your profile information</Text>
			</View>
			{/* PROFILE PHOTO */}
			<View style={[styles.profileHeader, { marginBottom: spacing.sectionGap }]}>
				<View
					style={[
						styles.avatar,
						{
							width: avatarSize,
							height: avatarSize,
							borderRadius: avatarSize / 2,
							overflow: 'hidden',
						},
					]}
				>
					{profileImage ? (
						<Image
							source={{ uri: profileImage }}
							style={{
								width: avatarSize,
								height: avatarSize,
								borderRadius: avatarSize / 2,
							}}
						/>
					) : (
						<Ionicons name="person" size={avatarIconSize} color={Colors.secondary} />
					)}
				</View>
				
				<View style={[styles.ratingRow, { marginBottom: 6 }]}>
					{[1, 2, 3, 4, 5].map((star) => {
						const rating = Number(loadingRating ?? 0);  // ← dari API, bukan teacher.rating
						const filled = star <= Math.floor(rating);
						const half = !filled && star === Math.ceil(rating) && rating % 1 >= 0.5;

						return (
							<Ionicons
								key={star}
								name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
								size={13}
								color={filled || half ? Colors.warning : Colors.secondary}
							/>
						);
					})}
					<Text style={styles.rating}>{Number(loadingRating ?? 0).toFixed(1)}</Text>
					{/* hapus reviewCount atau isi dengan data lain, karena loadingRating sudah dipakai untuk nilai rating */}
				</View>

				<TouchableOpacity
					style={styles.changePhotoBtn}
					activeOpacity={0.7}
					onPress={handleChangePhoto}
				>
					<Ionicons name="camera" size={16} color={Colors.primary} />
					<Text style={styles.changePhotoText}>Change Photo</Text>
				</TouchableOpacity>
			</View>

			{/* QUICK ACCESS */}
			<AppCard
				style={{ marginBottom: spacing.sectionGap }}
				padding={spacing.cardPadding}
			>
				<Text style={{ fontWeight: '700', marginBottom: 12 }}>
					Add New
				</Text>

				<View style={{ flexDirection: 'row', gap: 10 }}>

					<TouchableOpacity
						style={styles.quickBtn}
						onPress={() => router.push('/subjects')}
					>
						<Ionicons name="book-outline" size={20} color={Colors.primary} />
						<Text style={styles.quickText}>My Subjects</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.quickBtn}
						onPress={() => router.push('/documents')}
					>
						<Ionicons name="document-outline" size={20} color={Colors.primary} />
						<Text style={styles.quickText}>My Documents</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.quickBtn}
						onPress={() => router.push('/teacher-reviews')}
					>
						<Ionicons name="star-outline" size={20} color={Colors.primary} />
						<Text style={styles.quickText}>Reviews</Text>
					</TouchableOpacity>

				</View>
			</AppCard>

			{/* FORM */}
			<View style={styles.section}>
				<View style={[styles.formCard, { padding: spacing.cardPadding }]}>

					{/* TEACHER INFORMATION */}
					<AppSectionHeader title="Teacher Information" titleSize="md" />

					<View style={styles.formGroup}>
						<Text style={styles.label}>First Name *</Text>
						<TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
					</View>

					<View style={styles.formGroup}>
						<Text style={styles.label}>Last Name *</Text>
						<TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
					</View>

					<View style={styles.formGroup}>
						<Text style={styles.label}>Preferred Name</Text>
						<TextInput style={styles.input} value={preferredName} onChangeText={setPreferredName} />
					</View>

					<AppDateField
						label="Date of Birth"
						value={dateOfBirth}
						onChange={setDateOfBirth}
					/>

					<View style={styles.formGroup}>
						<AppSearchSelectField
							label="Gender"
							value={gender}
							onChange={setGender}
							options={[
								{ label: 'Male', value: 'Male' },
								{ label: 'Female', value: 'Female' },
								{ label: 'Other', value: 'Other' },
							]}
							closeOnSelect
						/>
					</View>

					<View style={styles.formGroup}>
						<Text style={styles.label}>Teacher Registration Number</Text>
						<TextInput
							style={styles.input}
							value={teacherRegistrationNumber}
							onChangeText={setTeacherRegistrationNumber}
						/>
					</View>

					<AppSearchSelectField
						label="Accreditation Level"
						value={ACCREDITATION_LABEL_BY_VALUE[accreditation_level] || ''}
						onChange={(label) => set_accreditation_level(ACCREDITATION_VALUE_BY_LABEL[label] || '')}
						options={ACCREDITATION_LEVEL_OPTIONS}
						placeholder="Select accreditation level"
						searchPlaceholder="Search accreditation..."
						closeOnSelect
					/>

					<AppSearchSelectField
						label="Qualification Level"
						value={QUALIFICATION_LABEL_BY_VALUE[qualification_level] || ''}
						onChange={(label) => set_qualification_level(QUALIFICATION_VALUE_BY_LABEL[label] || '')}
						options={QUALIFICATION_LEVEL_OPTIONS}
						placeholder="Select qualification level"
						searchPlaceholder="Search qualification..."
						closeOnSelect
					/>

					{/* CONTACT */}
					<AppSectionHeader title="Contact Information" titleSize="md" />

					<View style={styles.formGroup}>
						<Text style={styles.label}>Email *</Text>
						<TextInput
							style={styles.input}
							value={email}
							onChangeText={setEmail}
							keyboardType="email-address"
							autoCapitalize="none"
						/>
					</View>

					<View style={styles.formGroup}>
						<Text style={styles.label}>Phone</Text>
						<TextInput
							style={styles.input}
							value={phone}
							onChangeText={setPhone}
							keyboardType="phone-pad"
						/>
					</View>

					{/* LOCATION */}
					<AppSectionHeader title="Location" titleSize="md" />

					<View style={styles.formGroup}>
						<AppSearchSelectField
							label="State"
							value={location_state}
							onChange={handleStateChange}
							options={stateOptions}
							closeOnSelect
						/>
					</View>

					<View style={styles.formGroup}>
						<AppSearchSelectField
							label="Suburb"
							value={selectedSuburbLabel}
							onChange={handleSuburbChange}
							options={suburbOptions}
							closeOnSelect
						/>
					</View>

					<View style={styles.formGroup}>
						<AppField
							label="Postcode"
							value={postcode}
							onChangeText={setPostcode}
							inputProps={{ editable: false }}
						/>
					</View>

					{/* ACCOUNT */}
					<AppSectionHeader title="Account Setup" titleSize="md" />

					<View style={styles.formGroup}>
						<Text style={styles.label}>Password</Text>
						<TextInput
							style={styles.input}
							value={password}
							onChangeText={setPassword}
							secureTextEntry
						/>
					</View>

					<View style={styles.formGroup}>
						<Text style={styles.label}>Confirm Password</Text>
						<TextInput
							style={styles.input}
							value={repeatPassword}
							onChangeText={setRepeatPassword}
							secureTextEntry
						/>
					</View>

				</View>

				{/* SAVE */}
				<AppButton
					title="Save Profile"
					onPress={handleSave}
					loading={isSaving}
					style={[styles.saveBtn, { marginTop: spacing.sectionGap }]}
				/>
			</View>

			{/* LOGOUT */}
			<TouchableOpacity
				style={styles.logoutBtn}
				onPress={handleLogout}
				activeOpacity={0.8}
			>
				<Ionicons name="log-out-outline" size={20} color={Colors.error} />
				<Text style={styles.logoutText}>Logout</Text>
			</TouchableOpacity>
		</ScrollView>
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
	ratingRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 3,
	},
	rating: {
		fontSize: 12,
		fontWeight: '600' as const,
		color: Colors.text,
	},
	reviewCount: {
		fontSize: 12,
		color: Colors.textMuted,
	}
});
