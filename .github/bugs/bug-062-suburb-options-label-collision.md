# Bug #62 — Suburb options keyed on label instead of id; name+postcode collision sends wrong `location_id`

**Severity:** MEDIUM · **Effort:** ~10 min · **Status:** OPEN
**Affected file:** `app/register-school.tsx:100-115`

## Problem

```ts
const suburbLabels = useMemo(
  () => suburbsForState.map((item) => `${item.suburb} (${item.postcode})`),
  [suburbsForState]
);
const suburbOptions = useMemo(
  () => suburbLabels.map((label) => ({ label, value: label })),   // ← value is the label, not id
  [suburbLabels]
);
function handleSuburbChange(label: string) {
  const selected = suburbsForState.find((item) => item.label === label);
  ...
}
```

Options keyed on a derived label string instead of the real `id`. `AppSearchSelectField` uses `option.value` as React key. Two suburbs with the same name+postcode collide on key AND map to the first matching id.

## Impact

Possible cross-state suburb collision (rare but possible) → wrong `location_id` sent to backend.

## Fix

Use `id` as value (mirror the school profile fix from Bug #17):
```ts
const suburbOptions = useMemo(
  () => suburbsForState.map((item) => ({
    label: `${item.suburb} (${item.postcode})`,
    value: String(item.id),
  })),
  [suburbsForState]
);

function handleSuburbChange(value: string) {
  setLocationId(value);
}
```

## Related

Bug #17 (same suburb pattern in teacher profile) · Bug #29 (related casing drift)
