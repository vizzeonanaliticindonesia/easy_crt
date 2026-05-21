import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_SUBJECTS } from '@/lib/mockData';
import { SubjectItem } from '@/types';

const KEY = '@app_subjects';

export const subjectsRepository = {
    getSubjects: async (): Promise<SubjectItem[]> => {
        const raw = await AsyncStorage.getItem(KEY);
        if (!raw) {
            await AsyncStorage.setItem(KEY, JSON.stringify(MOCK_SUBJECTS));
            return MOCK_SUBJECTS;
        }
        return JSON.parse(raw);
    },

    createSubject: async (data: Omit<SubjectItem, 'id'>) => {
        const current = await subjectsRepository.getSubjects();
        const newItem: SubjectItem = {
            ...data,
            id: 'sub_' + Date.now(),
        };
        const updated = [newItem, ...current];
        await AsyncStorage.setItem(KEY, JSON.stringify(updated));
        return newItem;
    },

    deleteSubject: async (id: string) => {
        const current = await subjectsRepository.getSubjects();
        const updated = current.filter((item) => item.id !== id);
        await AsyncStorage.setItem(KEY, JSON.stringify(updated));
        return updated;
    },
};