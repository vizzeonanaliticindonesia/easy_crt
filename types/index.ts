export type UserRole = 9 | 10; // 9 = teacher, 10 = school

export interface User {
  id: string;
  email: string;
  password: string;
  name?: string;
  teacherName: string;
  role: UserRole;
  phone?: string;
  location?: string;
  profileImage?: string;
  documents?: UserDocument[];
  termsAccepted: boolean;
  integrityAccepted: boolean;
  createdAt: string;
}

export interface TeacherProfile extends User {
  role: 9;
  subjects: string[];
  preferred_name: string;
  first_name: string;
  last_name: string;
  subject_name: string;
  state: string;
  locality: string;
  pcode: string;
  qualifications?: string;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
}

export interface SchoolProfile extends User {
  role: 10;
  schoolName: string;
  address: string;
  contactPerson: string;
}

export interface UserDocument {
  id: string;
  name: string;
  uri: string;
  type: string;
  uploadedAt: string;
}

export type SessionStatus =
  | 'pending'
  | 'accepted'
  | 'checked_in'
  | 'attendance_confirmed'
  | 'completed'
  | 'completion_confirmed'
  | 'invoice_sent'
  | 'payment_uploaded'
  | 'payment_confirmed'
  | 'reviewed'
  | 'open'
  | 'closed'
  | 'declined';

export interface TeachingSession {
  id: string;
  school_id: string;
  school_name: string;
  teacher_id: string;
  teacher_first_name?: string;
  teacher_last_name?: string;
  subject_name: string;
  request_date: string;
  schedules: ScheduleSlot[];
  state: string;
  locality: string;
  pcode: string;
  status: SessionStatus;
  termsAndConditions?: string;
  agreement?: string;
  selectedTeacherIds: string[];
  invoiceAmount?: number;
  paymentProofUri?: string;
  review?: Review;
  createdAt: string;
}

export type ScheduleSlot = {
  schedule_date: string;
  start_time: string;
  end_time: string;
};

export interface Review {
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  sessionId?: string;
  is_read: '0' | '1';
  created_at: string;
}

export type NotificationType =
  | 'session_request'
  | 'session_accepted'
  | 'teacher_checked_in'
  | 'attendance_confirmed'
  | 'session_completed'
  | 'completion_confirmed'
  | 'invoice_sent'
  | 'payment_uploaded'
  | 'payment_confirmed'
  | 'review_received';
