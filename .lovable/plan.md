
# Remove Aadhaar Verification

## Overview
Remove all Aadhaar verification functionality from the application since it is not needed.

## Changes

### 1. Frontend - VerificationPanel (`src/components/staff/VerificationPanel.tsx`)
- Remove the `useInitiateAadhaar` import
- Remove the `initiateAadhaar` hook instance
- Remove the `handleInitiateAadhaar` function (lines 92-104)
- Remove the entire "Aadhaar Verification" UI block (lines 246-284)

### 2. Frontend Hook - (`src/hooks/useVendorVerification.tsx`)
- Remove the `useInitiateAadhaar` export function
- Remove the `useFetchAadhaarDetails` export function

### 3. Edge Functions to Delete
- `supabase/functions/verify-aadhaar/index.ts` -- no longer needed
- `supabase/functions/get-aadhaar-details/index.ts` -- no longer needed
- `supabase/functions/digilocker-callback/index.ts` -- only used for Aadhaar flow

### 4. Pages to Delete
- `src/pages/vendor/DigiLockerSuccess.tsx` -- callback page for Aadhaar/DigiLocker
- `src/pages/vendor/DigiLockerFailure.tsx` -- callback page for Aadhaar/DigiLocker

### 5. Routes (`src/App.tsx`)
- Remove routes for `/vendor/digilocker-success` and `/vendor/digilocker-failure`

### 6. Config (`supabase/config.toml`)
- Note: config.toml is auto-managed; the edge function entries will be cleaned up when the functions are deleted

## What Stays
- PAN verification (unchanged)
- Bank Account verification (unchanged)
- The `vendor_verifications` table remains -- it stores PAN and bank verification results too
