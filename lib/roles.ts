import type { User, UserRole } from '@/types';

type RoleLike = Pick<User, 'role'> | { role?: UserRole | number | string | null | undefined };

export function normalizeRole(role: unknown): UserRole | undefined {
    if (role === 9 || role === '9' || role === 'teacher') {
        return 9;
    }

    if (role === 10 || role === '10' || role === 'school') {
        return 10;
    }

    if (typeof role === 'string') {
        const parsed = Number(role);
        if (parsed === 9 || parsed === 10) {
            return parsed;
        }
    }

    return undefined;
}

export function isTeacher(user?: RoleLike | null): boolean {
    return normalizeRole(user?.role) === 9;
}

export function isSchool(user?: RoleLike | null): boolean {
    return normalizeRole(user?.role) === 10;
}