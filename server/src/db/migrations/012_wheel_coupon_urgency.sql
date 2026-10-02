-- 012: coupon urgency for the Lucky Wheel.
-- Wheel prizes get a short, admin-tunable lifetime (default 15 minutes) so the
-- countdown shown to the customer reflects a real expiry — urgency that is
-- honest converts and never needs fake timers.

ALTER TABLE wheel_config ADD COLUMN IF NOT EXISTS coupon_ttl_minutes INTEGER NOT NULL DEFAULT 15;

-- The spin endpoint looks up unused wheel coupons per visitor on every spin;
-- expired ones are deleted lazily at spin time (a lapsed prize re-arms the spin).
CREATE INDEX IF NOT EXISTS idx_coupons_visitor ON coupons(visitor_id) WHERE visitor_id IS NOT NULL;
