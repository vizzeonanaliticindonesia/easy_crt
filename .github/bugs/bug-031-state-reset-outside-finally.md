# Bug #31 — State reset placed outside `finally{}` — button stuck loading on failure

**Severity:** MEDIUM · **Effort:** ~5 min · **Status:** OPEN
**Affected file:** `app/session-confirmation-detail.tsx:74, 104`

## Problem

```tsx
try {
  // ... API call that may return early on non-success response
  if (!res.success) return;
  // ... happy path
} catch (err) {
  console.error(err);
  notify(...);
}
setSubmittingConfirmId(null);   // ← OUTSIDE try/catch, after the early return path can be skipped
```

The `setSubmittingConfirmId(null)` runs only if the try block completes normally. If the early `return` inside try (on non-success response) fires, the reset is skipped. Same in `submitReject`.

## Impact

Failed confirm leaves the "Confirm" button stuck in loading state forever. User has to refresh / re-navigate.

## Fix

Use `finally`:

```tsx
try {
  // ... API call ...
} catch (err) {
  console.error(err);
  notify(...);
} finally {
  setSubmittingConfirmId(null);   // ← ALWAYS runs
}
```

## Related

Bug #72 (same pattern in session-detail) · Bug #74 (idempotency / busy-state, related)
