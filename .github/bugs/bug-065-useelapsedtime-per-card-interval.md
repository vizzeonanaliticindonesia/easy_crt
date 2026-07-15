# Bug #65 — `useElapsedTime` runs `setInterval` every 1s on every SessionCard regardless of status

**Severity:** MEDIUM · **Effort:** ~10 min · **Status:** OPEN
**Affected file:** `components/SessionCard.tsx:49-61` (hook) and `:132-138` (consumer)

## Problem

```ts
useEffect(() => {
  if (!createdAt) return;
  const interval = setInterval(() => {
    setElapsed(formatElapsed(createdAt));
  }, 1000);
  return () => clearInterval(interval);
}, [createdAt]);
```

Runs unconditionally for every card. The `elapsed` value is **only displayed when `isOpen && !!elapsed`** (line 132). For lists with N cards, that's N setIntervals firing `setState` per second.

## Impact

CPU drain, battery drain, jank on long lists. The 1-second granularity is unnecessary once `elapsed > 1 min`.

## Fix

```ts
function useElapsedTime(createdAt: string, enabled: boolean): string {
  const [elapsed, setElapsed] = useState(() => formatElapsed(createdAt));
  useEffect(() => {
    if (!enabled || !createdAt) return;
    const intervalMs = elapsedMinutes(createdAt) >= 1 ? 30_000 : 1000;
    const interval = setInterval(() => {
      setElapsed(formatElapsed(createdAt));
    }, intervalMs);
    return () => clearInterval(interval);
  }, [createdAt, enabled]);
  return elapsed;
}

// Consumer:
const elapsed = useElapsedTime(createdAt, isOpen);   // pass the gate
```

## Related

Bug #66 (same file — defensive reads)
