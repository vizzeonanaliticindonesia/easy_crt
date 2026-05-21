import { TeacherProfile, SchoolProfile, TeachingSession, AppNotification, SchoolDocument, TeacherDocument, InvoiceRecord } from '@/types';

export const MOCK_TEACHERS: TeacherProfile[] = [
  {
    id: 'teacher_1',
    role: 'teacher',

    email: 'sarah.johnson@email.com',
    password: 'password123',

    firstName: 'Sarah',
    lastName: 'Johnson',
    preferredName: 'Sarah',

    phone: '+1-555-0101',

    location_state: 'NSW',
    location_suburb_id: 'nsw_1',
    postcode: '2000',
    address: '123 Main St, Sydney',

    subjects: ['Mathematics', 'Physics'],
    qualification: 'M.Sc. Mathematics, B.Ed.',

    rating: 4.8,
    reviewCount: 24,
    isAvailable: true,

    profileImage: '',

    termsAccepted: true,
    integrityAccepted: true,

    createdAt: '2024-01-15T08:00:00Z',
  },

  {
    id: 'teacher_2',
    role: 'teacher',

    email: 'michael.chen@email.com',
    password: 'password123',

    firstName: 'Michael',
    lastName: 'Chen',
    preferredName: '',

    phone: '+1-555-0102',

    location_state: 'NSW',
    location_suburb_id: 'nsw_2',
    postcode: '2150',
    address: '45 River Rd, Parramatta',

    subjects: ['English', 'Literature'],
    qualification: 'M.A. English Literature, TESOL',

    rating: 4.6,
    reviewCount: 18,
    isAvailable: true,

    profileImage: '',

    termsAccepted: true,
    integrityAccepted: true,

    createdAt: '2024-02-01T08:00:00Z',
  },

  {
    id: 'teacher_3',
    role: 'teacher',

    email: 'emma.wilson@email.com',
    password: 'password123',

    firstName: 'Emma',
    lastName: 'Wilson',
    preferredName: '',

    phone: '+1-555-0103',

    location_state: 'VIC',
    location_suburb_id: 'vic_1',
    postcode: '3000',
    address: '78 Collins St, Melbourne',

    subjects: ['Biology', 'Chemistry'],
    qualification: 'Ph.D. Biochemistry',

    rating: 4.9,
    reviewCount: 31,
    isAvailable: true,

    profileImage: '',

    termsAccepted: true,
    integrityAccepted: true,

    createdAt: '2024-01-20T08:00:00Z',
  },

  {
    id: 'teacher_4',
    role: 'teacher',

    email: 'david.park@email.com',
    password: 'password123',

    firstName: 'David',
    lastName: 'Park',
    preferredName: '',

    phone: '+1-555-0104',

    location_state: 'QLD',
    location_suburb_id: 'qld_1',
    postcode: '4000',
    address: '12 Queen St, Brisbane',

    subjects: ['History', 'Geography'],
    qualification: 'M.A. History, B.Ed.',

    rating: 4.5,
    reviewCount: 15,
    isAvailable: false,

    profileImage: '',

    termsAccepted: true,
    integrityAccepted: true,

    createdAt: '2024-03-01T08:00:00Z',
  },

  {
    id: 'teacher_5',
    role: 'teacher',

    email: 'lisa.martinez@email.com',
    password: 'password123',

    firstName: 'Lisa',
    lastName: 'Martinez',
    preferredName: '',

    phone: '+1-555-0105',

    location_state: 'WA',
    location_suburb_id: 'wa_1',
    postcode: '6000',
    address: '99 King St, Perth',

    subjects: ['Art', 'Music'],
    qualification: 'B.F.A., Music Education Certificate',

    rating: 4.7,
    reviewCount: 22,
    isAvailable: true,

    profileImage: '',

    termsAccepted: true,
    integrityAccepted: true,

    createdAt: '2024-02-15T08:00:00Z',
  },
];

export const MOCK_SCHOOLS: SchoolProfile[] = [
	{
		id: 'school_1',
		email: 'admin@lincoln-elementary.edu',
		password: 'password123',
		role: 'school',
		phone: '+1-555-0201',
		schoolName: 'Lincoln Elementary',
		address: '123 School St, Downtown',
		contactPerson: 'Principal Anna Brown',
		araraSchoolId: 'AES-001',
		schoolType: 'Public Elementary School',
		sector: 'Education',
		contactEmail: 'admin@lincoln-elementary.edu',
		contactPhone: '+1-555-0201',
		lat: '40.7128',
		long: '-74.0060',
		termsAccepted: true,
		integrityAccepted: true,
		createdAt: '2024-01-10T08:00:00Z',
	},
];

export const MOCK_SESSIONS: TeachingSession[] = [
	{
		id: 'session_1',
		schoolId: 'school_1',
		schoolName: 'Lincoln Elementary',
		teacherId: 'teacher_1',
		teacherName: 'Sarah Johnson',
		subject: 'Mathematics',
		date: '2024-12-20',
		startTime: '09:00',
		endTime: '12:00',
		location: '123 School St, Downtown',
		status: 'completed',
		selectedTeacherIds: ['teacher_1', 'teacher_3'],
		invoiceAmount: 150,
		createdAt: '2024-12-18T08:00:00Z',
	},
	{
		id: 'session_2',
		schoolId: 'school_1',
		schoolName: 'Lincoln Elementary',
		subject: 'English',
		date: '2024-12-22',
		startTime: '13:00',
		endTime: '16:00',
		location: '123 School St, Downtown',
		status: 'completed',
		selectedTeacherIds: ['teacher_2', 'teacher_5'],
		createdAt: '2024-12-19T08:00:00Z',
	},
];

