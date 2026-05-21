import React, { useMemo, useState, useEffect } from 'react';
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
	AppDateField,
	AppDocumentRow,
	AppField,
	AppSearchSelectField,
	AppSectionTitle,
	AppTopBar,
	AppUploadArea,
	useResponsiveSpacing,
} from '@/components/ui/AppPrimitives';
import { getStates, getSuburbs } from '@/lib/services/school';
import { registerStep1, registerStep2, uploadDocument } from '@/lib/services/teacher';

type SuburbOption = {
	id: string;
	suburb: string;
	postcode: string;
};

const STEPS = ['Profile & Account', 'Documents & Declaration'];

const GENDER_OPTIONS = [
	{ value: 'Female', label: 'Female' },
	{ value: 'Male', label: 'Male' },
	{ value: 'Other', label: 'Other' }
];

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



// const LOCATION_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

// const LOCATION_SUBURB_OPTIONS: Record<string, SuburbOption[]> = {
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

export default function RegisterTeacherScreen() {
	const router = useRouter();
	const { register } = useAuth();
	const insets = useSafeAreaInsets();
	const [step, setStep] = useState(0);
	const [loading, setLoading] = useState(false);
	const topPad = Platform.OS === 'web' ? 67 : insets.top;
	const spacing = useResponsiveSpacing();

	const [first_name, set_first_name] = useState('');
	const [last_name, set_last_name] = useState('');
	const [preferred_name, set_preferred_name] = useState('');
	const [date_of_birth, set_date_of_birth] = useState('');
	const [gender, set_gender] = useState('');
	const [phone, set_phone] = useState('');
	const [teacher_registration_number, set_teacher_registration_number] = useState('');
	const [accreditation_level, set_accreditation_level] = useState('');
	const [qualification_level, set_qualification_level] = useState('');
	const [location_state, set_location_state] = useState('');
	const [location_suburb_id, set_location_suburb_id] = useState('');
	const [postcode, set_postcode] = useState('');
	const [email, setEmail] = useState('');
	const [username, set_username] = useState('');
	const [password, setPassword] = useState('');
	const [password_confirm, set_password_confirm] = useState('');
	const [document_name, set_document_name] = useState('');
	const [document_number, set_document_number] = useState('');
	const [issued_by, set_issued_by] = useState('');
	const [issue_date, set_issue_date] = useState('');
	const [expiry_date, set_expiry_date] = useState('');
	const [document_file, set_document_file] = useState<UserDocument[]>([]);
	const [declaration_accept, set_declaration_accept] = useState(false);
	const [step1Data, setStep1Data] = useState<any>(null);
	const [documentUploadResult, setDocumentUploadResult] = useState<any>(null);

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

				if (res.status === 'error') {
					notify('Error', res.message)   // 🔥 tampilkan alert
					return
				}

				// mapping biar cocok ke component
				const formatted = res.locations.map((item: any) => ({
					label: item.state,
					value: item.state,
				}))

				setStates(formatted)

			} catch (err) {
				console.log('ERROR STATES:', err)
			}
		}

		loadStates()
	}, [])

	async function handle_state_change(nextState: string) {
		set_location_state(nextState);
		set_location_suburb_id('');
		set_postcode('');

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

	const suburbs_for_state = useMemo(() => {
		if (!location_state) return [];
		return suburbs || [];
	}, [location_state, suburbs]);

	const selected_suburb = useMemo(() => {
		return suburbs_for_state.find((item) => item.id === location_suburb_id) || null;
	}, [suburbs_for_state, location_suburb_id]);

	const suburb_options = useMemo(() => {
		return suburbs_for_state.map((item) => ({
			label: `${item.suburb} (${item.postcode})`,
			value: item.id,
		}));
	}, [suburbs_for_state]);

	function handle_suburb_change(value: string) {
		const selected = suburbs_for_state.find((item) => item.id === value);

		set_location_suburb_id(selected?.id || '');
		set_postcode(selected?.postcode || '');
	}

	async function pickDocument() {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: ['application/pdf', 'image/jpeg', 'image/png'],
				copyToCacheDirectory: true,
			});
			if (!result.canceled && result.assets?.[0]) {
				const asset = result.assets[0];
				if (asset.size && asset.size > 5 * 1024 * 1024) {
					notify('Error', 'File is too large. Maximum allowed size is 5MB.');
					return;
				}
				const doc: UserDocument = {
					id: Date.now().toString(),
					name: asset.name,
					uri: asset.uri,
					type: asset.mimeType || 'unknown',
					uploadedAt: new Date().toISOString(),
				};
				set_document_file([doc]);
				if (!document_name.trim()) {
					set_document_name(asset.name.replace(/\.[^.]+$/, ''));
				}
			}
		} catch {
			notify('Error', 'Failed to pick document');
		}
	}

	function removeDocumentFile() {
		set_document_file([]);
	}

	function validateStep(): boolean {
		if (step === 0) {
			if (
				!first_name.trim() ||
				!last_name.trim() ||
				!phone.trim() ||
				!accreditation_level ||
				!qualification_level ||
				!location_state ||
				!location_suburb_id ||
				!postcode.trim() ||
				!email.trim()
			) {
				notify('Error', 'Please complete all required fields in Profile & Account.');
				return false;
			}
			if (!email.includes('@')) {
				notify('Error', 'Please enter a valid email.');
				return false;
			}
			// if (password.length < 6) {
			// 	notify('Error', 'Password must be at least 6 characters.');
			// 	return false;
			// }
			// if (password !== password_confirm) {
			// 	notify('Error', 'Password and Confirm Password must match.');
			// 	return false;
			// }
		}
		if (step === 1) {
			if (!document_name.trim() || !document_number.trim() || !issued_by.trim() || !issue_date.trim()) {
				notify('Error', 'Please complete all required document fields.');
				return false;
			}
			if (!document_file) {
				notify('Error', 'Please choose a file (PDF/JPG/PNG, max 5MB).');
				return false;
			}
			if (!declaration_accept) {
				notify('Error', 'Please accept the declaration before completing registration.');
				return false;
			}
		}
		return true;
	}

	async function nextStep() {
		if (!validateStep()) return;
		try {
			const payload = {
				first_name: first_name.trim(),
				last_name: last_name.trim(),
				preferred_name: preferred_name.trim(),
				date_of_birth: date_of_birth.trim(),
				gender: gender.trim(),
				email: email.trim(),
				phone: phone.trim(),
				teacher_registration_number: teacher_registration_number.trim(),
				accreditation_level: accreditation_level.trim(),
				qualification_level: qualification_level.trim(),
				location_id: location_suburb_id || undefined,
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
		if (!validateStep()) {
			return;
		}

		const doc = document_file[0];

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
				document_name: document_name.trim(),
				document_number: document_number.trim(),
				issued_by: issued_by.trim(),
				issue_date: issue_date,
				expiry_date: expiry_date,
				file_path: filePath,
			});



			notify('Success', 'Registration complete! Please check your email regularly for account confirmation.', () =>
				router.replace('/register-select')
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
				title="Teacher Registration"
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
						<AppSectionTitle title="Personal Details" size="lg" />

						<View style={styles.inlineRow}>
							<AppField label="First Name" value={first_name} onChangeText={set_first_name} icon="person-outline" containerStyle={styles.rowField} />
							<AppField label="Last Name" value={last_name} onChangeText={set_last_name} icon="person-outline" containerStyle={styles.rowField} />
						</View>

						<AppField label="Preferred Name" value={preferred_name} onChangeText={set_preferred_name} icon="person-circle-outline" />

						<AppDateField
							label="Date of Birth"
							value={date_of_birth}
							onChange={set_date_of_birth}
							helperText="Choose your date of birth"
						/>

						<AppSearchSelectField
							label="Gender"
							value={gender}
							onChange={set_gender}
							options={GENDER_OPTIONS}
							placeholder="Select gender"
							searchPlaceholder="Search gender..."
							helperText="Optional"
							closeOnSelect
						/>

						<AppField label="Phone" value={phone} onChangeText={set_phone} icon="call-outline" keyboardType="phone-pad" />

						<AppSectionTitle title="Professional Details" size="md" style={styles.blockTitle} />

						<AppField
							label="Teacher Registration Number"
							value={teacher_registration_number}
							onChangeText={set_teacher_registration_number}
							icon="card-outline"
						/>

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

						<AppSearchSelectField
							label="State"
							value={location_state}
							onChange={handle_state_change}
							options={states}
							placeholder="Select state"
							searchPlaceholder="Search state..."
							closeOnSelect
						/>

						<AppSearchSelectField
							label="Suburb"
							value={
								selected_suburb
									? `${selected_suburb.suburb} (${selected_suburb.postcode})`
									: ''
							}
							onChange={handle_suburb_change}
							options={suburb_options}
							placeholder={location_state ? 'Select suburb' : 'Select state first'}
							searchPlaceholder="Search suburb..."
							helperText={location_state ? undefined : 'Choose State first'}
							closeOnSelect
						/>

						<AppField
							label="Postcode"
							value={postcode}
							onChangeText={set_postcode}
							icon="mail-outline"
							inputProps={{ editable: false }}
							helperText="Auto-filled from selected suburb"
						/>

						<AppSectionTitle title="Account Security" size="md" style={styles.blockTitle} />

						<AppField
							label="Email"
							value={email}
							onChangeText={setEmail}
							icon="mail-outline"
							keyboardType="email-address"
							inputProps={{ autoCapitalize: 'none' }}
						/>

					</AppCard>
				)}

				{step === 1 && (
					<AppCard padding={spacing.cardPadding} style={styles.formSection}>
						<AppSectionTitle title="Document Details" size="lg" />
						<Text style={styles.sectionDesc}>
							Complete document fields and upload one file to finish onboarding.
						</Text>

						<AppField
							label="Document Name"
							value={document_name}
							onChangeText={set_document_name}
							placeholder="WWCC / Teaching License"
							icon="document-text-outline"
						/>

						<AppField
							label="Document Number"
							value={document_number}
							onChangeText={set_document_number}
							icon="key-outline"
						/>

						<AppField
							label="Issued By"
							value={issued_by}
							onChangeText={set_issued_by}
							icon="business-outline"
						/>

						<AppDateField
							label="Issue Date"
							value={issue_date}
							onChange={set_issue_date}
							helperText="Required"
						/>

						<AppDateField
							label="Expiry Date"
							value={expiry_date}
							onChange={set_expiry_date}
							helperText="Optional"
						/>

						<AppSectionTitle title="Choose File (PDF/JPG/PNG, max 5MB)" size="md" style={styles.blockTitle} />

						<AppUploadArea
							label={document_file.length ? 'Replace File' : 'Choose File'}
							onPress={pickDocument}
							tone="primary"
						/>

						{document_file.length ? (
							<AppDocumentRow
								name={document_file[0]?.name || ''}
								onRemove={removeDocumentFile}
							/>
						) : null}

						<AppSectionTitle title="Declaration" size="md" style={styles.blockTitle} />

						<View style={styles.integrityRow}>
							<Switch
								value={declaration_accept}
								onValueChange={set_declaration_accept}
								trackColor={{ false: Colors.border, true: Colors.primary + '50' }}
								thumbColor={declaration_accept ? Colors.primary : Colors.textMuted}
							/>
							<Text style={styles.integrityText}>
								I confirm that all information and uploaded files are authentic, accurate, and legally mine. I understand that any false or misleading submission may lead to account rejection, suspension, and legal action in accordance with applicable law.
							</Text>
						</View>
					</AppCard>
				)}
			</ScrollView>

			<View style={[styles.bottomBar, { paddingHorizontal: spacing.horizontal, paddingBottom: Math.max(16, spacing.bottomPadding - 8) + insets.bottom }]}>
				{step < STEPS.length - 1 ? (
					<AppButton title="Next: Documents" onPress={nextStep} icon="arrow-forward" />
				) : (
					<AppButton
						title="Register"
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
	inlineRow: {
		flexDirection: 'row',
		gap: 12,
	},
	rowField: {
		flex: 1,
	},
	blockTitle: {
		marginTop: 4,
		marginBottom: -2,
	},
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
