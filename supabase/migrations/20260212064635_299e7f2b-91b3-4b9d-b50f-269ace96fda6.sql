
-- Drop all existing restrictive policies on vendors
DROP POLICY IF EXISTS "Admins can manage all vendors" ON public.vendors;
DROP POLICY IF EXISTS "Allow vendor creation via edge function" ON public.vendors;
DROP POLICY IF EXISTS "Staff access vendors by role" ON public.vendors;
DROP POLICY IF EXISTS "Staff can update vendors they can access" ON public.vendors;
DROP POLICY IF EXISTS "Vendor users can update own draft vendor" ON public.vendors;
DROP POLICY IF EXISTS "Vendor users view own vendor" ON public.vendors;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can manage all vendors"
ON public.vendors FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Allow vendor creation via edge function"
ON public.vendors FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Staff access vendors by role"
ON public.vendors FOR SELECT
TO authenticated
USING (can_staff_access_vendor(auth.uid(), id));

CREATE POLICY "Staff can update vendors they can access"
ON public.vendors FOR UPDATE
TO authenticated
USING (can_staff_access_vendor(auth.uid(), id));

CREATE POLICY "Vendor users can update own draft vendor"
ON public.vendors FOR UPDATE
TO authenticated
USING (is_vendor_user(auth.uid()) AND id = get_vendor_id(auth.uid()) AND current_status = 'draft'::vendor_status);

CREATE POLICY "Vendor users view own vendor"
ON public.vendors FOR SELECT
TO authenticated
USING (is_vendor_user(auth.uid()) AND id = get_vendor_id(auth.uid()));
