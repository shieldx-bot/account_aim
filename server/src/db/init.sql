-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    avatar VARCHAR(500),
    balance_vnd BIGINT NOT NULL DEFAULT 50000, -- Welcome credit 50,000 VND
    balance_usd NUMERIC(10, 2) NOT NULL DEFAULT 2.00,
    tier VARCHAR(50) NOT NULL DEFAULT 'Standard' CHECK (tier IN ('Standard', 'VIP Dev', 'Enterprise')),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup by email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Seed default Admin account (password: admin123)
-- bcrypt hash for 'admin123' with cost factor 10 is: $2a$10$3n57Hq9o420vYk8yQjW6cOSK0j7Z5uYpQ0rP1Y9D6HjT0l0hH9q1e or generated
INSERT INTO users (email, password_hash, name, role, avatar, balance_vnd, balance_usd, tier, phone)
VALUES (
    'admin@aipro.dev',
    '$2a$10$WqB8L.6k9vLwT3v3hZ4Q7eD7e8c3f4e5a6b7c8d9e0f1a2b3c4d5e', -- Placeholder, will be upserted cleanly
    'Root Operator',
    'admin',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    99999999,
    4000.00,
    'Enterprise',
    '0909000999'
)
ON CONFLICT (email) DO NOTHING;

-- Seed default Member account (password: 123456)
INSERT INTO users (email, password_hash, name, role, avatar, balance_vnd, balance_usd, tier, phone)
VALUES (
    'alex.dev@gmail.com',
    '$2a$10$WqB8L.6k9vLwT3v3hZ4Q7eD7e8c3f4e5a6b7c8d9e0f1a2b3c4d5e',
    'Alex Nguyen',
    'member',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    650000,
    25.50,
    'VIP Dev',
    '0987654321'
)
ON CONFLICT (email) DO NOTHING;

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(100) PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    brand_logo VARCHAR(500) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('coding', 'llm', 'search', 'design', 'creative', 'enterprise', 'bundle')),
    original_price_vnd BIGINT NOT NULL,
    current_price_vnd BIGINT NOT NULL,
    original_price_usd NUMERIC(10, 2) NOT NULL,
    current_price_usd NUMERIC(10, 2) NOT NULL,
    discount_percent INT NOT NULL DEFAULT 0,
    instant_delivery BOOLEAN NOT NULL DEFAULT true,
    stock_count INT NOT NULL DEFAULT 0,
    badge VARCHAR(100),
    platform_subtext VARCHAR(255),
    quota_features JSONB NOT NULL DEFAULT '[]',
    specs JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY, -- e.g. AGTLAB-94820
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    guest_email VARCHAR(255) NOT NULL,
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_slug VARCHAR(100) NOT NULL,
    plan_duration_months INT NOT NULL DEFAULT 1,
    provisioning_type VARCHAR(20) NOT NULL DEFAULT 'pre_created' CHECK (provisioning_type IN ('invite_email', 'pre_created')),
    target_email VARCHAR(255),
    quantity INT NOT NULL DEFAULT 1,
    unit_price_vnd BIGINT NOT NULL,
    unit_price_usd NUMERIC(10, 2) NOT NULL,
    discount_vnd BIGINT NOT NULL DEFAULT 0,
    discount_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_vnd BIGINT NOT NULL,
    total_usd NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'paypal',
    payment_gateway_ref VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'dispatched', 'cancelled', 'refunded')),
    coupon_code VARCHAR(50),
    notes TEXT,
    warranty_expire_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON orders(guest_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Subscriptions Table (tracks active license access after order dispatched)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_slug VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    provisioning_type VARCHAR(20) NOT NULL DEFAULT 'pre_created',
    account_email VARCHAR(255),
    account_password_encrypted TEXT,
    access_token TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expires_at DATE NOT NULL,
    days_remaining INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired', 'suspended')),
    auto_renew BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_order_id ON subscriptions(order_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

