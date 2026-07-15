# Bug #56 — Name concatenation `||` precedence makes fallback unreachable — "null null" displayed

**Severity:** LOW · **Effort:** ~2 min · **Status:** OPEN
**Affected file:** `app/(school-tabs)/invoices.tsx:362`

## Problem

```tsx
<Text style={styles.rowValue}>{item.first_name + ' ' + item.last_name || '-'}</Text>
```

Operator precedence: `(first + ' ' + last) || '-'`. The string concatenation is always at least `" "` (truthy), so the `|| '-'` fallback never runs. If both names are null/undefined, displays `"null null"` or `"undefined undefined"`.

## Fix

```tsx
<Text>{[item.first_name, item.last_name].filter(Boolean).join(' ') || '—'}</Text>
```

## Related

Bug #66 (similar undefined-rendering pattern in SessionCard)
