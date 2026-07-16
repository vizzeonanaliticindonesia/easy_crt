export function formatCurrency(amount: number | string): string {
    const numericAmount = typeof amount === 'number' ? amount : Number(amount);
    const normalizedAmount = Number.isFinite(numericAmount) ? numericAmount : 0;

    return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
    }).format(normalizedAmount);
}
