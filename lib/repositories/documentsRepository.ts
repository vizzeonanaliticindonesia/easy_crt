import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_SCHOOL_DOCUMENTS } from '@/lib/mockData';
import { SchoolDocument } from '@/types';

const SCHOOL_DOCUMENTS_KEY = '@app_school_documents';

export type CreateSchoolDocumentInput = Omit<SchoolDocument, 'id' | 'uploadedAt'>;

export interface DocumentsRepository {
    getDocuments(): Promise<SchoolDocument[]>;
    createDocument(input: CreateSchoolDocumentInput): Promise<SchoolDocument>;
    deleteDocument(documentId: string): Promise<SchoolDocument[]>;
}

class MockDocumentsRepository implements DocumentsRepository {
    private async save(documents: SchoolDocument[]): Promise<void> {
        await AsyncStorage.setItem(SCHOOL_DOCUMENTS_KEY, JSON.stringify(documents));
    }

    async getDocuments(): Promise<SchoolDocument[]> {
        const raw = await AsyncStorage.getItem(SCHOOL_DOCUMENTS_KEY);
        if (!raw) {
            await this.save(MOCK_SCHOOL_DOCUMENTS);
            return MOCK_SCHOOL_DOCUMENTS;
        }

        try {
            const parsed = JSON.parse(raw) as SchoolDocument[];
            if (!Array.isArray(parsed)) {
                await this.save(MOCK_SCHOOL_DOCUMENTS);
                return MOCK_SCHOOL_DOCUMENTS;
            }
            return parsed;
        } catch {
            await this.save(MOCK_SCHOOL_DOCUMENTS);
            return MOCK_SCHOOL_DOCUMENTS;
        }
    }

    async createDocument(input: CreateSchoolDocumentInput): Promise<SchoolDocument> {
        const current = await this.getDocuments();
        const next: SchoolDocument = {
            ...input,
            id: 'doc_' + Date.now().toString(),
            uploadedAt: new Date().toISOString(),
        };
        await this.save([next, ...current]);
        return next;
    }

    async deleteDocument(documentId: string): Promise<SchoolDocument[]> {
        const current = await this.getDocuments();
        const updated = current.filter((doc) => doc.id !== documentId);
        await this.save(updated);
        return updated;
    }
}

class ApiDocumentsRepository implements DocumentsRepository {
    async getDocuments(): Promise<SchoolDocument[]> {
        throw new Error('Not implemented. Replace with fetch/axios call.');
    }

    async createDocument(): Promise<SchoolDocument> {
        throw new Error('Not implemented. Replace with fetch/axios call.');
    }

    async deleteDocument(): Promise<SchoolDocument[]> {
        throw new Error('Not implemented. Replace with fetch/axios call.');
    }
}

export function createDocumentsRepository(mode: 'mock' | 'api' = 'mock'): DocumentsRepository {
    if (mode === 'api') return new ApiDocumentsRepository();
    return new MockDocumentsRepository();
}

export const documentsRepository = createDocumentsRepository('mock');
