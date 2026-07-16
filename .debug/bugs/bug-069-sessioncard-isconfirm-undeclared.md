# Bug #69 — `SessionCard` reads `session.is_confirm` which isn't declared on `TeachingSession`

**Severity:** MEDIUM · **Effort:** ~5 min · **Status:** OPEN
**Affected file:** `components/SessionCard.tsx:75` (via `resolveSessionStatus`)

## Problem

```tsx
const currentStatus: SessionStatus = resolveSessionStatus(session.status, session.is_confirm);
```

`session.is_confirm` is not declared on `TeachingSession` in `types/index.ts:65-86`. The component reads a field that the type doesn't know about. Runtime-only contract.

This extends Bug #12 — both the function's **return values** (`'attended'`/`'unattended'`) and the **input field** (`is_confirm`) violate the type system.

## Impact

Refactoring `TeachingSession` is risky because callers reach for undeclared fields. New tests can't trust the type.

## Fix

Add the field to the type:
```ts
// types/index.ts
export interface TeachingSession {
  ...
  is_confirm?: '0' | '1' | '2';   // 0=pending, 1=attended, 2=unattended (confirm with backend)
}
```

## Related

Bug #12 (combine — same `resolveSessionStatus` family) · Bug #5 (broader TeachingSession drift)
