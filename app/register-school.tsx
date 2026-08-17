import React, { useEffect, useMemo, useState } from 'react';
import {
	View, Text, StyleSheet, ScrollView,
	Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { notify } from '@/lib/dialogs';
import {
	AppButton,
	AppCard,
	AppField,
	AppSearchSelectField,
	AppSectionTitle,
	AppTopBar,
	useResponsiveSpacing,
} from '@/components/ui/AppPrimitives';
import { getStates, getSuburbs, registerStep1 } from '@/lib/services/school';
import { isValidEmail } from '@/lib/forms';

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

export default function RegisterSchoolScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [loading, setLoading] = useState(false);
	const topPad = Platform.OS === 'web' ? 67 : insets.top;
	const spacing = useResponsiveSpacing();

	const [schoolName, setSchoolName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [address, setAddress] = useState('');
	const [schoolType, setSchoolType] = useState('');
	const [sector, setSector] = useState('');
	const [araraSchoolId, setAraraSchoolId] = useState('');
	const [locationState, setLocationState] = useState('');
	const [locationSuburbId, setLocationSuburbId] = useState('');
	const [postcode, setPostcode] = useState('');

	const [states, setStates] = useState<any[]>([]);
	const [suburbs, setSuburbs] = useState<any[]>([]);

	useEffect(() => {
		async function loadStates() {
			try {
				const raw = await getStates();
				const res = typeof raw === 'string' ? JSON.parse(raw) : raw;
				const formatted = res.locations.map((item: any) => ({
					label: item.state,
					value: item.state,
				}));
				setStates(formatted);
			} catch (err: any) {
				notify('Error', err?.message || String(err));
			}
		}
		loadStates();
	}, []);

	async function handleStateChange(nextState: string) {
		setLocationState(nextState);
		setLocationSuburbId('');
		try {
			const raw = await getSuburbs(nextState);
			const res = typeof raw === 'string' ? JSON.parse(raw) : raw;
			const list = res.suburbs || [];
			const formatted = list.map((item: any) => ({
				label: item.suburb + ' (' + item.postcode + ')',
				value: item.id,
				suburb: item.suburb,
				postcode: item.postcode,
				id: item.id,
			}));
			setSuburbs(formatted);
		} catch (err) {
			console.error('Failed to load suburbs:', err);
		}
	}

	const suburbsForState = useMemo(() => {
		if (!locationState) return [];
		return suburbs || [];
	}, [locationState, suburbs]);

	const selectedSuburb = useMemo(() => {
		return suburbsForState.find((item) => item.value === locationSuburbId) || null;
	}, [suburbsForState, locationSuburbId]);

	const suburbLabels = useMemo(() => {
		return suburbsForState.map((item) => `${item.suburb} (${item.postcode})`);
	}, [suburbsForState]);

	const suburbOptions = useMemo(
		() => suburbLabels.map((label) => ({ label, value: label })),
		[suburbLabels]
	);

	const selectedSuburbLabel = selectedSuburb ? selectedSuburb.label : '';

	function handleSuburbChange(label: string) {
		const selected = suburbsForState.find((item) => item.label === label);
		setLocationSuburbId(selected?.value || '');
		setPostcode(selected?.postcode || '');
	}

	function validate(): boolean {
		if (!schoolName.trim() || !email.trim() || !phone.trim() || !schoolType || !sector || !araraSchoolId.trim()) {
			notify('Error', 'Please fill in all required fields.');
			return false;
		}
		if (!isValidEmail(email)) {
			notify('Error', 'Please enter a valid email.');
			return false;
		}
		if (!locationState || !locationSuburbId || !postcode.trim()) {
			notify('Error', 'Please complete the school location details.');
			return false;
		}
		return true;
	}

	async function handleSubmit() {
		if (!validate()) return;

		setLoading(true);
		try {
			const payload = {
				school_name: schoolName.trim(),
				contact_email: email.trim(),
				contact_phone: phone.trim(),
				address: address.trim(),
				school_type: schoolType.trim(),
				sector: sector.trim(),
				acara_school_id: araraSchoolId.trim(),
				location_id: locationSuburbId.trim(),
			};

			await registerStep1(payload);

			notify('Success', 'Registration complete! Please check your email regularly for account confirmation.', () =>
				router.replace('/login')
			);
		} catch (err: any) {
			const message = err?.response?.data?.message || err?.message || 'Something went wrong';
			notify('Error', message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<View style={[styles.flex, { paddingTop: topPad }]}>
			<AppTopBar
				title="School Registration"
				onBack={() => router.replace('/register-select')}
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
						paddingBottom: spacing.bottomPadding + 96,
					},
				]}
				keyboardShouldPersistTaps="handled"
			>
				<AppCard padding={spacing.cardPadding} style={styles.formSection}>
					<AppSectionTitle title="School Information" size="lg" />
					<AppField label="School Name" value={schoolName} onChangeText={setSchoolName} icon="business-outline" />
					<AppField label="Email" value={email} onChangeText={setEmail} icon="mail-outline" keyboardType="email-address" inputProps={{ autoCapitalize: 'none' }} />
					<AppField label="Phone" value={phone} onChangeText={setPhone} icon="call-outline" keyboardType="phone-pad" />
					<AppSearchSelectField
						label="School Type"
						value={schoolType}
						onChange={setSchoolType}
						options={SCHOOL_TYPE_OPTIONS}
						placeholder="Select school type"
						searchPlaceholder="Search school type..."
						closeOnSelect
					/>
					<AppSearchSelectField
						label="Sector"
						value={sector}
						onChange={setSector}
						options={SECTOR_OPTIONS}
						placeholder="Select sector"
						searchPlaceholder="Search sector..."
						closeOnSelect
					/>
					<AppField label="ACARA School ID" value={araraSchoolId} onChangeText={setAraraSchoolId} icon="card-outline" />
					<AppField label="Full Address" value={address} onChangeText={setAddress} icon="map-outline" multiline />
					<AppSearchSelectField
						label="State"
						value={locationState}
						onChange={handleStateChange}
						options={states}
						placeholder="Select state"
						searchPlaceholder="Search state..."
						closeOnSelect
					/>
					<AppSearchSelectField
						label="Suburb"
						value={selectedSuburbLabel}
						onChange={handleSuburbChange}
						options={suburbOptions}
						placeholder={locationState ? 'Select suburb' : 'Select state first'}
						searchPlaceholder="Search suburb..."
						helperText={locationState ? undefined : 'Choose State first'}
						closeOnSelect
					/>
					<AppField
						label="Postcode"
						value={postcode}
						onChangeText={setPostcode}
						icon="mail-outline"
						inputProps={{ editable: false }}
						helperText="Auto-filled from selected suburb"
					/>
				</AppCard>
			</ScrollView>

			<View style={[styles.bottomBar, { paddingHorizontal: spacing.horizontal, paddingBottom: Math.max(16, spacing.bottomPadding - 8) + insets.bottom }]}>
				<AppButton title="Complete Registration" onPress={handleSubmit} loading={loading} variant="secondary" />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1, backgroundColor: Colors.background },
	content: { paddingBottom: 120 },
	formSection: { gap: 16, marginBottom: 16 },
	bottomBar: {
		position: 'absolute', bottom: 0, left: 0, right: 0,
		backgroundColor: Colors.background,
		borderTopWidth: 1, borderTopColor: Colors.border,
	},
});