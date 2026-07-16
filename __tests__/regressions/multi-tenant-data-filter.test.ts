import { describe, expect, it } from '@jest/globals';
import { filterTenantOwnedItems } from '../../lib/tenant';

describe('multi-tenant data filtering', () => {
    it('keeps only items belonging to the current school', () => {
        const items = [
            { id: '1', school_id: 'school-1' },
            { id: '2', school_id: 'school-2' },
        ];

        const result = filterTenantOwnedItems(items, 'school-1');

        expect(result).toEqual([{ id: '1', school_id: 'school-1' }]);
    });

    it('keeps only items belonging to the current teacher', () => {
        const items = [
            { id: '10', teacher_id: 'teacher-1' },
            { id: '20', teacher_id: 'teacher-2' },
        ];

        const result = filterTenantOwnedItems(items, 'teacher-1');

        expect(result).toEqual([{ id: '10', teacher_id: 'teacher-1' }]);
    });
});
