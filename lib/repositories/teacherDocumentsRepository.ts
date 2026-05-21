import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_TEACHER_DOCUMENTS } from '@/lib/mockData';
import { TeacherDocument } from '@/types';

const TEACHER_DOCUMENTS_KEY = '@app_teacher_documents';

export type CreateTeacherDocumentInput = Omit<TeacherDocument, 'id' | 'uploadedAt'>;

export interface teacherDocumentsRepository {
    getDocuments(): Promise<TeacherDocument[]>;
    createDocument(input: CreateTeacherDocumentInput): Promise<TeacherDocument>;
    deleteDocument(documentId: string): Promise<TeacherDocument[]>;
}

class MockDocumentsRepository implements teacherDocumentsRepository {
    private async save(documents: TeacherDocument[]): Promise<void> {
        await AsyncStorage.setItem(TEACHER_DOCUMENTS_KEY, JSON.stringify(documents));
    }

    async getDocuments(): Promise<TeacherDocument[]> {
        const raw = await AsyncStorage.getItem(TEACHER_DOCUMENTS_KEY);
        if (!raw) {
            await this.save(MOCK_TEACHER_DOCUMENTS);
            return MOCK_TEACHER_DOCUMENTS;
        }

        try {
            const parsed = JSON.parse(raw) as TeacherDocument[];
            if (!Array.isArray(parsed)) {
                await this.save(MOCK_TEACHER_DOCUMENTS);
                return MOCK_TEACHER_DOCUMENTS;
            }
            return parsed;
        } catch {
            await this.save(MOCK_TEACHER_DOCUMENTS);
            return MOCK_TEACHER_DOCUMENTS;
        }
    }

    async createDocument(input: CreateTeacherDocumentInput): Promise<TeacherDocument> {
        const current = await this.getDocuments();
        const next: TeacherDocument = {
            ...input,
            id: 'doc_' + Date.now().toString(),
            uploadedAt: new Date().toISOString(),
        };
        await this.save([next, ...current]);
        return next;
    }

    async deleteDocument(documentId: string): Promise<TeacherDocument[]> {
        const current = await this.getDocuments();
        const updated = current.filter((doc) => doc.id !== documentId);
        await this.save(updated);
        return updated;
    }
}

class ApiDocumentsRepository implements teacherDocumentsRepository {
    async getDocuments(): Promise<TeacherDocument[]> {
        throw new Error('Not implemented. Replace with fetch/axios call.');
    }

    async createDocument(): Promise<TeacherDocument> {
        throw new Error('Not implemented. Replace with fetch/axios call.');
    }

    async deleteDocument(): Promise<TeacherDocument[]> {
        throw new Error('Not implemented. Replace with fetch/axios call.');
    }
}

export function createDocumentsRepository(mode: 'mock' | 'api' = 'mock'): teacherDocumentsRepository {
    if (mode === 'api') return new ApiDocumentsRepository();
    return new MockDocumentsRepository();
}

export const teacherDocumentsRepository = createDocumentsRepository('mock');
