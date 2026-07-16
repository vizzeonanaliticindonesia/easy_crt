# Bug #59 — Dead comments and informal log labels in `_layout.tsx`

**Severity:** LOW · **Effort:** ~5 min · **Status:** OPEN
**Affected file:** `app/_layout.tsx:54-63, 90-103`

## Problem

Blocks of commented-out code (`// console.log(...)`, `// const inTeacherProfile = ...`) and informal log labels mixing Bahasa Indonesia ("→ school masuk school-tabs", "ROLE GA JELAS"). The `[RootNavigation]` prefix is inconsistent across log statements.

## Impact

Polluted logs, harder to grep, less professional. The informal labels suggest the code was edited under time pressure.

## Fix

- Delete all commented-out code blocks
- Translate or remove Bahasa labels
- Standardize on `[RootNavigation]` prefix for all logs in this file
- Wrap dev-only logs in `__DEV__`

```ts
if (__DEV__) console.log('[RootNavigation] role:', role);   // standardized
```

## Related

Bug #3, #40 (combine with other console-log cleanup in same file)
