# Bug #7 — `BASE_URL` hardcoded; no dev/staging/prod separation

**Severity:** HIGH · **Effort:** ~1 hour · **Status:** OPEN
**Affected files:**
- `lib/api.ts:1-4`
- `contexts/AuthContext.tsx:58, 223, 277` (three duplicated host strings)

## Problem

```ts
// lib/api.ts:1-4
// const BASE_URL = 'http://teacher_relief.test:80/api';
// const BASE_URL = 'http://teacher_relief.test/api';
const BASE_URL = 'https://teacher-relief.vizzeon.com/api';   // ← OR kreatifa, see Bug #10
```

Three inline hardcoded URLs in `AuthContext` duplicate the same host:

```ts
await fetch('https://teacher-relief.kreatifa.com/api/auth/login', ...)
await fetch('https://teacher-relief.kreatifa.com/api/auth/logout', ...)
await fetch('https://teacher-relief.kreatifa.com/api/auth/reset_password', ...)
```

## Impact

No way to point a build at a non-production server without editing source. Consequences:
- **Developers test against production by default.** Every `expo start` from a developer laptop hits live data. Accidental "Create Session" calls during dev create real records. Failed password attempts count against production lockout policy.
- **QA cannot run E2E tests.** No staging environment is configurable.
- **EAS Build profiles can't differentiate environments.** Dev / preview / production builds all point at the same backend.
- **Host migration requires editing 4 sites** — the auth ones are easy to miss in code review. This is exactly what produced Bug #10 (the migration only updated 3 of 4).

## Fix

**Step 1 — Move the URL to `app.json` `extra`:**

```json
// app.json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "https://teacher-relief.kreatifa.com/api"
    }
  }
}
```

Or use `EXPO_PUBLIC_API_BASE_URL` env vars per EAS profile (see `eas.json` example in Bug #10).

**Step 2 — Read once at module load:**

```ts
// lib/api.ts
import Constants from 'expo-constants';
const BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl
  ?? process.env.EXPO_PUBLIC_API_BASE_URL
  ?? 'https://teacher-relief.kreatifa.com/api'; // safe fallback
```

**Step 3 — Refactor the three `AuthContext` `fetch` calls through the `api` wrapper** (this is also Bug #9's fix; do them together):

```ts
const data = await api.post('/auth/login', { login: email, password });
await api.post('/auth/logout');
const data = await api.post('/auth/reset_password', params);
```

**Step 4 — Delete the dead commented URLs** at `lib/api.ts:2-3`.

**Step 5 — Add a CI lint** to prevent regression:

```ts
// scripts/check-no-hardcoded-urls.ts
import { readFileSync } from 'fs';
import { globSync } from 'glob';
const offenders: string[] = [];
for (const file of globSync(['app/**/*.{ts,tsx}', 'contexts/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'])) {
  const content = readFileSync(file, 'utf8');
  if (/https?:\/\/[a-z0-9.-]+\/api/i.test(content) && !file.endsWith('lib/api.ts')) {
    offenders.push(file);
  }
}
if (offenders.length) {
  console.error('Hardcoded API URLs found in:\n' + offenders.join('\n'));
  process.exit(1);
}
```

Wire into `npm test` or the CI workflow.

## Acceptance criteria

- [ ] `lib/api.ts` reads URL from `expo-constants` / env var
- [ ] No hardcoded `teacher-relief.*` URL exists outside `lib/api.ts` (CI script enforces)
- [ ] EAS preview build can be configured to point at staging without source changes
- [ ] All three `AuthContext` fetches now go through `api.post(...)`
- [ ] Bug #10 (split-brain URL) is automatically resolved by this fix

## Related

- **Bug #10** — direct consequence of this (incomplete domain migration). Fix together.
- **Bug #9** — `AuthContext` bypassing the api wrapper. Fix together.
- **Bug #58** — Stripe `pk_test` is also hardcoded — same pattern. Move to env var in the same PR.
