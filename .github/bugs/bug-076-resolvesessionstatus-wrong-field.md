# Bug #76 — `resolveSessionStatus(session.status, ...)` but the field on this payload is `request_status`

**Severity:** MEDIUM · **Effort:** ~5 min · **Status:** OPEN
**Affected file:** `app/session-detail.tsx:74`

## Problem

```tsx
const currentStatus: SessionStatus = session
  ? resolveSessionStatus(session.status, session.is_confirm)
  : 'open';
```

`resolveSessionStatus` only recognizes specific values, but `session.status` is likely **undefined** on this payload — the dashboard data uses `session.request_status` (`'pending' | 'accepted' | ...`), not `session.status`.

So `resolveSessionStatus` always falls back to `'open'` regardless of true state.

## Impact

Status badge on session-detail screen is wrong (or stuck on 'open') regardless of the actual session state.

## Fix

```tsx
const currentStatus: SessionStatus = session
  ? resolveSessionStatus(session.request_status, session.is_confirm)
  : 'open';
```

Reconcile the `SessionStatus` enum with what `request_status` actually contains. The two may diverge.

## Related

Bug #12, #69 (same `resolveSessionStatus` family) · Bug #5 (broader shape drift)
