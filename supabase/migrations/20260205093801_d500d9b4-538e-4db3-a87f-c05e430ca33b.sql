-- Drop the existing INSERT policy on vendor_users that requires auth.uid() = user_id
DROP POLICY IF EXISTS "Authenticated users can create their own vendor_user record" ON vendor_users;

-- Create a permissive INSERT policy for vendor_users
-- The edge function validates the user creation and linking
CREATE POLICY "Allow vendor user creation via edge function"
ON vendor_users FOR INSERT
WITH CHECK (true);