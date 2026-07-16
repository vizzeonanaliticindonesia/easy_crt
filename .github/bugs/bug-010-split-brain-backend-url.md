# Bug #10 — Split-brain backend URL (`vizzeon.com` vs `kreatifa.com`)

**Severity:** CRITICAL · **Effort:** ~1 hour · **Status:** OPEN
**Affected files:**
- `lib/api.ts:4` — still points to `vizzeon.com`
- `contexts/AuthContext.tsx:58, 226, 280` — migrated to `kreatifa.com`

## Problem

The recent pull migrated the auth domain from `vizzeon.com` to `kreatifa.com`, but only inside `AuthContext`. The api wrapper still points at the old host:

```ts
// lib/api.ts:1-4
// const BASE_URL = 'http://teacher_relief.test:80/api';
// const BASE_URL = 'http://teacher_relief.test/api';
const BASE_URL = 'https://teacher-relief.vizzeon.com/api';   // ← OLD DOMAIN
```

```ts
// contexts/AuthContext.tsx:58, 226, 280
await fetch('https://teacher-relief.kreatifa.com/api/auth/login', ...)
await fetch('https://teacher-relief.kreatifa.com/api/auth/logout', ...)
await fetch('https://teacher-relief.kreatifa.com/api/auth/reset_password', ...)
```

## Impact

The app talks to **two different backends in the same session**:
- Login / logout / reset → `kreatifa.com`
- Every other API call (profile, sessions, notifications, documents, invoices) → `vizzeon.com`

Consequences:
- If `vizzeon.com` is decommissioned, the app breaks immediately after login. User logs in successfully, then every other screen errors.
- If both still exist but `vizzeon` is stale, users see inconsistent state.
- Devs and QA cannot reason about which backend a given operation hits without reading the source.

This is the direct, foreseeable consequence of Bug #7 (hardcoded URLs). The duplicated pattern hid the incomplete migration.

## Fix

**Step 1 — Confirm with the dev team which domain is current.** This is critical: choose `kreatifa.com` or `vizzeon.com` (or a new one).

**Step 2 — Move the URL out of source code.** Add to `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "https://teacher-relief.kreatifa.com/api"
    }
  }
}
```

Or use EAS profiles + env vars for dev/staging/prod separation:

```json
// eas.json
{
  "build": {
    "development": { "env": { "EXPO_PUBLIC_API_BASE_URL": "https://teacher-relief-dev.kreatifa.com/api" } },
    "preview":     { "env": { "EXPO_PUBLIC_API_BASE_URL": "https://teacher-relief-staging.kreatifa.com/api" } },
    "production":  { "env": { "EXPO_PUBLIC_API_BASE_URL": "https://teacher-relief.kreatifa.com/api" } }
  }
}
```

**Step 3 — Read it once at module load:**

```ts
// lib/api.ts
import Constants from 'expo-constants';
const BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl
  ?? process.env.EXPO_PUBLIC_API_BASE_URL
  ?? 'https://teacher-relief.kreatifa.com/api'; // safe fallback
```

**Step 4 — Refactor the three `fetch(...)` calls in `AuthContext` to go through the `api` wrapper** (this is Bug #9's fix, do it in the same PR):

```ts
// contexts/AuthContext.tsx — replace direct fetch with:
const data = await api.post('/auth/login', { login: email, password });
// ... and similar for /auth/logout and /auth/reset_password
```

After this, the URL is resolved in **exactly one place** (`lib/api.ts`).

**Step 5 — Delete the two commented-out URLs at the top of `lib/api.ts`** (`teacher_relief.test`). They're dev notes that don't belong in production source.

## Acceptance criteria

- [ ] `grep -rn "vizzeon\\|kreatifa" app/ lib/ contexts/ components/` returns matches only in `lib/api.ts` (and only as a fallback default)
- [ ] All four sites (api.ts + 3 auth fetches) use the same URL — verified by grep
- [ ] Login works against the chosen environment
- [ ] Subsequent API calls (e.g. fetching the dashboard) hit the same domain
- [ ] EAS preview build can be configured to point at staging without source changes
- [ ] A CI script `scripts/check-no-hardcoded-urls.ts` exists and fails the build if any `/api` URL is found outside `lib/api.ts`

## Related

- Bug #7 — root cause (hardcoded URLs)
- Bug #9 — `AuthContext` bypassing the api wrapper enabled the split-brain
- Bug #58 — Stripe `pk_test` similarly hardcoded
