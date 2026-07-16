# Bug #5 — `TeachingSession` snake_case type vs camelCase runtime; locally-created sessions render blank

**Severity:** HIGH · **Effort:** ~3 hours (biggest fix in HIGH category)
**Status:** OPEN
**Affected files:**
- `types/index.ts:65-86` (type declares snake_case)
- `contexts/SessionContext.tsx:46-69, 145-160, 194-205, 234-267, 302-309` (writes camelCase)
- `components/SessionCard.tsx:34-60` (reads snake_case — breaks for locally-created sessions)

## Problem

Type declares snake_case API fields:

```ts
// types/index.ts:65-86
export interface TeachingSession {
  id: string;
  school_id: string;
  school_name: string;
  teacher_id: string;
  teacher_first_name?: string;
  teacher_last_name?: string;
  subject_name: string;
  request_date: string;
  schedules: ScheduleSlot[];
  state: string;
  locality: string;
  pcode: string;
  status: SessionStatus;
  selectedTeacherIds: string[];
  ...
}
```

But `SessionContext.tsx` reads/writes camelCase fields that don't exist on the type:

```ts
// contexts/SessionContext.tsx:46-69 (mapper)
return {
  teacher_name: session.teacherName || '-',   // session.teacherName ✗ not on type
  school_name: session.schoolName || '-',     // session.schoolName  ✗
  schoolId: session.schoolId,                 // session.schoolId    ✗
  subject_name: session.subject || '-',       // session.subject     ✗
  schedules: [{
    schedule_date: session.date,              // session.date        ✗
    start_time: session.startTime,            // session.startTime   ✗
    end_time: session.endTime,                // session.endTime     ✗
  }],
};

// contexts/SessionContext.tsx:145-160 (createSession)
const primarySchedule = sessionData.scheduleSlots?.[0] || {  // scheduleSlots ✗
  date: sessionData.date,                                    // ✗
  startTime: sessionData.startTime,                          // ✗
  endTime: sessionData.endTime,                              // ✗
};
```

The most telling evidence: the "Sarah Johnson" helper at `:117-119` checks `session.teacher_id` **AND** `session.teacherName` in the same expression — even the author wasn't sure which shape they were dealing with.

## Impact

Two pipelines produce `TeachingSession` objects:
- **Server-shaped** (via `getSessions()` from API): snake_case — matches type, works in `SessionCard`
- **Locally-created** (via `createSession()` from form): camelCase — does NOT match type, **renders blank** in `SessionCard`

User-visible: when a school creates a new session, the resulting card on the Sessions tab shows blank rows for date, subject, school name, teacher name, location. Looks broken.

## Fix

Pick **snake_case** as canonical (because the backend can't be reshaped from the client).

**Step 1 — Add an adapter at the form-input boundary** (in or near `createSession`):

```ts
// somewhere in lib/ or contexts/
function toApiSession(formInput: SessionFormInput): Omit<TeachingSession, 'id' | 'status' | 'createdAt'> {
  return {
    school_id: formInput.schoolId,
    school_name: formInput.schoolName,
    subject_name: formInput.subject,
    state: formInput.state,
    locality: formInput.locality,
    pcode: formInput.pcode,
    request_date: formInput.date,
    schedules: [{
      schedule_date: formInput.date,
      start_time: formInput.startTime,
      end_time: formInput.endTime,
    }],
    selectedTeacherIds: formInput.selectedTeacherIds,
    // ... etc
  };
}
```

**Step 2 — Rewrite `createSession` in `SessionContext.tsx`** to call the adapter, so the persisted session matches the type.

**Step 3 — Delete every camelCase access site in `SessionContext.tsx`.** Replace with the typed snake_case fields. The compiler will surface them if you also enable `noUncheckedIndexedAccess` (Step 4).

**Step 4 — Enable `noUncheckedIndexedAccess` in `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true
  }
}
```

This will surface the next instance of the same mistake as a compile error.

## Acceptance criteria

- [ ] Creating a session via the form → SessionCard renders all rows populated (date, subject, school name, location)
- [ ] No camelCase access on `session.*` exists in `contexts/`, `components/`, or `app/` — verified by grep
- [ ] `tsc --noEmit` passes with `noUncheckedIndexedAccess: true`
- [ ] Regression test at `__tests__/regressions/bug-005-teachingsession-shape-drift.test.tsx`

## Related

- Bug #4 — same drift class on `AppNotification` (smaller scope; fix that first as a template)
- Bug #8 — "Sarah Johnson" helper relies on both shapes — fixing #5 will surface the bug clearly
- Bug #29 — `SchoolProfile.schoolName` vs API `school_name` — same family
- Bug #66 — `SessionCard` renders "undefined undefined" — directly enabled by this bug
