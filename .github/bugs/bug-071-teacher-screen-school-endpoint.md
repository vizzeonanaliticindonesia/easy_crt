# Bug #71 — Teacher screen calls school-only dashboard endpoint

**Severity:** HIGH · **Effort:** ~15 min · **Status:** OPEN
**Pattern:** same as Bug #15 (cross-role API call)
**Affected file:** `app/session-detail.tsx:21, 44-50`

## Problem

```tsx
// app/session-detail.tsx:21
import { getDashboardData } from '@/lib/services/school';

// app/session-detail.tsx:44-50
const fetchData = async () => {
  if (user) {
    const fetchedSessions = await getDashboardData();   // ← calls /school/dashboard/get_data
    setSessions(fetchedSessions.data);
    setLoading(false);
  }
};
```

`getDashboardData` is a school-only endpoint. The session-detail screen is opened by **both** teachers and schools. So when a teacher opens session detail, they call a school endpoint.

## Impact

Possible outcomes (depend on backend):
- Backend returns 403 Forbidden → `fetchedSessions` is undefined or error response → `sessions.find(...)` returns nothing → screen shows "Session not found"
- Backend returns wrong-shape payload → `fetchedSessions.data` is undefined → crash on `.find`
- Backend leaks school data to teacher → privilege boundary violation

User-visible: teacher opens a session, screen says "Session not found" even when the session definitely exists. They tap retry, same thing. They give up.

## Fix

**Step 1 — Add a teacher equivalent** in `lib/services/teacher.ts` (likely already exists; check):

```ts
// lib/services/teacher.ts
export function getTeacherSessions() {
  return api.get('/teacher/sessions/get_data');   // confirm endpoint with backend
}
```

**Step 2 — Branch on role in `session-detail.tsx`:**

```tsx
// app/session-detail.tsx
import { getDashboardData } from '@/lib/services/school';
import { getTeacherSessions } from '@/lib/services/teacher';

const fetchData = async () => {
  if (!user) return;
  try {
    const res = user.role === 9
      ? await getTeacherSessions()
      : await getDashboardData();
    setSessions(res.data);
  } catch (err) {
    notify('Error', 'Failed to load sessions');
  } finally {
    setLoading(false);   // ← also addresses Bug #72
  }
};
```

## Acceptance criteria

- [ ] Logging in as a teacher and opening a session detail loads correctly (no "Session not found")
- [ ] School user flow unchanged
- [ ] Network inspector shows the role-appropriate endpoint
- [ ] Regression test at `__tests__/regressions/bug-071-teacher-screen-school-endpoint.test.tsx`

## Related

- Bug #15 — same cross-role pattern in `edit-document.tsx`
- Bug #1 — role-confusion family
- Bug #72 — fix together (this fix's try/catch addresses both)
- Bug #74 — same screen, no double-tap guards
- Bug #75 — same screen, no auth guard on Accept/Decline
