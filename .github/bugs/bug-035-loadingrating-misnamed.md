# Bug #35 — `loadingRating` misnamed — stores the rating value, not a loading flag

**Severity:** LOW · **Effort:** ~5 min · **Status:** OPEN
**Affected file:** `app/(teacher-tabs)/profile.tsx:84, 139, 431, 443`

## Problem

```ts
const [loadingRating, setLoadingRating] = useState<number | null>(null);
// ...
setLoadingRating(Number(res.rating) || 0);
// ...
const rating = Number(loadingRating ?? 0);
```

Variable named like a loading boolean but stores the numeric rating value. Future devs will read it as "loading state" and refactor wrongly. Also, `TeacherProfile.rating` is already declared on the type — duplicate state.

## Fix

Rename and read from the typed source:
```ts
const rating = teacher?.rating ?? 0;
// Remove `loadingRating` and `setLoadingRating` entirely
```

If a separate local override is needed (e.g. after profile save before refetch), name it accurately:
```ts
const [localRating, setLocalRating] = useState<number | null>(null);
const rating = localRating ?? teacher?.rating ?? 0;
```
