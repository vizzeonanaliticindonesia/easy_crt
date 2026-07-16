# Bug #66 — `SessionCard` lacks defensive reads — renders "undefined undefined" for missing fields

**Severity:** MEDIUM · **Effort:** ~10 min · **Status:** OPEN
**Affected file:** `components/SessionCard.tsx:106-119, 125-126`

## Problem

```tsx
<Text style={styles.detailText} numberOfLines={1}>
  {session.state}, {session.locality}, {session.pcode}
</Text>
...
<Text>{session.teacher_first_name} {session.teacher_last_name}</Text>
```

If any of `state / locality / pcode / teacher_first_name / teacher_last_name` are undefined (Bug #5 type drift, or just empty backend response), renders as `", , "` or `"undefined undefined"`.

## Impact

Real user-visible bug compounded by Bug #5 (locally-created sessions have a different field shape).

## Fix

```tsx
<Text style={styles.detailText} numberOfLines={1}>
  {[session.state, session.locality, session.pcode].filter(Boolean).join(', ') || '—'}
</Text>

<Text>{[session.teacher_first_name, session.teacher_last_name].filter(Boolean).join(' ') || '—'}</Text>
```

## Related

Bug #5 (root cause — fixing #5 helps but defensive reads are still good practice)
