
-- Recreate the SELECT policy as PERMISSIVE (drop and recreate to ensure it's not restrictive)
DROP POLICY IF EXISTS "All authenticated can read roles" ON public.user_roles;
CREATE POLICY "All authenticated can read roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);
