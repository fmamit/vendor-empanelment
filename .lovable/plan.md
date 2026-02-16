

# Scale Up Vendor Referral Page

## Summary
Increase the visual scale of the vendor referral page to suit a large-screen display: 3X the header ribbon elements, 2X all body fonts, and expand the content container to fill the viewport without page-level scrolling.

## Changes

### 1. ReferralHeader.tsx -- Scale ribbon elements 3X
- Logo height: `h-10` to `h-[120px]` (approx 3X)
- Title text: `text-sm` to `text-[2.625rem]` (3X of 14px = 42px)
- Padding: `px-3 py-2` to `px-9 py-6`

### 2. ReferralStepper.tsx -- Scale stepper 3X
- Step circles: `w-6 h-6` to `w-[72px] h-[72px]`
- Circle text: `text-[10px]` to `text-[30px]`
- Check icon: `h-3.5 w-3.5` to `h-10 w-10`
- Step labels: `text-[9px]` to `text-[27px]`, `max-w-[40px]` to `max-w-[120px]`
- Connectors: `h-0.5 w-4 mx-0.5` to `h-1.5 w-12 mx-1.5`

### 3. ConsentStep.tsx -- Scale fonts 2X and expand container
- Title icon: `h-5 w-5` to `h-10 w-10`
- Title text: `text-base` to `text-2xl`
- Body text: `text-sm` to `text-lg`
- Section headings: add `text-lg`
- List items: `text-sm` / default to `text-base`
- ScrollArea: change `h-[320px]` to `h-[55vh]` (fills viewport, avoids outer page scroll)
- Consent checkbox label: `text-sm` to `text-base`
- Privacy link: `text-xs` to `text-base`
- Increase padding: `p-4` to `p-8`

### 4. VendorReferralRegistration.tsx -- Prevent page scroll
- The content area already uses `flex-1 overflow-y-auto` which fills available space
- No changes needed here since the expanded ScrollArea inside ConsentStep handles containment

## Technical Detail
- All size changes use Tailwind utility classes (no custom CSS needed)
- The ScrollArea in ConsentStep uses viewport-relative height (`55vh`) so the consent text scrolls internally while the page itself does not scroll
- Other form steps (Company, Contact, Bank, Docs) will also need their font sizes doubled -- this will be applied consistently across all step components using increased `text-*` classes

### 5. Other Step Components (CompanyDetailsStep, ContactDetailsStep, BankDetailsStep, DocumentUploadStep)
- All label text: increase to `text-base` or `text-lg`
- All input fields: keep `h-12` (already touch-friendly)
- Section headings: increase to `text-xl` or `text-2xl`
- Spacing: increase `space-y` values proportionally
