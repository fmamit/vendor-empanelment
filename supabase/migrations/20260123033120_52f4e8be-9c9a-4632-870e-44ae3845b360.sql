-- Add policy for users to read their own profile (fixes circular RLS dependency)
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (user_id = auth.uid());

-- Add policy for users to read their own roles
CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());