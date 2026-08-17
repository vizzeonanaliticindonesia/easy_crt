import api from '@/lib/api';
import { Platform } from 'react-native';

//sama dgn be, untuk create
export type RegisterStep1Payload = {
  first_name: string;
  last_name: string;
  preferred_name: string;
  date_of_birth: string;
  gender: string;
  email: string;
  phone: string;
  teacher_registration_number: string;
  accreditation_level: string;
  qualification_level: string;
  location_id?: string | number;
};

export type RegisterStep2Payload = {
  teacher_id: string;
  document_name: string;
  document_number: string;
  issued_by: string;
  issue_date: string;
  expiry_date: string;
  file_path: string;
  integrityAccepted: boolean;
};

export type updateProfilePayload = {
  first_name?: string;
  last_name?: string;
  preferred_name?: string;
  date_of_birth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  teacher_registration_number?: string;
  accreditation_level?: string;
  qualification_level?: string;
  location_id?: string | number;
};

// ================= REGISTER =================
export async function registerStep1(payload: RegisterStep1Payload) {
  console.log('Register Step 1 Payload:', payload);
  return api.post(`/teacher/register/step1`, payload);
}

export async function registerStep2(payload: RegisterStep2Payload & { teacher_id: string }) {
  console.log('Register Step 2 Payload:', payload);
  return api.post(`/teacher/register/step2`, payload);
}


export async function uploadDocument({ uri, name, type }: { uri: string; name: string; type: string }) {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const resBlob = await fetch(uri);
    const blob = await resBlob.blob();
    formData.append('file', blob, name);
  } else {
    formData.append('file', { uri, name, type } as any);
  }

  const res = await api.post('/teacher/register/upload_document', formData);

  return res;
}

// ================= GET STATE & SUBURBS =================
export async function getStates() {
  return api.get('/school/register/states');
}

// ambil suburb berdasarkan state
export function getSuburbs(state: string) {
  return api.get(`/school/register/suburbs?state=${state}`)
}

//=================== PROFILE =================================

export function getTeacherProfile() {
  return api.get('/teacher/profile');
}

export async function uploadProfilePhoto({ uri, name, type }: { uri: string; name: string; type: string }) {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    const resBlob = await fetch(uri);
    const blob = await resBlob.blob();
    formData.append('file', blob, name);
  } else {
    formData.append('file', { uri, name, type } as any);
  }

  const res = await api.post('/teacher/profile/upload_photo', formData);

  return res;
}

export function updateTeacherProfile(payload: updateProfilePayload) {
  return api.put('/teacher/profile/update', payload);
}

//=================== TEACHER DOCUMENTS ========================
export function getTeacherDocuments() {
  return api.get('/teacher/documents');
}

export function deleteTeacherDocument(documentId: string) {
  return api.del(`/teacher/documents/${documentId}`);
}

// NOTE: endpoint is a best guess following the school-side '/school/document/update' convention —
// verify against the actual CodeIgniter route before treating this as final.
export async function editTeacherDocument(documentId: string, formData: FormData) {
  formData.append('document_id', documentId);
  const res = await api.post('/teacher/document/update', formData);
  return res;
}

export function getTeacherSubjects() {
  return api.get('/teacher/subjects');
}

//=================== SUBJECTS =================================
export async function getAllSubjects() {
  return api.get('/teacher/all_subjects');
}

export function deleteTeacherSubject(subjectId: number) {
  return api.del(`/teacher/subjects/${subjectId}`);
}

export function createTeacherSubject(subjectIds: number[]) {
  return api.post('/teacher/subjects/create', { subject_ids: subjectIds });
}


//=================== EARNINGS =================================
export function getTeacherEarnings() {
  return api.get('/teacher/earnings');
}

//=================== TEACHER SESSIONS =================================

// NOTE: endpoint follows the school-side '/school/dashboard/get_data' naming convention —
// verify against the actual CodeIgniter route before treating this as final.
export function getTeacherDashboardData() {
  return api.get('/teacher/dashboard/get_data');
}

export function acceptSession(notificationId: number) {
  return api.post('/teacher/session/accept', {
    notification_id: notificationId
  });
}

export function declineSession(notificationId: number) {
  return api.post('/teacher/session/decline', {
    notification_id: notificationId
  });
}

export async function checkInSlot(scheduleId: number) {
  console.log('=== checkInSlot called ===');
  console.log('scheduleId:', scheduleId);
  
  const res = await api.post('/teacher/session/checkin', {
    schedule_id: scheduleId
  });
  
  console.log('checkIn response:', res);
  return res;
}

export async function checkOutSlot(scheduleId: number) {
  console.log('=== checkOutSlot called ===');
  console.log('scheduleId:', scheduleId);

  const res = await api.post('/teacher/session/checkout', {
    schedule_id: scheduleId
  });

  console.log('checkOut response:', res);

  return res;
}

// NOTE: endpoint paths follow the checkin/checkout naming convention above —
// verify against the actual CodeIgniter routes before treating this as final.
export async function confirmAttendance(scheduleId: number) {
  return api.post('/teacher/session/confirm_attendance', {
    schedule_id: scheduleId
  });
}

export async function unableAttendance(scheduleId: number) {
  return api.post('/teacher/session/unable_attendance', {
    schedule_id: scheduleId
  });
}

//====================== NOTIFICATION =========================
export function getNotifications() {
  return api.get('/teacher/notification');
}

export function markNotificationAsRead(notificationId: string) {
  return api.post(`/teacher/notification/mark_read?notification_id=${notificationId}`);
}

//====================== REVIEWS =========================
export function getTeacherReviews() {
  return api.get('/teacher/profile/review');
}

export default { registerStep1, registerStep2, getSuburbs, getStates, uploadDocument, getTeacherProfile, updateTeacherProfile, uploadProfilePhoto, getTeacherDocuments, deleteTeacherDocument, editTeacherDocument, getTeacherSubjects, getAllSubjects, deleteTeacherSubject, createTeacherSubject, getTeacherEarnings, acceptSession, declineSession, checkInSlot, checkOutSlot, confirmAttendance, unableAttendance, getNotifications, markNotificationAsRead, getTeacherReviews };