

# Invitation-Based Vendor Registration System

## Overview
Transform the vendor registration workflow from an open self-registration system to a controlled, invitation-only process. Staff members will generate secure, time-limited registration links for specific vendors, ensuring only authorized vendors can complete registration.

## How It Will Work

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CURRENT FLOW (Open)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Anyone → /vendor/register → Fill Form → Submit → Review Queue             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ↓

┌─────────────────────────────────────────────────────────────────────────────┐
│                         NEW FLOW (Invitation-Only)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Staff Dashboard                                                            │
│        │                                                                     │
│        ▼                                                                     │
│   "Create Vendor Invitation"                                                 │
│        │                                                                     │
│        ├──→ Enter: Company Name, Category, Contact Phone, Email             │
│        │                                                                     │
│        ▼                                                                     │
│   System generates:                                                          │
│        • Unique token (e.g., abc123xyz)                                      │
│        • Registration link: /vendor/register?token=abc123xyz                 │
│        • Expiry: 7 days                                                      │
│        │                                                                     │
│        ▼                                                                     │
│   Staff shares link with vendor                                              │
│        │                                                                     │
│        ▼                                                                     │
│   Vendor opens link → Token validated → Pre-filled form → Complete details  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Features

1. **Staff-Generated Invitations**: Only authenticated staff (Maker/Admin) can create registration links
2. **Pre-filled Data**: Category, company name, and contact details are pre-populated from the invitation
3. **Token Validation**: Registration page checks token validity before allowing access
4. **Expiry Control**: Links expire after 7 days (configurable)
5. **One-Time Use**: Token is consumed upon successful registration
6. **Audit Trail**: Track who created each invitation and when

---

## Implementation Plan

### Phase 1: Database Changes

**New Table: `vendor_invitations`**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| token | TEXT | Unique, secure token (used in URL) |
| category_id | UUID | Pre-selected vendor category |
| company_name | TEXT | Company name for the invitation |
| contact_phone | TEXT | Primary contact phone |
| contact_email | TEXT | Primary contact email |
| created_by | UUID | Staff user who created the invitation |
| expires_at | TIMESTAMPTZ | Expiration timestamp (default: 7 days) |
| used_at | TIMESTAMPTZ | When the invitation was used (null = unused) |
| vendor_id | UUID | Links to created vendor after registration |
| created_at | TIMESTAMPTZ | Creation timestamp |

**RLS Policies:**
- Staff (Maker/Admin) can create and view invitations
- Anonymous users can read invitation details by token (for registration page validation)

---

### Phase 2: Staff UI - Create Invitation

**New Component**: `src/components/staff/CreateInvitationDialog.tsx`

A dialog/modal accessible from the Staff Dashboard with:
- Category dropdown (from vendor_categories)
- Company name input
- Contact phone input
- Contact email input
- "Generate Link" button
- Display generated link with copy-to-clipboard functionality

**Update**: `src/pages/staff/StaffDashboard.tsx`
- Add "Invite Vendor" button in the dashboard
- Link to invitation management

---

### Phase 3: Modify Registration Flow

**Update**: `src/pages/vendor/VendorRegistration.tsx`

1. Read `token` from URL query parameters
2. If no token or invalid token:
   - Show "Invalid or expired invitation" error
   - Provide contact information for Capital India
3. If valid token:
   - Pre-fill category, company name, contact details
   - Lock category selection (already chosen by staff)
   - Allow vendor to complete remaining fields
4. On successful submission:
   - Mark invitation as used
   - Create vendor and vendor_user records
   - Navigate to login or dashboard

---

### Phase 4: Token Generation & Validation

**New Hook**: `src/hooks/useVendorInvitations.tsx`

- `useCreateInvitation()` - Staff creates new invitation
- `useValidateInvitation(token)` - Check if token is valid and not expired
- `useConsumeInvitation(token, vendorId)` - Mark invitation as used

**Token Format**: Secure random string (e.g., 32-character alphanumeric)

---

### Phase 5: Block Direct Access

**Update**: `src/pages/vendor/VendorRegistration.tsx`

- Remove direct access without valid token
- Show "Access Denied" message with instructions to contact Capital India

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/staff/CreateInvitationDialog.tsx` | UI for creating invitations |
| `src/hooks/useVendorInvitations.tsx` | Invitation management hooks |
| Database migration | Create vendor_invitations table |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/vendor/VendorRegistration.tsx` | Add token validation, pre-fill logic, block direct access |
| `src/pages/staff/StaffDashboard.tsx` | Add "Invite Vendor" button |

---

## Technical Details

### Token Generation (Client-side)
```typescript
const generateToken = () => {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};
```

### Invitation Validation Query
```typescript
const { data: invitation } = await supabase
  .from('vendor_invitations')
  .select('*, vendor_categories(name)')
  .eq('token', token)
  .is('used_at', null)
  .gt('expires_at', new Date().toISOString())
  .single();
```

### Registration Flow with Invitation
1. User opens `/vendor/register?token=abc123`
2. Page fetches invitation by token
3. If valid: pre-fill form with invitation data
4. User completes registration
5. On submit: create vendor, link to invitation, mark used

---

## Security Considerations

- Tokens are cryptographically random (48 hex characters)
- Tokens expire after 7 days
- One-time use only
- RLS ensures only staff can create invitations
- Anonymous users can only read their specific invitation by token

---

## User Experience

**For Staff:**
1. Click "Invite Vendor" on dashboard
2. Fill in basic vendor details
3. Copy generated link
4. Share with vendor via email/WhatsApp

**For Vendors:**
1. Receive link from Capital India
2. Open link - see pre-filled form
3. Complete remaining details
4. Upload documents
5. Submit application

