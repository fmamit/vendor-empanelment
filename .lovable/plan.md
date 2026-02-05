
# Vendor Invitations Management Page

## Overview
Create a dedicated page where staff can view and manage all vendor invitations, track their status, copy links, and resend notifications.

## Status Categories
Based on the invitation data:
- **Pending**: `used_at` is null AND `expires_at` is in the future
- **Accepted**: `used_at` is not null (vendor completed registration)
- **Expired**: `used_at` is null AND `expires_at` is in the past

## Implementation

### 1. Create New Page: `src/pages/staff/VendorInvitations.tsx`

A table-based view showing all invitations with:
- Company name and category
- Contact details (phone, email)
- Status badge (Pending/Accepted/Expired)
- Creation date
- Expiry date
- Actions column with:
  - Copy link button
  - Resend email button
  - Resend WhatsApp button

The page will include:
- Filter tabs to quickly view by status (All, Pending, Accepted, Expired)
- Search functionality for company name
- A prominent "Invite New Vendor" button at the top

### 2. Update Routing: `src/App.tsx`

Add new route:
```text
/staff/invitations -> VendorInvitations page
```

### 3. Update Sidebar Navigation: `src/components/layout/StaffSidebar.tsx`

Add "Invitations" link under the Main section (visible to Makers and Admins) with a badge showing pending invitation count.

### 4. Features

| Feature | Description |
|---------|-------------|
| Status Badges | Color-coded badges (green for accepted, yellow for pending, red for expired) |
| Copy Link | Quick copy of the registration URL to clipboard |
| Resend Email | Re-trigger invitation email using existing hook |
| Resend WhatsApp | Re-trigger WhatsApp message using existing hook |
| Filter Tabs | Quick filters for All/Pending/Accepted/Expired |
| Search | Filter by company name |
| Responsive | Works on both desktop and mobile |

---

## Technical Details

### Data Flow
```text
useInvitationsList() hook
        |
        v
VendorInvitations page
        |
        +-- Filter by status (computed from expires_at/used_at)
        +-- Render table with action buttons
        +-- useSendInvitationEmail() for resend
        +-- useSendInvitationWhatsApp() for resend
```

### Status Computation Logic
```text
function getInvitationStatus(invitation):
    if invitation.used_at is not null:
        return "accepted"
    else if invitation.expires_at < now:
        return "expired"
    else:
        return "pending"
```

### Files to Create/Modify
- **Create**: `src/pages/staff/VendorInvitations.tsx` - Main management page
- **Modify**: `src/App.tsx` - Add route
- **Modify**: `src/components/layout/StaffSidebar.tsx` - Add navigation link
