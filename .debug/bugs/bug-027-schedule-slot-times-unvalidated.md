# Bug #27 — Schedule slot times never validated (`endTime > startTime`, overlap)

**Severity:** MEDIUM · **Effort:** ~20 min · **Status:** OPEN
**Affected file:** `app/create-session.tsx:337-339`

## Problem

```tsx
const hasIncompleteSlot = normalizedSlots.some(
    (slot) => !slot.date || !slot.startTime || !slot.endTime
);
```

Only checks non-empty. A user can submit `startTime=15:00, endTime=09:00` or two slots on the same date that overlap.

## Impact

Backend may accept and create unusable bookings: zero-duration, negative-duration, or double-booking the teacher.

## Fix

```ts
function validateSlots(slots: ScheduleSlot[]): string | null {
  for (const s of slots) {
    if (!s.date || !s.startTime || !s.endTime) return 'All slot fields are required';
    if (s.endTime <= s.startTime) return `Slot on ${s.date} ends before it starts`;
  }
  // Overlap check
  const byDate = groupBy(slots, 'date');
  for (const [date, daySlots] of Object.entries(byDate)) {
    const sorted = [...daySlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].startTime < sorted[i-1].endTime) return `Overlapping slots on ${date}`;
    }
  }
  return null;
}
```

## Related

Bug #21 (same file — same payload-construction area)
