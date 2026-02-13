
## Email-Based Vendor Invitation System

### What Changes

The "Invite a Vendor" button will navigate to a new dedicated page (`/staff/invite-vendor`) where staff can:
1. Fill in a vendor's email, company name, phone, and category to send a personalized invitation
2. See a list of all invitations they've previously sent, with status (pending, used, expired)

An invitation email with a registration link will be sent via a new backend function using Resend.

### New Pages and Components

**1. New Page: `src/pages/staff/StaffInviteVendor.tsx`**
- Top section: Invitation form with fields for Email, Company Name, Phone, and Category (dropdown from `vendor_categories`)
- "Send Invitation" button that calls the new backend function
- Bottom section: List of sent invitations showing company name, email, status (Pending / Used / Expired), and sent date
- Fetches invitations from `vendor_invitations` table filtered by `created_by = current user`

**2. New Backend Function: `supabase/functions/send-vendor-invitation/index.ts`**
- Accepts: `company_name`, `contact_email`, `contact_phone`, `category_id`
- Validates inputs and checks the authenticated staff user
- Generates a unique token (UUID)
- Inserts a record into `vendor_invitations` with 7-day expiry
- Sends an invitation email via Resend (using `noreply@in-sync.co.in`) containing the registration link (`/register/ref/{staff_referral_code}`) and vendor details
- Returns success with invitation ID

**3. Route and Navigation Updates**
- Add route `/staff/invite-vendor` in `App.tsx`
- Update "Invite a Vendor" button in `StaffDashboard.tsx` to navigate to `/staff/invite-vendor` instead of `/staff/queue`
- Remove the `ReferralLinkCard` from `StaffReviewQueue.tsx` (keep the queue focused on review)

### Layout of the Invite Vendor Page

```text
+----------------------------------+
|  Staff Layout: "Invite a Vendor" |
+----------------------------------+
|  [Invite Form Card]              |
|    Company Name: [__________]    |
|    Email:        [__________]    |
|    Phone:        [__________]    |
|    Category:     [dropdown__]    |
|    [Send Invitation]             |
+----------------------------------+
|  [My Referral Link Card]         |
|    QR Code + Shareable Link      |
+----------------------------------+
|  [Sent Invitations]              |
|    - Acme Corp | a@b.com         |
|      Pending | 2 days ago        |
|    - Beta Ltd | c@d.com          |
|      Used    | 5 days ago        |
+----------------------------------+
```

### Technical Details

**Database**: No schema changes needed -- `vendor_invitations` table already has all required columns (`company_name`, `contact_email`, `contact_phone`, `category_id`, `token`, `created_by`, `expires_at`, `used_at`).

**Backend Function** (`send-vendor-invitation`):
- Uses `RESEND_API_KEY` secret (already configured)
- Authenticates the calling staff user via the Authorization header
- Generates token via `crypto.randomUUID()`
- Inserts invitation record
- Sends branded email with registration link

**Files to create:**
- `src/pages/staff/StaffInviteVendor.tsx`
- `supabase/functions/send-vendor-invitation/index.ts`

**Files to modify:**
- `src/App.tsx` -- add route for `/staff/invite-vendor`
- `src/pages/staff/StaffDashboard.tsx` -- change navigate target from `/staff/queue` to `/staff/invite-vendor`
- `src/pages/staff/StaffReviewQueue.tsx` -- remove `ReferralLinkCard` import and usage
- `supabase/config.toml` -- add `[functions.send-vendor-invitation]` with `verify_jwt = false`
