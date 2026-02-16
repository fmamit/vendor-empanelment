
CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));
