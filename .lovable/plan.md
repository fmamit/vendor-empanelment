

# DPDP Compliance Audit Dashboard

## Overview

Build a new admin-only page at `/admin/dpdp-audit` that displays PII access logs from the `pii_access_log` table, showing who accessed what data and when. The dashboard will include summary stats, filters, a detailed log table, and CSV export.

## New Files

### 1. `src/pages/admin/DpdpAuditDashboard.tsx`

A new page using the existing `StaffLayout` wrapper, restricted to admin users via `useUserRoles`. It will contain:

**Summary Stat Cards** (gradient style matching StaffReports):
- Total PII accesses (all time)
- Accesses today
- Unique users who accessed PII
- Unique vendors whose PII was accessed

**Filters Row:**
- Date range picker (from/to using date inputs)
- Filter by user (dropdown of distinct users from logs)
- Filter by table name
- Filter by purpose

**Log Table** with columns:
- Accessed At (formatted timestamp)
- User (resolved via join to `profiles` table for full_name)
- Table
- Column
- Vendor ID (truncated)
- Purpose

**CSV Export** button reusing the same export pattern from StaffReports.

**Data fetching**: Query `pii_access_log` joined with `profiles` to resolve user names. Since only admins can SELECT from `pii_access_log` (per existing RLS), this is already secured.

### 2. Route Registration

Add route `/admin/dpdp-audit` in `src/App.tsx`.

### 3. Sidebar Navigation

Add "DPDP Audit" link under the Administration section in `src/components/layout/StaffSidebar.tsx` (admin-only, already gated by `isAdmin` check). Use the `ShieldCheck` icon from lucide-react.

## Technical Details

- Query: `supabase.from('pii_access_log').select('*, profiles!pii_access_log_user_id_fkey(full_name)').order('accessed_at', { ascending: false }).limit(500)`
- Since `pii_access_log` has no FK to profiles, we'll do a secondary lookup: fetch logs, then batch-fetch profiles by user_id
- Date filtering via `.gte('accessed_at', from).lte('accessed_at', to)`
- All existing RLS policies already restrict access to admins only
- Uses same UI patterns (gradient cards, Card components, table styling) as StaffReports for consistency

## Files to Change

| File | Change |
|---|---|
| `src/pages/admin/DpdpAuditDashboard.tsx` | New page with audit log dashboard |
| `src/App.tsx` | Add route for `/admin/dpdp-audit` |
| `src/components/layout/StaffSidebar.tsx` | Add "DPDP Audit" nav item under Administration |

