
# Sidebar Redesign: Enhanced Logo Header and Expanded Navigation

## Overview

Redesign the left sidebar to match the reference style -- a prominent logo card with user name underneath, and additional direct navigation items to reduce clicks for common tasks.

## Changes

### 1. Logo and User Identity Header (StaffSidebar.tsx)

Replace the current small logo + text row with a styled header block:

- **Logo**: Display in a white rounded card/container (like the reference image-60.png), larger size (~48x48px), centered
- **User Name**: Fetch the logged-in user's `full_name` from the `profiles` table and display it below the logo in a prominent style
- **Department**: Show user's department as a subtle subtitle underneath
- When collapsed, show only the logo icon (no name/department)

### 2. Expanded Navigation Items

Add more direct links under the Main section so common tasks are one click away instead of buried inside dashboard cards:

**Main section (expanded):**
- Dashboard
- Vendor Queue
- Invite Vendor (new -- currently only accessible from Dashboard)
- Fraud Alerts
- Reports (new -- currently only accessible from Dashboard)

**Administration section (admin only, unchanged):**
- User Management
- System Settings
- DPDP Audit

### 3. Data Fetching

Use a simple `useQuery` hook inside `StaffSidebar` to fetch the current user's profile (`full_name`, `department`) from the `profiles` table. This is a lightweight query that runs once on mount.

## Files to Change

| File | Change |
|---|---|
| `src/components/layout/StaffSidebar.tsx` | Redesign header with prominent logo card and user name; add Invite Vendor and Reports nav items; fetch user profile |

## Technical Details

- Query: `supabase.from('profiles').select('full_name, department').eq('user_id', user.id).maybeSingle()`
- Logo container: white rounded-lg card with padding, centered in sidebar header area
- User name: `text-sm font-semibold`, department: `text-xs text-muted-foreground`
- New nav items use existing route paths (`/staff/invite-vendor` for Invite Vendor, `/staff/reports` for Reports) and lucide icons (`UserPlus`, `BarChart3`)
- No new routes or pages needed -- all target routes already exist in App.tsx
