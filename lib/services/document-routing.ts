import { normalizeRole } from '@/lib/roles';

export type UpdateDocumentForRoleArgs = {
    userRole: number | string | null | undefined;
    documentId: string;
    formData: FormData;
    editTeacherDocument: (documentId: string, formData: FormData) => Promise<unknown>;
    editSchoolDocument: (documentId: string, formData: FormData) => Promise<unknown>;
};

export async function updateDocumentForRole({
    userRole,
    documentId,
    formData,
    editTeacherDocument,
    editSchoolDocument,
}: UpdateDocumentForRoleArgs) {
    const normalizedRole = normalizeRole(userRole);

    if (normalizedRole === 9) {
        return editTeacherDocument(documentId, formData);
    }

    if (normalizedRole === 10) {
        return editSchoolDocument(documentId, formData);
    }

    throw new Error('Unknown user role. Please log in again.');
}
