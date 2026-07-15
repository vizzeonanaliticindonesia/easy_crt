# Bug #58 — Stripe `publishableKey="pk_test_*"` hardcoded in `_layout.tsx`

**Severity:** LOW · **Effort:** ~5 min · **Status:** OPEN
**Affected file:** `app/_layout.tsx:138`

## Problem

```tsx
<StripeProvider publishableKey="pk_test_51Te5Yg...">
```

Hardcoded `pk_test_*` key. Note: `pk_test` is **publicly publishable** (Stripe designed it to be safe in client code), so this is not a credential leak per se. But:
- If the dev later swaps to `pk_live_*`, the change is in source (commit history)
- No dev/prod separation — same key used across all builds
- Doesn't follow the same env-config pattern as Bug #7 / #10

## Fix

Move to env var (same pattern as Bug #7):
```tsx
// app/_layout.tsx
<StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PK!}>
```

Set per EAS build profile:
```json
// eas.json
{
  "build": {
    "development": { "env": { "EXPO_PUBLIC_STRIPE_PK": "pk_test_..." } },
    "production":  { "env": { "EXPO_PUBLIC_STRIPE_PK": "pk_live_..." } }
  }
}
```

## Related

Bug #7 (combine — same env-var pattern) · Bug #57 (same prod-vs-dev concern in same screen)
