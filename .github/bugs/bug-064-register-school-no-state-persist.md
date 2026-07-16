# Bug #64 — Form state not persisted; backgrounding the app wipes everything

**Severity:** LOW · **Effort:** ~30 min · **Status:** OPEN
**Affected file:** `app/register-school.tsx:40-49`

## Problem

Ten independent `useState` calls, no AsyncStorage hydration, no draft persistence. iOS/Android process-kill while the user is filling out the form (taking a photo, switching to email to copy school details, etc.) wipes the entire form.

## Impact

With a long form and a suburb dropdown that's slow to load, this is a real abandonment risk. School registers, gets a phone call, comes back 10 min later, app was killed → starts over.

## Fix

Persist a draft to AsyncStorage on field change (debounced) and rehydrate on mount:

```ts
const DRAFT_KEY = '@register_school_draft';

useEffect(() => {
  AsyncStorage.getItem(DRAFT_KEY).then(raw => {
    if (!raw) return;
    const draft = JSON.parse(raw);
    setSchoolName(draft.schoolName ?? '');
    // ... restore other fields
  });
}, []);

const draftRef = useRef({});
useEffect(() => {
  draftRef.current = { schoolName, email, phone, ... };
  const t = setTimeout(() => {
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draftRef.current));
  }, 500);
  return () => clearTimeout(t);
}, [schoolName, email, phone, ...]);

// On successful registration:
await AsyncStorage.removeItem(DRAFT_KEY);
```

## Related

Same flow as Bug #60 (combine if Step 2 is added)
