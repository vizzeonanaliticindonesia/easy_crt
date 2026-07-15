# Bug #12 — `resolveSessionStatus` returns values not in `SessionStatus` type

**Severity:** MEDIUM · **Effort:** ~15 min · **Status:** OPEN
**Affected file:** `components/ui/AppPrimitives.tsx:108-125`

## Problem

```ts
export function resolveSessionStatus(
  status?: SessionStatus | string | number | null,
  isConfirm?: string | number | null
): SessionStatus {                          // ← return type claims SessionStatus
  if (confirmVal === '1') return 'attended';    // ← NOT in SessionStatus union
  if (confirmVal === '2') return 'unattended';  // ← NOT in SessionStatus union
  ...
}
```

`SessionStatus` in `types/index.ts:50-63` has 13 values; `'attended'` and `'unattended'` are not among them. The return type is a lie. `SESSION_STATUS_VISUALS` falls back to "Unknown" badge.

## Impact

When `is_confirm = 1` (teacher attended), the badge silently shows **"Unknown"** instead of "Attended". User-visible.

## Fix

Add the values to the type AND the visuals map:

```ts
// types/index.ts
export type SessionStatus = ... | 'attended' | 'unattended';

// components/ui/AppPrimitives.tsx — extend SESSION_STATUS_VISUALS
attended: { label: 'Attended', color: '...', bg: '...' },
unattended: { label: 'Unattended', color: '...', bg: '...' },
```

## Related

Bug #6 (this is the residual type-drift after #6's fix) · Bug #69 (`is_confirm` field also undeclared)
