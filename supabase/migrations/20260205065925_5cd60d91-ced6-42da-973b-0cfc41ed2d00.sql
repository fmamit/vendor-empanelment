-- Create vendor_verifications table
CREATE TABLE public.vendor_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('pan', 'aadhaar', 'bank_account')),
  verification_source TEXT NOT NULL DEFAULT 'verifiedu',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'success', 'failed')),
  request_data JSONB,
  response_data JSONB,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_verifications ENABLE ROW LEVEL SECURITY;

-- Vendor users can view their own verifications
CREATE POLICY "Vendors view own verifications"
  ON public.vendor_verifications
  FOR SELECT
  USING (is_vendor_user(auth.uid()) AND vendor_id = get_vendor_id(auth.uid()));

-- Staff can view verifications for vendors they have access to
CREATE POLICY "Staff view verifications by access"
  ON public.vendor_verifications
  FOR SELECT
  USING (can_staff_access_vendor(auth.uid(), vendor_id));

-- Staff can insert verifications for vendors they have access to
CREATE POLICY "Staff insert verifications"
  ON public.vendor_verifications
  FOR INSERT
  WITH CHECK (can_staff_access_vendor(auth.uid(), vendor_id));

-- Staff can update verifications for vendors they have access to
CREATE POLICY "Staff update verifications"
  ON public.vendor_verifications
  FOR UPDATE
  USING (can_staff_access_vendor(auth.uid(), vendor_id));

-- Admins have full access
CREATE POLICY "Admins manage all verifications"
  ON public.vendor_verifications
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create index for fast lookups
CREATE INDEX idx_vendor_verifications_vendor_type ON public.vendor_verifications(vendor_id, verification_type);

-- Add trigger for updated_at
CREATE TRIGGER update_vendor_verifications_updated_at
  BEFORE UPDATE ON public.vendor_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();