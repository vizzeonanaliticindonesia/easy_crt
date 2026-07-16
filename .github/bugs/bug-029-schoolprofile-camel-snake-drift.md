# Bug #29 — `SchoolProfile.schoolName` (camelCase) vs API `school_name` (snake_case) — autofill silently fails

**Severity:** MEDIUM · **Effort:** ~15 min · **Status:** OPEN
**Affected file:** `app/create-session.tsx:294`

## Problem

```tsx
setSchoolName(school?.schoolName || school?.name || '');
```

`SchoolProfile` declares `schoolName` (camelCase), but the API/CodeIgniter convention everywhere else is snake_case (`school_name`). The fallback chain works today only because some other code path happens to set `schoolName` from the API response. If backend ever returns `school_name` instead (likely), the field becomes blank.

## Impact

School name auto-fill in create-session silently fails when the backend response shape shifts. The `!schoolName.trim()` editable guard then leaves the field permanently editable — opposite of intent.

## Fix

Pick one casing in `AuthContext` mapping (recommend snake_case to match backend) and stick to it. Update `SchoolProfile` type to match. Then:

```tsx
setSchoolName(school?.school_name || school?.name || '');
```

## Related

Bug #5 (same drift family on `TeachingSession`) · Bug #4, #13 (same class)
