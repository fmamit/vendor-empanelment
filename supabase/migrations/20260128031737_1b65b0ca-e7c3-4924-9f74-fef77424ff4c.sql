-- Create vendor_invitations table for invitation-only registration
CREATE TABLE public.vendor_invitations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    category_id UUID NOT NULL REFERENCES public.vendor_categories(id),
    company_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    created_by UUID NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    used_at TIMESTAMPTZ NULL,
    vendor_id UUID NULL REFERENCES public.vendors(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Staff (Maker/Admin) can create and view all invitations
CREATE POLICY "Staff can manage invitations"
ON public.vendor_invitations
FOR ALL
TO authenticated
USING (is_internal_staff(auth.uid()))
WITH CHECK (is_internal_staff(auth.uid()));

-- Policy: Anonymous users can read invitation details by token (for validation)
CREATE POLICY "Anyone can read invitation by token"
ON public.vendor_invitations
FOR SELECT
TO anon, authenticated
USING (true);

-- Create index for fast token lookups
CREATE INDEX idx_vendor_invitations_token ON public.vendor_invitations(token);

-- Create index for unused invitations lookup
CREATE INDEX idx_vendor_invitations_unused ON public.vendor_invitations(used_at) WHERE used_at IS NULL;