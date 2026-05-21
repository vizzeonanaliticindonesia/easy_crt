import AsyncStorage from '@react-native-async-storage/async-storage';
import { SchoolDocument } from '@/types';
import { MOCK_SCHOOL_DOCUMENTS } from '@/lib/mockData';

const SCHOOL_DOCUMENTS_KEY = '@app_school_documents';

export async function getSchoolDocuments(): Promise<SchoolDocument[]> {
    const raw = await AsyncStorage.getItem(SCHOOL_DOCUMENTS_KEY);
    if (!raw) {
        await saveSchoolDocuments(MOCK_SCHOOL_DOCUMENTS);
        return MOCK_SCHOOL_DOCUMENTS;
    }

    try {
        const parsed = JSON.parse(raw) as SchoolDocument[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        await saveSchoolDocuments(MOCK_SCHOOL_DOCUMENTS);
        return MOCK_SCHOOL_DOCUMENTS;
    }
}

export async function saveSchoolDocuments(documents: SchoolDocument[]): Promise<void> {
    await AsyncStorage.setItem(SCHOOL_DOCUMENTS_KEY, JSON.stringify(documents));
}

export async function addSchoolDocument(document: SchoolDocument): Promise<SchoolDocument[]> {
    const existing = await getSchoolDocuments();
    const updated = [document, ...existing];
    await saveSchoolDocuments(updated);
    return updated;
}

export async function removeSchoolDocument(documentId: string): Promise<SchoolDocument[]> {
    const existing = await getSchoolDocuments();
    const updated = existing.filter((doc) => doc.id !== documentId);
    await saveSchoolDocuments(updated);
    return updated;
}
