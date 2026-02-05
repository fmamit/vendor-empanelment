
# WhatsApp Integration Implementation Plan

## Overview

This plan implements WhatsApp Business API integration using Exotel for the Capital India Vendor Management System. The system will enable staff to send WhatsApp messages to vendors during the onboarding workflow, track message delivery status, and receive inbound messages from vendors.

## Current State Analysis

- **Existing email system**: Already implemented with `send-vendor-email` edge function and `useEmailNotifications` hook
- **Existing notifications table**: Has `notification_type` column that could support 'whatsapp'
- **Vendor data**: Vendors have `primary_mobile` field for WhatsApp messaging
- **Staff workflow**: `CreateInvitationDialog` and `useStaffWorkflow` are integration points

---

## Implementation Phases

### Phase 1: Database Schema

Create tables to store WhatsApp configuration, messages, and templates.

**Table 1: `whatsapp_settings`**
Stores Exotel API credentials per organization.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| exotel_sid | text | Exotel Account SID |
| exotel_api_key | text | API Key |
| exotel_api_token | text | API Token (secret) |
| exotel_subdomain | text | Regional subdomain |
| whatsapp_source_number | text | Business WhatsApp number |
| waba_id | text | WhatsApp Business Account ID |
| is_active | boolean | Enable/disable |

**Table 2: `whatsapp_messages`**
Logs all sent and received WhatsApp messages.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| vendor_id | uuid | Reference to vendors table |
| phone_number | text | Recipient phone |
| message_content | text | Message body |
| template_name | text | Template identifier |
| template_variables | jsonb | Variable values |
| direction | text | 'inbound' or 'outbound' |
| status | text | pending/sent/delivered/read/failed |
| exotel_message_id | text | Exotel SID for tracking |
| sent_by | uuid | Staff user who sent |
| sent_at | timestamptz | When sent |
| delivered_at | timestamptz | When delivered |
| read_at | timestamptz | When read |
| error_message | text | Error details if failed |

**Table 3: `whatsapp_templates`**
Stores pre-approved WhatsApp message templates.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| template_name | text | Unique template name |
| category | text | UTILITY/MARKETING |
| content | text | Message body with placeholders |
| variables | jsonb | Variable definitions |
| status | text | approved/pending/rejected |
| is_active | boolean | Can be used |

---

### Phase 2: Edge Functions

**Function 1: `send-whatsapp-message`**
Send WhatsApp messages via Exotel API.

```text
POST /functions/v1/send-whatsapp-message

Request:
{
  "vendor_id": "uuid",
  "phone_number": "+919876543210",
  "template_name": "vendor_invitation",
  "template_variables": {
    "1": "Company Name",
    "2": "Registration Link"
  }
}

Response:
{
  "success": true,
  "message_id": "exotel_sid"
}
```

Features:
- Fetch Exotel credentials from `whatsapp_settings`
- Build proper Exotel V2 API payload
- Log message to `whatsapp_messages`
- Handle errors gracefully

**Function 2: `whatsapp-webhook`**
Handle inbound messages and delivery reports from Exotel.

```text
POST /functions/v1/whatsapp-webhook

Webhook types:
- Inbound messages (customer replies)
- Delivery receipts (DLR): sent -> delivered -> read
```

Features:
- Parse Exotel nested payload format
- Update message status in database
- Create contact record for new inbound senders
- Enable realtime updates to frontend

**Function 3: `sync-whatsapp-templates`**
Fetch approved templates from Exotel/Meta.

---

### Phase 3: Frontend Components

**Component 1: `SendWhatsAppDialog.tsx`**
Dialog to send WhatsApp messages to vendors.

```text
src/components/staff/SendWhatsAppDialog.tsx

Features:
- Select from approved templates
- Preview message with variable substitution
- Input template variables
- Send button with loading state
- Success/error feedback
```

**Component 2: `WhatsAppHistory.tsx`**
Display message history for a vendor.

```text
src/components/staff/WhatsAppHistory.tsx

Features:
- List sent/received messages
- Status badges (sent, delivered, read, failed)
- Realtime updates via Supabase channel
- Formatted timestamps
```

**Component 3: `WhatsAppSettingsForm.tsx`**
Admin form to configure Exotel credentials.

```text
src/components/admin/WhatsAppSettingsForm.tsx

Features:
- Input fields for API credentials
- Test connection button
- Save/update settings
- Sync templates button
```

---

### Phase 4: Integration with Existing Workflow

**4.1 Update `CreateInvitationDialog.tsx`**
Add option to send WhatsApp invitation alongside email.

```text
Changes:
- Add checkbox: "Also send WhatsApp invitation"
- If checked, call send-whatsapp-message with invitation template
- Show combined success message
```

**4.2 Update `useStaffWorkflow.tsx`**
Add WhatsApp notifications for status changes.

```text
Triggers:
- Approved: Send approval WhatsApp with vendor code
- Rejected: Send rejection notice
- Status updates: Notify of progress
```

**4.3 Add `useWhatsAppNotifications.tsx` Hook**
New hook for WhatsApp messaging.

