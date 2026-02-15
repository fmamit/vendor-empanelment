
-- Insert the PII encryption key into the vault
-- The user will need to update this with their actual key
SELECT vault.create_secret('change-me-to-your-actual-key', 'PII_ENCRYPTION_KEY', 'PII encryption key for DPDP compliance');
