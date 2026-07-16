# Bug #20 — `updateUser` imported but never called after profile save — context stays stale

**Severity:** HIGH · **Effort:** ~15 min · **Status:** OPEN
**Affected files:**
- `app/(school-tabs)/profile.tsx:56, 278-291`
- `app/(teacher-tabs)/profile.tsx:58, 296-312`

## Problem

Both profile screens destructure `updateUser` from `useAuth()` but never call it after a successful profile update:

```tsx
// app/(school-tabs)/profile.tsx:56
const { user, logout, updateUser } = useAuth();    // ← imported

// ...

// app/(school-tabs)/profile.tsx:278-291 (save flow)
const updates = await updateSchoolProfile({ ... });   // ← backend updated
notify('Success', 'Profile saved successfully');
setVerifStatus(0);
// ← but updateUser is never called, so AuthContext still has old data
```

Same pattern in the teacher version (lines 58, 296-312).

## Impact

After save:
- The profile screen itself appears to update (because it has its own local form state)
- But **every other screen** that reads `user` from `useAuth()` continues showing the **old** name / email / contact / verification status
- Sidebar, header, dashboard, notification name display — all stale until the user logs out and back in (or until next cold start triggers a fresh `loadUser`)

User-visible: "I updated my school name to 'Greenfield High' and saved — why does the header still say 'Test School'?"

## Fix

Call `updateUser(...)` (or refetch profile) after a successful save:

```tsx
// app/(school-tabs)/profile.tsx — in the save handler, after notify('Success', ...)
const updates = await updateSchoolProfile({ ... });
notify('Success', 'Profile saved successfully');
setVerifStatus(0);

// NEW: propagate the changes to AuthContext so other screens reflect them
await updateUser({
  name: schoolName,
  email: contactEmail,
  // ... include all fields you allow the user to edit
});

// Alternative (heavier but always correct): call fetchProfile() again
// await fetchProfile();
```

Same for the teacher version. Confirm `updateUser`'s signature handles partial updates.

If `updateUser` doesn't already exist with the right signature, add a partial-update method to `AuthContext`:

```ts
// contexts/AuthContext.tsx
async function updateUser(updates: Partial<User>): Promise<void> {
  setUser((prev) => prev ? { ...prev, ...updates } : prev);
  await storage.saveUser({ ...user, ...updates } as User);
}
```

## Acceptance criteria

- [ ] After saving school name in school profile → header/dashboard show new name immediately
- [ ] After saving phone in teacher profile → header/dashboard show new phone immediately
- [ ] AsyncStorage persisted user matches the new values
- [ ] No need to log out and back in to see updates reflected
- [ ] Regression test at `__tests__/regressions/bug-020-updateuser-never-called.test.tsx`

## Related

- Bug #43 — `verification_status` fail-open default is also relevant here (after save, the status should refresh)
- Bug #18, #55 — verification fields type drift makes the partial-update typing trickier
