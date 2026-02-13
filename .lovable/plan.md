

# DPDP Act 2023 / Rules 2025 — Compliance Gap Analysis and Implementation Plan

## What the Document Requires

The DPDP Rules 2025 operationalize the Digital Personal Data Protection Act, 2023. The framework rests on **7 core principles**: consent, transparency, purpose limitation, data minimisation, accuracy, storage limitation, security safeguards, and accountability. It grants citizens specific rights and imposes penalties up to **INR 250 crore** for non-compliance.

---

## Already Incorporated

| DPDP Requirement | Current Implementation |
|---|---|
| **Purpose limitation** | Registration collects only vendor-onboarding-relevant data (company, contact, bank, documents) |
| **Data minimisation** | Form fields are scoped to business need; no extraneous personal data collected |
| **Right to Correct / Update** | "Send Back" flow allows vendors to correct and resubmit data |
| **Storage limitation (partial)** | Document expiry tracking with 30/15/7-day alerts |
| **Security safeguards** | RLS on all tables; data isolated by role; OTP codes inaccessible directly |
| **Accountability / Audit trail** | `workflow_history` table logs every action with actor and timestamp |
| **Role-based access control** | Maker/Checker/Approver/Admin with `user_roles` + `is_internal_staff()` |
| **Input validation** | Edge functions validate PAN, GST, IFSC, phone formats |
| **Children's data** | N/A — B2B portal, no children's data collected |

---

## Gaps Requiring Implementation

| # | DPDP Requirement | Gap | Severity |
|---|---|---|---|
| 1 | **Informed Consent Notice** — Clear, separate notice explaining *what* data is collected, *why*, and for how long. Must be given *before* collection. | No consent step exists. Registration starts directly. | **Critical** |
| 2 | **Consent Withdrawal** — Individuals can withdraw consent at any time | No mechanism to withdraw consent or request processing stop | **Critical** |
| 3 | **Right to Access Personal Data** — Individuals can request a copy of all data held about them | No "Download My Data" feature | **High** |
| 4 | **Right to Erasure** — Request removal of personal data | No data deletion/erasure request mechanism | **High** |
| 5 | **Right to Nominate** — Appoint someone to exercise data rights on their behalf | Not implemented | **Medium** |
| 6 | **Data Breach Notification** — Inform affected individuals without delay in plain language | No breach notification system | **High** |
| 7 | **90-day Response SLA** — Respond to all data rights requests within 90 days | No request tracking with deadlines | **Medium** |
| 8 | **DPO / Contact Display** — Clear contact information for data queries | No DPO contact shown anywhere | **Low** |
| 9 | **Privacy Policy Page** — Plain-language explanation of data practices | No privacy policy page | **Low** |

---

## Implementation Plan

### Phase A: Consent Framework (Critical)

**A1. Database: `consent_records` table**

```text
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  user_identifier TEXT NOT NULL,        -- phone or email
  consent_version TEXT NOT NULL,        -- e.g. "1.0"
  purpose TEXT NOT NULL,                -- e.g. "vendor_onboarding"
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
- RLS: Vendors see own records; staff read-only; admins full access.

**A2. Consent Notice Step in Registration**
- Add a **Step 0** before Company Details in `VendorReferralRegistration.tsx`
- Display a clear consent notice explaining:
  - What data is collected (company info, contact details, bank details, identity documents)
  - Why it is collected (vendor onboarding and verification)
  - How long it will be retained
  - Right to withdraw consent
- Vendor must check a consent checkbox before proceeding
- Record consent with timestamp and version in `consent_records`

**A3. Consent Withdrawal**
- Add "Withdraw Consent" button on Vendor Dashboard
- When triggered: update `consent_records.withdrawn_at`, flag vendor record, notify admin
- Vendor data processing stops (status changes to a new `consent_withdrawn` state)

### Phase B: Data Rights Portal (High Priority)

**B1. Database: `data_requests` table**

```text
CREATE TABLE data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  requested_by UUID NOT NULL,
  request_type TEXT NOT NULL,           -- 'access', 'erasure', 'correction', 'nomination'
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, rejected
  due_date TIMESTAMPTZ NOT NULL,        -- auto-set to created_at + 90 days
  completed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**B2. "Download My Data" (Right to Access)**
