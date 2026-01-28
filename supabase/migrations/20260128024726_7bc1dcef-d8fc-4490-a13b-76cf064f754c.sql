-- Allow anyone to read vendor categories (public data needed for registration)
CREATE POLICY "Anyone can view active vendor categories" 
ON public.vendor_categories 
FOR SELECT 
USING (is_active = true);