-- Add INSERT policy for vendors table (for new vendor registration)
CREATE POLICY "Authenticated users can create vendors during registration" 
ON public.vendors 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Add INSERT policy for vendor_users table (for linking user to vendor)
CREATE POLICY "Authenticated users can create their own vendor_user record" 
ON public.vendor_users 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);