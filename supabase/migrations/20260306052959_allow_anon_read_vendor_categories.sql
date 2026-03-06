-- Allow unauthenticated (anon) users to read active vendor categories
-- Needed for the vendor referral registration form which is public
CREATE POLICY "Anon can view active categories"
  ON public.vendor_categories FOR SELECT TO anon
  USING (is_active = true);
