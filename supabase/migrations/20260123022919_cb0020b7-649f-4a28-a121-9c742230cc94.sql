-- Enums for roles and statuses
CREATE TYPE public.app_role AS ENUM ('maker', 'checker', 'approver', 'admin');
CREATE TYPE public.vendor_status AS ENUM ('draft', 'pending_review', 'in_verification', 'pending_approval', 'approved', 'rejected');
CREATE TYPE public.document_status AS ENUM ('uploaded', 'under_review', 'approved', 'rejected', 'expired');
CREATE TYPE public.workflow_action AS ENUM ('submitted', 'forwarded', 'approved', 'rejected', 'returned', 'assigned');

-- =====================
-- MASTER TABLES
-- =====================

-- Vendor Categories
CREATE TABLE public.vendor_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document Types
CREATE TABLE public.document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    sample_url TEXT,
    accepted_formats TEXT[] DEFAULT ARRAY['pdf', 'jpg', 'jpeg', 'png'],
    max_file_size_mb INTEGER DEFAULT 5,
    has_expiry BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Category-Document Mapping
CREATE TABLE public.category_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.vendor_categories(id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES public.document_types(id) ON DELETE CASCADE,
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER DEFAULT 0,
    UNIQUE(category_id, document_type_id)
);

-- =====================
-- PROFILES & ROLES (Internal Staff)
-- =====================

-- Staff Profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    department TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles (separate as required)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- =====================
-- VENDOR TABLES
-- =====================

-- Vendors
CREATE TABLE public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_code TEXT UNIQUE,
    category_id UUID NOT NULL REFERENCES public.vendor_categories(id),
    company_name TEXT NOT NULL,
    trade_name TEXT,
    gst_number TEXT,
    pan_number TEXT,
    cin_number TEXT,
    registered_address TEXT,
    operational_address TEXT,
    primary_contact_name TEXT NOT NULL,
    primary_mobile TEXT NOT NULL,
    primary_email TEXT NOT NULL,
    secondary_contact_name TEXT,
    secondary_mobile TEXT,
    bank_account_number TEXT,
    bank_ifsc TEXT,
    bank_name TEXT,
    bank_branch TEXT,
    current_status vendor_status NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vendor Users (for OTP login)
CREATE TABLE public.vendor_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    is_primary_contact BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vendor Documents
CREATE TABLE public.vendor_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES public.document_types(id),
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes INTEGER,
    version_number INTEGER NOT NULL DEFAULT 1,
    expiry_date DATE,
    status document_status NOT NULL DEFAULT 'uploaded',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workflow History
CREATE TABLE public.workflow_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    from_status vendor_status,
    to_status vendor_status NOT NULL,
    action workflow_action NOT NULL,
    action_by UUID NOT NULL REFERENCES auth.users(id),
    comments TEXT,
    time_in_stage_minutes INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workflow Assignments
CREATE TABLE public.workflow_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES auth.users(id),
    stage vendor_status NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'in_app',
    related_vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OTP Codes (temporary storage)
CREATE TABLE public.otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- AUTO-GENERATE VENDOR CODE
-- =====================

CREATE OR REPLACE FUNCTION public.generate_vendor_code()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    seq_num INTEGER;
BEGIN
    year_part := EXTRACT(YEAR FROM now())::TEXT;
    SELECT COALESCE(MAX(CAST(SUBSTRING(vendor_code FROM 9) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM public.vendors
    WHERE vendor_code LIKE 'CI-' || year_part || '-%';
    
    NEW.vendor_code := 'CI-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_vendor_code
    BEFORE INSERT ON public.vendors
    FOR EACH ROW
    WHEN (NEW.vendor_code IS NULL)
    EXECUTE FUNCTION public.generate_vendor_code();

-- =====================
-- UPDATE TIMESTAMP TRIGGER
-- =====================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_vendors_timestamp BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_profiles_timestamp BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_vendor_documents_timestamp BEFORE UPDATE ON public.vendor_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================
-- SECURITY HELPER FUNCTIONS
-- =====================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Check if user is internal staff
CREATE OR REPLACE FUNCTION public.is_internal_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = _user_id AND is_active = true
    )
$$;

-- Check if user is a vendor user
CREATE OR REPLACE FUNCTION public.is_vendor_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.vendor_users
        WHERE user_id = _user_id AND is_active = true
    )
$$;

-- Get vendor ID for a vendor user
CREATE OR REPLACE FUNCTION public.get_vendor_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT vendor_id FROM public.vendor_users
    WHERE user_id = _user_id AND is_active = true
    LIMIT 1
$$;

-- Check if staff can access vendor based on status and role
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
        AND (
            public.has_role(_user_id, 'admin')
            OR (public.has_role(_user_id, 'maker') AND v.current_status IN ('draft', 'pending_review'))
            OR (public.has_role(_user_id, 'checker') AND v.current_status = 'in_verification')
            OR (public.has_role(_user_id, 'approver') AND v.current_status = 'pending_approval')
        )
    )
$$;

