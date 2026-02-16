
# Fix: RLS Policy on `user_roles` Table

## Problem

The "Save Profile" action fails with:
> new row violates row-level security policy for table "user_roles"

Both RLS policies on `user_roles` are set as **RESTRICTIVE**. PostgreSQL requires at least one **PERMISSIVE** policy to grant base access. Since none exist, all write operations (INSERT, DELETE) are denied -- even for admins.

## Solution

Drop the two existing restrictive policies and re-create them as **PERMISSIVE**:

| Policy | Command | Type | Rule |
|--------|---------|------|------|
| Admins can manage roles | ALL | PERMISSIVE | `has_role(auth.uid(), 'admin')` |
| All authenticated can read roles | SELECT | PERMISSIVE | `true` |

## Technical Details

A single database migration with these SQL statements:

```sql
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow all authenticated to read roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All authenticated can read roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);
```

No code changes needed -- only this one migration fixes the issue.
