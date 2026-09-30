-- ─────────────────────────────────────────────────────────────
-- Migration 004: Referral / #InviteToPay system
-- Personal invite codes, click attribution (30-day last-click),
-- FAB validation, reward ledger & anti-abuse constraints.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referral_codes (
  code         VARCHAR(20) PRIMARY KEY,               -- e.g. APX-7K2QF
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = anonymous session owner (claimed later)
  email        VARCHAR(255),                          -- optional pre-registration email capture
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_click_at TIMESTAMPTZ,
  click_count  INT NOT NULL DEFAULT 0,
  UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id);

-- Attribution record per invited visitor session (last-click wins, 30 days)
CREATE TABLE IF NOT EXISTS referral_attributions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         VARCHAR(20) NOT NULL REFERENCES referral_codes(code) ON DELETE CASCADE,
  visitor_id   TEXT NOT NULL,                         -- anonymous device/session fingerprint id from FE
  order_id     VARCHAR(50),                           -- set when the visitor converts (FAB)
  clicked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  UNIQUE (code, visitor_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_attr_visitor ON referral_attributions(visitor_id);

-- Reward ledger: exactly one reward per valid FAB (anti-abuse constraint)
CREATE TABLE IF NOT EXISTS referral_rewards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(20) NOT NULL REFERENCES referral_codes(code) ON DELETE CASCADE,
  referrer_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id      VARCHAR(50) NOT NULL UNIQUE,          -- 1 reward / valid paid order (FAB)
  reward_type   VARCHAR(30) NOT NULL DEFAULT 'account_credit_vnd',
  amount_vnd    BIGINT NOT NULL DEFAULT 0,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'granted')),
  granted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);

-- Orders carry the referral code used at purchase time (server-side validated)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_orders_referral_code ON orders(referral_code);
