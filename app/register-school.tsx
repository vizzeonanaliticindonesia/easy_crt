import React, { useEffect, useMemo, useState } from 'react';
import {
	View, Text, StyleSheet, ScrollView,
	Platform, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { notify } from '@/lib/dialogs';
import StepIndicator from '@/components/StepIndicator';
import { UserDocument } from '@/types';
import {
	AppButton,
	AppCard,
	AppDocumentRow,
	AppField,
	AppDateField,
	AppSearchSelectField,
	AppSectionTitle,
	AppTopBar,
	AppUploadArea,
	useResponsiveSpacing,
} from '@/components/ui/AppPrimitives';
import { getStates, getSuburbs, registerStep1, registerStep2, uploadDocument } from '@/lib/services/school';

const STEPS = ['Profile', 'Documents'];
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
// const LOCATION_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
// const LOCATION_STATES = getStates();
// const LOCATION_SUBURB_OPTIONS: Record<string, { id: string; suburb: string; postcode: string }[]> = {
// 	ACT: [
// 		{ id: 'act_1', suburb: 'Canberra', postcode: '2600' },
// 		{ id: 'act_2', suburb: 'Belconnen', postcode: '2617' },
// 	],
// 	NSW: [
// 		{ id: 'nsw_1', suburb: 'Sydney', postcode: '2000' },
// 		{ id: 'nsw_2', suburb: 'Parramatta', postcode: '2150' },
// 	],
// 	NT: [
// 		{ id: 'nt_1', suburb: 'Darwin', postcode: '0800' },
// 		{ id: 'nt_2', suburb: 'Alice Springs', postcode: '0870' },
// 	],
// 	QLD: [
// 		{ id: 'qld_1', suburb: 'Brisbane', postcode: '4000' },
// 		{ id: 'qld_2', suburb: 'Gold Coast', postcode: '4217' },
// 	],
// 	SA: [
// 		{ id: 'sa_1', suburb: 'Adelaide', postcode: '5000' },
// 		{ id: 'sa_2', suburb: 'Mount Gambier', postcode: '5290' },
// 	],
// 	TAS: [
// 		{ id: 'tas_1', suburb: 'Hobart', postcode: '7000' },
// 		{ id: 'tas_2', suburb: 'Launceston', postcode: '7250' },
// 	],
// 	VIC: [
// 		{ id: 'vic_1', suburb: 'Melbourne', postcode: '3000' },
// 		{ id: 'vic_2', suburb: 'Geelong', postcode: '3220' },
// 	],
// 	WA: [
// 		{ id: 'wa_1', suburb: 'Perth', postcode: '6000' },
// 		{ id: 'wa_2', suburb: 'Fremantle', postcode: '6160' },
// 	],
// };

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

export default function RegisterSchoolScreen() {
	const router = useRouter();
	const { register } = useAuth();
	const insets = useSafeAreaInsets();
	const [step, setStep] = useState(0);
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
	const [documentName, setDocumentName] = useState('');
	const [documentNumber, setDocumentNumber] = useState('');
	const [issuedBy, setIssuedBy] = useState('');
	const [issueDate, setIssueDate] = useState('');
	const [expiryDate, setExpiryDate] = useState('');
	const [name, setName] = useState('');
	const [uri, setUri] = useState('');
	const [type, setType] = useState('');
	const [documents, setDocuments] = useState<UserDocument[]>([]);
	const [integrityAccepted, setIntegrityAccepted] = useState(false);
	const [step1Data, setStep1Data] = useState<any>(null);

	const [states, setStates] = useState<any[]>([])
	const [suburbs, setSuburbs] = useState<any[]>([])

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

				setStates(formatted)

			} catch (err: any) {
				console.log('ERROR STATES:', err)
				notify('Error', err?.message || String(err))
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

	const selectedSuburbLabel = selectedSuburb
		? selectedSuburb.label
		: '';

	function handleSuburbChange(label: string) {
		const selected = suburbsForState.find((item) => item.label === label);
		setLocationSuburbId(selected?.value || '');
		setPostcode(selected?.postcode || '');
	}

	async function pickDocument() {
		try {
			const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
			if (!result.canceled && result.assets?.[0]) {
				const asset = result.assets[0];
				setDocuments((prev) => [
					...prev,
					{
						id: Date.now().toString(),
						name: asset.name,
						uri: asset.uri,
						type: asset.mimeType || 'unknown',
						documentName: documentName.trim(),
						documentNumber: documentNumber.trim(),
						issuedBy: issuedBy.trim(),
						issueDate,
						expiryDate,
						uploadedAt: new Date().toISOString(),
					},
				]);
			}
		} catch {
			notify('Error', 'Failed to pick document');
		}
	}

	function validateStep(): boolean {
		if (step === 0) {
			if (!schoolName.trim() || !email.trim() || !phone.trim() || !schoolType || !sector || !araraSchoolId.trim()) {
				notify('Error', 'Please fill in all required fields.');
				return false;
			}
			if (!email.includes('@')) {
				notify('Error', 'Please enter a valid email.');
				return false;
			}
		}
		if (step === 1) {
			if (!address.trim() || !locationState || !locationSuburbId || !postcode.trim()) {
				notify('Error', 'Please complete the school location details.');
				return false;
			}
			if (!documentName.trim() || !issuedBy.trim() || !issueDate.trim()) {
				notify('Error', 'Please complete the document details.');
				return false;
			}
		}
		return true;
	}

	// function nextStep() {
	// 	if (!validateStep()) return;
	// 	setStep((s) => Math.min(s + 1, STEPS.length - 1));
	// }

	async function nextStep() {
		if (!validateStep()) return;

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

			const res = await registerStep1(payload);

			setStep1Data(payload);

			console.log('STEP 1 RES:', res);

			setStep((s) => Math.min(s + 1, STEPS.length - 1));

		} catch (err: any) {
			console.log('STEP1 ERROR:', err);

			const message =
				err?.response?.data?.message ||
				err?.message ||
				'Something went wrong';

			notify('Error', message);
		}
	}

	function prevStep() {
		setStep((s) => Math.max(s - 1, 0));
	}

	async function handleSubmit() {
		if (!integrityAccepted) {
			notify('Error', 'Please accept the integrity statement.');
			return;
		}

		const doc = documents[0];

		if (!doc.uri) {
			notify('Error', 'Invalid file selected');
			return;
		}

		setLoading(true);

		try {
			// 1. UPLOAD FILE (FormData)
			console.log('DOC:', doc);
			const uploadResult = await uploadDocument({
				uri: doc.uri,
				name: doc.name,
				type: doc.type
			});

			console.log('UPLOAD RESULT:', uploadResult);


			const filePath = uploadResult.file_path; //ambil kembalian dari API upload

			// 2. STEP 2 (JSON)
			const step2Res = await registerStep2({
				...step1Data,
				integrityAccepted: true,
				document_name: documentName.trim(),
				document_number: documentNumber.trim(),
				issued_by: issuedBy.trim(),
				issue_date: issueDate,
				expiry_date: expiryDate,
				file_path: filePath,
			});



			notify('Success', 'Registration complete! Please check your email regularly for account confirmation.', () =>
				router.replace('/login')
			);

		} catch (err) {
			console.log(err);
			notify('Error', 'Failed');
		}

		setLoading(false);
	}

	return (
		<View style={[styles.flex, { paddingTop: topPad }]}>
			<AppTopBar
				title="School Registration"
				onBack={step > 0 ? prevStep : () => router.replace('/register-select')}
				horizontalPadding={spacing.horizontal}
				verticalPadding={spacing.topBarVertical}
				iconButtonSize={spacing.iconButtonSize}
				iconSize={spacing.iconGlyphSize}
			/>

			<StepIndicator steps={STEPS} currentStep={step} />

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
				{step === 0 && (
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
						<AppField label="Postcode" value={postcode} onChangeText={setPostcode} icon="mail-outline" inputProps={{ editable: false }} helperText="Auto-filled from selected suburb" />

					</AppCard>
				)}

				{step === 1 && (
					<AppCard padding={spacing.cardPadding} style={styles.formSection}>
						<AppSectionTitle title="Document Details" size="md" style={styles.blockTitle} />
						<AppField label="Document Name" value={documentName} onChangeText={setDocumentName} icon="document-text-outline" placeholder="School License / Permit" />
						<AppField label="Document Number" value={documentNumber} onChangeText={setDocumentNumber} icon="key-outline" />
						<AppField label="Issued By" value={issuedBy} onChangeText={setIssuedBy} icon="business-outline" />
						<AppDateField label="Issue Date" value={issueDate} onChange={setIssueDate} helperText="Required" />
						<AppDateField label="Expiry Date" value={expiryDate} onChange={setExpiryDate} helperText="Optional" />

						<AppSectionTitle title="Upload File" size="md" style={styles.blockTitle} />
						<AppUploadArea label="Add Document" onPress={pickDocument} tone="secondary" />
						{documents.map((doc) => (
							<AppDocumentRow
								key={doc.id}
								name={doc.name}
								onRemove={() => setDocuments((prev) => prev.filter((d) => d.id !== doc.id))}
							/>
						))}

						<View style={styles.integrityRow}>
							<Switch
								value={integrityAccepted}
								onValueChange={setIntegrityAccepted}
								trackColor={{ false: Colors.border, true: Colors.secondary + '50' }}
								thumbColor={integrityAccepted ? Colors.secondary : Colors.textMuted}
							/>
							<Text style={styles.integrityText}>
								I accept the integrity statement and confirm that all information provided is accurate
							</Text>
						</View>
					</AppCard>
				)}
			</ScrollView>

			<View style={[styles.bottomBar, { paddingHorizontal: spacing.horizontal, paddingBottom: Math.max(16, spacing.bottomPadding - 8) + insets.bottom }]}>
				{step < STEPS.length - 1 ? (
					<AppButton title="Continue" onPress={nextStep} variant="secondary" icon="arrow-forward" />
				) : (
					<AppButton
						title="Complete Registration"
						onPress={handleSubmit}
						loading={loading}
						variant="secondary"
					/>
				)}
			</View>
		</View>

	);
}

const styles = StyleSheet.create({
	flex: { flex: 1, backgroundColor: Colors.background },
	content: { paddingBottom: 120 },
	formSection: { gap: 16, marginBottom: 16 },
	blockTitle: { marginTop: 4, marginBottom: -2 },
	sectionDesc: { fontSize: 14, color: Colors.textSecondary, marginTop: -8 },
	integrityRow: {
		flexDirection: 'row', alignItems: 'center', gap: 12,
		backgroundColor: Colors.warningBg, padding: 14, borderRadius: 12,
	},
	integrityText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 20 },
	bottomBar: {
		position: 'absolute', bottom: 0, left: 0, right: 0,
		backgroundColor: Colors.background,
		borderTopWidth: 1, borderTopColor: Colors.border,
	},
});