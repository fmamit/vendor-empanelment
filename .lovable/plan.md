

# Staff Personal Referral Code System

## What Changes

Replace the current per-vendor invitation token model with a **permanent personal referral code per staff member**. Each staff gets a code like `REF-ABCD1234` that they can share freely. Any vendor who clicks the link fills out the registration form from scratch (no pre-filled data).

## New Database Table

**`staff_referral_codes`** -- stores one referral code per staff member:

| Column | Type | Details |
|--------|------|---------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users, unique |
| referral_code | text | Unique, e.g. `REF-ABCD1234` |
| is_active | boolean | Default true |
| created_at | timestamp | Auto |

RLS policies:
- Staff can SELECT their own code
- Admins can manage all codes
- **Public/anon can SELECT** (needed for the public referral form to validate codes)

A database trigger auto-generates a code when a staff profile is created (or we generate on first access).

## Changes to the Referral Registration Page

The existing `/register/ref/:token` route and `VendorReferralRegistration.tsx` will be updated:

- **Token validation**: Query `staff_referral_codes` instead of `vendor_invitations` to validate the code and retrieve the referring staff member's `user_id`
- **No pre-filling**: Since the code is generic, the vendor fills in all fields (company name, category selection, contact details, etc.)
- **Add category picker**: Step 1 gets a category dropdown (currently locked from invitation data)
- **Submission**: The `submit-vendor-referral` edge function will accept a `referral_code` instead of an invitation token, and store the referring staff's `user_id` on the vendor record (new `referred_by` column on `vendors` table)

## New Staff Page: "My Profile & Referral Link"

A new page at `/staff/profile` (added to sidebar), inspired by the screenshot:

**Section 1 -- Personal Information**
- First Name, Last Name, Email, Phone (from `profiles` table)
- "Save Changes" button

**Section 2 -- Referral Link**
- QR code generated client-side (using a lightweight QR library or canvas-based generation)
- Referral code displayed prominently (e.g. `REF-ABCD1234`)
- Full shareable URL in a read-only input with copy button
- URL format: `https://onboardly-path.lovable.app/register/ref/REF-ABCD1234`

## Sidebar Update

Add "My Profile" link to the staff sidebar with a User icon, placed above the sign-out button in the footer area.

## Vendor Record Enhancement

Add a `referred_by` column (nullable uuid) to the `vendors` table to track which staff member referred the vendor. This enables reporting on staff referral performance.

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/pages/staff/StaffProfile.tsx` | Profile page with personal info + referral link section |
| `src/components/staff/ReferralLinkCard.tsx` | QR code + referral code + copy link component |

### Files to Modify
| File | Changes |
|------|---------|
| `src/App.tsx` | Add route `/staff/profile` |
| `src/components/layout/StaffSidebar.tsx` | Add "My Profile" nav item |
| `src/pages/vendor/VendorReferralRegistration.tsx` | Validate against `staff_referral_codes`, add category picker, remove pre-fill logic |
| `src/components/referral/CompanyDetailsStep.tsx` | Add category dropdown, all fields editable |
| `supabase/functions/submit-vendor-referral/index.ts` | Accept `referral_code`, look up staff user, store `referred_by` |

### Database Migrations
1. Create `staff_referral_codes` table with RLS
2. Add `referred_by` column to `vendors` table
3. Create a function to auto-generate referral codes (format: `REF-` + 8 random alphanumeric chars)
4. Optionally seed codes for existing staff members

### QR Code Generation
Use canvas-based QR generation (no external library needed) or a lightweight library like `qrcode` to render the QR code client-side from the referral URL. This avoids any backend dependency for QR generation.

### Security
- Referral codes are validated server-side in the edge function before any vendor records are created
- The `submit-vendor-referral` edge function continues to use service role to bypass RLS for vendor/user creation
- Inactive codes (`is_active = false`) are rejected
- Phone OTP verification remains mandatory for the vendor

