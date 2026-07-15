# Bug #9 — `AuthContext` calls `fetch()` directly at 3 sites, bypassing the `api` wrapper

**Severity:** MEDIUM · **Effort:** ~1 hour · **Status:** OPEN
**Affected file:** `contexts/AuthContext.tsx:58, 223, 277`

## Problem

```ts
// login (line 58), logout (223), reset_password (277)
const res = await fetch('https://teacher-relief.kreatifa.com/api/auth/login', { ... });
await fetch('https://teacher-relief.kreatifa.com/api/auth/logout', { ... });
const res = await fetch('https://teacher-relief.kreatifa.com/api/auth/reset_password', { ... });
```

Meanwhile `acceptTerms` at line 271 correctly uses `api.post('/auth/terms/accept')`.

## Impact

- BASE_URL duplicated 4 times (compounds Bug #7)
- Token source inconsistent (logout reads `storage.getUser()`; api wrapper reads in-memory `authToken`)
- Error shapes differ between fetch and wrapper
- MSW can't intercept in one place — Bug #10 (split-brain URL) is the direct consequence
- Dead `// fall back to local/mock checks below` comment at line 127 implies unfinished offline path

## Fix

Replace all three with `api.post(...)`:
```ts
const data = await api.post('/auth/login', { login: email, password });
await api.post('/auth/logout');
const data = await api.post('/auth/reset_password', params);
```

Delete dead comments. Have `logout` use the in-memory token, not `storage.getUser()`.

## Acceptance

- [ ] No `fetch(` calls remain in `contexts/AuthContext.tsx`
- [ ] All four auth flows use `api.post`
- [ ] Tests can MSW-intercept all four uniformly

## Related

Bug #7 (hardcoded URL — combine fix) · Bug #10 (direct consequence) · Bug #14 (similar pattern in invoicesRepository)
