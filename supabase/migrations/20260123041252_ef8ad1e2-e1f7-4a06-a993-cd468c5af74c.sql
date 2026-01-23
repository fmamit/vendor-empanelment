-- Drop the problematic "Staff can view all profiles" policy that causes circular dependency
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;

-- The "Users can read own profile" policy (user_id = auth.uid()) is sufficient for bootstrapping
-- Staff viewing ALL profiles should use admin role, not is_internal_staff

-- Also drop the circular dependency policy on user_roles
DROP POLICY IF EXISTS "Staff can view roles" ON public.user_roles;