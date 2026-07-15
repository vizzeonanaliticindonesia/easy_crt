# Bug #79 — No check-in time-window enforcement (teacher can check in days early or late)

**Severity:** MEDIUM · **Effort:** ~15 min · **Status:** OPEN
**Affected file:** `app/session-detail.tsx:236-246`

## Problem

The Check In button is enabled the moment the slot is confirmed. No comparison against `slot.startTime` / `slot.date` — a teacher could check in three days before the lesson, or three days after.

## Impact

For a substitute-teacher attendance app, this defeats the audit purpose of check-in. Teachers could pre-check-in for sessions they haven't attended, or back-fill check-ins after the fact.

## Fix

```tsx
function isWithinCheckInWindow(slot: ScheduleSlot): boolean {
  const start = new Date(`${slot.date}T${slot.startTime}`);
  const end = new Date(`${slot.date}T${slot.endTime}`);
  const now = new Date();
  const earliest = new Date(start.getTime() - 30 * 60 * 1000);   // 30 min early
  const latest = new Date(end.getTime() + 30 * 60 * 1000);       // 30 min after end
  return now >= earliest && now <= latest;
}

// In render:
<AppButton
  title="Check In"
  disabled={!isWithinCheckInWindow(slot)}
  onPress={...}
/>
{!isWithinCheckInWindow(slot) && (
  <Text>Check-in opens 30 minutes before start time.</Text>
)}
```

Confirm timezone handling with backend. Confirm grace window (30 min may be too long or too short).

## Related

Bug #78 (same screen, status-machine gating) · Bug #74 (busy guard)
