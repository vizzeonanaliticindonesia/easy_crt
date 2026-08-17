import { describe, expect, it } from '@jest/globals';
import { filterSchoolOwnedItems, filterTeacherOwnedItems } from '../../lib/tenant';

describe('multi-tenant data filtering', () => {
    it('keeps only items belonging to the current school', () => {
        const items = [
            { id: '1', school_id: 'school-1' },
            { id: '2', school_id: 'school-2' },
        ];

        const result = filterSchoolOwnedItems(items, 'school-1');

        expect(result).toEqual([{ id: '1', school_id: 'school-1' }]);
    });

    it('keeps only items belonging to the current teacher', () => {
        const items = [
            { id: '10', teacher_id: 'teacher-1' },
            { id: '20', teacher_id: 'teacher-2' },
        ];

        const result = filterTeacherOwnedItems(items, 'teacher-1');

        expect(result).toEqual([{ id: '10', teacher_id: 'teacher-1' }]);
    });

    it('does not leak a teacher-owned item when the school ID happens to match the teacher ID', () => {
        const items = [
            { id: 'inv-99', teacher_id: '42', school_id: '17' },
            { id: 'inv-11', school_id: '42' },
        ];

        const result = filterSchoolOwnedItems(items, '42');

        expect(result).toEqual([{ id: 'inv-11', school_id: '42' }]);
    });

    it('does not leak a school-owned item when the teacher ID happens to match the school ID', () => {
        const items = [
            { id: 'inv-99', teacher_id: '42', school_id: '17' },
            { id: 'inv-22', teacher_id: '17' },
        ];

        const result = filterTeacherOwnedItems(items, '17');

        expect(result).toEqual([{ id: 'inv-22', teacher_id: '17' }]);
    });
});
