# Bug #70 — `unableAttendance` / `confirmAttendance` imported but don't exist — attendance buttons crash

**Severity:** CRITICAL · **Type:** REGRESSION (introduced by the recent pull)
**Effort:** ~30 min · **Status:** OPEN · **Priority:** P0 hotfix
**Affected file:** `app/session-detail.tsx:23-30, 206, 217`

## Problem

The file imports two functions that **don't exist anywhere in the repository**:

```tsx
// app/session-detail.tsx:23-30
import {
    acceptSession,
    declineSession,
    checkInSlot,
    checkOutSlot,
    unableAttendance,        // ← does NOT exist in lib/services/teacher.ts
    confirmAttendance,       // ← does NOT exist in lib/services/teacher.ts
} from '@/lib/services/teacher';
```

Verified by grep:
```
grep -rn "unableAttendance\|confirmAttendance" lib/services/
```
returns nothing. Only `confirmSession` (different function, different file) and `getSessionConfirmation` / `getSessionConfirmationDetails` exist.

At runtime, both imports resolve to `undefined`. When the user taps either button:

```tsx
// app/session-detail.tsx:206 (Confirm Attendance)
<AppButton title="Confirm Attendance" onPress={async () => {
    const res = await confirmAttendance(slot.id);   // ← undefined(slot.id) → TypeError
    // ...
}} />

// app/session-detail.tsx:217 (Unable to Attend)
<AppButton title="Unable to Attend" onPress={async () => {
    const res = await unableAttendance(slot.id);    // ← undefined(slot.id) → TypeError
    // ...
}} />
```

→ JS thread throws `TypeError: undefined is not a function`. App crashes or stops responding (depending on error boundary).

## Impact

The new attendance-confirmation UX (introduced in the +76-line change to this file) is **completely non-functional**. Steps to reproduce:

1. Log in as a teacher
2. Open Session Detail for any session in a state where attendance can be confirmed
3. Tap "Confirm Attendance" or "Unable to Attend"

→ TypeError. The session lifecycle is gated on this step in some paths, so check-in cannot proceed for affected sessions.

This is one of two regressions introduced by the recent pull. The other is Bug #38.

## Fix — pick one option

### Option A (preferred) — Add the functions to the teacher service

Confirm the backend endpoints with the backend team. Likely candidates:

```ts
// lib/services/teacher.ts — ADD
export async function confirmAttendance(scheduleId: number) {
  return api.post('/teacher/session/confirm_attendance', { schedule_id: scheduleId });
}

export async function unableAttendance(scheduleId: number) {
  return api.post('/teacher/session/unable_attendance', { schedule_id: scheduleId });
}
```

Use the same endpoint pattern as the existing `checkInSlot` / `checkOutSlot` for consistency.

### Option B (remove the broken UX until backend is ready)

If the backend endpoints don't exist yet:

```tsx
// app/session-detail.tsx:23-30 — REMOVE the two non-existent imports
import {
    acceptSession,
    declineSession,
    checkInSlot,
    checkOutSlot,
    // unableAttendance,        ← REMOVE
    // confirmAttendance,       ← REMOVE
} from '@/lib/services/teacher';
```

And remove the two buttons at lines 201-225 (the "Confirm Attendance" and "Unable to Attend" `AppButton` blocks). Leave the rest of the screen intact.

This restores a working app at the cost of feature parity. Pair with a ticket to re-add the buttons once the backend is ready.

## Acceptance criteria

- [ ] Tapping "Confirm Attendance" → no TypeError; API call fires; success toast or appropriate state change
- [ ] Tapping "Unable to Attend" → same, with appropriate decline/skip flow
- [ ] TypeScript compilation succeeds (no `undefined` imports)
- [ ] If Option B was taken, the buttons are removed entirely (no half-broken UI)
- [ ] A regression test exists at `__tests__/regressions/bug-070-undefined-attendance-imports.test.tsx` that mocks both services and asserts they are invoked correctly

## Related

- Bug #38 — the other regression introduced by the recent pull
- Bug #71 — same screen also calls the wrong dashboard endpoint for teachers
- Bug #72 — same screen has no error handling, so this TypeError leaves the spinner stuck
- Bug #74 — same screen has no double-tap guard, so a frustrated user tapping multiple times generates multiple crashes
