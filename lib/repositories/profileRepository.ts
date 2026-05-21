import AsyncStorage from '@react-native-async-storage/async-storage';
import { SchoolProfile } from '@/types';
import * as storage from '@/lib/storage';

export interface ProfileRepository {
    getProfile(): Promise<SchoolProfile | null>;
    updateProfile(updates: Partial<SchoolProfile>): Promise<SchoolProfile>;
    updateProfilePhoto(photoUri: string): Promise<SchoolProfile>;
}

class MockProfileRepository implements ProfileRepository {
    async getProfile(): Promise<SchoolProfile | null> {
        return await storage.getUser() as SchoolProfile | null;
    }

    async updateProfile(updates: Partial<SchoolProfile>): Promise<SchoolProfile> {
        const current = await storage.getUser();
        if (!current) throw new Error('No user found');

        const updated = { ...current, ...updates } as SchoolProfile;
        await storage.saveUser(updated);
        return updated;
    }

    async updateProfilePhoto(photoUri: string): Promise<SchoolProfile> {
        const current = await storage.getUser();
        if (!current) throw new Error('No user found');

        const updated = { ...current, profileImage: photoUri } as SchoolProfile;
        await storage.saveUser(updated);
        return updated;
    }
}

class ApiProfileRepository implements ProfileRepository {
    async getProfile(): Promise<SchoolProfile | null> {
        throw new Error('Not implemented. Replace with fetch/axios call.');
    }

    async updateProfile(): Promise<SchoolProfile> {
        throw new Error('Not implemented. Replace with fetch/axios call.');
    }

    async updateProfilePhoto(): Promise<SchoolProfile> {
        throw new Error('Not implemented. Replace with fetch/axios call.');
    }
}

export function createProfileRepository(mode: 'mock' | 'api' = 'mock'): ProfileRepository {
    if (mode === 'api') return new ApiProfileRepository();
    return new MockProfileRepository();
}

export const profileRepository = createProfileRepository('mock');
