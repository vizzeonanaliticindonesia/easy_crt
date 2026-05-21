import React, { useEffect, useState } from 'react';
import {
	View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl,
	ActivityIndicator,
	Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { SchoolProfile } from '@/types';
import { Colors } from '@/constants/Colors';
import { notify } from '@/lib/dialogs';
import { insertSession, getCategories, getSubjects, getTeachers, getTeacherForPrivateRequest, updateSession, sendRequest } from '@/lib/services/school';
import StepIndicator from '@/components/StepIndicator';
import TeacherCard from '@/components/TeacherCard';
import {
	AppButton,
	AppCard,
	AppDateField,
	AppField,
	AppSearchSelectField,
	AppSectionTitle,
	AppTimeRow,
	AppTopBar,
	useResponsiveSpacing,
} from '@/components/ui/AppPrimitives';


const YEAR_LEVEL_OPTIONS = [
	{ value: '1', label: 'Year 1' },
	{ value: '2', label: 'Year 2' },
	{ value: '3', label: 'Year 3' },
	{ value: '4', label: 'Year 4' },
	{ value: '5', label: 'Year 5' },
	{ value: '6', label: 'Year 6' },
	{ value: '7', label: 'Year 7' },
	{ value: '8', label: 'Year 8' },
	{ value: '9', label: 'Year 9' },
	{ value: '10', label: 'Year 10' },
	{ value: '11', label: 'Year 11' },
	{ value: '12', label: 'Year 12' },
];

const REQUEST_TYPE_OPTIONS = [
	{ value: 'Broadcast', label: 'Broadcast' },
	{ value: 'Private', label: 'Private' },
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

const getAccreditationLabel = (value?: string | number) => {
	switch (String(value)) {
		case '1':
			return 'Graduate Teacher';
		case '2':
			return 'Proficient Teacher';
		case '3':
			return 'Highly Accomplished Teacher';
		case '4':
			return 'Lead Teacher';
		default:
			return '-';
	}
};

const getQualificationLabel = (value?: string | number) => {
	switch (String(value)) {
		case '1':
			return 'Bachelor Degree';
		case '2':
			return 'Graduate Diploma';
		case '3':
			return 'Master Degree';
		case '4':
			return 'Post Graduate';
		default:
			return '-';
	}
};

const WWCC_OPTIONS = [
	{ value: 'Yes', label: 'Yes' },
	{ value: 'No', label: 'No' },
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

const REQUEST_TYPE_LABEL_BY_VALUE = Object.fromEntries(
	REQUEST_TYPE_OPTIONS.map((item) => [item.value, item.label])
) as Record<string, string>;

const REQUEST_TYPE_VALUE_BY_LABEL = Object.fromEntries(
	REQUEST_TYPE_OPTIONS.map((item) => [item.label, item.value])
) as Record<string, string>;

const WWCC_LABEL_BY_VALUE = Object.fromEntries(
	WWCC_OPTIONS.map((item) => [item.value, item.label])
) as Record<string, string>;

const WWCC_VALUE_BY_LABEL = Object.fromEntries(
	WWCC_OPTIONS.map((item) => [item.label, item.value])
) as Record<string, string>;

type ScheduleSlotInput = {
	id: string;
	date: string;
	startTime: string;
	endTime: string;
};

type PrivateTeacherInfo = {
	id?: string;
	first_name?: string;
	last_name?: string;
	gender?: string;
	email?: string;
	phone?: string;
	trn?: string;
	accreditation_level?: string;
	qualification_level?: string;
	locality?: string;
	state?: string;
	pcode?: string;
	subjects?: string[] | string;
};

const STEPS = ['Session Details', 'Select Teachers'];

export default function CreateSessionScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const [teachers, setTeachers] = useState<any[]>([]);
	const [teacherInfo, setTeacherInfo] = useState<PrivateTeacherInfo | null>(null);
	const [teacherLoading, setTeacherLoading] = useState(false);
	const insets = useSafeAreaInsets();
	const topPad = Platform.OS === 'web' ? 67 : insets.top;
	const spacing = useResponsiveSpacing();
	const school = user as SchoolProfile | null;
	const today = new Date();
	const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

	const [subject, setSubject] = useState('');
	const [subjectOptions, setSubjectOptions] = useState<any[]>([]);
	const [subjectCategory, setSubjectCategory] = useState('');
	const [subjectCategoryOptions, setSubjectCategoryOptions] = useState<any[]>([]);
	const [requestDate, setRequestDate] = useState('');
	const [schoolName, setSchoolName] = useState('');
	const [yearLevel, setYearLevel] = useState('');
	const [requestType, setRequestType] = useState('');
	const [accreditationLevel, setAccreditationLevel] = useState('');
	const [qualificationLevel, setQualificationLevel] = useState('');
	const [distance, setDistance] = useState('');
	const [requireWwcc, setRequireWwcc] = useState('');
	const [notes, setNotes] = useState('');
	const [teacher_id, setTeacherId] = useState('');
	const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlotInput[]>([
		{ id: 'schedule_1', date: '', startTime: '', endTime: '' },
	]);
	const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>(teachers.map((t) => t.id));
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [savingStep1, setSavingStep1] = useState(false);
	const [serverSessionId, setServerSessionId] = useState<string | null>(null);
	const [step, setStep] = useState(0);
	const isPrivateRequest = requestType === 'Private';
	const teacherLookupSeq = React.useRef(0);

	// If user switches category and current subject is not in filtered list, clear selection
	const loadCategories = React.useCallback(async () => {
		try {
			const res = await getCategories();
			const formatted = res.categories.map((item: any) => ({
				label: item.category,
				value: String(item.category),
			}));
			setSubjectCategoryOptions(formatted);
		} catch (e) {
			console.error('Failed to fetch categories:', e);
		}
	}, []);

	const loadTeachers = React.useCallback(async () => {
		try {
			const res = await getTeachers(serverSessionId || '');
			const list = res?.teachers ?? res?.data ?? [];
			const nextTeachers = Array.isArray(list) ? list : [];
			setTeachers(nextTeachers);
			setSelectedTeacherIds(nextTeachers.map((teacher: any) => String(teacher.id)));
		} catch (e) {
			console.error('Failed to fetch teachers:', e);
		}
	}, [serverSessionId]);

	const loadPrivateTeacherInfo = React.useCallback(async (teacherId: string) => {
		const trimmedTeacherId = teacherId.trim();
		if (!trimmedTeacherId || !isPrivateRequest) {
			teacherLookupSeq.current += 1;
			setTeacherInfo(null);
			setTeacherLoading(false);
			return;
		}

		const lookupSeq = ++teacherLookupSeq.current;
		setTeacherLoading(true);
		try {
			const res = await getTeacherForPrivateRequest(trimmedTeacherId);
			if (lookupSeq !== teacherLookupSeq.current) return;
			const teacher = res?.teacher ?? res?.data ?? res?.data?.teacher ?? res ?? null;
			setTeacherInfo(teacher && Object.keys(teacher).length > 0 ? teacher : null);
		} catch (e) {
			if (lookupSeq !== teacherLookupSeq.current) return;
			console.error('Failed to fetch private teacher info:', e);
			setTeacherInfo(null);
		} finally {
			if (lookupSeq !== teacherLookupSeq.current) return;
			setTeacherLoading(false);
		}
	}, [isPrivateRequest]);

	useEffect(() => {
		loadCategories();
	}, [loadCategories]);

	useEffect(() => {
		if (serverSessionId && !isPrivateRequest) {
			loadTeachers();
		}
	}, [serverSessionId, loadTeachers, isPrivateRequest]);

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			const refreshTasks = [loadCategories()];
			if (isPrivateRequest) {
				refreshTasks.push(loadPrivateTeacherInfo(teacher_id));
			} else if (serverSessionId) {
				refreshTasks.push(loadTeachers());
			}
			await Promise.all(refreshTasks);
		} finally {
			setRefreshing(false);
		}
	};

	async function categoryHandler(label: string) {
		const value = subjectCategoryOptions.find((option) => option.label === label)?.value || '';
		setSubjectCategory(value);
		setSubject('');
		try {
			const res = await getSubjects(value);
			const formatted = res.subjects.map((item: any) => ({
				label: item.subject_name,
				value: String(item.subject_name),
			}));
			setSubjectOptions(formatted);
		} catch (e) {
			console.error('Failed to fetch subjects:', e);
			setSubjectOptions([]);
		}
	}

	useEffect(() => {
		if (!schoolName.trim()) {
			setSchoolName(school?.schoolName || school?.name || '');
		}
	}, [school, schoolName]);

	useEffect(() => {
		if (!isPrivateRequest) {
			setTeacherInfo(null);
			setTeacherLoading(false);
			return;
		}

		loadPrivateTeacherInfo(teacher_id);
	}, [isPrivateRequest, teacher_id, loadPrivateTeacherInfo]);

	function toggleTeacher(id: string) {
		setSelectedTeacherIds((prev) =>
			prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
		);
	}

	function selectAll() {
		setSelectedTeacherIds(teachers.map((t) => t.id));
	}

	function selectNone() {
		setSelectedTeacherIds([]);
	}

	function addScheduleSlot() {
		setScheduleSlots((prev) => [
			...prev,
			{ id: `schedule_${Date.now()}_${prev.length + 1}`, date: '', startTime: '', endTime: '' },
		]);
	}

	async function handleProceedToTeachers() {
		// validate same as create but without teacher selection
		console.log('Server Session ID:', serverSessionId);

		const normalizedSlots = scheduleSlots.map((slot) => ({
			date: slot.date.trim(),
			startTime: slot.startTime.trim(),
			endTime: slot.endTime.trim(),
		}));
		const hasIncompleteSlot = normalizedSlots.some((slot) => !slot.date || !slot.startTime || !slot.endTime);

		if (
			!requestDate.trim() ||
			!schoolName.trim() ||
			!subject.trim() ||
			!yearLevel.trim() ||
			!requestType.trim() ||
			hasIncompleteSlot
		) {
			notify('Error', 'Please fill in all session details and complete each schedule slot.');
			return;
		}

		if (isPrivateRequest) {
			if (!teacher_id.trim()) {
				notify('Error', 'Please enter a teacher ID.');
				return;
			}

			if (teacherLoading) {
				notify('Error', 'Please wait until teacher information is loaded.');
				return;
			}

			if (!teacherInfo) {
				notify('Error', 'Teacher not found');
				return;
			}
		} else if (
			!accreditationLevel.trim() ||
			!qualificationLevel.trim() ||
			!distance.trim()
		) {
			notify('Error', 'Please fill in all session details and complete each schedule slot.');
			return;
		}

		if (!school) return;

		setSavingStep1(true);
		try {
			const payload = {
				id: serverSessionId || null,
				request_date: requestDate.trim() || normalizedSlots[0]?.date || null,
				teacher_id: teacher_id.trim() || null,
				school_id: school.id,
				subject_name: subject.trim() || null,
				year_level: yearLevel.trim() || null,
				request_type: requestType.trim() || null,
				accreditation_level: isPrivateRequest ? null : accreditationLevel.trim() || null,
				qualification_level: isPrivateRequest ? null : qualificationLevel.trim() || null,
				distance: isPrivateRequest ? null : (distance.trim() ? Number(distance.trim()) : null),
				require_wwcc: isPrivateRequest ? null : requireWwcc.trim() || null,
				notes: notes.trim() || null,
				schedules: scheduleSlots.map((slot) => ({
					date: slot.date.trim(),
					start_time: slot.startTime.trim(),
					end_time: slot.endTime.trim(),
				})),
			};

			if (serverSessionId) {
				// UPDATE
				await updateSession(payload);
				if (!isPrivateRequest) {
					const teachersRes = await getTeachers(serverSessionId);
					const nextTeachers = teachersRes?.teachers ?? teachersRes?.data ?? [];
					setTeachers(Array.isArray(nextTeachers) ? nextTeachers : []);
					setSelectedTeacherIds((Array.isArray(nextTeachers) ? nextTeachers : []).map((teacher: any) => String(teacher.id)));
				}
			} else {
				// CREATE
				const res = await insertSession(payload);
				const request_id = res?.request_id || res?.data?.id || res?.session_id || res?.booking_id || null;
				if (request_id) setServerSessionId(String(request_id));
				if (!isPrivateRequest && request_id) {
					const teachersRes = await getTeachers(request_id);
					const nextTeachers = teachersRes?.teachers ?? teachersRes?.data ?? [];
					setTeachers(Array.isArray(nextTeachers) ? nextTeachers : []);
					setSelectedTeacherIds((Array.isArray(nextTeachers) ? nextTeachers : []).map((teacher: any) => String(teacher.id)));
				}
			}
			// try to extract id from response if available
			setStep(1);
		} catch (e: any) {
			console.error('Failed to save session to server:', e);
			notify('Error', e?.message || 'Failed to save session details');
		} finally {
			setSavingStep1(false);
		}
	}

	function updateScheduleSlot(slotId: string, field: 'date' | 'startTime' | 'endTime', value: string) {
		setScheduleSlots((prev) => prev.map((slot) => (slot.id === slotId ? { ...slot, [field]: value } : slot)));
	}

	function removeScheduleSlot(slotId: string) {
		setScheduleSlots((prev) => (prev.length === 1 ? prev : prev.filter((slot) => slot.id !== slotId)));
	}

	async function handleCreate() {
		if (!school) return;

		const teacherIds = isPrivateRequest
			? [String(teacherInfo?.id || teacher_id.trim())]
			: selectedTeacherIds;

		if (teacherIds.length === 0 || !teacherIds[0]) {
			notify('Error', isPrivateRequest ? 'Teacher not found' : 'Please select at least one teacher.');
			return;
		}

		setLoading(true);
		try {
			await sendRequest({
				sessionId: serverSessionId || '',
				teacherIds,
			});
			notify('Success', 'Teaching session request has been created and sent successfully.', () => router.replace('/sessions'));
		} catch (e: any) {
			console.error('Failed to send request:', e);
			notify('Error', e?.message || 'Failed to send request');
		} finally {
			setLoading(false);
		}
	}

	return (
		<View style={[styles.container, { paddingTop: topPad }]}>
			<AppTopBar
				title="Create Session"
				onBack={() => (step > 0 ? setStep((prev) => Math.max(prev - 1, 0)) : router.replace('/(school-tabs)'))}
				horizontalPadding={spacing.horizontal}
				verticalPadding={spacing.topBarVertical}
				iconButtonSize={spacing.iconButtonSize}
				iconSize={spacing.iconGlyphSize}
			/>

			<StepIndicator steps={STEPS} currentStep={step} />

			<ScrollView
				contentContainerStyle={[
					styles.content,
					{
						paddingHorizontal: spacing.horizontal,
						paddingBottom: spacing.bottomPadding + insets.bottom,
					},
				]}
				keyboardShouldPersistTaps="handled"
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
			>
				{step === 0 && (
					<AppCard padding={spacing.cardPadding} style={[styles.sectionCard, { marginBottom: spacing.sectionGap }]}>
						<AppSectionTitle title="Session Details" size="lg" style={styles.sectionTitle} />

						<AppDateField
							label="Request Date"
							value={requestDate}
							onChange={setRequestDate}
							minimumDate={minDate}
						/>

						<AppField
							label="School Name"
							value={schoolName}
							onChangeText={setSchoolName}
							icon="business-outline"
							inputProps={{ editable: !schoolName.trim() }}
							helperText={schoolName.trim() ? "Auto-filled from your profile" : undefined}
						/>

						<AppSearchSelectField
							label="Category"
							value={subjectCategory}
							onChange={categoryHandler}
							options={subjectCategoryOptions}
							placeholder="Select category"
							searchPlaceholder="Search category..."
							closeOnSelect
							containerStyle={styles.inputGroup}
						/>

						<AppSearchSelectField
							label="Subject"
							value={subject}
							onChange={setSubject}
							options={subjectOptions}
							placeholder="Search and select subject"
							searchPlaceholder="Search subject..."
							helperText="Open picker to search all subjects quickly."
							containerStyle={styles.inputGroup}
							closeOnSelect
						/>

						<AppSearchSelectField
							label="Year Level"
							value={yearLevel}
							onChange={setYearLevel}
							options={YEAR_LEVEL_OPTIONS}
							placeholder="Select year level"
							searchPlaceholder="Search year level..."
							closeOnSelect
						/>

						<AppSearchSelectField
							label="Request Type"
							value={REQUEST_TYPE_LABEL_BY_VALUE[requestType] || ''}
							onChange={(label) => setRequestType(REQUEST_TYPE_VALUE_BY_LABEL[label] || '')}
							options={REQUEST_TYPE_OPTIONS}
							placeholder="Select request type"
							searchPlaceholder="Search request type..."
							closeOnSelect
						/>

						{isPrivateRequest ? (
							<>
								<AppField
									label="Teacher ID"
									value={teacher_id}
									onChangeText={setTeacherId}
									placeholder="Enter teacher ID"
									keyboardType="numeric"
								/>

								<AppCard padding={spacing.cardPadding} style={[styles.teacherInfoCard, { marginBottom: spacing.sectionGap }]}>
									<AppSectionTitle title="Teacher Information" size="md" style={styles.blockTitle} />
									{teacherLoading ? (
										<View style={styles.teacherLoadingRow}>
											<ActivityIndicator size="small" color={Colors.primary} />
											<Text style={styles.teacherLoadingText}>Loading teacher information...</Text>
										</View>
									) : teacherInfo ? (
										<View style={styles.teacherInfoList}>
											<Text style={styles.teacherInfoName}>
												{teacherInfo.first_name || '-'} {teacherInfo.last_name || ''}
											</Text>
											<Text style={styles.teacherInfoItem}>Gender: {teacherInfo.gender || '-'}</Text>
											<Text style={styles.teacherInfoItem}>Email: {teacherInfo.email || '-'}</Text>
											<Text style={styles.teacherInfoItem}>Phone: {teacherInfo.phone || '-'}</Text>
											<Text style={styles.teacherInfoItem}>Teacher Registration Number: {teacherInfo.trn || '-'}</Text>
											<Text style={styles.teacherInfoItem}>
												Accreditation Level: {getAccreditationLabel(teacherInfo.accreditation_level)}
											</Text>
											<Text style={styles.teacherInfoItem}>
												Qualification Level: {getQualificationLabel(teacherInfo.qualification_level)}
											</Text>
											<Text style={styles.teacherInfoItem}>State: {teacherInfo.state || '-'}</Text>
											<Text style={styles.teacherInfoItem}>Suburb: {teacherInfo.locality || '-'}</Text>
											<Text style={styles.teacherInfoItem}>Postcode: {teacherInfo.pcode || '-'}</Text>
											<Text style={styles.teacherInfoItem}>
												Subjects: {Array.isArray(teacherInfo.subjects) ? teacherInfo.subjects.join(', ') : teacherInfo.subjects || '-'}
											</Text>
										</View>
									) : teacher_id.trim() ? (
										<Text style={styles.teacherNotFoundText}>Teacher not found</Text>
									) : (
										<Text style={styles.teacherHintText}>Enter a teacher ID to load teacher information.</Text>
									)}
								</AppCard>
							</>
						) : (
							<>
								<AppSearchSelectField
									label="Accreditation Level"
									value={ACCREDITATION_LABEL_BY_VALUE[accreditationLevel] || ''}
									onChange={(label) => setAccreditationLevel(ACCREDITATION_VALUE_BY_LABEL[label] || '')}
									options={ACCREDITATION_LEVEL_OPTIONS}
									placeholder="Select accreditation level"
									searchPlaceholder="Search accreditation..."
									closeOnSelect
								/>

								<AppSearchSelectField
									label="Qualification Level"
									value={QUALIFICATION_LABEL_BY_VALUE[qualificationLevel] || ''}
									onChange={(label) => setQualificationLevel(QUALIFICATION_VALUE_BY_LABEL[label] || '')}
									options={QUALIFICATION_LEVEL_OPTIONS}
									placeholder="Select qualification level"
									searchPlaceholder="Search qualification..."
									closeOnSelect
								/>

								<AppField
									label="Distance"
									value={distance}
									onChangeText={setDistance}
									placeholder="Enter distance"
									keyboardType="numeric"
								/>

								<AppSearchSelectField
									label="Require WWCC"
									value={WWCC_LABEL_BY_VALUE[requireWwcc] || ''}
									onChange={(label) => setRequireWwcc(WWCC_VALUE_BY_LABEL[label] || '')}
									options={WWCC_OPTIONS}
									placeholder="Select WWCC requirement"
									searchPlaceholder="Search WWCC..."
									closeOnSelect
								/>

								<AppField
									label="Notes (optional)"
									value={notes}
									onChangeText={setNotes}
									placeholder="Enter notes"
								/>
							</>
						)}

						<AppSectionTitle title="Schedule Slots" size="md" style={styles.blockTitle} />

						{scheduleSlots.map((slot, index) => (
							<View key={slot.id} style={styles.scheduleSlotCard}>
								<View style={styles.scheduleSlotHeader}>
									<Text style={styles.scheduleSlotTitle}>Slot {index + 1}</Text>
									{scheduleSlots.length > 1 ? (
										<TouchableOpacity onPress={() => removeScheduleSlot(slot.id)}>
											<Text style={styles.removeSlotText}>Remove</Text>
										</TouchableOpacity>
									) : null}
								</View>

								<AppDateField
									label="Date"
									value={slot.date}
									onChange={(value) => updateScheduleSlot(slot.id, 'date', value)}
									minimumDate={minDate}
									helperText="Select a session date"
								/>

								<AppTimeRow
									startValue={slot.startTime}
									endValue={slot.endTime}
									onStartChange={(value) => updateScheduleSlot(slot.id, 'startTime', value)}
									onEndChange={(value) => updateScheduleSlot(slot.id, 'endTime', value)}
								/>
							</View>
						))}

						<AppButton
							title="Add Another Schedule"
							onPress={addScheduleSlot}
							variant="outline"
							icon="add-outline"
						/>

						<AppButton
							title="Create Session"
							onPress={handleProceedToTeachers}
							loading={savingStep1}
							variant="secondary"
							icon="arrow-forward"
							style={{ marginTop: spacing.sectionGap / 2 }}
						/>
					</AppCard>
				)}

				{step === 1 && (
					<>
						{isPrivateRequest ? (
							<AppCard padding={spacing.cardPadding} style={[styles.sectionCard, { marginBottom: spacing.sectionGap }]}>
								<AppSectionTitle title="Teacher Information" size="lg" style={styles.sectionTitle} />
								{teacherLoading ? (
									<View style={styles.teacherLoadingRow}>
										<ActivityIndicator size="small" color={Colors.primary} />
										<Text style={styles.teacherLoadingText}>Loading teacher information...</Text>
									</View>
								) : teacherInfo ? (
									<View style={styles.teacherInfoList}>
										<Text style={styles.teacherInfoName}>
											{teacherInfo.first_name || '-'} {teacherInfo.last_name || ''}
										</Text>
										<Text style={styles.teacherInfoItem}>Gender: {teacherInfo.gender || '-'}</Text>
										<Text style={styles.teacherInfoItem}>Email: {teacherInfo.email || '-'}</Text>
										<Text style={styles.teacherInfoItem}>Phone: {teacherInfo.phone || '-'}</Text>
										<Text style={styles.teacherInfoItem}>Teacher Registration Number: {teacherInfo.trn || '-'}</Text>
										<Text style={styles.teacherInfoItem}>
											Accreditation Level: {getAccreditationLabel(teacherInfo.accreditation_level)}
										</Text>
										<Text style={styles.teacherInfoItem}>
											Qualification Level: {getQualificationLabel(teacherInfo.qualification_level)}
										</Text>
										<Text style={styles.teacherInfoItem}>State: {teacherInfo.state || '-'}</Text>
										<Text style={styles.teacherInfoItem}>Suburb: {teacherInfo.locality || '-'}</Text>
										<Text style={styles.teacherInfoItem}>Postcode: {teacherInfo.pcode || '-'}</Text>
										<Text style={styles.teacherInfoItem}>
											Subjects: {Array.isArray(teacherInfo.subjects) ? teacherInfo.subjects.join(', ') : teacherInfo.subjects || '-'}
										</Text>
									</View>
								) : (
									<Text style={styles.teacherNotFoundText}>Teacher not found</Text>
								)}
							</AppCard>
						) : (
							<>
								<View style={styles.teacherHeader}>
									<AppSectionTitle title="Select Teachers" size="lg" style={styles.sectionTitleNoMargin} />
									<View style={styles.selectActions}>
										<TouchableOpacity onPress={selectAll}>
											<Text style={styles.selectLink}>Select All</Text>
										</TouchableOpacity>
										<Text style={styles.selectDivider}>|</Text>
										<TouchableOpacity onPress={selectNone}>
											<Text style={styles.selectLink}>None</Text>
										</TouchableOpacity>
									</View>
								</View>
								<Text style={[styles.selectedCount, { marginBottom: spacing.sectionGap - 4 }]}>
									{selectedTeacherIds.length} of {teachers.length} selected
								</Text>

								{teachers.map((teacher) => (
									<TeacherCard
										key={teacher.id}
										teacher={teacher}
										showSelect
										selected={selectedTeacherIds.includes(teacher.id)}
										onToggleSelect={() => toggleTeacher(teacher.id)}
									/>
								))}
							</>
						)}

						<AppButton
							title="Edit Session Details"
							onPress={() => setStep(0)}
							variant="outline"
							icon="create-outline"
							size="md"
							style={styles.editDetailsBtn}
						/>

						<AppButton
							title="Send Request"
							onPress={handleCreate}
							loading={loading}
							icon="paper-plane"
							style={{ marginTop: spacing.sectionGap / 2 }}
						/>
					</>
				)}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create<any>({
	container: { flex: 1, backgroundColor: Colors.background },
	content: { paddingBottom: 40 },
	sectionCard: { marginBottom: 16 },
	sectionTitle: { marginBottom: 16 },
	sectionTitleNoMargin: { marginBottom: 0 },
	inputGroup: { marginBottom: 16 },
	blockTitle: { marginTop: 4, marginBottom: 10 },
	teacherInfoCard: { marginTop: 4 },
	teacherInfoList: { gap: 6 },
	teacherInfoName: { fontSize: 18, fontWeight: '700' as const, color: Colors.text, marginBottom: 4 },
	teacherInfoItem: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
	teacherLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	teacherLoadingText: { fontSize: 14, color: Colors.textSecondary },
	teacherNotFoundText: { fontSize: 14, color: Colors.error, fontWeight: '600' as const },
	teacherHintText: { fontSize: 14, color: Colors.textSecondary },
	scheduleSlotCard: {
		borderWidth: 1,
		borderColor: Colors.border,
		borderRadius: 14,
		padding: 14,
		gap: 14,
		marginBottom: 12,
		backgroundColor: Colors.card,
	},
	scheduleSlotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	scheduleSlotTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
	removeSlotText: { fontSize: 13, fontWeight: '600' as const, color: Colors.error },
	teacherHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	selectActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
	selectLink: { fontSize: 14, color: Colors.secondary, fontWeight: '600' as const },
	selectDivider: { color: Colors.textMuted },
	selectedCount: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
	editDetailsBtn: { marginTop: 8, marginBottom: 10 },
});