```text
src/hooks/useWhatsAppNotifications.tsx

Exports:
- useSendWhatsApp() - Send message mutation
- useWhatsAppHistory(vendorId) - Message history query
- useWhatsAppSettings() - Settings query/mutation
```

---

### Phase 5: Vendor Review Detail Enhancement

Update `VendorReviewDetail.tsx` to show communication tab.

```text
New tab: "Communication"
- WhatsApp message history
- Send new message button
- Email history (future)
```

---

## File Changes Summary

| Action | File |
|--------|------|
| Create | `supabase/functions/send-whatsapp-message/index.ts` |
| Create | `supabase/functions/whatsapp-webhook/index.ts` |
| Create | `supabase/functions/sync-whatsapp-templates/index.ts` |
| Create | `src/hooks/useWhatsAppNotifications.tsx` |
| Create | `src/components/staff/SendWhatsAppDialog.tsx` |
| Create | `src/components/staff/WhatsAppHistory.tsx` |
| Create | `src/components/admin/WhatsAppSettingsForm.tsx` |
| Modify | `src/components/staff/CreateInvitationDialog.tsx` |
| Modify | `src/hooks/useStaffWorkflow.tsx` |
| Modify | `src/pages/staff/VendorReviewDetail.tsx` |
| Modify | `supabase/config.toml` |

---

## Required Secrets

The following Exotel credentials need to be configured:

| Secret Name | Description |
|-------------|-------------|
| EXOTEL_SID | Exotel Account SID |
| EXOTEL_API_KEY | Exotel API Key |
| EXOTEL_API_TOKEN | Exotel API Token |
| EXOTEL_SUBDOMAIN | API subdomain (default: api.exotel.com) |
| WHATSAPP_SOURCE_NUMBER | Your WhatsApp Business number |
| WABA_ID | WhatsApp Business Account ID |

---

## Database Migration SQL

```sql
-- WhatsApp Settings
CREATE TABLE public.whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exotel_sid TEXT,
  exotel_api_key TEXT,
  exotel_api_token TEXT,
  exotel_subdomain TEXT DEFAULT 'api.exotel.com',
  whatsapp_source_number TEXT,
  waba_id TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp Messages
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id),
  phone_number TEXT NOT NULL,
  message_content TEXT,
  template_name TEXT,
  template_variables JSONB,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'pending',
  exotel_message_id TEXT,
  sent_by UUID,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp Templates
CREATE TABLE public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'UTILITY',
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can manage whatsapp settings" ON public.whatsapp_settings
  FOR ALL USING (is_internal_staff(auth.uid()));

CREATE POLICY "Staff can view whatsapp messages" ON public.whatsapp_messages
  FOR SELECT USING (is_internal_staff(auth.uid()));

CREATE POLICY "Staff can insert whatsapp messages" ON public.whatsapp_messages
  FOR INSERT WITH CHECK (is_internal_staff(auth.uid()));

CREATE POLICY "Staff can update whatsapp messages" ON public.whatsapp_messages
  FOR UPDATE USING (is_internal_staff(auth.uid()));

CREATE POLICY "Staff can view templates" ON public.whatsapp_templates
  FOR SELECT USING (is_internal_staff(auth.uid()));

CREATE POLICY "Admins can manage templates" ON public.whatsapp_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Enable Realtime for live status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;

-- Indexes
CREATE INDEX idx_whatsapp_messages_vendor ON public.whatsapp_messages(vendor_id);
CREATE INDEX idx_whatsapp_messages_exotel_id ON public.whatsapp_messages(exotel_message_id);
CREATE INDEX idx_whatsapp_messages_status ON public.whatsapp_messages(status);
```

---

## Implementation Order

1. **Ask for Exotel credentials** - Need API keys before proceeding
2. **Create database tables** - Run migration
3. **Create edge functions** - Deploy send and webhook functions
4. **Create frontend hooks** - `useWhatsAppNotifications`
5. **Create UI components** - Dialog, history, settings
6. **Integrate with workflow** - Add WhatsApp to invitation and status flows
7. **Configure webhook URL** in Exotel dashboard
8. **Test end-to-end** - Send test messages and verify delivery

---

## Prerequisites

Before implementation, please provide:

1. **Exotel Account** - Sign up at https://exotel.com
2. **WhatsApp Business Account** - Set up through Exotel
3. **API Credentials** - SID, API Key, API Token
4. **Approved Templates** - At least one approved template for sending

---

## Template Examples

Pre-defined templates to create in Exotel:

**1. vendor_invitation**
```text
Hello {{1}}! You've been invited to register as a vendor with Capital India. 
Complete your registration here: {{2}}
This link expires in 7 days.
```

**2. status_approved**
```text
Congratulations {{1}}! Your vendor application for {{2}} has been approved.
Your Vendor Code: {{3}}
Welcome aboard!
```

**3. status_rejected**
```text
Dear {{1}}, we regret to inform you that your vendor application for {{2}} 
could not be approved. Reason: {{3}}
Contact us for more information.
```

**4. status_update**
```text
Hi {{1}}, your vendor application status has been updated to: {{2}}
Our team is reviewing your application.
```
