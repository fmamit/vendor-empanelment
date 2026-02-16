

# Combined Plan: Rename "Add Staff User" to "Add User" and Add Profile Editing

## Overview

Two changes in one file (`src/pages/admin/AdminUserManagement.tsx`):
1. Rename all "Staff User" labels to just "User"
2. Upgrade the "Edit Roles" dialog into a full "Edit Profile" dialog

---

## 1. Text Replacements

| Line | Current | New |
|------|---------|-----|
| 151 | `Add Staff User` (button) | `Add User` |
| 189 | `Add Staff User` (dialog title) | `Add User` |
| 159 | `No staff users found` | `No users found` |

---

## 2. Replace Shield Icon with Pencil Icon

- Line 17: Replace `Shield` import with `Pencil` from lucide-react
- Line 176: Change `<Shield className="h-4 w-4" />` to `<Pencil className="h-4 w-4" />`

---

## 3. Upgrade "Edit Roles" Dialog to "Edit Profile"

**Replace the current Edit Roles dialog (lines 217-236) with a full Edit Profile dialog:**

- Title changes from `Edit Roles - {name}` to `Edit Profile - {name}`
- Add editable fields: Full Name, Phone, Department (email shown as read-only)
- Keep the Roles checkbox section below the profile fields
- Track edited profile fields via local state on the `editingUser` object

**Replace the `updateRoles` mutation (lines 98-113) with an `updateProfile` mutation that:**
1. Updates the `profiles` table with name, phone, department
2. Deletes existing roles and re-inserts the new set (same logic as current `updateRoles`)
3. Success toast changes to "Profile updated successfully"

**Update `handleRoleToggle` and dialog state** to also handle profile field edits (name, phone, department) on the `editingUser` object -- using inline `onChange` handlers, same pattern as the Add dialog.

---

## Technical Details

### Updated mutation (replaces `updateRoles`)

```typescript
const updateProfile = useMutation({
  mutationFn: async ({ user }: { user: StaffUser }) => {
    // Update profile fields
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: user.full_name,
        phone: user.phone || null,
        department: user.department || null,
      })
      .eq("user_id", user.user_id);
    if (profileError) throw profileError;

    // Update roles (delete + re-insert)
    const { error: deleteError } = await supabase
      .from("user_roles").delete().eq("user_id", user.user_id);
    if (deleteError) throw deleteError;
    for (const role of user.roles) {
      const { error: insertError } = await supabase
        .from("user_roles").insert({ user_id: user.user_id, role: role as any });
      if (insertError) throw insertError;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["admin-staff-users"] });
    toast.success("Profile updated successfully");
    setEditingUser(null);
  },
  onError: (error: Error) => toast.error(error.message || "Failed to update profile"),
});
```

### Edit Profile dialog fields

```
Email (read-only, displayed but not editable)
Full Name (editable input)
Phone (editable input)
Department (editable input)
Roles (checkbox list, same as current)
```

---

## Summary

| Change | Details |
|--------|---------|
| Rename 3 strings | "Staff User" / "staff users" to "User" / "users" |
| Swap icon | Shield to Pencil |
| Expand edit dialog | Roles-only to full profile + roles |
| Replace mutation | `updateRoles` becomes `updateProfile` |
| Files changed | 1 (`AdminUserManagement.tsx`) |
| Database changes | None (uses existing `profiles` update + `user_roles` delete/insert) |

