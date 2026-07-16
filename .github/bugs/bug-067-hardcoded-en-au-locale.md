# Bug #67 — Hardcoded `en-AU` locale and no timezone in date formatter

**Severity:** LOW · **Effort:** ~10 min · **Status:** OPEN
**Affected file:** `components/SessionCard.tsx:19-24`

## Problem

```ts
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', { ... });
}
```

Hardcoded locale matches the product target but is a magic string that bypasses any future i18n switch. Also no timezone — `new Date('2025-12-01')` parses as UTC midnight, which renders as "Sun, 30 Nov" in negative-UTC tester locales (none in AU, but staging devs may see drift).

## Fix

Centralize date formatting in a shared helper:

```ts
// lib/format.ts
const DEFAULT_LOCALE = 'en-AU';   // override via i18n in future

export function formatDate(dateStr: string, opts: Intl.DateTimeFormatOptions = {}): string {
  if (!dateStr) return '';
  // Use timeZone: 'Australia/Sydney' or backend's tz to avoid UTC drift
  return new Date(dateStr).toLocaleDateString(DEFAULT_LOCALE, {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: 'Australia/Sydney',
    ...opts,
  });
}
```

## Related

Bug #44 (similar: currency also uses en-AU — combine into `lib/format.ts`)
