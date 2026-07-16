# Bug #63 — Incomplete validation in `register-school.validate()`

**Severity:** MEDIUM · **Effort:** ~15 min · **Status:** OPEN
**Affected file:** `app/register-school.tsx:117-131`

## Problem

`validate()` checks `schoolName, email, phone, schoolType, sector, araraSchoolId, locationState, locationSuburbId, postcode`. It does NOT validate:
- `address` (sent as `address: address.trim()` in payload, never gated)
- Phone format (just non-empty)
- Email beyond `.includes('@')`

## Impact

Schools register with garbage emails/phones. Missing address silently submits empty string. "Full Address" input is treated as optional even though it sits in the required-looking form block.

## Fix

```ts
function validate(): string | null {
  if (!schoolName.trim()) return 'School name is required';
  if (!isValidEmail(email)) return 'Please enter a valid email';
  if (!/^[\d\s+()-]{7,}$/.test(phone)) return 'Please enter a valid phone number';
  if (!address.trim()) return 'Address is required';
  // ... existing checks
}
```

Use `isValidEmail` from `lib/validation.ts` (Bug #33's fix).

## Related

Bug #33, #60 (combine — same file / register flow)
