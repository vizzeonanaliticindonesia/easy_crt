# Bug #22 — `booking.booking_status == '1'` magic comparison breaks "Leave a Review"

**Severity:** HIGH · **Effort:** ~15 min · **Status:** OPEN
**Affected file:** `app/session-confirmation-detail.tsx:214` (verified — even the author was uncertain)

## Problem

```tsx
// app/session-confirmation-detail.tsx:214
{booking.booking_status == '1' && (   // sesuaikan value status complete di project kamu
  <AppButton
    title={booking.review_id ? 'View Review' : 'Leave a Review'}
    onPress={handleReview}
    variant={booking.review_id ? 'outline' : 'secondary'}
    size="md"
    style={{ marginTop: 12 }}
  />
)}
```

The author's own comment translates as "adjust to this project's complete status value." Meaning: even the developer who wrote this line wasn't sure what value `booking_status` would have when the booking is complete.

`booking.booking_status` is mapped from `SessionStatus` (13-value enum) by the context. Looking at the mapping in `contexts/SessionContext.tsx`:

```ts
function mapSessionToConfirmationStatus(status: SessionStatus): string {
  if (status === 'declined') return 'rejected';
  if (status === 'completed') return 'completed';
  if (status === 'accepted' || status === 'checked_in') return 'on session';
  if (status === 'attendance_confirmed' || ...) return 'confirmed';
  return 'awaiting';
}
```

None of those return values equal `'1'`. So `booking.booking_status == '1'` is **always false**.

## Impact

The "Leave a Review" button **never appears** on completed sessions. School users have no in-app way to review teachers they hired — even when the session is complete.

The review flow is one of the documented core flows from the README. It's broken end-to-end.

## Fix

Compare against the actual status value (likely `'completed'`):

```tsx
// app/session-confirmation-detail.tsx:214
{booking.booking_status === 'completed' && (
  <AppButton ... />
)}
```

But this is brittle — the `mapSessionToConfirmationStatus` function uses six different output strings, and the dev team should decide which one(s) qualify as "ready for review". Likely candidates:
- `'completed'` (school has confirmed teacher attendance)
- `'confirmed'` (one of the post-completion states like `payment_confirmed`)

**Step 1 — Confirm with the dev team / product owner**: when is "Leave a Review" appropriate? After completion, after payment, after both?

**Step 2 — Use a named constant or enum** to avoid the magic-string repeat:

```ts
// somewhere shared
export const BOOKING_STATUS = {
  AWAITING: 'awaiting',
  ON_SESSION: 'on session',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
} as const;

// in the screen
{booking.booking_status === BOOKING_STATUS.COMPLETED && (
  <AppButton ... />
)}
```

**Step 3 — Replace `==` with `===`** everywhere in this file (also addresses Bug #37).

**Step 4 — Delete the dead `// console.log(user.id);` and similar developer notes** that show this section was a work-in-progress.

## Acceptance criteria

- [ ] After a session is marked complete, opening session-confirmation-detail shows "Leave a Review" button
- [ ] Tapping it navigates to the review screen
- [ ] If the review already exists, button reads "View Review" and is in outline variant
- [ ] No `== '1'` magic comparison remains in this file
- [ ] Regression test at `__tests__/regressions/bug-022-booking-status-magic-comparison.test.tsx`

## Related

- Bug #45, #46, #54 — same family of magic-string comparisons on invoice status
- Bug #37 — broader pattern of loose `==` in this file
