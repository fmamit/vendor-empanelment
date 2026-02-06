
# Staff Admin Sidebar Navigation

## Overview

I'll create a collapsible left sidebar for the staff admin portal that provides easy navigation between all staff and admin pages. The sidebar will replace the current mobile-focused layout with a proper desktop-friendly layout while still working well on mobile devices.

## Navigation Structure

The sidebar will include these sections:

**Main**
- Dashboard (home view with stats)
- Vendor Queue (review queue)
- Fraud Alerts (security monitoring)

**Administration** (Admin role only)
- User Management
- System Settings

**Account**
- Sign Out

---

## Implementation Plan

### 1. Create Staff Sidebar Component

Create a new `StaffSidebar.tsx` component that:
- Uses the existing Shadcn Sidebar components
- Shows navigation items with icons
- Highlights the active route using NavLink
- Shows/hides admin section based on user roles
- Collapses to icons on smaller screens
- Works as a slide-out sheet on mobile

### 2. Create Staff Layout Component

Create a new `StaffLayout.tsx` that wraps all staff/admin pages:
- Contains `SidebarProvider` with the sidebar
- Includes a header with a menu toggle button (SidebarTrigger)
- Shows the Capital India logo in the header
- Provides a main content area for page content

### 3. Update Staff Pages

Modify all staff and admin pages to use the new `StaffLayout`:
- `StaffDashboard.tsx`
- `StaffReviewQueue.tsx`
- `VendorReviewDetail.tsx`
- `FraudAlertsDashboard.tsx`
- `AdminUserManagement.tsx`
- `AdminSettings.tsx`

Remove the "Back to Dashboard" buttons since navigation is now via sidebar.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/layout/StaffSidebar.tsx` | Sidebar component with navigation items |
| `src/components/layout/StaffLayout.tsx` | Layout wrapper with sidebar + header |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/staff/StaffDashboard.tsx` | Use StaffLayout, remove redundant nav |
| `src/pages/staff/StaffReviewQueue.tsx` | Use StaffLayout, remove back button |
| `src/pages/staff/VendorReviewDetail.tsx` | Use StaffLayout |
| `src/pages/staff/FraudAlertsDashboard.tsx` | Use StaffLayout |
| `src/pages/admin/AdminUserManagement.tsx` | Use StaffLayout, remove back button |
| `src/pages/admin/AdminSettings.tsx` | Use StaffLayout, remove back button |

---

## Visual Design

```text
+------------------+--------------------------------+
|  [=] Capital     |                                |
|     India        |      Page Content              |
|------------------|                                |
| MAIN             |                                |
|  > Dashboard     |                                |
|    Vendor Queue  |                                |
|    Fraud Alerts  |                                |
|------------------|                                |
| ADMINISTRATION   |                                |
|    Users         |                                |
|    Settings      |                                |
|------------------|                                |
|                  |                                |
|  [Sign Out]      |                                |
+------------------+--------------------------------+
```

---

## Technical Details

### StaffSidebar Component Structure

```tsx
// Navigation items configuration
const navItems = [
  { title: "Dashboard", url: "/staff/dashboard", icon: LayoutDashboard },
  { title: "Vendor Queue", url: "/staff/queue", icon: ClipboardList },
  { title: "Fraud Alerts", url: "/staff/fraud-alerts", icon: ShieldAlert },
];

const adminItems = [
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "System Settings", url: "/admin/settings", icon: Settings },
];
```

### StaffLayout Component Structure

```tsx
<SidebarProvider>
  <div className="min-h-screen flex w-full">
    <StaffSidebar />
    <SidebarInset>
      <header className="h-14 flex items-center border-b px-4">
        <SidebarTrigger />
        <img src={logo} className="h-8 ml-3" />
        <span className="ml-2 font-semibold">{title}</span>
      </header>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </SidebarInset>
  </div>
</SidebarProvider>
```

### Mobile Behavior

On mobile devices (width < 768px):
- Sidebar becomes a slide-out sheet
- Menu button in header toggles the sidebar
- Sidebar closes automatically after navigation
