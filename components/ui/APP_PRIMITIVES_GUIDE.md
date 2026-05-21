# App Primitives Guide

This project uses a composable primitives-first approach.
Build new screens by assembling shared primitives instead of creating local style systems.

## Core Rule

- Prefer importing from `components/ui/AppPrimitives.tsx` before adding new screen-level styles.
- Add new primitives only when a UI pattern is repeated in 2+ places.
- Keep screen styles for layout placement only, not component design tokens.

## Primitive Catalog

### Layout and Navigation

- `useResponsiveSpacing()`
  - Source of truth for spacing, icon sizes, and responsive density.
- `AppTopBar`
  - Standard back navigation row + centered title.
- `AppPageHeader`
  - Large page heading + subtitle block.
- `AppSectionHeader`
  - Section title row with optional right-side action (for "See All" style links).
- `AppSectionTitle`
  - Lightweight section heading text for forms and card blocks.
  - Use heading props (`size`, `tone`) to control title tokens instead of local text styles.

### Surface and Actions

- `AppCard`
  - Shared card surface with variants: `surface`, `primaryTint`, `secondaryTint`, `warningTint`.
- `AppButton`
  - Shared CTA with variants and built-in `loading` support.
- `AppIconButton`
  - Shared icon-only button for headers and quick actions.
- `AppStatusBadge`
  - Unified badge primitive for session statuses and generic status pills.
  - Use `status` for `SessionStatus` rendering, or `tone` for non-session statuses.

### Form and Content Patterns

- `AppField`
  - Standard labeled input wrapper with icon/trailing content/multiline support.
- `AppTimeRow`
  - Standard dual time input row (`Start Time` / `End Time`) for session forms.
- `AppChip`
  - Shared chip primitive for selectable or display-only chips.
- `AppChipGroup`
  - Wrap/horizontal layout helper for chip collections.
- `AppInfoRow`
  - Reusable icon + label + value row.
  - Use `variant="inline"` for session/detail rows.
  - Use `variant="stacked"` for profile/information rows.
- `AppStatCard`
  - Compact metric card (icon + value + label).
- `AppEmptyState`
  - Unified empty-state block (icon + title + subtitle).
- `AppUploadArea`
  - Reusable dashed upload dropzone/button.
- `AppDocumentRow`
  - Shared document row with optional remove action.
- `AppSummaryRow` / `AppSummaryList`
  - Shared confirmation-summary rows used in registration flows.

## Composition Recipes

### New Dashboard Section

1. Use `AppSectionHeader` for title + action link.
2. Use `AppStatCard` for KPI/summary cards.
3. Use `AppEmptyState` for no-data fallback.
4. Use list item components (for example `SessionCard`) for populated state.

### New Form Screen

1. Use `AppTopBar` for page chrome.
2. Wrap groups in `AppCard`.
3. Use `AppField` for inputs.
4. Use `AppButton loading` for submit state.
5. Use `useResponsiveSpacing()` for all vertical/horizontal spacing.

### New Detail/Profile Screen

1. Use `AppTopBar` + `AppPageHeader`.
2. Use `AppCard` for grouped information.
3. Use `AppInfoRow` instead of custom row implementations.
4. Use `AppButton` for workflow actions.

## When Adding a New Primitive

Add a new primitive when all are true:

- The pattern appears in at least 2 screens/components.
- The pattern has visual token risk (font size, spacing, border, icon size).
- The pattern should evolve globally.

If accepted:

1. Add the primitive in `components/ui/AppPrimitives.tsx`.
2. Migrate existing usages in same PR.
3. Keep old local style blocks removed to avoid drift.

## Anti-Patterns to Avoid

- Recreating empty states with local icon/text styles.
- Recreating stat cards on each dashboard.
- Creating custom loading buttons instead of `AppButton loading`.
- Duplicating info row structures in each profile/detail screen.
- Recreating subject chips/status badges/upload blocks locally.

## Quick Checklist for New Screens

- Uses `useResponsiveSpacing()`.
- No duplicated card/button/input styles.
- Uses shared primitives for repeated patterns.
- Empty and loading states use shared primitives.
- Action link/title rows use `AppSectionHeader`.
