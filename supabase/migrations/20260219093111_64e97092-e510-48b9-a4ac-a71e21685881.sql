
-- Fix: use vault's own API functions instead of direct INSERT/DELETE
CREATE OR REPLACE FUNCTION public.upsert_vault_secret(secret_name TEXT, secret_value TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'vault', 'extensions'
AS $$
DECLARE
  existing_id UUID;
BEGIN
  -- Check if secret already exists
  SELECT id INTO existing_id
  FROM vault.decrypted_secrets
  WHERE name = secret_name
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    -- Update existing secret using vault API
    PERFORM vault.update_secret(existing_id, secret_value, secret_name);
  ELSE
    -- Create new secret using vault API
    PERFORM vault.create_secret(secret_value, secret_name);
  END IF;
END;
$$;
