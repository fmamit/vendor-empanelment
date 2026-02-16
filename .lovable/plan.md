

# Redesign Referral Page Header: 3-Column Single Row

## Current Layout
The header currently has two stacked sections:
1. A tall centered logo (h-40) with padding
2. A "Vendor Registration" title bar
3. Below that, a separate stepper row

## New Layout
Combine everything into a single compact top ribbon with 3 columns in one row:

```text
+------------------------------------------------------------------+
| [Logo]  |  Vendor Registration  |  [0] -- [1] -- [2] -- [3] -- [4] |
|  (left) |      (center)         |        Stepper (right)            |
+------------------------------------------------------------------+
```

### Changes

**1. `src/components/referral/ReferralHeader.tsx`**
- Accept `currentStep` as a prop
- Replace the stacked layout with a single `flex` row (`items-center justify-between`)
- Left column: Logo scaled down to ~h-10 for the ribbon
- Center column: "Vendor Registration" title text
- Right column: Inline the stepper (import and render `ReferralStepper`)
- Remove the separate blue title bar since the title is now inline
- Keep the sticky top behavior and border

**2. `src/components/referral/ReferralStepper.tsx`**
- Make it more compact to fit inside the header row (reduce circle size from w-9 to w-7, reduce connector width, smaller text)
- Remove the outer padding and background/border since it will be embedded inside the header

**3. `src/pages/vendor/VendorReferralRegistration.tsx`**
- Remove the separate `<ReferralStepper>` component usage
- Pass `currentStep` to `<ReferralHeader>` instead
- Update all render paths (loading, invalid, submitting, success) to pass `currentStep={0}` to ReferralHeader

