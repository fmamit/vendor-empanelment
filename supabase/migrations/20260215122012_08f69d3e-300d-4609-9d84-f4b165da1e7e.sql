
-- Part 1: Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Part 1: Create encrypt/decrypt helper functions
CREATE OR REPLACE FUNCTION public.encrypt_pii(plaintext TEXT)
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF plaintext IS NULL OR plaintext = '' THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_encrypt(plaintext, current_setting('app.settings.pii_encryption_key'));
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_pii(ciphertext BYTEA)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF ciphertext IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_decrypt(ciphertext, current_setting('app.settings.pii_encryption_key'));
END;
$$;

-- Part 2: Add encrypted columns to vendors
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS pan_number_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS gst_number_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS cin_number_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS bank_account_number_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS bank_ifsc_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS primary_mobile_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS primary_email_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS secondary_mobile_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS nominee_contact_encrypted BYTEA;

-- Part 2: Add encrypted columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS email_encrypted BYTEA;

-- Part 3: Create trigger function for vendors PII encryption
CREATE OR REPLACE FUNCTION public.encrypt_vendor_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Encrypt PAN
  IF NEW.pan_number IS NOT NULL AND NEW.pan_number != '' THEN
    NEW.pan_number_encrypted := encrypt_pii(NEW.pan_number);
    NEW.pan_number := NULL;
  END IF;
  -- Encrypt GST
  IF NEW.gst_number IS NOT NULL AND NEW.gst_number != '' THEN
    NEW.gst_number_encrypted := encrypt_pii(NEW.gst_number);
    NEW.gst_number := NULL;
  END IF;
  -- Encrypt CIN
  IF NEW.cin_number IS NOT NULL AND NEW.cin_number != '' THEN
    NEW.cin_number_encrypted := encrypt_pii(NEW.cin_number);
    NEW.cin_number := NULL;
  END IF;
  -- Encrypt bank account
  IF NEW.bank_account_number IS NOT NULL AND NEW.bank_account_number != '' THEN
    NEW.bank_account_number_encrypted := encrypt_pii(NEW.bank_account_number);
    NEW.bank_account_number := NULL;
  END IF;
  -- Encrypt IFSC
  IF NEW.bank_ifsc IS NOT NULL AND NEW.bank_ifsc != '' THEN
    NEW.bank_ifsc_encrypted := encrypt_pii(NEW.bank_ifsc);
    NEW.bank_ifsc := NULL;
  END IF;
  -- Encrypt primary mobile
  IF NEW.primary_mobile IS NOT NULL AND NEW.primary_mobile != '' THEN
    NEW.primary_mobile_encrypted := encrypt_pii(NEW.primary_mobile);
    NEW.primary_mobile := '****' || RIGHT(NEW.primary_mobile, 4);
  END IF;
  -- Encrypt primary email
  IF NEW.primary_email IS NOT NULL AND NEW.primary_email != '' THEN
    NEW.primary_email_encrypted := encrypt_pii(NEW.primary_email);
    NEW.primary_email := SPLIT_PART(NEW.primary_email, '@', 1) || '@***';
  END IF;
  -- Encrypt secondary mobile
  IF NEW.secondary_mobile IS NOT NULL AND NEW.secondary_mobile != '' THEN
    NEW.secondary_mobile_encrypted := encrypt_pii(NEW.secondary_mobile);
    NEW.secondary_mobile := NULL;
  END IF;
  -- Encrypt nominee contact
  IF NEW.nominee_contact IS NOT NULL AND NEW.nominee_contact != '' THEN
    NEW.nominee_contact_encrypted := encrypt_pii(NEW.nominee_contact);
    NEW.nominee_contact := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Part 3: Create trigger function for profiles PII encryption
CREATE OR REPLACE FUNCTION public.encrypt_profile_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    NEW.phone_encrypted := encrypt_pii(NEW.phone);
    NEW.phone := NULL;
  END IF;
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    NEW.email_encrypted := encrypt_pii(NEW.email);
    NEW.email := SPLIT_PART(NEW.email, '@', 1) || '@***';
  END IF;
  RETURN NEW;
END;
$$;

-- Part 3: Create triggers
CREATE TRIGGER encrypt_vendor_pii_trigger
  BEFORE INSERT OR UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_vendor_pii();

CREATE TRIGGER encrypt_profile_pii_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_profile_pii();

-- Part 5: Create decrypted view for vendors
CREATE OR REPLACE VIEW public.vendors_decrypted
WITH (security_invoker = on)
AS
SELECT
  id, category_id, current_status, company_name, trade_name,
  registered_address, operational_address,
  primary_contact_name, secondary_contact_name,
  salutation, constitution_type, nominee_name,
  vendor_code, referred_by,
  submitted_at, approved_at, rejected_at, rejection_reason, sent_back_reason,
  bank_name, bank_branch,
  created_at, updated_at,
  -- Decrypted fields
  COALESCE(decrypt_pii(pan_number_encrypted), pan_number) AS pan_number,
  COALESCE(decrypt_pii(gst_number_encrypted), gst_number) AS gst_number,
  COALESCE(decrypt_pii(cin_number_encrypted), cin_number) AS cin_number,
  COALESCE(decrypt_pii(bank_account_number_encrypted), bank_account_number) AS bank_account_number,
  COALESCE(decrypt_pii(bank_ifsc_encrypted), bank_ifsc) AS bank_ifsc,
  COALESCE(decrypt_pii(primary_mobile_encrypted), primary_mobile) AS primary_mobile,
  COALESCE(decrypt_pii(primary_email_encrypted), primary_email) AS primary_email,
  COALESCE(decrypt_pii(secondary_mobile_encrypted), secondary_mobile) AS secondary_mobile,
  COALESCE(decrypt_pii(nominee_contact_encrypted), nominee_contact) AS nominee_contact
FROM public.vendors;

-- Part 5: Create decrypted view for profiles
CREATE OR REPLACE VIEW public.profiles_decrypted
WITH (security_invoker = on)
AS
SELECT
  id, user_id, full_name, department, is_active, created_at, updated_at,
  COALESCE(decrypt_pii(phone_encrypted), phone) AS phone,
  COALESCE(decrypt_pii(email_encrypted), email) AS email
FROM public.profiles;

-- Part 8: Create PII access audit log
CREATE TABLE public.pii_access_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  vendor_id UUID,
  purpose TEXT NOT NULL DEFAULT 'display',
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pii_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.pii_access_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit log"
  ON public.pii_access_log FOR INSERT
  WITH CHECK (true);

-- Index for audit queries
CREATE INDEX idx_pii_access_log_user ON public.pii_access_log(user_id);
CREATE INDEX idx_pii_access_log_time ON public.pii_access_log(accessed_at);