- Button on Vendor Dashboard that compiles all vendor data (profile, documents metadata, verification history, workflow history) into a downloadable JSON/PDF
- Logged as a `data_requests` entry of type `access`

**B3. "Request Data Erasure" (Right to Erasure)**
- Button on Vendor Dashboard to submit an erasure request
- Creates a `data_requests` entry of type `erasure`
- Admin reviews in a new "Data Requests" tab in Admin Settings
- On approval: soft-delete vendor record, anonymize PII, remove stored documents

**B4. Right to Nominate**
- Add `nominee_name` and `nominee_contact` fields to vendor profile
- Vendor can set/update a nominee from their dashboard
- Nominee can exercise data rights on behalf of the vendor

**B5. 90-Day SLA Tracking**
- `due_date` auto-calculated as `created_at + 90 days` on every data request
- Admin dashboard shows overdue requests with visual alerts
- Staff can filter by approaching deadline

### Phase C: Breach Notification System (High Priority)

**C1. Database: `breach_notifications` table**

```text
CREATE TABLE breach_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact TEXT NOT NULL,
  remedial_steps TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  triggered_by UUID NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  affected_vendor_ids UUID[]
);
```

**C2. Admin Breach Notification UI**
- New tab in Admin Settings: "Breach Notifications"
- Form to describe the breach (what happened, impact, steps taken, contact info) -- all in plain language as DPDP requires
- Select affected vendors (all or specific)
- Triggers in-app notifications to all affected vendor users
- Records the notification for audit

### Phase D: Privacy & DPO Display (Low Priority)

**D1. Privacy Policy Page**
- New static route `/privacy-policy`
- Plain-language explanation of data practices, retention periods, rights
- Linked from registration consent step and app footer

**D2. DPO Contact Display**
- Add configurable DPO contact info in Admin Settings (name, email, phone)
- Display in app footer/help section for both vendor and staff portals

---

## Files to Create / Modify

### New Files
- `src/pages/vendor/PrivacyPolicy.tsx` -- Static privacy policy page
- `src/components/referral/ConsentStep.tsx` -- Consent notice and checkbox component
- `src/components/admin/DataRequestsPanel.tsx` -- Admin panel for managing data rights requests
- `src/components/admin/BreachNotificationPanel.tsx` -- Admin breach notification trigger UI

### Modified Files
- **Database**: 3 new tables (`consent_records`, `data_requests`, `breach_notifications`), `consent_withdrawn` added to `vendor_status` enum, nominee fields on `vendors`
- `src/pages/vendor/VendorReferralRegistration.tsx` -- Add consent step (Step 0) before company details
- `src/components/referral/ReferralStepper.tsx` -- Add "Consent" as first step
- `src/pages/vendor/VendorDashboard.tsx` -- Add "My Data Rights" section (Download Data, Request Erasure, Withdraw Consent, Manage Nominee)
- `src/pages/admin/AdminSettings.tsx` -- Add "Data Requests" and "Breach Notifications" tabs, DPO contact config
- `src/App.tsx` -- Add `/privacy-policy` route
- `src/components/layout/MobileLayout.tsx` -- Add privacy policy + DPO contact link in footer
- `src/components/layout/StaffLayout.tsx` -- Add DPO info in footer

### Database Schema Changes Summary

```text
-- New enum value
ALTER TYPE vendor_status ADD VALUE 'consent_withdrawn';

-- New tables
CREATE TABLE consent_records (...);
CREATE TABLE data_requests (...);
CREATE TABLE breach_notifications (...);

-- Nominee fields
ALTER TABLE vendors ADD COLUMN nominee_name TEXT;
ALTER TABLE vendors ADD COLUMN nominee_contact TEXT;
```

---

## Priority Order

1. **Phase A** (Consent) -- Legal prerequisite; without this, data collection may be non-compliant
2. **Phase B** (Data Rights) -- Core citizen rights under DPDP; 90-day SLA is mandatory
3. **Phase C** (Breach Notification) -- Required for incident response; penalties up to INR 200 crore
4. **Phase D** (Privacy/DPO) -- Supporting compliance; relatively simple additions

