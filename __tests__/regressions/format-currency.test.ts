import { formatCurrency } from '@/lib/format';

describe('formatCurrency', () => {
    it('formats numeric values using Australian dollars', () => {
        const expected = new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
        }).format(150);

        expect(formatCurrency(150)).toBe(expected);
    });

    it('coerces string values before formatting', () => {
        const expected = new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
        }).format(250.5);

        expect(formatCurrency('250.5')).toBe(expected);
    });
});