-- =====================
-- ENABLE RLS ON ALL TABLES
-- =====================

ALTER TABLE public.vendor_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- =====================
-- RLS POLICIES
-- =====================

-- vendor_categories: readable by all authenticated, writable by admin
CREATE POLICY "Anyone can view active categories" ON public.vendor_categories FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON public.vendor_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- document_types: readable by all authenticated, writable by admin
CREATE POLICY "Anyone can view document types" ON public.document_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage document types" ON public.document_types FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- category_documents: readable by all authenticated, writable by admin
CREATE POLICY "Anyone can view category documents" ON public.category_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage category documents" ON public.category_documents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- profiles: staff can view all, update own, admin manages all
CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_internal_staff(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_roles: staff can view, admin manages
CREATE POLICY "Staff can view roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_internal_staff(auth.uid()));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- vendors: complex access based on role and status
CREATE POLICY "Vendor users view own vendor" ON public.vendors FOR SELECT TO authenticated 
    USING (public.is_vendor_user(auth.uid()) AND id = public.get_vendor_id(auth.uid()));
CREATE POLICY "Staff access vendors by role" ON public.vendors FOR SELECT TO authenticated 
    USING (public.can_staff_access_vendor(auth.uid(), id));
CREATE POLICY "Vendor users can update own draft vendor" ON public.vendors FOR UPDATE TO authenticated 
    USING (public.is_vendor_user(auth.uid()) AND id = public.get_vendor_id(auth.uid()) AND current_status = 'draft');
CREATE POLICY "Staff can update vendors they can access" ON public.vendors FOR UPDATE TO authenticated 
    USING (public.can_staff_access_vendor(auth.uid(), id));
CREATE POLICY "Admins can manage all vendors" ON public.vendors FOR ALL TO authenticated 
    USING (public.has_role(auth.uid(), 'admin'));

-- vendor_users: admin manages, staff can view
CREATE POLICY "Staff can view vendor users" ON public.vendor_users FOR SELECT TO authenticated USING (public.is_internal_staff(auth.uid()));
CREATE POLICY "Vendor users can view own record" ON public.vendor_users FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage vendor users" ON public.vendor_users FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- vendor_documents: access based on vendor access
CREATE POLICY "Vendor users manage own documents" ON public.vendor_documents FOR ALL TO authenticated 
    USING (public.is_vendor_user(auth.uid()) AND vendor_id = public.get_vendor_id(auth.uid()));
CREATE POLICY "Staff access documents by vendor access" ON public.vendor_documents FOR SELECT TO authenticated 
    USING (public.can_staff_access_vendor(auth.uid(), vendor_id));
CREATE POLICY "Staff can update documents" ON public.vendor_documents FOR UPDATE TO authenticated 
    USING (public.can_staff_access_vendor(auth.uid(), vendor_id));
CREATE POLICY "Admins manage all documents" ON public.vendor_documents FOR ALL TO authenticated 
    USING (public.has_role(auth.uid(), 'admin'));

-- workflow_history: read based on vendor access
CREATE POLICY "Vendor users view own history" ON public.workflow_history FOR SELECT TO authenticated 
    USING (public.is_vendor_user(auth.uid()) AND vendor_id = public.get_vendor_id(auth.uid()));
CREATE POLICY "Staff view history by access" ON public.workflow_history FOR SELECT TO authenticated 
    USING (public.can_staff_access_vendor(auth.uid(), vendor_id));
CREATE POLICY "Staff can insert history" ON public.workflow_history FOR INSERT TO authenticated 
    WITH CHECK (public.can_staff_access_vendor(auth.uid(), vendor_id));
CREATE POLICY "Admins manage history" ON public.workflow_history FOR ALL TO authenticated 
    USING (public.has_role(auth.uid(), 'admin'));

-- workflow_assignments: staff view own, admin manages all
CREATE POLICY "Staff view own assignments" ON public.workflow_assignments FOR SELECT TO authenticated 
    USING (assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can manage assignments" ON public.workflow_assignments FOR ALL TO authenticated 
    USING (public.is_internal_staff(auth.uid()));

-- notifications: users view own
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (recipient_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (recipient_id = auth.uid());
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- otp_codes: service role only (edge functions)
CREATE POLICY "No direct access to OTP codes" ON public.otp_codes FOR ALL TO authenticated USING (false);

-- =====================
-- INDEXES FOR PERFORMANCE
-- =====================

CREATE INDEX idx_vendors_status ON public.vendors(current_status);
CREATE INDEX idx_vendors_category ON public.vendors(category_id);
CREATE INDEX idx_vendor_documents_vendor ON public.vendor_documents(vendor_id);
CREATE INDEX idx_vendor_documents_status ON public.vendor_documents(status);
CREATE INDEX idx_workflow_history_vendor ON public.workflow_history(vendor_id);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, is_read);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_vendor_users_vendor ON public.vendor_users(vendor_id);
CREATE INDEX idx_vendor_users_phone ON public.vendor_users(phone_number);
CREATE INDEX idx_otp_codes_phone ON public.otp_codes(phone_number, expires_at);