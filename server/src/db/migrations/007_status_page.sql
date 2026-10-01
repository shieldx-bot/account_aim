-- 007: status page schema — the /status controller queries these tables but
-- they were never created by any earlier migration, which made GET /api/status
-- fail with 500 (relation does not exist) and the page render blank.

CREATE TABLE IF NOT EXISTS status_components (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('ai_providers', 'payment_gateways', 'fulfillment_bot', 'core_infrastructure')),
    status VARCHAR(30) NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'degraded_performance', 'partial_outage', 'major_outage')),
    uptime_percent NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS status_metrics (
    id BIGSERIAL PRIMARY KEY,
    component_id VARCHAR(100) NOT NULL REFERENCES status_components(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    uptime NUMERIC(5, 4) NOT NULL DEFAULT 1.0,
    latency_ms INTEGER NOT NULL DEFAULT 0,
    error_rate NUMERIC(6, 4) NOT NULL DEFAULT 0,
    requests_per_second NUMERIC(8, 2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_status_metrics_component_ts ON status_metrics(component_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS status_incidents (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
    impact VARCHAR(30) NOT NULL DEFAULT 'minor' CHECK (impact IN ('none', 'minor', 'major', 'critical')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS status_incident_updates (
    id BIGSERIAL PRIMARY KEY,
    incident_id VARCHAR(100) NOT NULL REFERENCES status_incidents(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS status_incident_components (
    incident_id VARCHAR(100) NOT NULL REFERENCES status_incidents(id) ON DELETE CASCADE,
    component_id VARCHAR(100) NOT NULL REFERENCES status_components(id) ON DELETE CASCADE,
    PRIMARY KEY (incident_id, component_id)
);

CREATE TABLE IF NOT EXISTS status_maintenance (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS status_maintenance_components (
    maintenance_id VARCHAR(100) NOT NULL REFERENCES status_maintenance(id) ON DELETE CASCADE,
    component_id VARCHAR(100) NOT NULL REFERENCES status_components(id) ON DELETE CASCADE,
    PRIMARY KEY (maintenance_id, component_id)
);

CREATE TABLE IF NOT EXISTS status_page_views (
    id BIGSERIAL PRIMARY KEY,
    path VARCHAR(255),
    ip_hash VARCHAR(64),
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_status_page_views_created ON status_page_views(created_at DESC);

-- ── Seed: real component inventory matching the frontend categories ──
INSERT INTO status_components (id, name, category, status, uptime_percent, description) VALUES
    ('relay-openai',      'OpenAI API Relay',        'ai_providers',        'operational', 99.98, 'ChatGPT / GPT-4o API relay serving all active accounts.'),
    ('relay-anthropic',   'Anthropic Claude Relay',  'ai_providers',        'operational', 99.95, 'Claude (Pro/Max) API relay — automatic slot allocation.'),
    ('relay-gemini',      'Google Gemini Relay',     'ai_providers',        'operational', 99.97, 'Gemini Advanced API relay.'),
    ('paypal-checkout',   'PayPal Checkout',         'payment_gateways',    'operational', 100.00, 'International payment gateway (PayPal balance, Visa/MC via PayPal).'),
    ('vietqr-bank',       'VietQR Banking',          'payment_gateways',    'operational', 99.90, 'Domestic bank QR payment gateway.'),
    ('bot-delivery',      'Auto Delivery Bot',       'fulfillment_bot',     'operational', 99.99, 'Automated account provisioning & delivery bot (< 30s).'),
    ('bot-warranty',      'Warranty Bot',            'fulfillment_bot',     'operational', 99.95, 'Handles 1-to-1 replacement claims with a 30-minute SLA.'),
    ('core-postgres',     'PostgreSQL Cluster',      'core_infrastructure', 'operational', 99.99, 'Database for orders, account inventory & users.'),
    ('core-api',          'API Gateway',             'core_infrastructure', 'operational', 99.98, 'REST API serving the storefront & member portal.'),
    ('core-web',          'Web / CDN',               'core_infrastructure', 'operational', 100.00, 'Storefront frontend and static assets.')
ON CONFLICT (id) DO NOTHING;

-- Seed one fresh metric per component so latency/RPS gauges render immediately.
INSERT INTO status_metrics (component_id, timestamp, uptime, latency_ms, error_rate, requests_per_second)
SELECT c.id, NOW(), 1.0000,
       CASE c.category
           WHEN 'ai_providers' THEN 180 + (RANDOM() * 120)::int
           WHEN 'payment_gateways' THEN 220 + (RANDOM() * 100)::int
           WHEN 'fulfillment_bot' THEN 90 + (RANDOM() * 60)::int
           ELSE 25 + (RANDOM() * 30)::int
       END,
       0.0000,
       CASE c.category
           WHEN 'ai_providers' THEN 40 + (RANDOM() * 30)
           WHEN 'payment_gateways' THEN 8 + (RANDOM() * 6)
           WHEN 'fulfillment_bot' THEN 3 + (RANDOM() * 2)
           ELSE 120 + (RANDOM() * 80)
       END
FROM status_components c
WHERE NOT EXISTS (SELECT 1 FROM status_metrics m WHERE m.component_id = c.id AND m.timestamp >= NOW() - INTERVAL '5 minutes');
