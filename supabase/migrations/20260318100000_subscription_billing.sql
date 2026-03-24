-- Subscription billing schema for vendor verification platform
-- Modeled on WA project billing with subscription tiers instead of per-message pricing

-- Subscription plan enum
DO $$ BEGIN
  CREATE TYPE subscription_plan AS ENUM ('free_trial', 'starter', 'professional', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Subscription status enum
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Transaction type enum (reuse pattern from WA)
DO $$ BEGIN
  CREATE TYPE billing_transaction_type AS ENUM ('credit', 'debit');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE billing_category AS ENUM (
    'subscription_payment', 'free_trial_credit', 'refund', 'adjustment', 'gst'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── org_subscriptions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  plan subscription_plan NOT NULL DEFAULT 'free_trial',
  status subscription_status NOT NULL DEFAULT 'trial',
  vendor_limit integer NOT NULL DEFAULT 5, -- free trial = 5
  vendors_used integer NOT NULL DEFAULT 0,
  monthly_price numeric NOT NULL DEFAULT 0,
  billing_cycle_start date,
  billing_cycle_end date,
  razorpay_subscription_id text,
  razorpay_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

-- ─── billing_transactions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS billing_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  type billing_transaction_type NOT NULL,
  category billing_category NOT NULL,
  amount numeric NOT NULL,
  description text,
  reference_id text, -- razorpay payment id, etc.
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_txn_tenant_date
  ON billing_transactions(tenant_id, created_at DESC);

-- ─── Plan configuration (reference data) ────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
  id subscription_plan PRIMARY KEY,
  name text NOT NULL,
  description text,
  vendor_limit integer NOT NULL,
  monthly_price numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

INSERT INTO subscription_plans (id, name, description, vendor_limit, monthly_price) VALUES
  ('free_trial', 'Free Trial', 'First 5 vendor verifications free', 5, 0),
  ('starter', 'Starter', 'Up to 10 vendors per month', 10, 2499),
  ('professional', 'Professional', '11-30 vendors per month', 30, 5999),
  ('enterprise', 'Enterprise', '31+ vendors per month', 999999, 11999)
ON CONFLICT (id) DO NOTHING;

-- ─── Auto-create subscription on tenant creation ────────────────────
CREATE OR REPLACE FUNCTION create_tenant_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO org_subscriptions (tenant_id, plan, status, vendor_limit, monthly_price)
  VALUES (NEW.id, 'free_trial', 'trial', 5, 0)
  ON CONFLICT (tenant_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_tenant_subscription ON tenants;
CREATE TRIGGER trg_create_tenant_subscription
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION create_tenant_subscription();

-- ─── Increment vendor usage counter ─────────────────────────────────
-- Called when a vendor application is submitted for review
CREATE OR REPLACE FUNCTION increment_vendor_usage(_tenant_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _sub org_subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO _sub FROM org_subscriptions WHERE tenant_id = _tenant_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN -1; -- no subscription
  END IF;

  IF _sub.vendors_used >= _sub.vendor_limit THEN
    RETURN -2; -- limit reached
  END IF;

  UPDATE org_subscriptions
  SET vendors_used = vendors_used + 1, updated_at = now()
  WHERE tenant_id = _tenant_id;

  RETURN _sub.vendors_used + 1;
END;
$$;

-- ─── RLS policies ───────────────────────────────────────────────────
ALTER TABLE org_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can read plans
CREATE POLICY "Anyone can read plans" ON subscription_plans
  FOR SELECT USING (true);

-- Org members can view their subscription
CREATE POLICY "Org members can view subscription" ON org_subscriptions
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Org members can view their transactions
CREATE POLICY "Org members can view transactions" ON billing_transactions
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Service role can manage all
CREATE POLICY "Service role full access subscriptions" ON org_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access transactions" ON billing_transactions
  FOR ALL USING (auth.role() = 'service_role');
