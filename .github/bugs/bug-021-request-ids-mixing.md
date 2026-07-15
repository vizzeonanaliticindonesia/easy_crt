# Bug #21 — `request_ids` mixes active and deleted IDs; backend can't tell which is which

**Severity:** HIGH · **Effort:** ~30 min · **Status:** OPEN
**Affected file:** `app/create-session.tsx:381` (verified) and the schedules section nearby

## Problem

```tsx
// app/create-session.tsx:381
const activeRequestIds = normalizedSlots.map((s) => s.requestId).filter(Boolean) as number[];

const payload = {
  // request_ids: array of existing ids, aligned dengan schedules[]
  // Kosong berarti semua slot di-INSERT
  // request_ids: normalizedSlots.map((s) => s.requestId).filter(Boolean),
  request_ids: [...activeRequestIds, ...deletedRequestIds],   // ← MIXES TWO LISTS
  ...
  // schedules[] harus aligned index-per-index dengan request_ids[]
  schedules: normalizedSlots.map((slot) => ({ ... })),   // ← length = activeRequestIds only
};
```

The comment **explicitly says** `schedules[]` must be aligned index-per-index with `request_ids[]`. By appending `deletedRequestIds`, the alignment is broken whenever any slot is deleted.

## Impact

When the school edits an existing session and removes some slots:
- `activeRequestIds` = the IDs of slots they kept
- `deletedRequestIds` = the IDs of slots they removed
- `schedules` = data for slots they kept (active only)
- `request_ids` payload field = `[...kept, ...removed]` concatenated

Backend receives:
- `request_ids: [101, 102, 105, 103, 104]` (kept 101/102/105, deleted 103/104)
- `schedules: [scheduleFor101, scheduleFor102, scheduleFor105]` (length 3, but `request_ids` length 5)

Backend has no way to know which IDs to keep vs delete vs which schedule belongs to which ID. Result: edit-session is likely corrupting backend data — either:
- Schedules misassigned to wrong request IDs
- Deleted slots stay around
- Backend throws a 500

## Fix

Send the two lists separately:

```tsx
// app/create-session.tsx:381
const payload = {
  request_ids: activeRequestIds,                  // ← only active
  deleted_request_ids: deletedRequestIds,         // ← NEW field for backend to process deletions
  schedules: normalizedSlots.map((slot) => ({ ... })),   // aligned with request_ids
  // ... rest of payload
};
```

**Coordinate with backend team** — they need to accept the new `deleted_request_ids` field and process deletions explicitly. Confirm the field name with them.

If the backend can't be updated in this sprint, an interim fix:
- Send `request_ids: activeRequestIds` (correct alignment)
- Make N separate DELETE calls for each `deletedRequestIds` (slower but correct)

## Acceptance criteria

- [ ] Editing a session with some deleted slots: backend receives `request_ids` aligned with `schedules` length
- [ ] Deleted slots are actually removed in the backend
- [ ] Kept slots retain their schedule data correctly
- [ ] No misassignment of schedule → request ID
- [ ] Regression test at `__tests__/regressions/bug-021-request-ids-mixing.test.tsx` using MSW to verify request shape

## Related

- Bug #5 — session shape drift makes this whole flow harder to reason about
- The author's `// schedules[] harus aligned index-per-index dengan request_ids[]` comment is the documentation of the contract that the code itself violates
