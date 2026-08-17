import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
// useAuth + useMemo added so we can filter confirmation bookings for the logged-in school
import { useAuth } from '@/contexts/AuthContext';
import { TeachingSession, SessionStatus, AppNotification, TeacherProfile } from '@/types';
import { sessionConfirmationsRepository } from '@/lib/repositories/sessionConfirmationsRepository';
import { sessionRuntimeRepository } from '@/lib/repositories/sessionRuntimeRepository';

export interface SessionConfirmationSchedule {
  id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  attendance_status: string; // kalo ada (?) adalah opsional
  attendance_notes?: string;
  attendance_check_in?: string;
  attendance_check_out?: string;
}

export interface SessionConfirmationBooking {
  id: string;
  teacher_name: string;
  school_name: string;
  subject_name: string;
  booking_status: string;
  schoolId?: string; // included so bookings can be filtered by the owning school
  schedules: SessionConfirmationSchedule[];
}

function mapSessionToConfirmationStatus(status: SessionStatus): string {
  if (status === 'declined') return 'rejected';
  if (status === 'completed') return 'completed';
  if (status === 'accepted' || status === 'checked_in') return 'on session';
  if (
    status === 'attendance_confirmed' ||
    status === 'completion_confirmed' ||
    status === 'invoice_sent' ||
    status === 'payment_uploaded' ||
    status === 'payment_confirmed' ||
    status === 'reviewed'
  ) {
    return 'confirmed';
  }
  return 'awaiting';
}

function toSessionConfirmationBooking(session: TeachingSession): SessionConfirmationBooking {
  const mappedStatus = mapSessionToConfirmationStatus(session.status);
  const primarySchedule = session.schedules?.[0];

  return {
    id: session.id,
    teacher_name: session.teacher_name || '-',
    school_name: session.school_name || '-',
    schoolId: session.school_id, // include schoolId in mapped booking for filtering
    subject_name: session.subject_name || '-',
    booking_status: mappedStatus,
    schedules: [
      {
        id: session.id,
        schedule_date: primarySchedule?.schedule_date || '',
        start_time: primarySchedule?.start_time || '',
        end_time: primarySchedule?.end_time || '',
        attendance_status: mappedStatus,
        attendance_notes: session.attendance_notes,
        attendance_check_in: session.attendance_check_in,
        attendance_check_out: session.attendance_check_out,
      },
    ],
  };
}

