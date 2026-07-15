# Bug #48 — Missing `return` after `router.replace` chain in `_layout.tsx`

**Severity:** MEDIUM · **Effort:** ~5 min · **Status:** OPEN
**Affected file:** `app/_layout.tsx` (multiple redirect branches)

## Problem

```ts
if (isTeacherRole && inSchoolTabs) {
    router.replace('/(teacher-tabs)');
} else if (isSchoolRole && inTeacherTabs) {
    router.replace('/(school-tabs)');
} else if (isPublicRoute) {
    if (isTeacherRole) router.replace('/(teacher-tabs)');
    ...
}
// Effect continues — verification-status redirect can fire AFTER tab redirect
```

No `return` after `router.replace(...)`. Subsequent branches in the same effect run, potentially issuing a second `router.replace` → flicker or competing navigation.

## Impact

Race between role redirect and verification-status redirect (line 76-84). User may briefly see one screen flash before the second redirect wins.

## Fix

Add `return` after every `router.replace`:
```ts
if (isTeacherRole && inSchoolTabs) {
    router.replace('/(teacher-tabs)');
    return;
}
// etc.
```

## Related

Bug #41 (same effect — combine fixes) · Bug #42 (same effect)
