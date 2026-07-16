# Bug #75 — No authorization check on Accept / Decline (only Check-In/Out gate by teacher_user_id)

**Severity:** HIGH · **Effort:** ~10 min · **Status:** OPEN
**Affected file:** `app/session-detail.tsx:301` (Accept/Decline visibility) vs `:196-197, :232-233, :249-251` (Check-In/Out visibility)

## Problem

Check-In and Check-Out buttons correctly verify that the current user is the assigned teacher:

```tsx
// app/session-detail.tsx:232-233 (Check In)
{isTeacher && session.request_status === 'accepted' &&
  String(session.teacher_user_id) === String(user?.id) &&   // ← AUTH GUARD
  (slot.status === null) && ...
}
```

But Accept and Decline buttons only check role + status, **not assignment**:

```tsx
// app/session-detail.tsx:301 (Accept / Decline row)
{isTeacher && session.request_status == 'pending' &&
  String(session.notification_status) === '1' && (
    // ... no check that THIS teacher is the one being asked
)}
```

If the dashboard payload contains a session notified to **another** teacher (rare but possible — shared cache, deep link, future bug), any role-9 user can call `acceptSession(session.rn_id)`. Authorization is delegated entirely to the backend.

## Impact

Even today, this is a defense-in-depth gap — the backend should reject the unauthorized call, but the client shouldn't even present the button. Risks:
- A teacher could accidentally accept another teacher's session if they navigate to it via deep-link or stale data
- Future bug in the dashboard endpoint could leak sessions across teachers, and the client would happily render Accept buttons on each
- QA cannot easily test "what does the client do with unauthorized data" because the client doesn't enforce the check

## Fix

Apply the same authorization guard as Check-In/Out:

```tsx
// app/session-detail.tsx:301 — replace
{isTeacher && session.request_status === 'pending' &&
  String(session.notification_status) === '1' &&
  String(session.notified_teacher_id) === String(user?.id) &&   // ← ADD
  ( ... Accept/Decline buttons ... )}
```

Note: confirm the actual field name for "the teacher this request was notified to" with the dev team. Candidates: `notified_teacher_id`, `target_teacher_id`, `recipient_teacher_id`. Use whichever the backend actually sends.

Also use `===` instead of `==` (fix Bug #81 in the same change).

## Acceptance criteria

- [ ] Accept/Decline buttons only appear when the current user is the notified teacher
- [ ] Manually injecting a session belonging to another teacher (via mock data) → buttons don't render
- [ ] No regression on the existing flow (real notified teacher sees the buttons)
- [ ] Regression test at `__tests__/regressions/bug-075-no-authz-accept-decline.test.tsx`

## Related

- Bug #74 — combine the fix (both add guards to the same buttons)
- Bug #81 — `==` vs `===` cleanup in same file
- Bug #1 — same role-handling family
