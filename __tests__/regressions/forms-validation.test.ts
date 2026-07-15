import { describe, expect, it } from '@jest/globals';
import { coerceNumber, isValidEmail } from '../../lib/forms';

describe('form validation helpers', () => {
    it('accepts properly formatted emails and rejects malformed ones', () => {
        expect(isValidEmail('teacher@example.com')).toBe(true);
        expect(isValidEmail('teacher @example.com')).toBe(false);
        expect(isValidEmail('teacher@example')).toBe(false);
    });

    it('coerces numeric form values safely before submission', () => {
        expect(coerceNumber('12.5')).toBe(12.5);
        expect(coerceNumber('bad-value', 0)).toBe(0);
        expect(coerceNumber('', 4)).toBe(4);
    });
});
