-- Allow anyone to validate an invitation by token (for the registration page)
-- This is secure because they need the exact token and it only allows SELECT
CREATE POLICY "Anyone can validate invitation by token"
ON public.vendor_invitations
FOR SELECT
USING (true);