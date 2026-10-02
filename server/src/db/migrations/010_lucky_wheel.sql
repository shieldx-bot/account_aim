-- 010: Lucky Wheel (vòng quay may mắn cho khách mới)
-- Wheel prizes are server-managed coupons: one spin per browser (visitor_id),
-- the code applies to a single order and is deleted once that order is paid.

-- Extend coupons with wheel attribution + single-use tracking.
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'manual';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS visitor_id VARCHAR(64);
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_uses INTEGER NOT NULL DEFAULT 1;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS used_by_order VARCHAR(50);

-- One row (id = 1): the prize table. `weight` is relative probability —
-- admins tune it in the dashboard; the backend draws weighted-random.
CREATE TABLE IF NOT EXISTS wheel_config (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    active BOOLEAN NOT NULL DEFAULT true,
    segments JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO wheel_config (id, active, segments)
VALUES (1, true, '[
    {"percent": 10, "weight": 30},
    {"percent": 20, "weight": 25},
    {"percent": 30, "weight": 18},
    {"percent": 40, "weight": 12},
    {"percent": 50, "weight": 8},
    {"percent": 60, "weight": 4},
    {"percent": 70, "weight": 2},
    {"percent": 80, "weight": 1},
    {"percent": 90, "weight": 1}
]'::jsonb)
ON CONFLICT (id) DO NOTHING;
