-- ============================================================================
-- Multi-Tenancy Migration
-- Adds tenant isolation to the vendor management platform.
-- Seeds In-Sync as the first (default) tenant.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREATE TENANTS TABLE
-- ============================================================================

CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '204 100% 35%',
  accent_color TEXT DEFAULT '92 47% 50%',
  vendor_code_prefix TEXT NOT NULL DEFAULT 'VND',
  dpo_email TEXT,
  privacy_policy_url TEXT,
  support_email TEXT,
  support_phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tenants"
  ON public.tenants FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Platform admins manage tenants"
  ON public.tenants FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_tenants_timestamp
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 2. SEED IN-SYNC AS FIRST TENANT
-- ============================================================================

INSERT INTO public.tenants (id, slug, name, short_name, vendor_code_prefix, dpo_email, primary_color, accent_color)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'in-sync',
  'In-Sync',
  'In-Sync',
  'IS',
  'dpo@in-sync.co.in',
  '204 100% 35%',
  '92 47% 50%'
);

-- ============================================================================
-- 3. ADD tenant_id TO ALL CORE DATA TABLES
-- ============================================================================

-- profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- vendors
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- vendor_users
ALTER TABLE public.vendor_users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- vendor_documents
ALTER TABLE public.vendor_documents ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- vendor_categories
ALTER TABLE public.vendor_categories ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- document_types
ALTER TABLE public.document_types ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- category_documents
ALTER TABLE public.category_documents ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- workflow_history
ALTER TABLE public.workflow_history ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- workflow_assignments
ALTER TABLE public.workflow_assignments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- staff_referral_codes
ALTER TABLE public.staff_referral_codes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- consent_records
ALTER TABLE public.consent_records ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- data_requests
ALTER TABLE public.data_requests ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- breach_notifications
ALTER TABLE public.breach_notifications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- pii_access_log
ALTER TABLE public.pii_access_log ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- Tables that may or may not exist — use IF EXISTS pattern

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendor_verifications') THEN
    ALTER TABLE public.vendor_verifications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
    UPDATE public.vendor_verifications SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE public.vendor_verifications ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_vendor_verifications_tenant ON public.vendor_verifications(tenant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendor_invitations') THEN
    ALTER TABLE public.vendor_invitations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
    UPDATE public.vendor_invitations SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE public.vendor_invitations ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_vendor_invitations_tenant ON public.vendor_invitations(tenant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_analyses') THEN
    ALTER TABLE public.document_analyses ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
    UPDATE public.document_analyses SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE public.document_analyses ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_document_analyses_tenant ON public.document_analyses(tenant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'whatsapp_settings') THEN
    ALTER TABLE public.whatsapp_settings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
    UPDATE public.whatsapp_settings SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE public.whatsapp_settings ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_tenant ON public.whatsapp_settings(tenant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'whatsapp_templates') THEN
    ALTER TABLE public.whatsapp_templates ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
    UPDATE public.whatsapp_templates SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE public.whatsapp_templates ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_tenant ON public.whatsapp_templates(tenant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'whatsapp_messages') THEN
    ALTER TABLE public.whatsapp_messages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
    UPDATE public.whatsapp_messages SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE public.whatsapp_messages ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_tenant ON public.whatsapp_messages(tenant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'public_otp_verifications') THEN
    ALTER TABLE public.public_otp_verifications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
    UPDATE public.public_otp_verifications SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE public.public_otp_verifications ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_public_otp_verifications_tenant ON public.public_otp_verifications(tenant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fraud_alerts') THEN
    ALTER TABLE public.fraud_alerts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
    UPDATE public.fraud_alerts SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE public.fraud_alerts ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_fraud_alerts_tenant ON public.fraud_alerts(tenant_id);
  END IF;
END $$;

-- ============================================================================
-- 4. BACKFILL ALL ROWS WITH IN-SYNC TENANT_ID
-- ============================================================================

UPDATE public.profiles SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.user_roles SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.vendors SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.vendor_users SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.vendor_documents SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.vendor_categories SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.document_types SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.category_documents SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.workflow_history SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.workflow_assignments SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.notifications SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.staff_referral_codes SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.consent_records SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.data_requests SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.breach_notifications SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.pii_access_log SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

-- Make tenant_id NOT NULL on all core tables
ALTER TABLE public.profiles ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.user_roles ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vendors ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vendor_users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vendor_documents ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vendor_categories ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.document_types ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.category_documents ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.workflow_history ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.workflow_assignments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.staff_referral_codes ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.consent_records ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.data_requests ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.breach_notifications ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.pii_access_log ALTER COLUMN tenant_id SET NOT NULL;

-- ============================================================================
-- 5. ADD INDEXES ON tenant_id FOR ALL CORE TABLES
-- ============================================================================

CREATE INDEX idx_profiles_tenant ON public.profiles(tenant_id);
CREATE INDEX idx_user_roles_tenant ON public.user_roles(tenant_id);
CREATE INDEX idx_vendors_tenant ON public.vendors(tenant_id);
CREATE INDEX idx_vendor_users_tenant ON public.vendor_users(tenant_id);
CREATE INDEX idx_vendor_documents_tenant ON public.vendor_documents(tenant_id);
CREATE INDEX idx_vendor_categories_tenant ON public.vendor_categories(tenant_id);
CREATE INDEX idx_document_types_tenant ON public.document_types(tenant_id);
CREATE INDEX idx_category_documents_tenant ON public.category_documents(tenant_id);
CREATE INDEX idx_workflow_history_tenant ON public.workflow_history(tenant_id);
CREATE INDEX idx_workflow_assignments_tenant ON public.workflow_assignments(tenant_id);
CREATE INDEX idx_notifications_tenant ON public.notifications(tenant_id);
CREATE INDEX idx_staff_referral_codes_tenant ON public.staff_referral_codes(tenant_id);
CREATE INDEX idx_consent_records_tenant ON public.consent_records(tenant_id);
CREATE INDEX idx_data_requests_tenant ON public.data_requests(tenant_id);
CREATE INDEX idx_breach_notifications_tenant ON public.breach_notifications(tenant_id);
CREATE INDEX idx_pii_access_log_tenant ON public.pii_access_log(tenant_id);

-- ============================================================================
-- 6. CREATE get_user_tenant_id FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT tenant_id FROM public.profiles WHERE user_id = _user_id LIMIT 1),
    (SELECT tenant_id FROM public.vendor_users WHERE user_id = _user_id LIMIT 1)
  )
$$;

-- ============================================================================
-- 7. UPDATE generate_vendor_code() TO USE TENANT PREFIX
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_vendor_code()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    seq_num INTEGER;
    prefix TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM now())::TEXT;

    SELECT vendor_code_prefix INTO prefix
    FROM public.tenants WHERE id = NEW.tenant_id;

    IF prefix IS NULL THEN prefix := 'VND'; END IF;

    SELECT COALESCE(MAX(CAST(SUBSTRING(vendor_code FROM LENGTH(prefix) + 7) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM public.vendors
    WHERE tenant_id = NEW.tenant_id
      AND vendor_code LIKE prefix || '-' || year_part || '-%';

    NEW.vendor_code := prefix || '-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 8. UPDATE RLS HELPER FUNCTIONS TO INCLUDE TENANT SCOPING
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_staff_access_vendor(_user_id UUID, _vendor_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = _vendor_id
        AND v.tenant_id = public.get_user_tenant_id(_user_id)
        AND (
            public.is_admin(_user_id)
            OR (public.has_role(_user_id, 'maker') AND v.current_status IN ('draft', 'pending_review'))
            OR (public.has_role(_user_id, 'checker') AND v.current_status = 'in_verification')
            OR (public.has_role(_user_id, 'approver') AND v.current_status = 'pending_approval')
        )
    )
$$;

-- ============================================================================
-- 9. UPDATE ALL RLS POLICIES TO ADD TENANT SCOPING
-- ============================================================================

-- ---------------------------------------------------------------------------
-- vendor_categories
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can view active categories" ON public.vendor_categories;
CREATE POLICY "Anyone can view active categories"
  ON public.vendor_categories FOR SELECT TO authenticated
  USING (is_active = true AND tenant_id = get_user_tenant_id(auth.uid()));

-- Keep anon read policy for public registration
DROP POLICY IF EXISTS "Anon can view active categories" ON public.vendor_categories;
CREATE POLICY "Anon can view categories"
  ON public.vendor_categories FOR SELECT TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.vendor_categories;
CREATE POLICY "Admins can manage categories"
  ON public.vendor_categories FOR ALL TO authenticated
  USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

-- ---------------------------------------------------------------------------
-- document_types
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can view document types" ON public.document_types;
CREATE POLICY "Anyone can view document types"
  ON public.document_types FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Anon can view document types" ON public.document_types;
CREATE POLICY "Anon can view document types"
  ON public.document_types FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "Admins can manage document types" ON public.document_types;
CREATE POLICY "Admins can manage document types"
  ON public.document_types FOR ALL TO authenticated
  USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

-- ---------------------------------------------------------------------------
-- category_documents
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can view category documents" ON public.category_documents;
CREATE POLICY "Anyone can view category documents"
  ON public.category_documents FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Anon can view category documents" ON public.category_documents;
CREATE POLICY "Anon can view category documents"
  ON public.category_documents FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "Admins can manage category documents" ON public.category_documents;
CREATE POLICY "Admins can manage category documents"
  ON public.category_documents FOR ALL TO authenticated
  USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

-- Current effective policies:
--   "Users can view own profile" (user_id = auth.uid()) — keep as-is (self-access, tenant implicit)
--   "Admins and staff can view all profiles" (is_internal_staff OR has_role admin) — add tenant scope
--   "Allow all authenticated to update own profile" (user_id = auth.uid()) — keep as-is
--   "Admins can manage profiles" (has_role admin) — replaced by is_admin() in later migration — add tenant scope
--   "Admins can insert profiles" (is_admin) — add tenant scope

DROP POLICY IF EXISTS "Allow all authenticated to read profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins and staff can view all profiles" ON public.profiles;
CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (is_internal_staff(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Allow all authenticated to update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- user_roles
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "All authenticated can read roles" ON public.user_roles;
CREATE POLICY "All authenticated can read roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- vendors
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage all vendors" ON public.vendors;
CREATE POLICY "Admins can manage all vendors"
  ON public.vendors FOR ALL TO authenticated
  USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Allow vendor creation via edge function" ON public.vendors;
CREATE POLICY "Allow vendor creation via edge function"
  ON public.vendors FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Staff access vendors by role" ON public.vendors;
CREATE POLICY "Staff access vendors by role"
  ON public.vendors FOR SELECT TO authenticated
  USING (can_staff_access_vendor(auth.uid(), id));

DROP POLICY IF EXISTS "Staff can update vendors they can access" ON public.vendors;
CREATE POLICY "Staff can update vendors they can access"
  ON public.vendors FOR UPDATE TO authenticated
  USING (can_staff_access_vendor(auth.uid(), id));

DROP POLICY IF EXISTS "Vendor users can update own draft vendor" ON public.vendors;
CREATE POLICY "Vendor users can update own draft vendor"
  ON public.vendors FOR UPDATE TO authenticated
  USING (is_vendor_user(auth.uid()) AND id = get_vendor_id(auth.uid()) AND current_status = 'draft'::vendor_status);

DROP POLICY IF EXISTS "Vendor users view own vendor" ON public.vendors;
CREATE POLICY "Vendor users view own vendor"
  ON public.vendors FOR SELECT TO authenticated
  USING (is_vendor_user(auth.uid()) AND id = get_vendor_id(auth.uid()));

DROP POLICY IF EXISTS "Staff can view approved and deactivated vendors" ON public.vendors;
CREATE POLICY "Staff can view approved and deactivated vendors"
  ON public.vendors FOR SELECT TO authenticated
  USING (
    is_internal_staff(auth.uid())
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND current_status IN ('approved', 'deactivated')
  );

DROP POLICY IF EXISTS "Staff can update approved or deactivated vendors" ON public.vendors;
CREATE POLICY "Staff can update approved or deactivated vendors"
  ON public.vendors FOR UPDATE TO authenticated
  USING (
    (is_admin(auth.uid()) OR has_role(auth.uid(), 'approver'))
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND current_status IN ('approved', 'deactivated')
  );

-- ---------------------------------------------------------------------------
-- vendor_users
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Staff can view vendor users" ON public.vendor_users;
CREATE POLICY "Staff can view vendor users"
  ON public.vendor_users FOR SELECT TO authenticated
  USING (is_internal_staff(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Vendor users can view own record" ON public.vendor_users;
CREATE POLICY "Vendor users can view own record"
  ON public.vendor_users FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage vendor users" ON public.vendor_users;
CREATE POLICY "Admins can manage vendor users"
  ON public.vendor_users FOR ALL TO authenticated
  USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

-- ---------------------------------------------------------------------------
-- vendor_documents
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Vendor users manage own documents" ON public.vendor_documents;
CREATE POLICY "Vendor users manage own documents"
  ON public.vendor_documents FOR ALL TO authenticated
  USING (is_vendor_user(auth.uid()) AND vendor_id = get_vendor_id(auth.uid()));

DROP POLICY IF EXISTS "Staff access documents by vendor access" ON public.vendor_documents;
CREATE POLICY "Staff access documents by vendor access"
  ON public.vendor_documents FOR SELECT TO authenticated
  USING (can_staff_access_vendor(auth.uid(), vendor_id));

DROP POLICY IF EXISTS "Staff can update documents" ON public.vendor_documents;
CREATE POLICY "Staff can update documents"
  ON public.vendor_documents FOR UPDATE TO authenticated
  USING (can_staff_access_vendor(auth.uid(), vendor_id));

DROP POLICY IF EXISTS "Admins manage all documents" ON public.vendor_documents;
CREATE POLICY "Admins manage all documents"
  ON public.vendor_documents FOR ALL TO authenticated
  USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

-- ---------------------------------------------------------------------------
-- workflow_history
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Vendor users view own history" ON public.workflow_history;
CREATE POLICY "Vendor users view own history"
  ON public.workflow_history FOR SELECT TO authenticated
  USING (is_vendor_user(auth.uid()) AND vendor_id = get_vendor_id(auth.uid()));

DROP POLICY IF EXISTS "Staff view history by access" ON public.workflow_history;
CREATE POLICY "Staff view history by access"
  ON public.workflow_history FOR SELECT TO authenticated
  USING (can_staff_access_vendor(auth.uid(), vendor_id));

DROP POLICY IF EXISTS "Staff can insert history" ON public.workflow_history;
CREATE POLICY "Staff can insert history"
  ON public.workflow_history FOR INSERT TO authenticated
  WITH CHECK (can_staff_access_vendor(auth.uid(), vendor_id));

DROP POLICY IF EXISTS "Admins manage history" ON public.workflow_history;
CREATE POLICY "Admins manage history"
  ON public.workflow_history FOR ALL TO authenticated
  USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

-- ---------------------------------------------------------------------------
-- workflow_assignments
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Staff view own assignments" ON public.workflow_assignments;
CREATE POLICY "Staff view own assignments"
  ON public.workflow_assignments FOR SELECT TO authenticated
  USING (
    (assigned_to = auth.uid() OR is_admin(auth.uid()))
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

DROP POLICY IF EXISTS "Staff can manage assignments" ON public.workflow_assignments;
CREATE POLICY "Staff can manage assignments"
  ON public.workflow_assignments FOR ALL TO authenticated
  USING (is_internal_staff(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Staff can create notifications" ON public.notifications;
CREATE POLICY "Staff can create notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (is_internal_staff(auth.uid()));

-- ---------------------------------------------------------------------------
-- staff_referral_codes
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Staff view own referral code" ON public.staff_referral_codes;
CREATE POLICY "Staff view own referral code"
  ON public.staff_referral_codes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Staff insert own referral code" ON public.staff_referral_codes;
CREATE POLICY "Staff insert own referral code"
  ON public.staff_referral_codes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_internal_staff(auth.uid()));

DROP POLICY IF EXISTS "Admins manage all referral codes" ON public.staff_referral_codes;
CREATE POLICY "Admins manage all referral codes"
  ON public.staff_referral_codes FOR ALL TO authenticated
  USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

-- Keep anon read for public referral validation
DROP POLICY IF EXISTS "Public can validate referral codes" ON public.staff_referral_codes;
CREATE POLICY "Public can validate referral codes"
  ON public.staff_referral_codes FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- ---------------------------------------------------------------------------
-- consent_records
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Vendor users view own consent records" ON public.consent_records;
CREATE POLICY "Vendor users view own consent records"
  ON public.consent_records FOR SELECT TO authenticated
  USING (is_vendor_user(auth.uid()) AND vendor_id = get_vendor_id(auth.uid()));

DROP POLICY IF EXISTS "Staff can view consent records" ON public.consent_records;
CREATE POLICY "Staff can view consent records"
  ON public.consent_records FOR SELECT TO authenticated
  USING (is_internal_staff(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Admins manage consent records" ON public.consent_records;
CREATE POLICY "Admins manage consent records"
  ON public.consent_records FOR ALL TO authenticated
  USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Allow consent insertion via edge function" ON public.consent_records;
CREATE POLICY "Allow consent insertion via edge function"
  ON public.consent_records FOR INSERT
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- data_requests
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Vendor users view own data requests" ON public.data_requests;
CREATE POLICY "Vendor users view own data requests"
  ON public.data_requests FOR SELECT TO authenticated
  USING (is_vendor_user(auth.uid()) AND vendor_id = get_vendor_id(auth.uid()));

DROP POLICY IF EXISTS "Vendor users create own data requests" ON public.data_requests;
CREATE POLICY "Vendor users create own data requests"
  ON public.data_requests FOR INSERT TO authenticated
  WITH CHECK (is_vendor_user(auth.uid()) AND vendor_id = get_vendor_id(auth.uid()));

DROP POLICY IF EXISTS "Staff can view all data requests" ON public.data_requests;
CREATE POLICY "Staff can view all data requests"
  ON public.data_requests FOR SELECT TO authenticated
  USING (is_internal_staff(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Admins manage data requests" ON public.data_requests;
CREATE POLICY "Admins manage data requests"
  ON public.data_requests FOR ALL TO authenticated
  USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

-- ---------------------------------------------------------------------------
-- breach_notifications
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins manage breach notifications" ON public.breach_notifications;
CREATE POLICY "Admins manage breach notifications"
  ON public.breach_notifications FOR ALL TO authenticated
  USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Staff can view breach notifications" ON public.breach_notifications;
CREATE POLICY "Staff can view breach notifications"
  ON public.breach_notifications FOR SELECT TO authenticated
  USING (is_internal_staff(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

-- ---------------------------------------------------------------------------
-- pii_access_log
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view audit log" ON public.pii_access_log;
CREATE POLICY "Admins can view audit log"
  ON public.pii_access_log FOR SELECT TO authenticated
  USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "System can insert audit log" ON public.pii_access_log;
CREATE POLICY "System can insert audit log"
  ON public.pii_access_log FOR INSERT
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- vendor_verifications (IF EXISTS)
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendor_verifications') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins manage all verifications" ON public.vendor_verifications';
    EXECUTE 'CREATE POLICY "Admins manage all verifications" ON public.vendor_verifications FOR ALL TO authenticated USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()))';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- vendor_invitations (IF EXISTS)
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendor_invitations') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Staff can view all invitations" ON public.vendor_invitations';
    EXECUTE 'CREATE POLICY "Staff can view all invitations" ON public.vendor_invitations FOR SELECT TO authenticated USING (is_internal_staff(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()))';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- fraud_alerts (IF EXISTS)
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fraud_alerts') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins manage fraud alerts" ON public.fraud_alerts';
    EXECUTE 'CREATE POLICY "Admins manage fraud alerts" ON public.fraud_alerts FOR ALL TO authenticated USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()))';
    EXECUTE 'DROP POLICY IF EXISTS "Staff can view fraud alerts" ON public.fraud_alerts';
    EXECUTE 'CREATE POLICY "Staff can view fraud alerts" ON public.fraud_alerts FOR SELECT TO authenticated USING (is_internal_staff(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()))';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- whatsapp_settings (IF EXISTS)
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'whatsapp_settings') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage whatsapp settings" ON public.whatsapp_settings';
    EXECUTE 'CREATE POLICY "Admins can manage whatsapp settings" ON public.whatsapp_settings FOR ALL TO authenticated USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()))';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- whatsapp_templates (IF EXISTS)
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'whatsapp_templates') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage whatsapp templates" ON public.whatsapp_templates';
    EXECUTE 'CREATE POLICY "Admins can manage whatsapp templates" ON public.whatsapp_templates FOR ALL TO authenticated USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()))';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- whatsapp_messages (IF EXISTS)
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'whatsapp_messages') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage all whatsapp messages" ON public.whatsapp_messages';
    EXECUTE 'CREATE POLICY "Admins can manage all whatsapp messages" ON public.whatsapp_messages FOR ALL TO authenticated USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()))';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- document_analyses (IF EXISTS) — policies use can_staff_access_vendor which
-- already includes tenant scoping. Update admin policy only.
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_analyses') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins manage all document analyses" ON public.document_analyses';
    EXECUTE 'CREATE POLICY "Admins manage all document analyses" ON public.document_analyses FOR ALL TO authenticated USING (is_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()))';
  END IF;
END $$;

COMMIT;
