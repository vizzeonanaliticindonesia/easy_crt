# Bug #60 — School registration missing Step 2 entirely (no document upload, no terms acceptance)

**Severity:** HIGH · **Effort:** ~2-3 hours (assuming Step 2 fields are known)
**Status:** OPEN — **needs backend confirmation first**
**Affected file:** `app/register-school.tsx` (254 lines — should be ~500-700 like teacher's 659)
**Reference (correct pattern):** `app/register-teacher.tsx:331-420`

## Problem

`register-school.tsx` only imports/calls `registerStep1`:

```tsx
// app/register-school.tsx:20
import { getStates, getSuburbs, registerStep1 } from '@/lib/services/school';

// app/register-school.tsx:149 (only call)
await registerStep1(payload);
```

Compare to `register-teacher.tsx`:

```tsx
// app/register-teacher.tsx:12, 27, 331, 372, 384, 386, 420
import StepIndicator from '@/components/StepIndicator';
import { registerStep1, registerStep2, uploadDocument } from '@/lib/services/teacher';

const res = await registerStep1(payload);
const uploadResult = await uploadDocument({ ... });
const step2Res = await registerStep2({
  ...
  integrityAccepted: true,
});
// ...
<StepIndicator steps={STEPS} currentStep={step} />
```

Teacher has full Step 1 + Step 2 + document upload + integrity checkbox + StepIndicator. School has none of that.

## Impact

If schools are **supposed** to go through a Step 2 (like teachers do):
- Schools register without uploading proof-of-identity / accreditation documents
- No recorded acceptance of terms / integrity declaration
- Under-verified school accounts created — potential fraud surface
- Status machine may break (other code expects schools to have completed Step 2)

If schools are **intentionally exempt** from Step 2 (unlikely but possible — maybe the dev team decided schools don't need verification):
- Then this bug doesn't exist — close as "won't fix" after backend confirms

## Fix

**Step 0 — Confirm with backend team or dev lead.** Question: "Should schools go through a Step 2 (document upload + integrity acceptance) like teachers do? If yes, what fields are required?"

**If yes:**

**Step 1 — Add the Step 2 import:**

```tsx
// app/register-school.tsx
import StepIndicator from '@/components/StepIndicator';
import { getStates, getSuburbs, registerStep1, registerStep2, uploadDocument } from '@/lib/services/school';
```

(Confirm whether `registerStep2` and `uploadDocument` exist in `lib/services/school.ts`; if not, the backend / dev team needs to add them.)

**Step 2 — Add Step 2 state, fields, and UI** mirroring `register-teacher.tsx:331-420`:
- Document picker for required school docs (accreditation, ABN registration, etc.)
- Integrity / terms acceptance checkbox
- Submit handler that calls `uploadDocument` then `registerStep2`

**Step 3 — Add `StepIndicator`** at the top:

```tsx
<StepIndicator steps={['Account', 'Verification']} currentStep={step} />
```

**Step 4 — Add navigation between steps** (next/back buttons), gated on validation.

**If schools are intentionally exempt:**

- Document this in `app/register-school.tsx` with a top-of-file comment:
  ```tsx
  // NOTE: Schools register in a single step (no document upload).
  // Confirmed with backend team on 2026-MM-DD that schools do not require
  // post-registration verification. See decision: <link>.
  ```
- Close this bug as WONTFIX with the reference.

## Acceptance criteria (assuming Step 2 is required)

- [ ] School registration flow has 2 steps with a visible step indicator
- [ ] Step 2 requires uploading required documents and accepting terms
- [ ] Cannot submit Step 2 without integrity acceptance checked
- [ ] After completion, school account is fully registered (verified state matches teacher flow)
- [ ] Regression test at `__tests__/regressions/bug-060-school-registration-missing-step-2.test.tsx`

## Related

- Bug #61, #62, #63, #64 — other issues in `register-school.tsx` (handle in same PR)
- Bug #1, #18, #43 — `verification_status` flow only makes sense if registration sets it correctly
