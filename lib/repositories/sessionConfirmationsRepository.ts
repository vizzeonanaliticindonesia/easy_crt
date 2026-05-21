import { TeachingSession } from '@/types';
import { MOCK_SESSIONS } from '@/lib/mockData';
import * as storage from '@/lib/storage';

export interface SessionConfirmationsRepository {
    getSessions(): Promise<TeachingSession[]>;
    confirmSession(params: {
        scheduleId: string | number;
        attendanceNotes: string;
        attendanceCheckIn: string;
        attendanceCheckOut: string;
    }): Promise<TeachingSession | null>;
    rejectSession(params: {
        scheduleId: string | number;
        notes: string;
    }): Promise<TeachingSession | null>;
}

class MockSessionConfirmationsRepository implements SessionConfirmationsRepository {
    async getSessions(): Promise<TeachingSession[]> {
        let sessions = await storage.getSessions();
        if (sessions.length === 0) {
            sessions = MOCK_SESSIONS;
            await storage.saveSessions(sessions);
        }
        return sessions;
    }

    async confirmSession(params: {
        scheduleId: string | number;
        attendanceNotes: string;
        attendanceCheckIn: string;
        attendanceCheckOut: string;
    }): Promise<TeachingSession | null> {
        const sessions = await this.getSessions();
        const targetId = String(params.scheduleId);
        let updatedTarget: TeachingSession | null = null;

        const updated = sessions.map((session) => {
            if (session.id !== targetId) return session;
            updatedTarget = {
                ...session,
                status: 'attendance_confirmed',
                attendanceNotes: params.attendanceNotes,
                attendanceCheckIn: params.attendanceCheckIn,
                attendanceCheckOut: params.attendanceCheckOut,
            };
            return updatedTarget;
        });

        if (!updatedTarget) return null;
        await storage.saveSessions(updated);
        return updatedTarget;
    }

    async rejectSession(params: {
        scheduleId: string | number;
        notes: string;
    }): Promise<TeachingSession | null> {
        const sessions = await this.getSessions();
        const targetId = String(params.scheduleId);
        let updatedTarget: TeachingSession | null = null;

        const updated = sessions.map((session) => {
            if (session.id !== targetId) return session;
            updatedTarget = {
                ...session,
                status: 'declined',
                attendanceNotes: params.notes,
            };
            return updatedTarget;
        });

        if (!updatedTarget) return null;
        await storage.saveSessions(updated);
        return updatedTarget;
    }
}

class ApiSessionConfirmationsRepository implements SessionConfirmationsRepository {
    async getSessions(): Promise<TeachingSession[]> {
        throw new Error('Not implemented. Replace with fetch/axios call.');
    }

    async confirmSession(): Promise<TeachingSession | null> {
        throw new Error('Not implemented. Replace with fetch/axios call.');
    }

    async rejectSession(): Promise<TeachingSession | null> {
        throw new Error('Not implemented. Replace with fetch/axios call.');
    }
}

export function createSessionConfirmationsRepository(mode: 'mock' | 'api' = 'mock'): SessionConfirmationsRepository {
    if (mode === 'api') return new ApiSessionConfirmationsRepository();
    return new MockSessionConfirmationsRepository();
}

export const sessionConfirmationsRepository = createSessionConfirmationsRepository('mock');
