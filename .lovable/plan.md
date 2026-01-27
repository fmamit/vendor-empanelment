
# Add Left Sidebar Menu to Staff Dashboard

## Overview
Add a collapsible left sidebar navigation menu to all staff pages, replacing the current mobile-first layout with a proper desktop sidebar layout that also works on mobile.

## Current State
- All staff pages use `MobileLayout` component (top header only)
- Shadcn sidebar component already exists in `src/components/ui/sidebar.tsx`
- `NavLink` component exists for active route highlighting
- Staff routes: Dashboard, Review Queue, Vendor Detail, Fraud Alerts
- Admin routes: User Management, System Settings

## Implementation Plan

### 1. Create Staff Sidebar Component
**New file**: `src/components/layout/StaffSidebar.tsx`

Contains the navigation menu with:
- Logo and branding in header
- Navigation groups:
  - **Dashboard**: Home/Overview
  - **Workqueue**: Pending Review, In Verification, Pending Approval
  - **Alerts**: Fraud Alerts
  - **Administration** (admin only): User Management, System Settings
- User info and Sign Out button in footer
- Role-based visibility (admin sections only show for admins)
- Active route highlighting using `NavLink`

### 2. Create Staff Layout Wrapper
**New file**: `src/components/layout/StaffLayout.tsx`

A wrapper component that:
- Uses `SidebarProvider` to manage sidebar state
- Contains the `StaffSidebar` component
- Has a header with `SidebarTrigger` for mobile toggle
- Wraps page content in `SidebarInset`
- Works on both desktop (persistent sidebar) and mobile (sheet/drawer)

### 3. Update Staff Pages
Update each staff page to use the new `StaffLayout` instead of `MobileLayout`:
- `src/pages/staff/StaffDashboard.tsx`
- `src/pages/staff/StaffReviewQueue.tsx`
- `src/pages/staff/VendorReviewDetail.tsx`
- `src/pages/staff/FraudAlertsDashboard.tsx`
- `src/pages/admin/AdminUserManagement.tsx`
- `src/pages/admin/AdminSettings.tsx`

### 4. Sidebar Menu Structure

```text
+----------------------------------+
|  [Logo] Capital India            |
|  Staff Portal                    |
+----------------------------------+
|                                  |
|  MAIN                            |
|  > Dashboard                     |
|                                  |
|  WORKQUEUE                       |
|  > Pending Review           (3)  |
|  > In Verification          (1)  |
|  > Pending Approval         (2)  |
|                                  |
|  ALERTS                          |
|  > Fraud Alerts             (3)  |
|                                  |
|  ADMINISTRATION (admin only)     |
|  > User Management               |
|  > System Settings               |
|                                  |
+----------------------------------+
|  [User Name]                     |
|  [Sign Out]                      |
+----------------------------------+
```

## Files to Create
| File | Purpose |
|------|---------|
| `src/components/layout/StaffSidebar.tsx` | Sidebar navigation component |
| `src/components/layout/StaffLayout.tsx` | Layout wrapper with sidebar |

## Files to Modify
| File | Changes |
|------|---------|
| `src/pages/staff/StaffDashboard.tsx` | Replace MobileLayout with StaffLayout, simplify content |
| `src/pages/staff/StaffReviewQueue.tsx` | Replace MobileLayout with StaffLayout |
| `src/pages/staff/VendorReviewDetail.tsx` | Replace MobileLayout with StaffLayout |
| `src/pages/staff/FraudAlertsDashboard.tsx` | Replace MobileLayout with StaffLayout, remove back button |
| `src/pages/admin/AdminUserManagement.tsx` | Replace MobileLayout with StaffLayout, remove back button |
| `src/pages/admin/AdminSettings.tsx` | Replace MobileLayout with StaffLayout, remove back button |

## Technical Details

### StaffSidebar Component Features
- Uses `useSidebar` hook for collapse state
- Uses `useUserRoles` for role-based menu visibility
- Uses `useStaffVendorQueue` for badge counts
- Uses `NavLink` with `activeClassName` for highlighting current route
- Collapsible to icon-only mode on desktop
- Opens as sheet/drawer on mobile

### Layout Structure
```tsx
<SidebarProvider>
  <StaffSidebar />
  <SidebarInset>
    <header className="flex items-center gap-2 p-4 border-b">
      <SidebarTrigger />
      <h1>{title}</h1>
    </header>
    <main>{children}</main>
  </SidebarInset>
</SidebarProvider>
```

### Mobile Behavior
- Sidebar hidden by default on mobile
- Opens as overlay sheet when hamburger menu is tapped
- Auto-closes when navigation link is clicked
