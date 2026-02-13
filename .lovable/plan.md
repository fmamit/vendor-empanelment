
# Fix PWA Caching + Add DPDP Compliance to Staff Dashboard

## Root Cause Analysis

1. **Stale PWA Cache**: The Workbox configuration in `vite.config.ts` is missing `skipWaiting: true` and `clientsClaim: true`. Without these, the service worker doesn't force activation of new versions—old cached code persists until the browser decides to update, which is why you're seeing outdated UI.

2. **Missing DPDP Compliance Section**: The Staff Dashboard code review shows the DPDP Compliance section was never actually added. The dashboard currently only has: Welcome Card → Quick Actions → Stats → My Workqueue → Reports → Fraud Alerts. There is no DPDP section.

## Solution Overview

### Part 1: Force Latest Code Cache Activation

**File: `vite.config.ts`**

Modify the Workbox configuration in the VitePWA plugin to:
- Add `skipWaiting: true` — new service worker activates immediately without waiting for old tabs to close
- Add `clientsClaim: true` — new service worker claims all existing clients immediately

This ensures every code change is served to users without delay.

### Part 2: Implement DPDP Compliance Section on Staff Dashboard

**Files to Create:**
- `src/hooks/useDataRequests.tsx` — New hook to fetch pending and overdue data request counts from the database

**Files to Modify:**
- `src/pages/staff/StaffDashboard.tsx` — Add DPDP Compliance card between Reports and Fraud Alerts sections

**Implementation Details:**

The `useDataRequests` hook will:
- Query the `data_requests` table (created in previous implementation)
- Count records where `status = 'pending'` or `status = 'in_progress'`
- Identify overdue requests (where `due_date < now()` and status is still pending/in_progress)
- Return pending count, overdue count, and a loading state

The new Staff Dashboard card will:
- Display as a card with Shield icon and "DPDP Compliance" title
- Show two sections: "Data Requests" and "Breach Notifications"
- Display pending data request counts with an "Overdue" badge if any requests exceed the 90-day SLA
- Provide navigation buttons to the Admin Settings where staff can manage these items
- Only show if user has admin role (since data request management is admin-only)

**Visual Layout:**

```text
┌─────────────────────────────────────┐
│ 🛡️  DPDP Compliance                 │
├─────────────────────────────────────┤
│ [📋 Data Requests]      Pending: 5  │
│  Manage access/erasure requests     │
│                             Arrow > │
├─────────────────────────────────────┤
│ [⚠️  Breach Notifications]           │
│  View or report security incidents  │
│                             Arrow > │
└─────────────────────────────────────┘
```

If there are overdue requests, a red "Overdue" badge appears next to the pending count.

**Implementation Flow:**

1. Create the hook that queries `data_requests` table
2. Add the card to the dashboard with data request stats
3. Clicking either section navigates to `/admin/settings` (relevant tabs: Data Requests or Breach)
4. Apply RLS security to ensure only staff can see data request counts

## Files to Change

| File | Change |
|---|---|
| `vite.config.ts` | Add `skipWaiting: true`, `clientsClaim: true` to workbox |
| `src/hooks/useDataRequests.tsx` | **NEW** - Fetch pending/overdue data request stats |
| `src/pages/staff/StaffDashboard.tsx` | Add DPDP Compliance card with data request stats |

## Expected Outcome

After these changes:
1. **Every code change will be served immediately** — No more stale cached versions
2. **Staff will see the DPDP Compliance section** on their dashboard with real-time data request metrics
3. **Staff can quickly navigate to manage** data rights requests and breach notifications
4. **SLA tracking is visible** — Overdue badges alert staff to requests exceeding the 90-day response deadline

