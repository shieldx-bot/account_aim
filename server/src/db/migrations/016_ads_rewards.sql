-- Migration 016: Watch & Earn (xem ADS tích tiền vào ví nội bộ)
-- Ads rewards credit the internal wallet (users.balance_usd) only — store credit,
-- never cash-out. Two credit sources:
--   1. 'internal' — sponsor videos served by AgentLab itself (fallback, admin-tunable)
--   2. offerwall providers (torox / bitlabs / adgate / ...) via signed S2S postbacks.
-- Anti-abuse: per-user daily cap (server-enforced), UNIQUE(provider, tx_id)
-- idempotency so provider retries never double-credit, plus reversal ledger.

CREATE TABLE IF NOT EXISTS ads_config (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    active BOOLEAN NOT NULL DEFAULT true,
    daily_cap INTEGER NOT NULL DEFAULT 5,                -- max credited internal watches / user / day
    per_watch_usd NUMERIC(10,4) NOT NULL DEFAULT 0.01,  -- reward per completed watch
    min_watch_seconds INTEGER NOT NULL DEFAULT 15,      -- server-enforced minimum watch time
    offerwall_url TEXT NOT NULL DEFAULT '',             -- iframe URL w/ {uid} placeholder; '' hides the wall
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO ads_config (id, active, daily_cap, per_watch_usd, min_watch_seconds, offerwall_url)
VALUES (1, true, 5, 0.01, 15, '')
ON CONFLICT (id) DO NOTHING;

-- Reward ledger. status lifecycle:
--   started   — internal watch opened, timer running (no credit yet)
--   credited  — reward paid to the wallet
--   reversed  — provider chargeback / reversal (balance clamped back)
-- UNIQUE(provider, tx_id) makes provider postback retries idempotent;
-- tx_id is NULL for internal sessions (Postgres treats NULLs as distinct).
CREATE TABLE IF NOT EXISTS ads_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(30) NOT NULL DEFAULT 'internal',   -- 'internal' | 'torox' | 'bitlabs' | ...
    tx_id VARCHAR(128),                                  -- provider transaction id (NULL for internal)
    reward_usd NUMERIC(10,4) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'started'
        CHECK (status IN ('started', 'credited', 'reversed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ads_sessions_tx_unique UNIQUE (provider, tx_id)
);

-- Daily cap lookups scan (user_id, created_at) — keeps /ads/status cheap.
CREATE INDEX IF NOT EXISTS idx_ads_sessions_user_day ON ads_sessions(user_id, created_at DESC);
