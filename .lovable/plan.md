

# VerifiedU API Integration Plan

## Summary
Implement three verification services (PAN, Bank Account, Aadhaar/DigiLocker) using the VerifiedU API. This adds identity verification capabilities to both the vendor registration flow and the staff review workflow.

## What Already Exists
- `vendor_verifications` table in the database with columns for `verification_type`, `verification_source`, `status`, `request_data`, `response_data`, `verified_at`, `verified_by`, and `vendor_id`
- `vendors` table with `pan_number`, `bank_account_number`, `bank_ifsc`, `bank_name`, `bank_branch` fields
- Staff review page (`VendorReviewDetail`) where verifications will be triggered
- Vendor referral registration form with PAN and bank details steps

## Implementation Steps

### 1. Create Edge Functions (3 verification + 1 callback)

**a) `verify-pan` Edge Function**
- Accepts `{ pan_number, vendor_id }` 
- Validates PAN format with regex `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`
- Calls VerifiedU `POST /api/verifiedu/VerifyPAN`
- Logs result to `vendor_verifications` table
- Returns verification result (name, DOB, validity)
- Includes mock mode fallback when credentials unavailable
- Includes retry logic (up to 2 retries with exponential backoff)

**b) `verify-bank-account` Edge Function**
- Accepts `{ account_number, ifsc_code, vendor_id }`
- Sanitizes IFSC: replaces letter 'O' at position 4 with digit '0'
- Calls VerifiedU `POST /api/verifiedu/VerifyBankAccountNumber` with pennyless verification
- Distinguishes API errors (`success: false, data: null`) from genuine verification failures (`is_valid: false`)
- Logs to `vendor_verifications` table
- Returns account holder name, bank name, branch, validity
- Includes retry logic

**c) `verify-aadhaar` Edge Function**
- Accepts `{ vendor_id }` 
- Calls VerifiedU `POST /api/verifiedu/VerifyAadhaarViaDigilocker`
- Sets `surl` and `furl` to the `digilocker-callback` function URLs
- Logs initiation to `vendor_verifications` with status `in_progress`
- Returns the DigiLocker redirect URL for the browser

**d) `digilocker-callback` Edge Function**
- Handles POST callbacks from VerifiedU after DigiLocker consent
- Extracts `id` (unique_request_number) from query params, JSON body, or form data
- Returns a 302 redirect to the frontend: `/digilocker/success?id={id}` or `/digilocker/failure?id={id}`

**e) `get-aadhaar-details` Edge Function**
- Accepts `{ unique_request_number, vendor_id }`
- Calls VerifiedU `POST /api/verifiedu/GetAadhaarDetailsById`
- Maps address fields (house+street+landmark to line1, locality+vtc+subdist to line2, dist to city, state, pc to pincode)
- Updates `vendor_verifications` record with final result
- Returns name, gender, DOB, address, validity

### 2. Configuration Updates

- Add all 5 new functions to `supabase/config.toml` with `verify_jwt = false`
- VerifiedU credentials (token, companyid, base URL) will be hardcoded in each Edge Function per the existing project convention

### 3. Frontend: Staff Verification Panel

Add a **Verification Panel** to the `VendorReviewDetail` page with three verification buttons:

- **Verify PAN** button -- calls `verify-pan` with the vendor's PAN number, shows result inline (name, DOB, valid/invalid badge)
- **Verify Bank Account** button -- calls `verify-bank-account` with vendor's account number and IFSC, shows result (account holder, bank name, branch, valid/invalid)
- **Verify Aadhaar** button -- calls `verify-aadhaar`, opens DigiLocker URL in a new tab

Each button shows loading state, success/failure results, and any error messages. Previously completed verifications are loaded from `vendor_verifications` on page load.

### 4. Frontend: DigiLocker Callback Pages

Create two new routes:
- `/digilocker/success` -- receives `id` query param, calls `get-aadhaar-details`, displays verified Aadhaar data
- `/digilocker/failure` -- shows a failure message

### 5. Frontend: Verification Hook

Create `useVendorVerification` hook:
- `useVendorVerifications(vendorId)` -- fetches existing verification records
- `useVerifyPan()` -- mutation to trigger PAN verification
- `useVerifyBankAccount()` -- mutation to trigger bank verification  
- `useInitiateAadhaar()` -- mutation to start Aadhaar flow
- `useFetchAadhaarDetails()` -- mutation to get Aadhaar results

### 6. Retry Logic

All VerifiedU API calls include retry logic:
- Maximum 2 retries on network/server errors (5xx, timeouts)
- Exponential backoff: 1s, then 2s delay
- No retry on 4xx client errors or successful responses with `is_valid: false`

## Technical Details

### Files to Create
- `supabase/functions/verify-pan/index.ts`
- `supabase/functions/verify-bank-account/index.ts`  
- `supabase/functions/verify-aadhaar/index.ts`
- `supabase/functions/digilocker-callback/index.ts`
- `supabase/functions/get-aadhaar-details/index.ts`
- `src/hooks/useVendorVerification.tsx`
- `src/components/staff/VerificationPanel.tsx`
- `src/pages/vendor/DigiLockerSuccess.tsx`
- `src/pages/vendor/DigiLockerFailure.tsx`

### Files to Modify
- `supabase/config.toml` -- add 5 new function configs
- `src/App.tsx` -- add DigiLocker callback routes
- `src/pages/staff/VendorReviewDetail.tsx` -- add VerificationPanel component

### Credentials (Hardcoded in Edge Functions)
The VerifiedU token, companyid, and base URL will need to be provided. They will be hardcoded directly in the Edge Function code per the project's existing convention.

