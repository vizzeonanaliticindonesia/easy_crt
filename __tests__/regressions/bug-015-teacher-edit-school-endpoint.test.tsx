import { describe, expect, it, jest } from '@jest/globals';
import { updateDocumentForRole } from '../../lib/services/document-routing';

describe('bug-015 teacher edit role routing', () => {
    it('uses the teacher document service for teacher roles', async () => {
        const teacherEdit = jest.fn().mockResolvedValue({ ok: true });
        const schoolEdit = jest.fn().mockResolvedValue({ ok: true });

        await updateDocumentForRole({
            userRole: 9,
            documentId: '42',
            formData: new FormData(),
            editTeacherDocument: teacherEdit,
            editSchoolDocument: schoolEdit,
        });

        expect(teacherEdit).toHaveBeenCalledWith('42', expect.any(FormData));
        expect(schoolEdit).not.toHaveBeenCalled();
    });

    it('uses the school document service for school roles', async () => {
        const teacherEdit = jest.fn().mockResolvedValue({ ok: true });
        const schoolEdit = jest.fn().mockResolvedValue({ ok: true });

        await updateDocumentForRole({
            userRole: 10,
            documentId: '77',
            formData: new FormData(),
            editTeacherDocument: teacherEdit,
            editSchoolDocument: schoolEdit,
        });

        expect(schoolEdit).toHaveBeenCalledWith('77', expect.any(FormData));
        expect(teacherEdit).not.toHaveBeenCalled();
    });
});
