# Bug #17 — Suburb selection broken in teacher profile (value/label type mismatch)

**Severity:** CRITICAL · **Effort:** ~1 hour · **Status:** OPEN
**Affected file:** `app/(teacher-tabs)/profile.tsx:228-230, 246-250, 557`
**Reference (correct pattern):** `app/(school-tabs)/profile.tsx:197` — does this right

## Problem

The teacher profile builds suburb options keyed by raw `item.id` (not stringified), then compares against a stringified `location_suburb_id` from the backend:

```ts
// app/(teacher-tabs)/profile.tsx:228-230
const selectedSuburb = useMemo(() => {
  return suburbsForState.find((item) => item.value === location_suburb_id) || null;
}, ...);
```

```ts
// app/(teacher-tabs)/profile.tsx:246-250
function handleSuburbChange(label: string) {
  const selected = suburbsForState.find((item) => item.label === label);
  setLocationSuburbId(selected?.value || '');
}
```

`location_suburb_id` from backend is a string (`"42"`), but `item.value` is the unstringified raw `item.id` (number `42`). The `===` comparison fails on the type mismatch — `selectedSuburb` is always `null`.

Additionally, `onChange` receives a **label** string, then does another `find` against the label — but in the school version of this screen, `AppSearchSelectField` invokes the callback with the **value**, not the label. Inconsistent contract.

## Compare to the school version (which works)

```ts
// app/(school-tabs)/profile.tsx:197 — the correct pattern
suburbsForState.map((item) => ({ label: ..., value: String(item.id) }))
```

The school version stringifies on the way in. The teacher version doesn't.

## Impact

User-facing:
- Teacher's saved suburb shows blank in the dropdown on every profile load
- Postcode field never auto-fills (it depends on `selectedSuburb` being non-null)
- When the teacher saves, the wrong `location_suburb_id` is submitted (sometimes the right one due to label-based lookup, sometimes blank)

Operational:
- Teachers cannot see or update their suburb without manually re-selecting every time
- Profile save can silently submit empty `location_suburb_id`, leaving backend in inconsistent state

## Fix

Mirror the school screen's pattern exactly. Three changes in `app/(teacher-tabs)/profile.tsx`:

**Change 1 — Stringify on the way in (around line 228 where `suburbsForState` is built):**
```ts
// Find where suburbsForState is constructed; ensure value is stringified
const suburbsForState = useMemo(
  () => suburbs.map((item) => ({ label: `${item.suburb} (${item.postcode})`, value: String(item.id) })),
  [suburbs]
);
```

**Change 2 — Comparison stays as-is** (will now work because both sides are strings).

**Change 3 — Make `handleSuburbChange` receive value, not label:**
```ts
function handleSuburbChange(value: string) {
  setLocationSuburbId(value);
  // postcode derives from the find() in useMemo
}
```

**Change 4 — Update the `AppSearchSelectField` callsite** (around line 557) to pass `suburbsForState` directly (not `suburbOptions` if that's a separate derived array). Match the school version.

## Acceptance criteria

- [ ] Open teacher profile — current saved suburb shows in the dropdown (not blank)
- [ ] Postcode field auto-populates based on the current suburb
- [ ] Change suburb → new postcode appears immediately
- [ ] Save → backend receives the correct `location_suburb_id` (not empty)
- [ ] The teacher and school suburb-select implementations now use the same pattern (the dev can extract a shared hook later)
- [ ] A regression test exists at `__tests__/regressions/bug-017-suburb-selection-broken.test.tsx`

## Related

- The school profile screen (`app/(school-tabs)/profile.tsx:197`) is the reference implementation. Don't refactor that one without also touching the teacher one — they should match.
- Bug #62 — same suburb-options keying issue in `register-school.tsx` (label collision risk), worth fixing in the same PR
