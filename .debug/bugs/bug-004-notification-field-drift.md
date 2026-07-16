# Bug #4 — `AppNotification` field drift; unread badge never decreases for API-sourced notifications

**Severity:** HIGH · **Effort:** ~1 hour · **Status:** OPEN
**Affected files:**
- `types/index.ts:100-109` (type declares snake_case)
- `contexts/SessionContext.tsx:270-316` (runtime uses camelCase)

## Problem

Type declares snake_case + string flag:

```ts
// types/index.ts:100-109
export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  sessionId?: string;
  is_read: '0' | '1';     // ← API shape
  created_at: string;     // ← API shape
}
```

Context writes / reads camelCase + boolean:

```ts
// contexts/SessionContext.tsx:270-280
async function addNotification(notifData: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) {
  const newNotif: AppNotification = {
    ...notifData,
    id: 'notif_' + ...,
    read: false,                            // ← `read`, not `is_read`
    createdAt: new Date().toISOString(),    // ← `createdAt`, not `created_at`
  };
}

// contexts/SessionContext.tsx:288-316
function getUnreadCount(userId: string) {
  return notifications.filter((n) => n.userId === userId && !n.read).length;
  //   For API-shape notifications, n.read is undefined → !undefined === true
}
```

## Impact

Local-only notifications work. API-sourced notifications (the real ones from `/teacher/notification`) carry `is_read: '0' | '1'` but the reader checks `.read`. Since `n.read` is `undefined`, every API notification is **permanently counted as unread**.

**User-visible:** The red badge on the notifications tab never decreases. Users learn to ignore it → real notifications get missed.

## Fix — pick one source of truth

**Option A (preferred — match backend):**

Change `addNotification`, `markNotificationRead`, and `getUnreadCount` in `contexts/SessionContext.tsx` to use the snake_case fields:

```ts
// contexts/SessionContext.tsx
async function addNotification(notifData: Omit<AppNotification, 'id' | 'is_read' | 'created_at'>) {
  const newNotif: AppNotification = {
    ...notifData,
    id: 'notif_' + ...,
    is_read: '0',                                          // unread
    created_at: new Date().toISOString(),
  };
  // ...
}

async function markNotificationRead(notifId: string) {
  setNotifications((prev) =>
    prev.map((n) => (n.id === notifId ? { ...n, is_read: '1' } : n))
  );
  // also push to backend if needed
}

function getUnreadCount(userId: string) {
  return notifications.filter((n) => n.userId === userId && n.is_read === '0').length;
}
```

**Option B — keep JS-friendly internal shape:**

Add an adapter at the repository boundary (`lib/repositories/sessionRuntimeRepository.ts`) that converts API responses (`'0'`/`'1'`) into `read: boolean`. Then update the `AppNotification` type to declare `read: boolean` + `createdAt: string`. Don't write the snake_case form anywhere in app code.

Either way: **one source of truth**.

## Acceptance criteria

- [ ] All notification writes use the chosen field name (verified by grep)
- [ ] Receiving a notification from the API increments the badge
- [ ] Tapping it (or visiting the notifications screen) decrements the badge to 0
- [ ] Cold-restarting the app preserves read/unread state correctly
- [ ] Regression test at `__tests__/regressions/bug-004-notification-field-drift.test.tsx`

## Related

- Bug #5 — same class of drift on `TeachingSession`
- Bug #13, #18 — same class on `User` fields