export const MOCK_SCHOOL_DOCUMENTS: SchoolDocument[] = [
	{
		id: 'doc_1',
		fileName: 'School License 2026.pdf',
		documentName: 'School License',
		documentNumber: 'LIC-2026-001',
		issuedBy: 'Education Authority',
		issueDate: '2026-01-05',
		expiryDate: '2027-01-05',
		fileUri: 'mock://documents/school-license-2026.pdf',
		fileMimeType: 'application/pdf',
		fileSize: 240000,
		uploadedAt: '2026-01-06T09:00:00.000Z',
	},
	{
		id: 'doc_2',
		fileName: 'Building Safety Certificate.pdf',
		documentName: 'Building Safety Certificate',
		documentNumber: 'SAFE-2026-009',
		issuedBy: 'City Safety Office',
		issueDate: '2026-02-11',
		expiryDate: '2027-02-11',
		fileUri: 'mock://documents/building-safety-certificate.pdf',
		fileMimeType: 'application/pdf',
		fileSize: 195000,
		uploadedAt: '2026-02-12T09:00:00.000Z',
	},
];

export const MOCK_TEACHER_DOCUMENTS: TeacherDocument[] = [
	{
		id: 'doc_1',
		fileName: 'Teaching License 2026.pdf',
		documentName: 'Teaching License',
		documentNumber: 'LIC-2026-001',
		issuedBy: 'Education Authority',
		issueDate: '2026-01-05',
		expiryDate: '2027-01-05',
		fileUri: 'mock://documents/teaching-license-2026.pdf',
		fileMimeType: 'application/pdf',
		fileSize: 240000,
		uploadedAt: '2026-01-06T09:00:00.000Z',
	},
	{
		id: 'doc_2',
		fileName: 'Building Safety Certificate.pdf',
		documentName: 'Building Safety Certificate',
		documentNumber: 'SAFE-2026-009',
		issuedBy: 'City Safety Office',
		issueDate: '2026-02-11',
		expiryDate: '2027-02-11',
		fileUri: 'mock://documents/building-safety-certificate.pdf',
		fileMimeType: 'application/pdf',
		fileSize: 195000,
		uploadedAt: '2026-02-12T09:00:00.000Z',
	},
];

export const MOCK_NOTIFICATIONS: AppNotification[] = [
	{
		id: 'notif_1',
		userId: 'teacher_1',
		type: 'session_request',
		title: 'New Teaching Request',
		message: 'Lincoln Elementary needs a Mathematics teacher on Dec 20.',
		sessionId: 'session_1',
		read: false,
		createdAt: '2024-12-18T08:00:00Z',
	},
	{
		id: 'notif_2',
		userId: 'school_1',
		type: 'session_accepted',
		title: 'Teacher Accepted',
		message: 'Sarah Johnson accepted your teaching session request.',
		sessionId: 'session_1',
		read: false,
		createdAt: '2024-12-18T09:00:00Z',
	},
];

export const MOCK_INVOICES: InvoiceRecord[] = [
	{
		id: 'invoice_1',
		bookingId: 'BK-240001',
		schoolId: 'school_1',
		sessionId: 'session_1',
		teacherName: 'Sarah Johnson',
		subjectName: 'Mathematics',
		totalAmount: 150,
		paymentMethod: 'bank_transfer',
		status: 'paid',
		paidAt: '2026-04-08T10:22:00.000Z',
		fileInvoice: 'invoice_BK-240001.pdf',
		paymentProofFileName: 'proof_bk240001.png',
		reasonLogs: [
			{
				id: 'log_1',
				changedAt: '2026-04-08T09:56:00.000Z',
				notes: 'School uploaded bank transfer receipt.',
			},
			{
				id: 'log_2',
				changedAt: '2026-04-08T10:22:00.000Z',
				notes: 'Payment verified by finance team.',
			},
		],
	},
	{
		id: 'invoice_2',
		bookingId: 'BK-240002',
		schoolId: 'school_1',
		sessionId: 'session_2',
		teacherName: 'Michael Chen',
		subjectName: 'English',
		totalAmount: 180,
		status: 'waiting_confirmation',
		paymentMethod: 'credit_card',
		paidAt: '2026-04-20T08:40:00.000Z',
		fileInvoice: 'invoice_BK-240002.pdf',
		paymentProofFileName: 'proof_bk240002.pdf',
		reasonLogs: [
			{
				id: 'log_3',
				changedAt: '2026-04-20T08:40:00.000Z',
				notes: 'School submitted credit card proof. Waiting confirmation.',
			},
		],
	},
	{
		id: 'invoice_3',
		bookingId: 'BK-240003',
		schoolId: 'school_1',
		totalAmount: 210,
		status: 'unpaid',
		fileInvoice: 'invoice_BK-240003.pdf',
		reasonLogs: [
			{
				id: 'log_4',
				changedAt: '2026-04-22T14:00:00.000Z',
				notes: 'Invoice generated. Awaiting payment from school.',
			},
		],
	},
];

export const MOCK_SUBJECTS = [
  { id: '1', teacherName: 'Budi Santoso', subject: 'Matematika' },
  { id: '2', teacherName: 'Siti Aminah', subject: 'Bahasa Inggris' },
];
