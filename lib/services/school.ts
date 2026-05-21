import api from '@/lib/api';
import { Platform } from 'react-native';

//sama dgn be
export type RegisterStep1Payload = {
  school_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  location_id?: string | number;
  school_type?: string;
  sector?: string;
  acara_school_id?: string;
};

export type RegisterStep2Payload = {
  school_id: string;
  document_name: string;
  document_number: string;
  issued_by: string;
  issue_date: string;
  expiry_date: string;
  file_path: string;
  integrityAccepted: boolean;
};

export type InsertDocumentPayload = {
  document_name: string;
  document_number: string;
  issued_by: string;
  issue_date: string;
  expiry_date: string;
  fileUri: string;
  fileMimeType: string;
  fileSize: number;
};

export type updateProfilePayload = {
  school_name: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  location_id?: string | number;
  school_type?: string;
  sector?: string;
  acara_school_id?: string;
  password?: string;
};

export type insertSessionPayload = {
  request_date: string | null;
  school_id: string;
  subject_name: string | null;
  year_level: string | null;
  request_type: string | null;
  accreditation_level: string | null;
  qualification_level: string | null;
  distance: number | null;
  require_wwcc: string | null;
  notes: string | null;

  schedules: Array<{
    date: string;
    start_time: string;
    end_time: string;
  }>;
};

export type insertReviewPayload = {
  booking_id: string;
  rating: number;
  review: string;
};

// ================= REGISTER =================
export async function registerStep1(payload: RegisterStep1Payload) {
  return api.post(`/school/register/step1`, payload);
}

export async function registerStep2(payload: RegisterStep2Payload & { school_id: string }) {
  return api.post(`/school/register/step2`, payload);
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

  const res = await api.post('/school/register/upload_document', formData);

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


// ================= GET SCHOOLS PROFILE =================
export function getSchoolProfile() {
  return api.get('/school/profile');
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

  const res = await api.post('/school/profile/upload_photo', formData);

  return res;
}

export function updateSchoolProfile(payload: updateProfilePayload) {
  return api.put('/school/profile/update', payload);
}

// ================= SCHOOL DOCUMENTS =================
export function getSchoolDocuments() {
  return api.get('/school/documents');
}

export async function insertSchoolDocument(payload: InsertDocumentPayload) {
  const formData = new FormData();
  formData.append('document_name', payload.document_name);
  formData.append('document_number', payload.document_number ?? '');
  formData.append('issued_by', payload.issued_by ?? '');
  formData.append('issue_date', payload.issue_date ?? '');
  formData.append('expiry_date', payload.expiry_date ?? '');

  if (Platform.OS === 'web') {
    const resBlob = await fetch(payload.fileUri);
    const blob = await resBlob.blob();
    formData.append('file', blob, payload.fileUri.split('/').pop());
  } else {
    formData.append('file', { uri: payload.fileUri, name: payload.fileUri.split('/').pop(), type: payload.fileMimeType } as any);
  }

  const res = await api.post('/school/document/insert', formData);
  return res;
}

export async function deleteSchoolDocument(documentId: string) {
  const res = await api.post(`/school/document/delete`, { document_id: documentId });
  return res;
}

// =================================== SCHOOL DASHBOARD ======================================================
export function getDashboardData() {
  return api.get('/school/dashboard/get_data');
}

//==================================== SCHOOL SESSIONS ======================================================
export async function insertSession(payload: insertSessionPayload) {
  return api.post('/school/booking/insert', payload);
}

export async function updateSession(payload: insertSessionPayload) {
  return api.put(`/school/booking/update`, payload);
}

export async function getCategories() {
  return api.get('/school/booking/category');
}

// ambil subject berdasarkan category
export function getSubjects(category: string) {
  return api.get(`/school/booking/subject?category=${category}`)
}

// ambil teacher berdasarkan request_id
export function getTeachers(requestId: string) {
  return api.get(`/school/booking/find_teachers?request_id=${requestId}`)
}

// ambil teacher untuk private request berdasarkan teacher_id
export function getTeacherForPrivateRequest(teacherId: string) {
  return api.get(`/school/booking/get_teacher?teacher_id=${teacherId}`)
}

export function sendRequest(payload: { sessionId: string; teacherIds: string[] }) {
  return api.post('/school/booking/send_request', payload);
}

//======================= INVOICE & PAYMENT =======================

export function getInvoiceData() {
  return api.get('/school/invoice/get_data');
}

export async function insertInvoice(invoiceId: string, paymentMethod: string, payload: { fileUri: string; fileMimeType: string; fileName: string }) {
  const formData = new FormData();
  formData.append('invoice_id', invoiceId);
  formData.append('payment_method', paymentMethod);

  if (Platform.OS === 'web') {
    const resBlob = await fetch(payload.fileUri);
    const blob = await resBlob.blob();
    const filename = payload.fileName || (payload.fileUri ? payload.fileUri.split('/').pop() : 'file');
    formData.append('file_payment', blob, filename);
  } else {
    formData.append('file_payment', { uri: payload.fileUri, name: payload.fileName, type: payload.fileMimeType } as any);
  }

  const res = await api.post('/school/invoice/insert', formData);
  return res;
}

export function getPaymentLogs(paymentId: number) {
  return api.get(`/school/invoice/payment_logs?payment_id=${paymentId}`);
}

export function insertReview(payload: insertReviewPayload) {
  return api.post('/school/review', payload);
}

export function getNotifications() {
  return api.get('/school/notification');
}

export function markNotificationRead(notificationId: string) {
  return api.get(`/school/notification/mark_read?notification_id=${notificationId}`);
}

// ================= SESSION CONFIRMATION =================
// GET LIST
export function getSessionConfirmation() {
  return api.get('/school/session_confirmation/get');
}

// DETAIL (pakai query param)
export function getSessionConfirmationDetails(bookingId: number) {
  return api.get(`/school/session_confirmation/get_detail?booking_id=${bookingId}`);
}

/// CONFIRM
export function confirmSession(scheduleId: number, notes: string = "") {
  return api.post('/school/session_confirmation/update_session', {
    schedule_id: scheduleId,
    action: 'confirm',
    notes,
  });
}

// REJECT
export function rejectSession(scheduleId: number, notes: string = "") {
  return api.post('/school/session_confirmation/update_session', {
    schedule_id: scheduleId,
    action: 'reject',
    notes,
  });
}

export default { registerStep1, registerStep2, getSuburbs, getStates, uploadDocument, getSchoolProfile, updateSchoolProfile, uploadProfilePhoto, getSchoolDocuments, insertSchoolDocument, deleteSchoolDocument, insertSession, updateSession, getInvoiceData, insertInvoice, getPaymentLogs, getCategories, getSubjects, getTeachers, sendRequest, insertReview, getNotifications, markNotificationRead, getSessionConfirmation, getSessionConfirmationDetails, confirmSession, rejectSession };