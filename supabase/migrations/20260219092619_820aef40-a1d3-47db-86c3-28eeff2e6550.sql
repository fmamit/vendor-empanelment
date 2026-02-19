
-- Create a helper function to upsert secrets in the vault (admin only)
CREATE OR REPLACE FUNCTION public.upsert_vault_secret(secret_name TEXT, secret_value TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete existing secret with same name if it exists
  DELETE FROM vault.secrets WHERE name = secret_name;
  
  -- Insert the new secret
  INSERT INTO vault.secrets (name, secret)
  VALUES (secret_name, secret_value);
END;
$$;

-- Create a helper to check if a vault secret exists
CREATE OR REPLACE FUNCTION public.check_encryption_key_exists()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'PII_ENCRYPTION_KEY'
  );
END;
$$;