// Bentuk Isi Context
interface SessionContextType {
  //STATE (data)
  sessions: TeachingSession[];
  sessionConfirmations: SessionConfirmationBooking[];
  bookings: SessionConfirmationBooking[];
  teachers: TeacherProfile[];
  notifications: AppNotification[];
  isLoading: boolean;
  //ACTION (fungsi untuk update data)
  //Omit ambil semua fied dari teachingsession kecuali ..
  createSession: (session: Omit<TeachingSession, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  handleConfirm: (scheduleId: string | number) => Promise<boolean>;
  handleReject: (scheduleId: string | number, notes: string) => Promise<boolean>;
  updateSessionStatus: (sessionId: string, status: SessionStatus, extra?: Partial<TeachingSession>) => Promise<void>;
  acceptSession: (sessionId: string, teacherId: string, teacherName: string) => Promise<void>;
  addNotification: (notif: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>) => Promise<void>;
  markNotificationRead: (notifId: string) => Promise<void>;
  //GETTERS (query)
  getSessionsForUser: (userId: string, role: 'teacher' | 'school') => TeachingSession[];
  getNotificationsForUser: (userId: string) => AppNotification[];
  getUnreadCount: (userId: string) => number;
  refreshData: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<TeachingSession[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data dari storage saat context pertama kali dipakai, dan juga bisa dipanggil ulang untuk refresh
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const savedSessions = await sessionConfirmationsRepository.getSessions();
      const savedTeachers = await sessionRuntimeRepository.getTeachers();
      const savedNotifications = await sessionRuntimeRepository.getNotifications();

      setSessions(savedSessions); // simpan ke state agar bisa diakses di seluruh aplikasi
      setTeachers(savedTeachers);
      setNotifications(savedNotifications);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshData() {
    await loadData();
  }

  async function createSession(sessionData: Omit<TeachingSession, 'id' | 'createdAt' | 'status'>) {
    try {
      const primarySchedule = sessionData.schedules?.[0];

      const newSession: TeachingSession = {
        ...sessionData,
        id: 'session_' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      setSessions((prev) => {
        const updated = [newSession, ...prev];
        sessionRuntimeRepository.saveSessions(updated);
        return updated;
      });

      for (const teacherId of sessionData.selectedTeacherIds) {
        await addNotification({
          userId: teacherId,
          type: 'session_request',
          title: 'New Teaching Request',
          message: `${sessionData.school_name} needs a ${sessionData.subject_name} teacher on ${primarySchedule?.schedule_date || ''}.`,
          sessionId: newSession.id,
        });
      }
    } catch (e) {
      console.error('Failed to create session:', e);
    }
  }

  async function handleConfirm(scheduleId: string | number): Promise<boolean> {
    const targetId = String(scheduleId);
    const session = sessions.find((s) => s.id === targetId);
    if (!session) return false;

    const primarySchedule = session.schedules?.[0];
    const confirmed = await sessionConfirmationsRepository.confirmSession({
      scheduleId,
      attendanceNotes: session.attendance_notes || 'Attendance confirmed by school.',
      attendanceCheckIn: session.attendance_check_in || `${primarySchedule?.schedule_date || ''} ${primarySchedule?.start_time || ''}`,
      attendanceCheckOut: session.attendance_check_out || `${primarySchedule?.schedule_date || ''} ${primarySchedule?.end_time || ''}`,
    });
    if (!confirmed) return false;

    setSessions((prev) => prev.map((s) => (s.id === targetId ? confirmed : s)));

    if (session.teacher_id) {
      await addNotification({
        userId: session.teacher_id,
        type: 'attendance_confirmed',
        title: 'Attendance Confirmed',
        message: `${session.school_name} confirmed your attendance for ${session.subject_name}.`,
        sessionId: session.id,
      });
    }

    return true;
  }

  async function handleReject(scheduleId: string | number, notes: string): Promise<boolean> {
    const targetId = String(scheduleId);
    const rejected = await sessionConfirmationsRepository.rejectSession({
      scheduleId,
      notes,
    });
    if (!rejected) return false;

    setSessions((prev) => prev.map((s) => (s.id === targetId ? rejected : s)));

    return true;
  }

  async function updateSessionStatus(sessionId: string, status: SessionStatus, extra?: Partial<TeachingSession>) {
    try {
      setSessions((prev) => {
        const updated = prev.map((s) =>
          s.id === sessionId ? { ...s, status, ...extra } : s
        );
        sessionRuntimeRepository.saveSessions(updated);
        return updated;
      });
    } catch (e) {
      console.error('Failed to update session:', e);
    }
  }

  async function acceptSession(sessionId: string, teacherId: string, teacherName: string) {
    try {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return;

      if (session.teacher_id && session.teacher_id !== teacherId) {
        await addNotification({
          userId: teacherId,
          type: 'session_accepted',
          title: 'Session Already Taken',
          message: `Another teacher has already accepted this session for ${session.subject_name}.`,
          sessionId,
        });
        return;
      }

      setSessions((prev) => {
        const updated = prev.map((s) =>
          s.id === sessionId ? { ...s, status: 'accepted' as SessionStatus, teacher_id: teacherId, teacher_name: teacherName } : s
        );
        sessionRuntimeRepository.saveSessions(updated);
        return updated;
      });

      await addNotification({
        userId: session.school_id,
        type: 'session_accepted',
        title: 'Teacher Accepted',
        message: `${teacherName} accepted your teaching session for ${session.subject_name}.`,
        sessionId,
      });
    } catch (e) {
      console.error('Failed to accept session:', e);
    }
  }

  async function addNotification(notifData: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>) {
    try {
      const newNotif: AppNotification = {
        ...notifData,
        id: 'notif_' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
        is_read: '0',
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        sessionRuntimeRepository.saveNotifications(updated);
        return updated;
      });
    } catch (e) {
      console.error('Failed to add notification:', e);
    }
  }

  async function markNotificationRead(notifId: string) {
    try {
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === notifId ? { ...n, is_read: '1' as const } : n
        );
        sessionRuntimeRepository.saveNotifications(updated);
        return updated;
      });
    } catch (e) {
      console.error('Failed to mark notification read:', e);
    }
  }

  function getSessionsForUser(userId: string, role: 'teacher' | 'school') {
    if (role === 'teacher') {
      return sessions.filter(
        (s) => s.teacher_id === userId || s.selectedTeacherIds.includes(userId)
      );
    }
    return sessions.filter((s) => s.school_id === userId);
  }

  function getNotificationsForUser(userId: string) {
    return notifications.filter((n) => n.userId === userId);
  }

  function getUnreadCount(userId: string) {
    return notifications.filter((n) => n.userId === userId && n.is_read !== '1').length;
  }

  // current user is used to limit results for school users
  const { user } = useAuth();

  // Map sessions to confirmation bookings and, if the user is a school, filter to their bookings
  const sessionConfirmations = useMemo(() => {
    const mapped = sessions.map(toSessionConfirmationBooking);
    if (!user) return mapped;
    if (user.role === 10) {
      return mapped.filter((b) => b.schoolId === user.id); // only bookings belonging to this school
    }
    return mapped;
  }, [sessions, user]);

  return (
    <SessionContext.Provider
      value={{
        sessions,
        sessionConfirmations,
        bookings: sessionConfirmations,
        teachers,
        notifications,
        isLoading,
        createSession,
        handleConfirm,
        handleReject,
        updateSessionStatus,
        acceptSession,
        addNotification,
        markNotificationRead,
        getSessionsForUser,
        getNotificationsForUser,
        getUnreadCount,
        refreshData,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
