import { AppNotification, TeacherProfile, TeachingSession } from '@/types';
import { MOCK_NOTIFICATIONS, MOCK_TEACHERS } from '@/lib/mockData';
import * as storage from '@/lib/storage';

export interface SessionRuntimeRepository {
    getTeachers(): Promise<TeacherProfile[]>;
    getNotifications(): Promise<AppNotification[]>;
    saveSessions(sessions: TeachingSession[]): Promise<void>;
    saveTeachers(teachers: TeacherProfile[]): Promise<void>;
    saveNotifications(notifications: AppNotification[]): Promise<void>;
}

class LocalSessionRuntimeRepository implements SessionRuntimeRepository {
    async getTeachers(): Promise<TeacherProfile[]> {
        let teachers = await storage.getTeachers();
        if (teachers.length === 0) {
            teachers = MOCK_TEACHERS;
            await storage.saveTeachers(teachers);
        }
        return teachers;
    }

    async getNotifications(): Promise<AppNotification[]> {
        let notifications = await storage.getNotifications();
        if (notifications.length === 0) {
            notifications = MOCK_NOTIFICATIONS;
            await storage.saveNotifications(notifications);
        }
        return notifications;
    }

    async saveSessions(sessions: TeachingSession[]): Promise<void> {
        await storage.saveSessions(sessions);
    }

    async saveTeachers(teachers: TeacherProfile[]): Promise<void> {
        await storage.saveTeachers(teachers);
    }

    async saveNotifications(notifications: AppNotification[]): Promise<void> {
        await storage.saveNotifications(notifications);
    }
}

export const sessionRuntimeRepository: SessionRuntimeRepository = new LocalSessionRuntimeRepository();
