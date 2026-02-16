
# Fix Document Upload in Referral Registration

## Problem
The document upload fails because of a **token mismatch** between the referral flow and the edge function:

- The referral registration page passes the **referral code** (e.g., `REF-ABCD1234`) as the `token` to the upload function
- The `upload-referral-document` edge function tries to look up this token in the `vendor_invitations` table, which is for the **old invitation flow**
- Since no matching record exists in `vendor_invitations`, the function returns "Invalid token" (400 error)

## Solution
Update the `upload-referral-document` edge function to support **both** flows:

1. First, try looking up the token in `vendor_invitations` (existing invitation flow)
2. If not found, try looking up the token in `staff_referral_codes` (referral flow)
3. Use the matched record to determine the storage path

### Technical Changes

**File: `supabase/functions/upload-referral-document/index.ts`**

Replace the token validation logic (lines 89-101) to:
- First attempt: query `vendor_invitations` by `token` (existing behavior)
- Fallback attempt: query `staff_referral_codes` by `referral_code` where `is_active = true`
- Use the referral code's `id` as the folder identifier for storage path when matched via referral flow
- Return "Invalid token" only if **both** lookups fail

The storage path will use `referral/{identifier}/{documentTypeId}/...` where `identifier` is either the invitation ID or the referral code ID, keeping uploads organized.

The vendor document record linking (lines 124-133) will be skipped for referral uploads since no vendor record exists yet at upload time -- documents will be linked during the final `submit-vendor-referral` step.
