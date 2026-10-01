-- 006: payments ledger + server-managed coupons
-- Payments are recorded per order; provider_ref is unique per provider so
-- webhook replays (idempotency) collapse into a single row.

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    provider VARCHAR(30) NOT NULL DEFAULT 'paypal',
    provider_ref VARCHAR(255),
    amount NUMERIC(12, 2),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    raw_event JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_ref
    ON payments(provider, provider_ref) WHERE provider_ref IS NOT NULL;

-- Coupons validated server-side; DEVVIP10/AI2025 replace the old hardcoded client list.
CREATE TABLE IF NOT EXISTS coupons (
    code VARCHAR(50) PRIMARY KEY,
    discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 0 AND 90),
    active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO coupons (code, discount_percent) VALUES ('DEVVIP10', 10), ('AI2025', 5)
ON CONFLICT (code) DO NOTHING;
