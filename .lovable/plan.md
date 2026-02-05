
# PAN, Aadhaar (DigiLocker), and Bank Account Verification Implementation

## Overview

This plan implements real-time verification of PAN, Aadhaar (via DigiLocker), and Bank Account details for the vendor onboarding system using the **VerifiedU API** as the verification provider.

## Integration Points

The verification features will be integrated at two levels:
1. **Vendor Registration (Step 1 & 3)**: Vendors can verify their PAN and Bank Account during self-registration
2. **Staff Review (VendorReviewDetail)**: Staff can trigger verifications and view verification status/results

## Architecture

```text
+------------------+     +------------------------+     +----------------+
|   Frontend       |---->|  Supabase Edge         |---->|  VerifiedU API |
|   (React)        |<----|  Functions             |<----|                |
+------------------+     +------------------------+     +----------------+
        |                         |
        |                         v
        |               +------------------------+
        +-------------->|  vendor_verifications  |
                        |  (Database Table)      |
                        +------------------------+
```

## Implementation Components

### 1. Database Schema

**New Table: `vendor_verifications`**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| vendor_id | uuid | FK to vendors |
| verification_type | text | 'pan', 'aadhaar', 'bank_account' |
| verification_source | text | 'verifiedu' |
| status | text | 'pending', 'in_progress', 'success', 'failed' |
| request_data | jsonb | Input parameters sent to API |
| response_data | jsonb | Full API response |
| verified_at | timestamptz | When verification completed |
| verified_by | uuid | Staff user who triggered (if applicable) |
| created_at | timestamptz | Record creation time |

### 2. Edge Functions

| Function | Auth | Purpose |
|----------|------|---------|
| `verify-pan` | JWT | Verify PAN number via VerifiedU |
| `verify-bank-account` | JWT | Verify bank account via VerifiedU (pennyless) |
| `verify-aadhaar-initiate` | JWT | Start DigiLocker flow, get redirect URL |
| `verify-aadhaar-details` | JWT | Fetch Aadhaar details after DigiLocker consent |
| `digilocker-callback` | None | Handle DigiLocker redirect callback |

### 3. Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `PANVerificationButton` | Vendor Registration Step 1 | Inline PAN verify button |
| `BankVerificationButton` | Vendor Registration Step 3 | Inline bank verify button |
| `VerificationStatusBadge` | Staff Review | Show verification status |
| `VerificationPanel` | Staff Review | Trigger verifications, view results |
| `DigilockerSuccess` | New route | Handle DigiLocker callback |

### 4. API Provider Setup

**Required Secret**: `VERIFIEDU_TOKEN`, `VERIFIEDU_COMPANY_ID`, `VERIFIEDU_API_BASE_URL`

**Mock Mode**: If credentials are not configured, all functions return mock data for testing.

## Detailed Implementation

### Phase 1: Database Setup

Create the `vendor_verifications` table with RLS policies:
- Vendors can view their own verifications
- Staff can view and insert verifications for vendors they have access to
- Admins have full access

### Phase 2: PAN Verification

**Edge Function: `supabase/functions/verify-pan/index.ts`**
- Validates PAN format (ABCDE1234F)
- Calls VerifiedU API: `POST /api/verifiedu/VerifyPAN`
- Returns: Name, DOB, validity status
- Stores result in `vendor_verifications`
- Updates vendor record with verified name if applicable

**Frontend Integration:**
- Add "Verify" button next to PAN input in Step 1
- Show verification status (pending/success/failed)
- Display verified name from response
- Staff can also trigger from review page

### Phase 3: Bank Account Verification

**Edge Function: `supabase/functions/verify-bank-account/index.ts`**
- Validates account number and IFSC format
- Calls VerifiedU API: `POST /api/verifiedu/VerifyBankAccountNumber`
- Uses "pennyless" verification type
- Returns: Account holder name, bank name, validity
- Stores result in `vendor_verifications`

**Frontend Integration:**
- Add "Verify" button next to IFSC input in Step 3
- Show verification status
- Display account holder name from response
- Auto-populate bank name if returned

### Phase 4: Aadhaar Verification (DigiLocker)

This is a 3-step redirect flow:

**Step 1: Initiate**
- Edge function calls VerifiedU to get DigiLocker redirect URL
- Creates pending verification record
- Frontend opens DigiLocker in new window/redirect

**Step 2: User Consent**
- User logs into DigiLocker
- Grants consent for Aadhaar access
- DigiLocker redirects to callback URL

**Step 3: Callback & Fetch**
- `digilocker-callback` edge function receives the redirect
- Redirects user to `/digilocker/success?id=xxx`
- Frontend page calls `verify-aadhaar-details` to fetch data
- Stores Aadhaar details (masked UID, name, DOB, gender, address)

