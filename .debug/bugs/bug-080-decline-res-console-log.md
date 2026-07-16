# Bug #80 — `console.log('decline res:', res)` leaks server response

**Severity:** MEDIUM · **Effort:** ~1 min · **Status:** OPEN
**Affected file:** `app/session-detail.tsx:131` (and dead `// console.log(user.id);` at `:139`)

## Problem

```tsx
const res = await declineSession(session.rn_id);
console.log('decline res:', res);
```

Plus a dead commented-out `console.log(user.id)` nearby (line 139).

## Impact

Same family as Bugs #3, #16, #39, #40 — server response logged to OS log. May contain tokens, IDs, internal error info.

## Fix

Delete both lines. If you need it for dev:
```ts
if (__DEV__) console.log('decline succeeded');   // OK — no response payload
```

## Related

Bug #3 family (all console-log leaks)
