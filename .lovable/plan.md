

## Move "My Profile" Button to Top of Dashboard

### What Changes
Move the "My Profile" button from the Quick Links section (bottom) to directly below the Welcome card (top), and make it more prominent and visible.

### Layout After Change

1. Welcome & Roles card (unchanged)
2. **My Profile button** -- prominent, full-width, placed right after welcome
3. Stats Overview (unchanged)
4. My Workqueue (unchanged)
5. Invite a Vendor button (stays as a single button, no longer in a 2-column grid)
6. Fraud Alerts (unchanged)

### Technical Details

**File: `src/pages/staff/StaffDashboard.tsx`**

- Remove the "Quick Links" 2-column grid section (lines 134-144)
- Add a full-width "My Profile" button immediately after the Welcome card (after line 63), styled with a distinct background (e.g., `bg-primary/5 border-primary/20`) so it stands out
- Move "Invite a Vendor" to a standalone full-width button where the Quick Links section was