**Frontend Integration:**
- Add "Verify Aadhaar via DigiLocker" button in Step 1 or Staff Review
- New route `/digilocker/success` to handle callback
- Show verification status and extracted details

### Phase 5: Staff Review Integration

**Verification Panel Component:**
- New tab in VendorReviewDetail: "Verifications"
- Shows all verification attempts with status
- Staff can trigger PAN/Bank/Aadhaar verification
- Displays extracted data from successful verifications
- Verification results help staff make approval decisions

## Files to Create

| File | Description |
|------|-------------|
| `supabase/functions/verify-pan/index.ts` | PAN verification edge function |
| `supabase/functions/verify-bank-account/index.ts` | Bank verification edge function |
| `supabase/functions/verify-aadhaar-initiate/index.ts` | Start DigiLocker flow |
| `supabase/functions/verify-aadhaar-details/index.ts` | Fetch Aadhaar after consent |
| `supabase/functions/digilocker-callback/index.ts` | Handle DigiLocker redirect |
| `src/components/verification/PANVerificationButton.tsx` | PAN verify UI component |
| `src/components/verification/BankVerificationButton.tsx` | Bank verify UI component |
| `src/components/verification/AadhaarVerificationButton.tsx` | Aadhaar verify UI |
| `src/components/verification/VerificationStatusBadge.tsx` | Status indicator |
| `src/components/verification/VerificationPanel.tsx` | Staff verification panel |
| `src/pages/DigilockerSuccess.tsx` | DigiLocker callback page |
| `src/hooks/useVendorVerifications.tsx` | Verification data hooks |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add DigiLocker routes |
| `src/pages/vendor/VendorRegistration.tsx` | Add verification buttons in Steps 1 & 3 |
| `src/pages/staff/VendorReviewDetail.tsx` | Add Verifications tab |
| `supabase/config.toml` | Add new edge function configurations |

## Security Considerations

- All verification edge functions require JWT authentication (except DigiLocker callback)
- VerifiedU API credentials stored as Supabase secrets
- RLS policies ensure vendors only see their own verification data
- Staff access controlled by existing `can_staff_access_vendor` function
- Sensitive data (full Aadhaar number) is masked in storage

## Technical Details

### PAN API Request/Response
```javascript
// Request
POST /api/verifiedu/VerifyPAN
Headers: { token: "xxx", companyid: "xxx" }
Body: { PanNumber: "ABCDE1234F" }

// Response
{
  data: {
    name: "JOHN DOE",
    dob: "1990-01-15",
    is_valid: true
  }
}
```

### Bank Account API Request/Response
```javascript
// Request
POST /api/verifiedu/VerifyBankAccountNumber
Body: {
  verification_type: "pennyless",
  account_number: "1234567890",
  account_ifsc: "SBIN0001234"
}

// Response
{
  data: {
    account_holder_name: "JOHN DOE",
    bank_name: "STATE BANK OF INDIA",
    is_valid: true
  }
}
```

### DigiLocker Flow
```javascript
// Step 1: Initiate
POST /api/verifiedu/VerifyAadhaarViaDigilocker
Body: { surl: "callback/success", furl: "callback/failure" }
Response: { url: "https://digilocker.gov.in/...", unique_request_number: "xxx" }

// Step 3: Fetch details
POST /api/verifiedu/GetAadhaarDetailsById
Body: { unique_request_number: "xxx" }
Response: {
  aadhaar_uid: "XXXX-XXXX-1234",
  name: "JOHN DOE",
  gender: "Male",
  dob: "1990-01-15",
  addresses: [...]
}
```

## Testing Strategy

1. **Mock Mode Testing**: Test full flow without API credentials
2. **Unit Testing**: Test edge functions with mock API responses
3. **Integration Testing**: Test complete flow with real VerifiedU sandbox
4. **UI Testing**: Verify all buttons, status badges, and error states work correctly

## Implementation Order

1. Database migration (create `vendor_verifications` table)
2. Request VerifiedU API credentials from user
3. Implement PAN verification (simplest, no redirect)
4. Implement Bank verification
5. Implement Aadhaar/DigiLocker flow (most complex)
6. Add verification panel to staff review
7. End-to-end testing

## Questions for You

Before proceeding, I need to confirm:

1. **API Credentials**: Do you have VerifiedU API credentials (Token, Company ID, API URL)?
2. **Scope**: Should verifications be available to vendors during self-registration, or only triggered by staff during review?
3. **Aadhaar Priority**: Is Aadhaar/DigiLocker verification essential for initial launch, or can it be added later?
