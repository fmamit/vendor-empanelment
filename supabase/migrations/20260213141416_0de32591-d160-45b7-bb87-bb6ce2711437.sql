
-- Add consent_withdrawn to vendor_status enum
ALTER TYPE vendor_status ADD VALUE IF NOT EXISTS 'consent_withdrawn';

-- Add nominee fields to vendors
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS nominee_name TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS nominee_contact TEXT;

-- Consent records table
CREATE TABLE public.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id),
  user_identifier TEXT NOT NULL,
  consent_version TEXT NOT NULL DEFAULT '1.0',
  purpose TEXT NOT NULL DEFAULT 'vendor_onboarding',
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendor users view own consent records"
  ON public.consent_records FOR SELECT
  USING (is_vendor_user(auth.uid()) AND vendor_id = get_vendor_id(auth.uid()));

CREATE POLICY "Staff can view consent records"
  ON public.consent_records FOR SELECT
  USING (is_internal_staff(auth.uid()));

CREATE POLICY "Admins manage consent records"
  ON public.consent_records FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Allow consent insertion via edge function"
  ON public.consent_records FOR INSERT
  WITH CHECK (true);

-- Data requests table
CREATE TABLE public.data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) NOT NULL,
  requested_by UUID NOT NULL,
  request_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 days'),
  completed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.data_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendor users view own data requests"
  ON public.data_requests FOR SELECT
  USING (is_vendor_user(auth.uid()) AND vendor_id = get_vendor_id(auth.uid()));

CREATE POLICY "Vendor users create own data requests"
  ON public.data_requests FOR INSERT
  WITH CHECK (is_vendor_user(auth.uid()) AND vendor_id = get_vendor_id(auth.uid()));

CREATE POLICY "Staff can view all data requests"
  ON public.data_requests FOR SELECT
  USING (is_internal_staff(auth.uid()));

CREATE POLICY "Admins manage data requests"
  ON public.data_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Breach notifications table
CREATE TABLE public.breach_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact TEXT NOT NULL,
  remedial_steps TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  triggered_by UUID NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  affected_vendor_ids UUID[]
);

ALTER TABLE public.breach_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage breach notifications"
  ON public.breach_notifications FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view breach notifications"
  ON public.breach_notifications FOR SELECT
  USING (is_internal_staff(auth.uid()));
