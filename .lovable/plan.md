

# Email Notifications Implementation Plan

## Overview

This plan implements email notifications for the vendor management system using Resend as the email provider. The system will send transactional emails for vendor workflow events such as invitation creation, status changes, and approval/rejection notifications.

## Current State Analysis

- **Existing notifications table**: Already exists in the database with `recipient_id`, `title`, `message`, `notification_type`, and `related_vendor_id` columns
- **No edge functions**: The `supabase/functions` directory is currently empty
- **No RESEND_API_KEY**: Not yet configured in secrets
- **Vendor workflow hooks**: `useUpdateVendorStatus` and `useCreateInvitation` are the key points where emails should be triggered

## Email Notification Triggers

| Event | Recipients | Email Type |
|-------|-----------|------------|
| Vendor invitation created | Vendor contact email | Invitation with registration link |
| Vendor submits application | Staff (Makers) | New application notification |
| Status: pending_review -> in_verification | Vendor | Status update |
| Status: in_verification -> pending_approval | Vendor | Status update |
| Status: approved | Vendor | Approval confirmation |
| Status: rejected | Vendor | Rejection with reason |

---

## Implementation Steps

### Phase 1: Setup and Configuration

**Step 1.1: Configure Resend API Key**
- You need to provide a Resend API key
- Go to https://resend.com and create an account if you don't have one
- Verify your sending domain at https://resend.com/domains
- Create an API key at https://resend.com/api-keys

**Step 1.2: Add Shared Utilities**
Create reusable CORS headers and retry utilities for edge functions:
- `supabase/functions/_shared/cors-headers.ts`

### Phase 2: Edge Functions

**Step 2.1: Create `send-vendor-email` Function**
A single edge function that handles all vendor-related emails with different templates:

```text
supabase/functions/send-vendor-email/index.ts
```

Features:
- Email type parameter (invitation, status_update, approved, rejected)
- Merge tag replacement for personalization
- CORS support for frontend calls
- Error handling with proper responses

**Email Templates:**

1. **Invitation Email**
   - Subject: "You're invited to register as a vendor with Capital India"
   - Body: Welcome message + registration link + expiry notice

2. **Status Update Email**
   - Subject: "Your vendor application status has been updated"
   - Body: New status + next steps

3. **Approval Email**
   - Subject: "Congratulations! Your vendor application has been approved"
   - Body: Approval confirmation + vendor code + login instructions

4. **Rejection Email**
   - Subject: "Update on your vendor application"
   - Body: Rejection notice + reason + contact information

### Phase 3: Frontend Integration

**Step 3.1: Create Email Service Hook**
Create `src/hooks/useEmailNotifications.tsx` to call the edge function:

```text
- useSendVendorEmail() mutation hook
- Email type definitions
- Error handling with toast notifications
```

**Step 3.2: Integrate with Invitation Flow**
Update `CreateInvitationDialog.tsx` to send invitation email after link generation:
- Call `sendVendorEmail` with type "invitation"
- Include registration link in email body
- Show success/error feedback

**Step 3.3: Integrate with Workflow Status Updates**
Update `useUpdateVendorStatus` in `useStaffWorkflow.tsx`:
- Send appropriate email when status changes
- Fetch vendor email from vendor record
- Handle approval/rejection emails with appropriate content

### Phase 4: Email Templates and Styling

**Step 4.1: Create HTML Email Templates**
Inline-styled HTML templates for consistent rendering across email clients:

```text
src/lib/email-templates.ts
- getInvitationEmailHtml()
- getStatusUpdateEmailHtml()
- getApprovalEmailHtml()
- getRejectionEmailHtml()
```

Template features:
- Capital India branding
- Mobile-responsive design
- Professional layout with header/footer
- Merge tags for personalization ({{company_name}}, {{vendor_code}}, etc.)

---

## Technical Details

### Edge Function Structure

```text
supabase/functions/send-vendor-email/index.ts

Request body:
{
  "email_type": "invitation" | "status_update" | "approved" | "rejected",
  "to_email": "vendor@example.com",
  "to_name": "Company Name",
  "merge_data": {
    "company_name": "...",
    "registration_link": "...",
    "vendor_code": "...",
    "rejection_reason": "...",
    "new_status": "..."
  }
}

Response:
{
  "success": true,
  "email_id": "resend-email-id"
}
```

### Security Considerations

- Edge function requires authentication (Authorization header)
- Service role key used for database lookups
- CORS headers configured for web access
- No sensitive data in email logs

### File Changes Summary

| Action | File |
|--------|------|
| Create | `supabase/functions/_shared/cors-headers.ts` |
| Create | `supabase/functions/send-vendor-email/index.ts` |
| Create | `src/lib/email-templates.ts` |
| Create | `src/hooks/useEmailNotifications.tsx` |
| Modify | `src/components/staff/CreateInvitationDialog.tsx` |
| Modify | `src/hooks/useStaffWorkflow.tsx` |

---

## Prerequisites Before Implementation

1. **Resend Account Setup**
   - Sign up at https://resend.com
   - Add and verify your sending domain
   - Create an API key

2. **Provide API Key**
   - After creating the API key, I'll need you to provide it so I can add it as a secret

---

## Next Steps After Approval

1. I'll ask you to provide the RESEND_API_KEY
2. Create the edge function and shared utilities
3. Create the email templates
4. Create the frontend hook
5. Integrate with invitation and workflow flows
6. Test the email sending

