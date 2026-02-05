-- Drop the existing INSERT policy that requires auth.uid()
DROP POLICY IF EXISTS "Authenticated users can create vendors during registration" ON vendors;

-- Create a permissive INSERT policy
-- The edge function handles all validation (invitation token, OTP verification)
-- so we can allow inserts and rely on the edge function for access control
CREATE POLICY "Allow vendor creation via edge function"
ON vendors FOR INSERT
WITH CHECK (true);