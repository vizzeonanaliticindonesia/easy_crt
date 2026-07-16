# Bug #74 — No double-tap guard on session-detail action buttons → duplicate API calls

**Severity:** HIGH · **Effort:** ~20 min · **Status:** OPEN
**Affected file:** `app/session-detail.tsx:201-266, 303-316`

## Problem

Six action buttons in this screen, none of which are guarded against double-tap:

- Accept (`:303`)
- Decline (`:309`)
- Check In (`:236`)
- Check Out (`:249`)
- Confirm Attendance (`:201`) — note: also broken per Bug #70
- Unable to Attend (`:217`) — also broken per Bug #70

Pattern:

```tsx
<AppButton title="Confirm Attendance" onPress={async () => {
    const res = await confirmAttendance(slot.id);
    await fetchData();
    // ... no loading state, no disabled prop
}} />
```

Or for Accept/Decline (TouchableOpacity directly):

```tsx
<TouchableOpacity onPress={async () => { await acceptSession(...) }}>...</TouchableOpacity>
```

No `disabled`, no busy state, no debounce.

## Impact

Two rapid taps on the same button:
- Two simultaneous API calls to e.g. `/teacher/session/checkin`
- Backend may double-insert attendance rows (duplicate check-in record)
- Or return "already checked in" on the second call, which the UI shows as an error toast even though the first call succeeded
- Worst case for Accept: two `accept` calls race — second one may "un-accept" or trigger a backend race-condition bug

Mobile users tap things twice frequently (slow network, unsure if first tap registered). This is real, not theoretical.

## Fix

Add a single `busy` state and use it to guard all six handlers + disable the buttons:

```tsx
// app/session-detail.tsx — near the top of the component
const [busy, setBusy] = useState<string | null>(null);
// busy stores the action key ('accept' / 'decline' / 'checkIn' / etc.) or null when idle

async function withBusy<T>(key: string, fn: () => Promise<T>) {
  if (busy !== null) return;   // already in flight; ignore
  setBusy(key);
  try {
    return await fn();
  } finally {
    setBusy(null);
  }
}

// Use in handlers:
<AppButton
  title="Confirm Attendance"
  disabled={busy !== null}
  loading={busy === 'confirm'}
  onPress={() => withBusy('confirm', async () => {
    await confirmAttendance(slot.id);
    await fetchData();
  })}
/>
```

Repeat for the other five buttons with appropriate keys.

Also apply `disabled={busy !== null}` to the Accept/Decline `TouchableOpacity` (and add visual feedback like opacity 0.5 when disabled).

## Acceptance criteria

- [ ] Rapid double-tap on "Check In" → exactly one API call (verified via network inspector)
- [ ] Buttons show a loading state during the action
- [ ] All six action buttons are disabled while ANY one of them is in flight
- [ ] After error or success, buttons re-enable
- [ ] Regression test at `__tests__/regressions/bug-074-no-double-tap-guards.test.tsx`

## Related

- Bug #31 — same family in a different screen
- Bug #70, #71, #72 — same file; fix all together for a clean session-detail PR
