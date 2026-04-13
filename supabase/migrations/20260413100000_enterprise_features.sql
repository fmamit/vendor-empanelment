-- Enterprise features: Webhook Callbacks and API Access
-- Bulk Import uses existing vendors table — no schema changes needed.

-- ─── Webhook endpoints ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_tenant
  ON webhook_endpoints(tenant_id);

-- ─── Webhook deliveries ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint_id UUID REFERENCES webhook_endpoints(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES vendors(id),
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending',       -- pending | delivered | failed
  response_status INTEGER,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint
  ON webhook_deliveries(endpoint_id, created_at DESC);

-- ─── API keys ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,    -- first 12 chars for display (e.g. "isk_live_a1b2")
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256(full_key) for lookup
  created_by UUID REFERENCES profiles(id),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash
  ON api_keys(key_hash) WHERE is_active = true;

-- ─── Extend billing_category enum ───────────────────────────────────
ALTER TYPE billing_category ADD VALUE IF NOT EXISTS 'api_call';

-- ─── RLS: webhook_endpoints ──────────────────────────────────────────
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members manage webhook_endpoints" ON webhook_endpoints
  FOR ALL
  USING   (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

-- ─── RLS: webhook_deliveries ─────────────────────────────────────────
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members view webhook_deliveries" ON webhook_deliveries
  FOR SELECT
  USING (
    endpoint_id IN (
      SELECT id FROM webhook_endpoints
      WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- ─── RLS: api_keys ───────────────────────────────────────────────────
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members manage api_keys" ON api_keys
  FOR ALL
  USING   (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));
