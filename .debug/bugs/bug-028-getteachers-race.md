# Bug #28 — `getTeachers(requestIds)` race condition after step transition

**Severity:** MEDIUM · **Effort:** ~20 min · **Status:** OPEN
**Affected file:** `app/create-session.tsx:254-258, 431`

## Problem

Two code paths fetch teachers concurrently:
- The `useEffect` watching `[requestIds, ...]` at line 254
- The inline `getTeachers(returnedIds)` inside `handleProceedToTeachers` at line 431

When `returnedIds` updates `requestIds`, the effect fires too. Two requests race. Slower response wins — may overwrite a more recent selection.

## Impact

User clicks "Next" → backend returns teacher list → user selects some → effect fires a SECOND fetch → selection silently resets when the second response arrives.

## Fix

Pick one trigger. Either:
- Drop the inline fetch in `handleProceedToTeachers` and rely on the effect
- Add a ref to guard: if `handleProceedToTeachers` just ran, skip the effect's fetch once

```ts
const handledByButtonRef = useRef(false);
useEffect(() => {
  if (handledByButtonRef.current) {
    handledByButtonRef.current = false;
    return;
  }
  // ... fetch
}, [requestIds, ...]);
```

## Related

Bug #21 (same file) · Bug #74 (similar race-condition family, different screen)
