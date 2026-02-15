
# World-Class Executive Dashboard Redesign

## Overview

Transform the current list-based dashboard into a modern, data-rich "Command Center" style layout that impresses C-Level executives. Drawing inspiration from the reference's dark glassmorphic aesthetic but adapting it to Capital India's brand identity with a clean light theme that feels premium and professional.

## Design Philosophy

- **Data density over navigation** -- Show key metrics at a glance, not just links to other pages
- **Visual hierarchy** -- Large gradient KPI numbers draw the eye first, then pipeline, then activity
- **Glass/card layered design** -- Subtle shadows, gradients, and rounded cards for a premium feel
- **Real-time feel** -- Live dot indicator, timestamps, activity feed
- **Actionable** -- Every card is clickable, leading to the relevant detail page

## Layout Structure

```text
+---------------------------------------------------------------+
| Header: "Vendor Operations Command Center"  [Live] [Invite]   |
+---------------------------------------------------------------+
| KPI Card 1    | KPI Card 2    | KPI Card 3    | KPI Card 4    |
| Pending Review| Approved      | Total Vendors  | Fraud Alerts  |
| (gradient)    | (gradient)    | (gradient)     | (gradient)    |
+---------------+---------------+--------+----------------------+
| Onboarding Pipeline                    | Recent Activity       |
| Draft > Pending > Verify > Approve     | Live feed of actions  |
| (large stage numbers, colored)         | (scrollable)          |
+----------------------------------------+-----------------------+
| Key Metrics         | Compliance    | Critical Alerts         |
| Avg TAT, Rate, Docs | DPDP stats    | Fraud/expiry warnings   |
+---------------------+---------------+-------------------------+
```

## Components and Data Sources

### 1. Header Bar
- Gradient title "Vendor Operations Command Center"
- Live indicator dot (green pulse)
- "Capital India Finance" label
- Greeting with user name from `profiles` table
- Notification bell with fraud alert count badge
- "Invite Vendor" CTA button

### 2. KPI Cards Row (4 cards)
Each card has: label, large gradient number, trend indicator, subtitle

| Card | Value Source | Accent Color |
|---|---|---|
| Pending Review | `vendors` where `current_status = 'pending_review'` | Amber/Warning |
| Approved | `vendors` where `current_status = 'approved'` | Green |
| Total Vendors | `vendors` count | Blue (primary) |
| Fraud Alerts | Mock fraud stats `.pending` count | Red |

### 3. Onboarding Pipeline (left panel, wide)
Horizontal 4-stage pipeline showing vendor flow:
- **Draft** -- count of `draft` vendors
- **In Review** -- count of `pending_review` + `in_verification`
- **Verified** -- count of `pending_approval`
- **Approved** -- count of `approved`

Each stage is a clickable card with large number, label, and a subtle change indicator.

### 4. Recent Activity Feed (right panel)
Scrollable list of recent vendor actions, pulled from the `vendors` table ordered by `updated_at`. Shows:
- Icon (color-coded by status)
- Vendor company name
- Status change description
- Relative timestamp

### 5. Bottom Row (3 cards)

**Key Metrics Card:**
- Average processing time (placeholder/computed)
- Document compliance rate (approved docs / total docs)
- Expiring documents count

**Compliance Card (admin only):**
- Pending data requests count
- Overdue data requests (red badge)
- Consent withdrawal count

**Critical Alerts Card:**
- Top 2-3 fraud alerts from `useFraudAlerts` hook
- Color-coded by severity (red border for critical)

## Files Changed

| File | Change |
|---|---|
| `src/pages/staff/StaffDashboard.tsx` | Complete rewrite with new executive dashboard layout |

## Technical Details

- All data comes from existing hooks: `useStaffVendorQueue`, `useDataRequests`, `useFraudAlerts`, `useUserRoles`
- Additional query for recent activity: reuse `vendors` data sorted by `updated_at`, take top 8
- Additional query for document stats: new inline `useQuery` to get doc counts by status and expiry
- KPI cards use `bg-gradient-to-br` with brand colors for premium look
- Pipeline stages use large `text-4xl font-bold` numbers with color gradients
- Activity feed items use relative time via `date-fns` `formatDistanceToNow`
- Clickable cards navigate to relevant pages (`/staff/queue`, `/staff/fraud-alerts`, etc.)
- Responsive: on smaller screens, KPI grid goes 2x2, bottom grid stacks vertically
- No dark mode -- stays on light theme but uses gradient accents for visual impact
- Layout removes `max-w-4xl` constraint to use full width for the data-dense layout
