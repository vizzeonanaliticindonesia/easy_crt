# Bug #33 — Email "validation" is just `.includes('@')` — accepts `@`, `a@`, `@b`

**Severity:** MEDIUM · **Effort:** ~5 min · **Status:** OPEN
**Affected files:** `app/(school-tabs)/profile.tsx:256`, `app/(teacher-tabs)/profile.tsx:274`, `app/register-school.tsx` (similar)

## Problem

```ts
if (!contactEmail.includes('@')) {
  notify('Error', 'Please enter a valid email');
  return;
}
```

Accepts `@`, `a@`, `@b`, `foo@bar` (no TLD), `   @   `, etc. Backend rejects → user sees generic error after submit.

## Impact

Bad UX: user fixes "missing @" but resubmit still fails. Trust degraded. Wastes a roundtrip.

## Fix

Centralize:
```ts
// lib/validation.ts
export const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
```

Then:
```ts
if (!isValidEmail(contactEmail)) {
  notify('Error', 'Please enter a valid email');
  return;
}
```

## Related

Bug #63 (same in register-school) · Bug #31 (related: form validation patterns)
