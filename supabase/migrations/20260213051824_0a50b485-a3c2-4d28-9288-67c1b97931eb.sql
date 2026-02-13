
-- Fix vendor_invitations RLS to restrict SELECT access - only allow viewing via staff or with token
DROP POLICY IF EXISTS "Anyone can read invitation by token" ON public.vendor_invitations;
DROP POLICY IF EXISTS "Anyone can validate invitation by token" ON public.vendor_invitations;

CREATE POLICY "Staff can view all invitations" 
ON public.vendor_invitations 
FOR SELECT 
USING (is_internal_staff(auth.uid()));

-- Fix profiles table RLS to restrict to own profile or admin/staff access
DROP POLICY IF EXISTS "Allow all authenticated to read profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins and staff can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_internal_staff(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
