export function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function coerceNumber(value: unknown, fallback = 0): number {
    if (value === null || value === undefined) {
        return fallback;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            return fallback;
        }
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}
