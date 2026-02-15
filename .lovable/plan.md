

# Stress Test: Seed 100 Vendors with Diverse Test Conditions

## Overview

Create a temporary edge function `seed-stress-test` that inserts 100 vendors with varied data conditions to thoroughly exercise the system across all edge cases, statuses, document states, encryption paths, and compliance scenarios.

## Test Condition Matrix

The 100 vendors are split into **10 groups of 10**, each targeting specific test conditions:

### Group 1: Happy Path (Vendors 1-10)
All fields populated, status `approved`, all 4 docs `approved`, consent recorded.
Tests: Normal completed onboarding flow.

### Group 2: Partial PII (Vendors 11-20)
Only mandatory fields (PAN, mobile, email). Optional fields (CIN, secondary mobile, nominee) left null.
Status: `pending_review`. Docs: `uploaded`.
Tests: Encryption triggers handle null fields gracefully.

### Group 3: Rejected Vendors (Vendors 21-30)
All PII populated. Status: `rejected`. `rejected_at` set, `rejection_reason` filled.
Docs: mix of `approved` and `rejected` with `review_comments`.
Tests: Rejection workflow, filtered views, rejection reasons display.

### Group 4: Sent Back for Corrections (Vendors 31-40)
Status: `sent_back`. `sent_back_reason` populated.
Docs: some `rejected` with comments like "Blurry image", "Wrong document".
Tests: Sent-back workflow, re-upload scenarios.

### Group 5: In Verification (Vendors 41-50)
Status: `in_verification`. Docs: `under_review`.
Tests: Active review queue load, checker workflow.

### Group 6: Pending Approval (Vendors 51-60)
Status: `pending_approval`. All docs `approved`.
Tests: Approver queue, final approval step.

### Group 7: Drafts / Incomplete (Vendors 61-70)
Status: `draft`. Only 1-2 docs uploaded (incomplete set).
Tests: Draft state handling, missing documents indicator.

### Group 8: Expiring Documents (Vendors 71-80)
Status: `approved`. All docs `approved` but with `expiry_date` set:
- 2 docs expiring in 7 days
- 1 doc expiring in 30 days
- 1 doc already expired (past date)
Tests: Expiry badge rendering, expiry alerts, dashboard warnings.

### Group 9: Consent Withdrawn (Vendors 81-85)
Status: `consent_withdrawn`. Full PII. Consent record with `withdrawn_at` set.
Tests: DPDP consent withdrawal handling, restricted access.

### Group 10: Duplicate / Fraud Scenarios (Vendors 86-100)
- Vendors 86-90: Share same PAN number (`DUPAN1234F`) -- duplicate PAN detection
- Vendors 91-95: Share same GST number (`27DUPAN1234F1Z5`) -- duplicate GST detection
- Vendors 96-98: Share same bank account (`9999999999999`) -- duplicate bank detection
- Vendors 99-100: Similar company names ("Capital Trading Enterprises" / "Capitol Trading Enterprise") -- fuzzy name match

Tests: Fraud detection triggers, duplicate alerts, similarity matching.

## Additional Seeded Data

### Consent Records (100 rows)
One consent record per vendor. Vendors 81-85 have `withdrawn_at` populated.

### PII Access Logs (50 rows)
Simulate 50 historical PII access events spread over the last 30 days, referencing the staff user. Varied `table_name`, `column_name`, and `purpose` values to populate the DPDP Audit Dashboard with realistic data.

### Document Variations (400 total)
4 document types per vendor with varied states:

| Doc Type ID | Name | Used For |
|---|---|---|
| c6f865ba-... | GST Registration Certificate | All vendors |
| c58df90a-... | PAN Card | All vendors |
| a7a8d996-... | Certificate of Incorporation | All vendors |
| 4e7246e8-... | Cancelled Cheque | All vendors |

Document statuses distributed per group as described above.

## Summary Statistics in Response

```text
{
  "vendors_inserted": 100,
  "documents_inserted": 400,
  "consent_records_inserted": 100,
  "pii_access_logs_inserted": 50,
  "status_distribution": {
    "approved": 20,
    "pending_review": 10,
    "rejected": 10,
    "sent_back": 10,
    "in_verification": 10,
    "pending_approval": 10,
    "draft": 10,
    "consent_withdrawn": 5,
    "various (fraud group)": 15
  },
  "encryption_spot_check": {
    "full_pii_vendor": { "all_encrypted": true },
    "partial_pii_vendor": { "nulls_handled": true },
    "duplicate_pan_vendors": ["id1", "id2", ...]
  },
  "document_conditions": {
    "expired_docs": 10,
    "expiring_7_days": 20,
    "expiring_30_days": 10,
    "rejected_with_comments": 30
  }
}
```

## File Created

| File | Purpose |
|---|---|
| `supabase/functions/seed-stress-test/index.ts` | Edge function with all 10 test groups, consent records, PII access logs, and cleanup support |

## Config Addition

```text
[functions.seed-stress-test]
verify_jwt = false
```

## Technical Details

- **Batch inserts**: Vendors in batches of 10 (one per group), documents in batches of 40
- **Service role key**: Bypasses RLS for direct insertion
- **Encryption triggers**: The existing `encrypt_vendor_pii()` trigger fires on each INSERT, automatically encrypting all populated PII fields
- **Idempotency**: Checks for existing `StressTest Corp` vendors before inserting; skips if already seeded
- **Cleanup**: `?clean=true` deletes all seeded vendors (by name pattern), their documents, consent records, and PII access logs
- **Category rotation**: Round-robin across 4 categories (Supplier, Service Provider, Contractor, Channel Partner)
- **Constitution types**: Rotates through Proprietorship, Partnership, LLP, Private Limited, Public Limited
- **Salutations**: Rotates through Mr, Mrs, Ms, Dr
- **Bank names**: Rotates through SBI, HDFC, ICICI, Axis, Kotak
- **Staff reference**: Uses existing profile `8b83d837-bb3d-4efb-81c6-c33550ba557a` for `referred_by` and PII access logs

## Post-Seed Verification Checklist

1. Staff Dashboard -- loads with 100 vendors, stat cards show correct counts
2. Review Queue -- filters by status show correct groups
3. Reports page -- pie/bar charts render with realistic distribution
4. DPDP Audit Dashboard -- shows 50 PII access log entries with filters working
5. Document expiry badges -- vendors 71-80 show warning/expired indicators
6. Fraud detection -- duplicate PAN/GST/bank vendors flagged (if fraud triggers exist)
7. Encryption -- spot-check raw DB confirms `_encrypted` columns populated, plain text masked

