
-- Update encrypt_pii to read key from vault
CREATE OR REPLACE FUNCTION public.encrypt_pii(plaintext TEXT)
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  IF plaintext IS NULL OR plaintext = '' THEN
    RETURN NULL;
  END IF;
  
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'PII_ENCRYPTION_KEY'
  LIMIT 1;
  
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'PII_ENCRYPTION_KEY not found in vault';
  END IF;
  
  RETURN pgp_sym_encrypt(plaintext, encryption_key);
END;
$$;

-- Update decrypt_pii to read key from vault
CREATE OR REPLACE FUNCTION public.decrypt_pii(ciphertext BYTEA)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  IF ciphertext IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'PII_ENCRYPTION_KEY'
  LIMIT 1;
  
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'PII_ENCRYPTION_KEY not found in vault';
  END IF;
  
  RETURN pgp_sym_decrypt(ciphertext, encryption_key);
END;
$$;

-- Also update the trigger functions since they call encrypt_pii which now reads from vault
-- Re-create encrypt_vendor_pii to use updated encrypt_pii
CREATE OR REPLACE FUNCTION public.encrypt_vendor_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.pan_number IS NOT NULL AND NEW.pan_number != '' THEN
    NEW.pan_number_encrypted := encrypt_pii(NEW.pan_number);
    NEW.pan_number := NULL;
  END IF;
  IF NEW.gst_number IS NOT NULL AND NEW.gst_number != '' THEN
    NEW.gst_number_encrypted := encrypt_pii(NEW.gst_number);
    NEW.gst_number := NULL;
  END IF;
  IF NEW.cin_number IS NOT NULL AND NEW.cin_number != '' THEN
    NEW.cin_number_encrypted := encrypt_pii(NEW.cin_number);
    NEW.cin_number := NULL;
  END IF;
  IF NEW.bank_account_number IS NOT NULL AND NEW.bank_account_number != '' THEN
    NEW.bank_account_number_encrypted := encrypt_pii(NEW.bank_account_number);
    NEW.bank_account_number := NULL;
  END IF;
  IF NEW.bank_ifsc IS NOT NULL AND NEW.bank_ifsc != '' THEN
    NEW.bank_ifsc_encrypted := encrypt_pii(NEW.bank_ifsc);
    NEW.bank_ifsc := NULL;
  END IF;
  IF NEW.primary_mobile IS NOT NULL AND NEW.primary_mobile != '' THEN
    NEW.primary_mobile_encrypted := encrypt_pii(NEW.primary_mobile);
    NEW.primary_mobile := '****' || RIGHT(NEW.primary_mobile, 4);
  END IF;
  IF NEW.primary_email IS NOT NULL AND NEW.primary_email != '' THEN
    NEW.primary_email_encrypted := encrypt_pii(NEW.primary_email);
    NEW.primary_email := SPLIT_PART(NEW.primary_email, '@', 1) || '@***';
  END IF;
  IF NEW.secondary_mobile IS NOT NULL AND NEW.secondary_mobile != '' THEN
    NEW.secondary_mobile_encrypted := encrypt_pii(NEW.secondary_mobile);
    NEW.secondary_mobile := NULL;
  END IF;
  IF NEW.nominee_contact IS NOT NULL AND NEW.nominee_contact != '' THEN
    NEW.nominee_contact_encrypted := encrypt_pii(NEW.nominee_contact);
    NEW.nominee_contact := NULL;
  END IF;
  RETURN NEW;
END;
$$;

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

-- Drop the unnecessary set_pii_key function
DROP FUNCTION IF EXISTS public.set_pii_key();
