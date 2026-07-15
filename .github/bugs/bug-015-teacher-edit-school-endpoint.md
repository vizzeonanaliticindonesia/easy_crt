# Bug #15 — Teacher document edits hit the SCHOOL endpoint

**Severity:** CRITICAL · **Effort:** ~30 min · **Status:** OPEN
**Affected file:** `app/edit-document.tsx:192` (and the redirect logic at `:195-200`)

## Problem

The screen loads either teacher or school documents based on `user?.role`. But `handleSubmit` **always** calls `editSchoolDocument`:

```tsx
// app/edit-document.tsx:192
await editSchoolDocument(documentId, formData);

notify('Success', 'Document updated successfully.', () => {
    if (user?.role == 10) {       // ← role check only affects redirect, not the API call
        router.replace({
            pathname: '/(school-tabs)/documents' as any,
            params: { refresh: Date.now().toString() },
        });
    } else {
        // teacher redirect
    }
});
```

The role check at line 195 only affects **where to redirect after the edit**, not which endpoint is called.

The file imports only the school service:

```tsx
// app/edit-document.tsx:20
import { editSchoolDocument, getSchoolDocuments } from '@/lib/services/school';
```

## Impact

A teacher (role 9) editing their own document hits a **school endpoint**. Possible outcomes:

1. Backend rejects the request (best case) — teacher sees a generic error toast
2. Backend processes it with school-role permissions — could edit a school's document with the same ID (cross-tenant data corruption)
3. Backend silently no-ops — teacher thinks their edit saved, but the actual document is unchanged

The behavior depends entirely on backend authorization, which we cannot guarantee. The client-side bug is real regardless.

## Fix

**Step 1 — Add a teacher equivalent in `lib/services/teacher.ts`** (if it doesn't exist):

```ts
// lib/services/teacher.ts
export async function editTeacherDocument(documentId: string, formData: FormData) {
  return api.put(`/teacher/documents/${documentId}`, formData);
}
```

**Step 2 — Branch on role in `handleSubmit`:**

```tsx
// app/edit-document.tsx
import { editTeacherDocument } from '@/lib/services/teacher';   // ADD
import { editSchoolDocument } from '@/lib/services/school';

async function handleSubmit() {
  // ... existing validation and formData prep ...

  // Branch on role:
  if (user?.role === 9) {
    await editTeacherDocument(documentId, formData);
  } else if (user?.role === 10) {
    await editSchoolDocument(documentId, formData);
  } else {
    notify('Error', 'Unknown user role. Please log in again.');
    return;
  }

  notify('Success', 'Document updated successfully.', () => { /* redirect */ });
}
```

**Step 3 — Verify the teacher endpoint exists on the backend.** If it doesn't, the dev team needs to add it before this fix can ship.

## Acceptance criteria

- [ ] Logging in as a teacher and editing a teacher document hits the teacher endpoint (verified via network inspector or backend logs)
- [ ] Logging in as a school and editing a school document hits the school endpoint (unchanged behavior)
- [ ] Unknown role → user sees an error and is not redirected
- [ ] A regression test exists at `__tests__/regressions/bug-015-teacher-edit-school-endpoint.test.tsx` that mocks both services and asserts the correct one is called per role

## Related

- Bug #1 — same role-confusion family
- Bug #18 — `verification_*` fields read in profile screens, same role-branching issue
- Bug #71 — teacher session-detail screen calls school endpoint (same pattern, different surface)
