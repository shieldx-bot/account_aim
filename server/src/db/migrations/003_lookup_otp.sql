-- ─────────────────────────────────────────────────────────────
-- Migration 003: Server-issued OTP for Warranty Self-Service lookup
-- Replaces the client-side "any 6 digits pass" demo validation.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lookup_otps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     TEXT NOT NULL,
  email        TEXT NOT NULL,
  code_hash    TEXT NOT NULL,             -- bcrypt hash, never store plaintext
  attempts     INT  NOT NULL DEFAULT 0,   -- wrong-submission counter
  expires_at   TIMESTAMPTZ NOT NULL,      -- created_at + 5 minutes
  consumed_at  TIMESTAMPTZ,               -- set once verified successfully
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lookup_otps_order_email
  ON lookup_otps (order_id, email);

-- Only one live (unconsumed, unexpired) OTP per order+email is enforced
-- application-side before issuing a new one.
