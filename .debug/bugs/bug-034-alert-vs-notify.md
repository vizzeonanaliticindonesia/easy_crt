# Bug #34 — `alert('...')` instead of `notify(...)` in profile files

**Severity:** LOW · **Effort:** ~5 min · **Status:** OPEN
**Affected files:** `app/(school-tabs)/profile.tsx:252`, `app/(teacher-tabs)/profile.tsx:270`

## Problem

```ts
if (!schoolName.trim() || !contactEmail.trim()) {
  alert('School Name and Contact Email are required');
  return;
}
```

Note: contrary to a common misconception, React Native **does polyfill** `alert()` via `Alert.alert`. It works on iOS and Android — this is NOT a crash. But it bypasses the project's `notify()` helper, which means inconsistent UX (no title, no error icon, plain-OS alert).

## Fix

```ts
notify('Error', 'School Name and Contact Email are required');
```

## Related

Same screens use `notify(...)` elsewhere — this is just inconsistency.
