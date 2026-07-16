# Bug #52 — Logs-modal `RefreshControl` calls `onRefresh` which refetches invoice list (wrong handler)

**Severity:** MEDIUM · **Effort:** ~10 min · **Status:** OPEN
**Affected file:** `app/(school-tabs)/invoices.tsx:424-432`

## Problem

```tsx
<RefreshControl
    refreshing={refreshing}
    onRefresh={onRefresh}     // ← refreshes invoices list, NOT logs
    ...
/>
```

User in Logs modal pulls to refresh → invoice list behind the modal re-fetches, but logs in the modal don't change. `refreshing` flag also vibrates state of an invisible list. Confusing.

## Impact

Pull-to-refresh in the logs modal does nothing visible to the user. Looks broken.

## Fix

Create a dedicated logs refresh handler:
```ts
const [refreshingLogs, setRefreshingLogs] = useState(false);
const onRefreshLogs = async () => {
  if (!activeLogsPaymentId) return;
  setRefreshingLogs(true);
  try { await openLogs(activeLogsPaymentId); }
  finally { setRefreshingLogs(false); }
};

// In modal RefreshControl:
<RefreshControl refreshing={refreshingLogs} onRefresh={onRefreshLogs} ... />
```

Also store the current `activeLogsPaymentId` when `openLogs` is called.

## Related

Bug #50, #51 (same modal / loading family)
