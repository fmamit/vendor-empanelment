

# Vendor Referral Registration Page

## Overview

Build a public, unauthenticated, mobile-first vendor registration form at `/register/ref/:token`. Staff share the link; vendors complete onboarding without logging in. The invitation token (from `vendor_invitations`) is their access key.

## User Flow (4 Steps)

1. **Company Details** -- Company Name (pre-filled), Trade Name, Category (locked), GST, PAN
2. **Contact Details** -- Contact Name, Mobile + OTP verification, Email (all pre-filled from invitation)
3. **Banking Details** -- Bank Name, Branch, Account Number, IFSC
4. **Documents** -- Category-specific uploads from `category_documents` table, then submit

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/vendor/VendorReferralRegistration.tsx` | Main page with step state machine and token validation |
| `src/components/referral/ReferralHeader.tsx` | Sticky header with Capital India logo |
| `src/components/referral/ReferralStepper.tsx` | 4-step progress bar |
| `src/components/referral/CompanyDetailsStep.tsx` | Step 1 form |
| `src/components/referral/ContactDetailsStep.tsx` | Step 2 form with phone OTP |
| `src/components/referral/BankDetailsStep.tsx` | Step 3 form |
| `src/components/referral/DocumentUploadStep.tsx` | Step 4 category-specific uploads |
| `supabase/functions/submit-vendor-referral/index.ts` | Creates vendor, auth user, vendor_users link, marks invitation used |
| `supabase/functions/upload-referral-document/index.ts` | Handles document uploads for unauthenticated users |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add public route `/register/ref/:token` |
| `supabase/config.toml` | Add `verify_jwt = false` for new edge functions |

## Backend: Edge Functions

**`submit-vendor-referral`** (service role, public):
- Validates token (exists, not expired, not used)
- Creates `vendors` record (status: `pending_review`)
- Creates auth user via phone number
- Creates `vendor_users` link
- Marks invitation as used (`used_at = now()`, links `vendor_id`)

**`upload-referral-document`** (service role, public):
- Validates token
- Uploads file to storage
- Creates `vendor_documents` record

## State Management
- `useState` in parent page for all form fields
- `localStorage` key `vendor_referral_form_state` for persistence across reloads
- Pre-fill from invitation data on mount
- Clear on successful submission

## Universal Link Accessibility
- Links use `VITE_PUBLIC_URL` / fallback `https://onboardly-path.lovable.app`
- Format: `https://onboardly-path.lovable.app/register/ref/{token}`
- No login required -- fully public route
- Token validated server-side before any writes
- Expired and already-used tokens rejected

## No Database Changes Needed
All required tables already exist: `vendor_invitations`, `vendors`, `vendor_users`, `vendor_documents`, `vendor_categories`, `category_documents`, `document_types`.

