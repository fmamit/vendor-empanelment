
-- Create missing tables that were created outside migrations in the old project

-- vendor_invitations table
CREATE TABLE IF NOT EXISTS public.vendor_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  category_id uuid NOT NULL REFERENCES public.vendor_categories(id),
  created_by uuid NOT NULL,
  token text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  vendor_id uuid REFERENCES public.vendors(id)
);
ALTER TABLE public.vendor_invitations ENABLE ROW LEVEL SECURITY;

-- vendor_verifications table
CREATE TABLE IF NOT EXISTS public.vendor_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id),
  verification_type text NOT NULL,
  verification_source text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'pending',
  request_data jsonb,
  response_data jsonb,
  remarks text,
  verified_at timestamptz,
  verified_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_verifications ENABLE ROW LEVEL SECURITY;

-- whatsapp_settings table
CREATE TABLE IF NOT EXISTS public.whatsapp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exotel_sid text,
  exotel_api_key text,
  exotel_api_token text,
  exotel_subdomain text,
  whatsapp_source_number text,
  waba_id text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- whatsapp_templates table
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  content text NOT NULL,
  variables jsonb,
  category text,
  status text DEFAULT 'active',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- whatsapp_messages table
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  direction text NOT NULL,
  message_content text,
  template_name text,
  template_variables jsonb,
  status text DEFAULT 'pending',
  exotel_message_id text,
  error_message text,
  vendor_id uuid REFERENCES public.vendors(id),
  sent_by uuid,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Fix vendor_invitations RLS to restrict SELECT access - only allow viewing via staff or with token
DROP POLICY IF EXISTS "Anyone can read invitation by token" ON public.vendor_invitations;
DROP POLICY IF EXISTS "Anyone can validate invitation by token" ON public.vendor_invitations;

CREATE POLICY "Staff can view all invitations"
ON public.vendor_invitations
FOR SELECT
USING (is_internal_staff(auth.uid()));

-- Fix profiles table RLS to restrict to own profile or admin/staff access
DROP POLICY IF EXISTS "Allow all authenticated to read profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins and staff can view all profiles"
ON public.profiles
FOR SELECT
USING (is_internal_staff(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
