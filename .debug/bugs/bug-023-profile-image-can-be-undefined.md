# Bug #23 — `setProfileImage(...)` can resolve to `undefined`, violating state type and clearing photo

**Severity:** HIGH · **Effort:** ~5 min · **Status:** OPEN
**Affected files:**
- `app/(school-tabs)/profile.tsx:121`
- `app/(teacher-tabs)/profile.tsx:138`

## Problem

```ts
// both files, in fetchProfile()
setProfileImage(res.photo != null ? res.photo : school?.profileImage);
```

`profileImage` state is typed `useState<string>('')`. But when both:
- `res.photo` is `null` (API returned null — user has no uploaded photo), AND
- `school?.profileImage` is `undefined` (context user has no profile image either, or `school` is null because fetch is mid-flight)

…the value becomes `undefined`, which violates the `string` state contract and clears any previously-displayed image.

## Impact

User-visible races:
- User opens profile → fetch starts, `school` may be temporarily null
- Image flash: previously-shown image disappears for a moment
- If API returns null photo, the avatar reverts to whatever default the component renders — even if the user just uploaded one moments ago

Also a type-safety violation that downstream code may not be prepared for.

## Fix

Defensive null coalescing with explicit empty-string fallback:

```ts
// both profile files
setProfileImage(res.photo ?? school?.profileImage ?? '');
```

Or, if blank string isn't the right default (e.g. a placeholder URL is preferred):

```ts
const DEFAULT_AVATAR = '';   // or a placeholder URL
setProfileImage(res.photo ?? school?.profileImage ?? DEFAULT_AVATAR);
```

Make the same change in `app/(teacher-tabs)/profile.tsx:138` (substitute `teacher?.profileImage`).

## Acceptance criteria

- [ ] After mounting the profile screen, the displayed photo never momentarily disappears
- [ ] If API returns `photo: null`, the previously-set local image stays (or shows the default)
- [ ] State type matches runtime value (no `undefined` reaching `setProfileImage`)
- [ ] Regression test at `__tests__/regressions/bug-023-profile-image-can-be-undefined.test.tsx`

## Related

- Bug #32 — same `useEffect` has no AbortController, contributing to the race
- Bug #18 — `verification_*` fields read in same screen — context-vs-API consistency theme
