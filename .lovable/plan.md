

# Workflow Validation: Document vs Current Implementation

## Comparison Summary

The uploaded "Vendor Management Flow for Demo" document defines a 9-section workflow. Here is a gap analysis against the current codebase, followed by a plan to close the gaps.

### What Already Matches

| Document Requirement | Current Implementation | Status |
|---|---|---|
| Admin initiates vendor registration | StaffInviteVendor page + referral codes | Done |
| Invitation via Email/WhatsApp/QR | Email invite + QR/referral link | Done |
| Vendor OTP verification | Phone OTP in referral registration flow | Done |
| Vendor fills Company, Contact, Bank, Documents | 4-step referral registration form | Done |
| Submission generates unique Vendor ID | vendor_code assigned on submit | Done |
| Status = "Pending Maker Review" after submit | `pending_review` status | Done |
| Maker reviews and forwards | Forward button in VendorReviewDetail | Done |
| Checker reviews and approves | Forward/Approve flow exists | Done |
| Role-based access (Maker/Checker/Admin) | useUserRoles with RBAC | Done |
| Audit trail of actions | workflow_history table with action_by, timestamps | Done |
| Document upload with validation | DocumentUploadStep with format/size checks | Done |
| PAN, Bank, Aadhaar verification | VerifiedU Edge Functions + VerificationPanel | Done |

### Gaps to Fix

| # | Document Requirement | Gap | Priority |
|---|---|---|---|
| 1 | **"Send Back" action** for Maker and Checker | Only "Reject" exists. Document requires a separate "Send Back" that lets vendor correct and resubmit. | High |
| 2 | **"Sent Back" status** in tracking | The `vendor_status` enum is missing `sent_back`. The `workflow_action` enum already has `returned`. | High |
| 3 | **Vendor re-submission after Send Back** | No UI for vendor to see "sent back" state, view comments, and resubmit. | High |
| 4 | **Salutation field** (Mr/Mrs/Ms) | Missing from vendor registration form. | Medium |
| 5 | **Constitution Type field** (Proprietorship, Partnership, LLP, Pvt Ltd, etc.) | Missing from registration form and vendors table. | Medium |
| 6 | **Dashboard filters**: Date Range, Constitution Type | Only search-by-name and status tabs exist. | Medium |
| 7 | **Downloadable reports** (Excel/PDF): Vendor Status, Approval TAT, Pending Cases, Document Deficiency | Not implemented. | Low |
| 8 | **Notifications** for Sent Back, Maker approval, Checker approval | Notifications table exists but systematic triggers are missing for these events. | Low |

---

## Implementation Plan

### Phase 1: "Send Back" Flow (High Priority)

**1a. Database: Add `sent_back` status to vendor_status enum**
- `ALTER TYPE vendor_status ADD VALUE 'sent_back';`
- This enables vendors to be in a "corrections required" state distinct from "rejected"

**1b. Add `sent_back_reason` column to vendors table**
- `ALTER TABLE vendors ADD COLUMN sent_back_reason TEXT;`
- Stores the reason/comments when a Maker or Checker sends the application back

**1c. Staff UI: Add "Send Back" button to VendorReviewDetail**
- Add a "Send Back" button alongside "Reject" and "Forward"
- Opens a dialog asking for a reason (similar to the reject dialog)
- Calls `useUpdateVendorStatus` with `newStatus: "sent_back"` and the reason
- Logs to `workflow_history` with action `returned`
- Available to Makers (when status is `pending_review`) and Checkers (when status is `in_verification`)

**1d. Status labels and colors**
- Add `sent_back: "Sent Back"` to STATUS_LABELS
- Add `sent_back: "bg-orange-100 text-orange-700"` to STATUS_COLORS
- Update both StaffReviewQueue and VendorReviewDetail

**1e. Vendor Dashboard: Show "Sent Back" state**
- On the VendorDashboard, if the vendor's status is `sent_back`, display a prominent alert with the reason
- Provide a "Resubmit" or "Edit & Resubmit" button that allows correcting details and re-uploading documents
- On resubmission, status changes back to `pending_review`

### Phase 2: Registration Form Fields (Medium Priority)

**2a. Database: Add `salutation` and `constitution_type` columns**
- `ALTER TABLE vendors ADD COLUMN salutation TEXT;`
- `ALTER TABLE vendors ADD COLUMN constitution_type TEXT;`

**2b. Update referral registration form (CompanyDetailsStep)**
- Add a Salutation dropdown (Mr, Mrs, Ms, Dr)
- Add a Constitution Type dropdown (Proprietorship, Partnership, LLP, Private Limited, Public Limited, Other)
- Both fields included in form state and submission

**2c. Display in VendorReviewDetail**
- Show Salutation and Constitution Type in the Company Details card

### Phase 3: Dashboard Enhancements (Medium Priority)

**3a. Add Date Range filter to StaffReviewQueue**
- Add date picker inputs for "From" and "To" dates
- Filter vendors by `created_at` or `submitted_at` within the range

**3b. Add Constitution Type filter**
- Add a dropdown filter for Constitution Type in the queue page
- Filter vendors by the new `constitution_type` column

### Phase 4: Reports (Low Priority -- Deferred)

**4a. Downloadable reports**
- Vendor Status Report (Excel/PDF)
- Approval TAT Report (calculate time between workflow_history stages)
- Pending Cases Report
- Document Deficiency Report

These require a report generation system. This can be deferred to a later iteration and built using client-side export (e.g., CSV/Excel generation in the browser) or a backend function.

### Phase 5: Notifications (Low Priority -- Deferred)

- Trigger notifications for: Sent Back, Maker Approval, Checker Approval
- The `notifications` table already exists; this involves adding insert calls at the appropriate points in the workflow mutation functions

---

## Technical Details

### Files to Modify
- **Database migration**: Add `sent_back` to `vendor_status` enum, add `salutation` and `constitution_type` columns
- `src/pages/staff/VendorReviewDetail.tsx` -- Add "Send Back" button and dialog
- `src/pages/staff/StaffReviewQueue.tsx` -- Add `sent_back` tab, date range and constitution type filters
- `src/hooks/useStaffWorkflow.tsx` -- Handle `sent_back` status in `useUpdateVendorStatus`
- `src/pages/vendor/VendorDashboard.tsx` -- Show "Sent Back" alert with resubmit option
- `src/components/referral/CompanyDetailsStep.tsx` -- Add Salutation and Constitution Type fields
- `src/pages/vendor/VendorReferralRegistration.tsx` -- Add new fields to form state
- `src/pages/staff/StaffDashboard.tsx` -- Add "Sent Back" count to stats

### Database Changes
```text
ALTER TYPE vendor_status ADD VALUE 'sent_back' BEFORE 'approved';
ALTER TABLE vendors ADD COLUMN sent_back_reason TEXT;
ALTER TABLE vendors ADD COLUMN salutation TEXT;
ALTER TABLE vendors ADD COLUMN constitution_type TEXT;
```

### Workflow State Transitions (Updated)
```text
draft --> pending_review (vendor submits)
pending_review --> in_verification (maker forwards)
pending_review --> sent_back (maker sends back)
pending_review --> rejected (maker rejects)
in_verification --> pending_approval (checker forwards)
in_verification --> sent_back (checker sends back)
in_verification --> rejected (checker rejects)
pending_approval --> approved (approver approves)
pending_approval --> rejected (approver rejects)
sent_back --> pending_review (vendor resubmits)
```

