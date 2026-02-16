
-- Create is_admin helper that checks for admin OR platform_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin'::app_role, 'platform_admin'::app_role)
  )
$$;

-- Update can_staff_access_vendor to use is_admin
CREATE OR REPLACE FUNCTION public.can_staff_access_vendor(_user_id uuid, _vendor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = _vendor_id
    AND (
      public.is_admin(_user_id)
      OR (public.has_role(_user_id, 'maker') AND v.current_status IN ('draft', 'pending_review'))
      OR (public.has_role(_user_id, 'checker') AND v.current_status = 'in_verification')
      OR (public.has_role(_user_id, 'approver') AND v.current_status = 'pending_approval')
    )
  )
$$;

-- Update get_vendor_decrypted to use is_admin
CREATE OR REPLACE FUNCTION public.get_vendor_decrypted(p_vendor_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  result JSON;
  calling_user UUID;
BEGIN
  calling_user := auth.uid();
  IF NOT (is_internal_staff(calling_user) OR is_admin(calling_user)) THEN
    IF NOT (is_vendor_user(calling_user) AND p_vendor_id = get_vendor_id(calling_user)) THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  END IF;
  INSERT INTO public.pii_access_log (user_id, table_name, column_name, vendor_id, purpose)
  VALUES (calling_user, 'vendors', 'all_pii_fields', p_vendor_id, 'vendor_detail_view');
  SELECT json_build_object(
    'id', v.id, 'vendor_code', v.vendor_code, 'category_id', v.category_id,
    'company_name', v.company_name, 'trade_name', v.trade_name,
    'registered_address', v.registered_address, 'operational_address', v.operational_address,
    'primary_contact_name', v.primary_contact_name, 'secondary_contact_name', v.secondary_contact_name,
    'salutation', v.salutation, 'constitution_type', v.constitution_type,
    'nominee_name', v.nominee_name, 'bank_name', v.bank_name, 'bank_branch', v.bank_branch,
    'current_status', v.current_status, 'submitted_at', v.submitted_at,
    'approved_at', v.approved_at, 'rejected_at', v.rejected_at,
    'rejection_reason', v.rejection_reason, 'sent_back_reason', v.sent_back_reason,
    'referred_by', v.referred_by, 'created_at', v.created_at, 'updated_at', v.updated_at,
    'pan_number', COALESCE(decrypt_pii(v.pan_number_encrypted), v.pan_number),
    'gst_number', COALESCE(decrypt_pii(v.gst_number_encrypted), v.gst_number),
    'cin_number', COALESCE(decrypt_pii(v.cin_number_encrypted), v.cin_number),
    'bank_account_number', COALESCE(decrypt_pii(v.bank_account_number_encrypted), v.bank_account_number),
    'bank_ifsc', COALESCE(decrypt_pii(v.bank_ifsc_encrypted), v.bank_ifsc),
    'primary_mobile', COALESCE(decrypt_pii(v.primary_mobile_encrypted), v.primary_mobile),
    'primary_email', COALESCE(decrypt_pii(v.primary_email_encrypted), v.primary_email),
    'secondary_mobile', COALESCE(decrypt_pii(v.secondary_mobile_encrypted), v.secondary_mobile),
    'nominee_contact', COALESCE(decrypt_pii(v.nominee_contact_encrypted), v.nominee_contact)
  ) INTO result
  FROM public.vendors v WHERE v.id = p_vendor_id;
  RETURN result;
END;
$function$;

-- Update all RLS policies to use is_admin()

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all vendors" ON public.vendors;
CREATE POLICY "Admins can manage all vendors"
  ON public.vendors FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage all documents" ON public.vendor_documents;
CREATE POLICY "Admins manage all documents"
  ON public.vendor_documents FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage vendor users" ON public.vendor_users;
CREATE POLICY "Admins can manage vendor users"
  ON public.vendor_users FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage all verifications" ON public.vendor_verifications;
CREATE POLICY "Admins manage all verifications"
  ON public.vendor_verifications FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage history" ON public.workflow_history;
CREATE POLICY "Admins manage history"
  ON public.workflow_history FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Staff view own assignments" ON public.workflow_assignments;
CREATE POLICY "Staff view own assignments"
  ON public.workflow_assignments FOR SELECT TO authenticated
  USING ((assigned_to = auth.uid()) OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage breach notifications" ON public.breach_notifications;
CREATE POLICY "Admins manage breach notifications"
  ON public.breach_notifications FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage consent records" ON public.consent_records;
CREATE POLICY "Admins manage consent records"
  ON public.consent_records FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage data requests" ON public.data_requests;
CREATE POLICY "Admins manage data requests"
  ON public.data_requests FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage document types" ON public.document_types;
CREATE POLICY "Admins can manage document types"
  ON public.document_types FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage category documents" ON public.category_documents;
CREATE POLICY "Admins can manage category documents"
  ON public.category_documents FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage categories" ON public.vendor_categories;
CREATE POLICY "Admins can manage categories"
  ON public.vendor_categories FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view audit log" ON public.pii_access_log;
CREATE POLICY "Admins can view audit log"
  ON public.pii_access_log FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage all referral codes" ON public.staff_referral_codes;
CREATE POLICY "Admins manage all referral codes"
  ON public.staff_referral_codes FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage whatsapp settings" ON public.whatsapp_settings;
CREATE POLICY "Admins can manage whatsapp settings"
  ON public.whatsapp_settings FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage whatsapp templates" ON public.whatsapp_templates;
CREATE POLICY "Admins can manage whatsapp templates"
  ON public.whatsapp_templates FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all whatsapp messages" ON public.whatsapp_messages;
CREATE POLICY "Admins can manage all whatsapp messages"
  ON public.whatsapp_messages FOR ALL TO authenticated
  USING (is_admin(auth.uid()));
