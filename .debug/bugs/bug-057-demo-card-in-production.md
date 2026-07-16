# Bug #57 — Hardcoded "Demo Card (Test Mode) — 4242 4242 4242 4242" UI text visible in production

**Severity:** LOW · **Effort:** ~5 min · **Status:** OPEN
**Affected file:** `app/(school-tabs)/invoices.tsx:493-497`

## Problem

```tsx
<Text style={styles.bankTitle}>Demo Card (Test Mode)</Text>
<Text style={styles.bankText}>Number: 4242 4242 4242 4242</Text>
```

If the build is promoted to production without a flag change, end users see Stripe test card numbers in the payment modal. Looks unprofessional and may confuse users into trying the test card with real money.

## Fix

Render only when in dev mode or test publishable key is active:
```tsx
{__DEV__ && (
  <View>
    <Text>Demo Card (Test Mode)</Text>
    <Text>Number: 4242 4242 4242 4242</Text>
  </View>
)}
```

Or gate on whether the publishable key starts with `pk_test_`:
```tsx
{STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_') && ( ... )}
```

## Related

Bug #58 (related: Stripe pk_test hardcoded — same prod-vs-dev concern)
