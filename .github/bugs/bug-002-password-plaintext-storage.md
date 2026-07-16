# Bug #2 — Password persisted to AsyncStorage in plaintext

**Severity:** CRITICAL · **Effort:** ~30 min · **Status:** OPEN
**Affected files:**
- `types/index.ts:6`
- `lib/storage.ts:14-16`
- `contexts/AuthContext.tsx:160-161` (and similar in `register()`)

## Problem

The `User` interface declares `password` as a required field:

```ts
// types/index.ts:1-9
export interface User {
  id: string;
  email: string;
  password: string;       // ← required
  name?: string;
  teacherName: string;
  role: UserRole;
  ...
}
```

`saveUser` serializes the entire object:

```ts
// lib/storage.ts:14-16
export async function saveUser(user: User): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
}
```

`register()` explicitly writes the password into the object that will be persisted:

```ts
// contexts/AuthContext.tsx:160-161 (and same pattern in schools)
newUser = {
  ...
  email: userData.email || '',
  password: userData.password || '',   // ← persisted to AsyncStorage
  ...
};
await storage.saveUser(newUser);
```

## Impact

AsyncStorage on iOS lives in unencrypted SQLite under the app's Library directory. On Android it's a plaintext XML file in `/data/data/<pkg>/shared_prefs/`. Readable by:

- Any process on a rooted/jailbroken device
- Anyone with an unencrypted device backup (iTunes, `adb backup`, MDM export)
- Forensic tools with physical access to an unlocked device
- MDM agents installed by enterprise customers

Once login succeeds, the API returns a bearer token — that token is sufficient for all subsequent requests. The password serves **no client-side purpose** and is pure liability. Compliance exposure under Australian Privacy Principles (`.com.au` domain implies AU-resident user data, and education-sector regulations apply).

## Fix

**Step 1** — Remove `password` from the `User` interface:

```ts
// types/index.ts — DELETE this line
password: string;       // ← REMOVE
```

**Step 2** — Remove the explicit `password:` assignments in `register()`:

```ts
// contexts/AuthContext.tsx (in register function for both teacher and school)
newUser = {
  id,
  email: userData.email || '',
  // password: userData.password || '',   ← DELETE THIS LINE
  name: userData.name || teacherName,
  ...
};
```

**Step 3** — If there's any other site that reads `user.password`, those calls will surface as compile errors after Step 1; fix each.

**Step 4 (optional but recommended)** — Move the bearer token from AsyncStorage to `expo-secure-store` (Keychain on iOS, EncryptedSharedPreferences on Android). Token is the only remaining secret and deserves stronger storage. This is a separate work item — track as Bug #2b if desired.

## Acceptance criteria

- [ ] After login, `await AsyncStorage.getItem('@app_user')` does not contain the password string anywhere in the JSON
- [ ] After registration, same — no password persisted
- [ ] TypeScript compilation passes (no `user.password` access anywhere)
- [ ] A regression test exists at `__tests__/regressions/bug-002-password-plaintext-storage.test.tsx` asserting the password is never serialized

## Related

- Bug #3 — bearer token also logged to console (combine the fixes if you're in the file)
- Bug #16 — full user object logged on route change (#40 specifically) — same fix surface
