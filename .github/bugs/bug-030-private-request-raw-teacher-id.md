# Bug #30 — Private-request teacher_id accepts raw user-typed string when `teacherInfo.id` is missing

**Severity:** MEDIUM · **Effort:** ~10 min · **Status:** OPEN
**Affected file:** `app/create-session.tsx:472-474`

## Problem

```tsx
const teacherIds = isPrivateRequest
    ? [String(teacherInfo?.id || teacher_id.trim())]
    : selectedTeacherIds;
```

Falls back to the raw string the user typed when `teacherInfo.id` is null. Combined with `teacherInfo` possibly being `{}` when the API returns 200 with empty body (the `Object.keys(teacher).length > 0` check returns `null`), this submits whatever the user typed as a teacher ID.

## Impact

User types a non-existent teacher ID (typo, paste error, autocomplete) → form submits successfully → backend creates a request with no real teacher to notify.

## Fix

```tsx
if (isPrivateRequest && !teacherInfo?.id) {
  notify('Error', 'Please select a valid teacher.');
  return;
}
const teacherIds = isPrivateRequest
  ? [String(teacherInfo.id)]
  : selectedTeacherIds;
```

## Related

Same file: Bug #21, #27, #28
