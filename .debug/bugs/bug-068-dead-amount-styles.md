# Bug #68 — Dead `amountRow / amountLabel / amount` styles in SessionCard

**Severity:** LOW · **Effort:** ~1 min · **Status:** OPEN
**Affected file:** `components/SessionCard.tsx:201-218`

## Problem

```ts
amountRow: { ... },
amountLabel: { ... },
amount: { ... },
```

Defined but never referenced in JSX. Implies a removed price-display feature.

## Fix

Delete the three style entries, OR restore the JSX if the price row was supposed to ship:
```tsx
{session.amount && (
  <View style={styles.amountRow}>
    <Text style={styles.amountLabel}>Amount</Text>
    <Text style={styles.amount}>{formatCurrency(session.amount)}</Text>
  </View>
)}
```

## Related

Bug #82 (similar dead code elsewhere)
