-- Double subscription plan prices
UPDATE subscription_plans SET monthly_price = 4999  WHERE id = 'starter';
UPDATE subscription_plans SET monthly_price = 11999 WHERE id = 'professional';
UPDATE subscription_plans SET monthly_price = 23999 WHERE id = 'enterprise';

-- ─── Coupons table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent integer NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date NOT NULL,
  max_uses integer, -- NULL = unlimited
  times_used integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- HAPPY50 launch coupon: 50% off, valid until 30 Jun 2026
INSERT INTO coupons (code, discount_percent, valid_from, valid_until)
VALUES ('HAPPY50', 50, '2026-03-24', '2026-06-30')
ON CONFLICT (code) DO NOTHING;

-- ─── Coupon redemptions (track who used which coupon) ─────────────
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES coupons(id),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  applied_at timestamptz NOT NULL DEFAULT now(),
  razorpay_payment_id text,
  UNIQUE(coupon_id, tenant_id) -- each org can use a coupon only once
);

-- ─── RLS ──────────────────────────────────────────────────────────
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Service role manages coupons
CREATE POLICY "Service role full access coupons" ON coupons
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access redemptions" ON coupon_redemptions
  FOR ALL USING (auth.role() = 'service_role');
