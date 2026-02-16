

# Revert Staff Pages + Improve Vendor Registration Form

## Part 1: Revert Staff Pages

Undo the changes made to:
- **StaffSidebar.tsx**: Restore the logo to its original fixed `120px` width (instead of `w-full`)
- **StaffInviteVendor.tsx**: Restore the original form layout (remove the icon-prefixed inputs and mobile-first restructuring)

## Part 2: Vendor Registration Form Improvements

Based on the screenshot, the vendor registration form (public referral flow) needs:

### A. Make the Capital India logo 5x larger in ReferralHeader
- Current logo height: `h-8` (32px)
- New logo height: `h-40` (160px) -- approximately 5x larger
- Center it prominently in the header area

### B. Mobile-first form design for CompanyDetailsStep (and other steps)
- Increase input heights to `h-12` for better touch targets (already done)
- Add more spacing between fields
- Make labels bolder and more readable
- Ensure the "Next" button at the bottom is large and easy to tap
- Clean, spacious single-column layout optimized for phone screens

### Technical Details

**Files to modify:**
1. `src/components/layout/StaffSidebar.tsx` -- revert logo to `w-[120px]`
2. `src/pages/staff/StaffInviteVendor.tsx` -- revert form to original grid layout without icon prefixes
3. `src/components/referral/ReferralHeader.tsx` -- increase logo from `h-8` to `h-40`
4. `src/components/referral/CompanyDetailsStep.tsx` -- polish spacing and mobile touch targets
5. `src/components/referral/ReferralStepper.tsx` -- ensure stepper is clean on mobile

