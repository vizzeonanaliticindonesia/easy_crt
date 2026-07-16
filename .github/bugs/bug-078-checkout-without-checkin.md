# Bug #78 — "Check Out" button shown without verifying user has checked in

**Severity:** HIGH · **Effort:** ~10 min · **Status:** OPEN
**Affected file:** `app/session-detail.tsx:249-266`

## Problem

```tsx
// app/session-detail.tsx:249-251 (Check Out visibility)
{isTeacher && session.request_status === 'accepted' &&
  String(session.teacher_user_id) === String(user?.id) &&
  (slot.status === '0' || slot.status === 0) && (
    <AppButton title="Check Out" ... />
)}
```

Visibility is gated on `slot.status === '0' || slot.status === 0` — a magic numeric value. There's no verification that `slot.check_in_time != null`, which is the actual prerequisite for checking out.

If the backend initializes `attendance_status` to `0` before the teacher has checked in, the "Check Out" button appears prematurely. Teacher taps it → backend either rejects (best case, generic error) or creates a check-out timestamp with no matching check-in.

## Impact

Status-machine hole:
- Teacher arrives at the school but hasn't tapped "Check In" yet
- Sees "Check Out" button (because backend has `attendance_status: 0`)
- Taps Check Out by mistake
- Either: errors out (confusing UX), or: records a check-out without a check-in (corrupts attendance audit)

For an attendance app where the entire purpose is auditable time tracking, this defeats the use case.

## Fix

Gate Check Out on the actual prerequisite — having checked in:

```tsx
// app/session-detail.tsx:249-251
{isTeacher && session.request_status === 'accepted' &&
  String(session.teacher_user_id) === String(user?.id) &&
  slot.check_in_time != null &&        // ← MUST have checked in
  slot.check_out_time == null && (     // ← AND not yet checked out
    <AppButton title="Check Out" ... />
)}
```

Mirror the same on the Check In button:

```tsx
{isTeacher && session.request_status === 'accepted' &&
  String(session.teacher_user_id) === String(user?.id) &&
  slot.check_in_time == null && (       // ← only show when NOT checked in
    <AppButton title="Check In" ... />
)}
```

Replace the magic `'0' || 0` numeric comparison with field names that match what the backend actually sends. Confirm the exact field names (`check_in_time`, `checked_in_at`, etc.) with the dev team.

## Acceptance criteria

- [ ] Teacher who hasn't checked in: sees "Check In" button, NOT "Check Out"
- [ ] After tapping Check In: button changes to "Check Out"
- [ ] After tapping Check Out: neither button shown (or replaced with "Confirmed" status)
- [ ] Manual test: mock data with `attendance_status: 0` but `check_in_time: null` → Check Out is NOT shown
- [ ] Regression test at `__tests__/regressions/bug-078-checkout-without-checkin.test.tsx`

## Related

- Bug #79 — no check-in time-window enforcement (same screen, related)
- Bug #74 — combine the fix (button visibility changes around the same code)
- Bug #54 — broader pattern of magic numeric status comparisons
