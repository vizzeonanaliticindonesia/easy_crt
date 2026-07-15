# Bug #3 — Bearer tokens logged to OS log on every API request

**Severity:** CRITICAL · **Effort:** ~5 min · **Status:** OPEN
**Affected files:**
- `lib/api.ts:33-34`
- `contexts/AuthContext.tsx:126`

## Problem

The API client logs the token on every call:

```ts
// lib/api.ts:33-34
console.log('AUTH TOKEN:', authToken);
console.log('STORAGE TOKEN:', await getStorageToken());
```

Login logs the token a second time, in a record that also carries role info — making it trivial to grep:

```ts
// contexts/AuthContext.tsx:126
console.log('LOGIN TOKEN:', data.token, 'normalizedRole=', (userWithToken as any).role, 'role_id=', (userWithToken as any).role_id);
```

## Impact

`console.log` in React Native is **not a no-op in production**. Hermes still executes the call. The string is emitted to:

- **Android `logcat`** — readable by any other app with `READ_LOGS` permission, by MDM agents, by OEM crash collectors
- **iOS unified log** (`Console.app` / `idevicesyslog`) — captured in sysdiagnose archives, exported by MDMs, shared in Apple support tickets
- **Crash reporter breadcrumbs** — Sentry / Bugsnag / Crashlytics SDKs hook `console.log` and ship the buffer with every crash report to third-party SaaS

A bearer token in the log is **session-takeover material**. Every request the user can make for the lifetime of that token can be replayed by anyone with log access. Combined with Bug #2 (password also persisted), an attacker doesn't even need the password — the token is enough.

The `LOGIN TOKEN` line at `AuthContext.tsx:126` is the most damaging because it fires once per login (easy to grep) and co-locates the token with the role — a one-stop credential record.

## Fix

**Step 1 — delete the three logging lines:**

```ts
// lib/api.ts:33-34 — DELETE
console.log('AUTH TOKEN:', authToken);
console.log('STORAGE TOKEN:', await getStorageToken());

// contexts/AuthContext.tsx:126 — DELETE (or rewrite without the token)
console.log('LOGIN TOKEN:', data.token, ...);
```

**Step 2 — for any future dev logging you want to keep**, introduce a `__DEV__`-gated helper:

```ts
// lib/logger.ts
export function devLog(...args: unknown[]): void {
  if (__DEV__) console.log(...args);
}
```

Use it for genuinely-useful dev logs (route changes, state transitions, etc.) — but **never include the token** even in dev, because dev logs end up in screenshares, Slack threads, and Loom recordings during pair programming.

## Acceptance criteria

- [ ] `grep -n "console\\.log.*[Tt]oken\\|console\\.log.*data\\.token" lib/ contexts/ app/` returns no matches
- [ ] Manual test: open the app with Metro connected, perform login + any API call; observe the terminal output. No "AUTH TOKEN:" or "LOGIN TOKEN:" or "STORAGE TOKEN:" appears.
- [ ] A regression test exists at `__tests__/regressions/bug-003-token-console-log.test.tsx`:
  ```ts
  it('never logs the bearer token', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    setAuthToken('SECRET_TOKEN_VALUE_xyz');
    await api.get('/anything').catch(() => {});
    const allLogs = spy.mock.calls.flat().join(' ');
    expect(allLogs).not.toContain('SECRET_TOKEN_VALUE_xyz');
  });
  ```

## Related

- Bug #16 — broader pattern of `console.log` leaks (uploads, suburb data, full booking objects)
- Bug #39 — Stripe `paymentMethod.id` logged
- Bug #40 — full `user` object logged on every route change
- Bug #61, #80 — error responses logged elsewhere
- Bug #2 — password also persisted (combine fixes)
