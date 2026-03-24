-- ============================================================================
-- Create fraud_alerts table
-- ============================================================================

CREATE TYPE public.fraud_alert_type AS ENUM (
  'duplicate_gst',
  'duplicate_pan',
  'duplicate_bank',
  'similar_name',
  'tampering',
  'verification_failed'
);

CREATE TYPE public.fraud_alert_severity AS ENUM (
  'critical',
  'high',
  'medium',
  'low'
);

CREATE TYPE public.fraud_alert_status AS ENUM (
  'pending',
  'reviewed',
  'dismissed',
  'confirmed'
);

CREATE TABLE public.fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  alert_type public.fraud_alert_type NOT NULL,
  severity public.fraud_alert_severity NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  status public.fraud_alert_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  dismiss_reason TEXT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id)
);

-- Indexes
CREATE INDEX idx_fraud_alerts_vendor ON public.fraud_alerts(vendor_id);
CREATE INDEX idx_fraud_alerts_status ON public.fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_severity ON public.fraud_alerts(severity);
CREATE INDEX idx_fraud_alerts_tenant ON public.fraud_alerts(tenant_id);
CREATE INDEX idx_fraud_alerts_created ON public.fraud_alerts(created_at DESC);

-- RLS
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view fraud alerts"
  ON public.fraud_alerts FOR SELECT TO authenticated
  USING (
    is_internal_staff(auth.uid())
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

CREATE POLICY "Staff can update fraud alerts"
  ON public.fraud_alerts FOR UPDATE TO authenticated
  USING (
    is_internal_staff(auth.uid())
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

CREATE POLICY "Admins manage fraud alerts"
  ON public.fraud_alerts FOR ALL TO authenticated
  USING (
    is_admin(auth.uid())
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

-- ============================================================================
-- Function: auto-detect duplicate GST/PAN/bank on vendor insert/update
-- ============================================================================

CREATE OR REPLACE FUNCTION public.detect_vendor_duplicates()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  match RECORD;
BEGIN
  -- Get tenant from the vendor (assumes vendors have tenant_id)
  SELECT tenant_id INTO v_tenant_id FROM public.vendors WHERE id = NEW.id;
  IF v_tenant_id IS NULL THEN
    -- Fallback: try from the tenants default
    v_tenant_id := 'a0000000-0000-0000-0000-000000000001';
  END IF;

  -- Check duplicate GST
  IF NEW.gst_number IS NOT NULL AND NEW.gst_number != '' THEN
    FOR match IN
      SELECT id, company_name FROM public.vendors
      WHERE gst_number = NEW.gst_number
        AND id != NEW.id
        AND current_status NOT IN ('rejected', 'deactivated', 'consent_withdrawn')
    LOOP
      INSERT INTO public.fraud_alerts (vendor_id, alert_type, severity, title, description, details, tenant_id)
      VALUES (
        NEW.id,
        'duplicate_gst',
        'critical',
        'Duplicate GST Number Detected',
        format('GST number %s is already registered with another vendor.', NEW.gst_number),
        jsonb_build_object(
          'matching_vendor_id', match.id,
          'matching_vendor_name', match.company_name,
          'matching_value', NEW.gst_number
        ),
        v_tenant_id
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Check duplicate PAN
  IF NEW.pan_number IS NOT NULL AND NEW.pan_number != '' THEN
    FOR match IN
      SELECT id, company_name FROM public.vendors
      WHERE pan_number = NEW.pan_number
        AND id != NEW.id
        AND current_status NOT IN ('rejected', 'deactivated', 'consent_withdrawn')
    LOOP
      INSERT INTO public.fraud_alerts (vendor_id, alert_type, severity, title, description, details, tenant_id)
      VALUES (
        NEW.id,
        'duplicate_pan',
        'critical',
        'Duplicate PAN Number',
        format('PAN number %s is registered with another vendor.', NEW.pan_number),
        jsonb_build_object(
          'matching_vendor_id', match.id,
          'matching_vendor_name', match.company_name,
          'matching_value', NEW.pan_number
        ),
        v_tenant_id
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Check duplicate bank account
  IF NEW.bank_account_number IS NOT NULL AND NEW.bank_account_number != '' AND NEW.bank_ifsc IS NOT NULL THEN
    FOR match IN
      SELECT id, company_name FROM public.vendors
      WHERE bank_account_number = NEW.bank_account_number
        AND bank_ifsc = NEW.bank_ifsc
        AND id != NEW.id
        AND current_status NOT IN ('rejected', 'deactivated', 'consent_withdrawn')
    LOOP
      INSERT INTO public.fraud_alerts (vendor_id, alert_type, severity, title, description, details, tenant_id)
      VALUES (
        NEW.id,
        'duplicate_bank',
        'high',
        'Duplicate Bank Account',
        format('Bank account at %s is already linked to another vendor.', NEW.bank_ifsc),
        jsonb_build_object(
          'matching_vendor_id', match.id,
          'matching_vendor_name', match.company_name,
          'matching_value', format('%s - %s', NEW.bank_ifsc, right(NEW.bank_account_number, 4))
        ),
        v_tenant_id
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_detect_vendor_duplicates
  AFTER INSERT OR UPDATE OF gst_number, pan_number, bank_account_number, bank_ifsc
  ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.detect_vendor_duplicates();
