-- =====================================================================
-- Migration 002: Production tables (Inventory accounts & Warranty tickets)
-- Move mock/dev-era management data into centralized PostgreSQL storage
-- =====================================================================

-- AI account warehouse (inventory pool)
CREATE TABLE IF NOT EXISTS inventory_accounts (
    id VARCHAR(60) PRIMARY KEY,                     -- e.g. ACC-1712345678901
    tool VARCHAR(255) NOT NULL,                     -- Tool name (Cursor Pro, Claude Pro...)
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    password TEXT NOT NULL,
    pool VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (pool IN ('active', 'buffer')),
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'compromised')),
    assigned_order_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_pool ON inventory_accounts(pool);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_accounts(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_email ON inventory_accounts(email);

-- Warranty / dispute tickets
CREATE TABLE IF NOT EXISTS warranty_tickets (
    id VARCHAR(60) PRIMARY KEY,                     -- e.g. DISP-1712345678901
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE SET NULL,
    customer_email VARCHAR(255) NOT NULL,
    tool VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    attempts INT NOT NULL DEFAULT 1,
    sla_left_minutes INT NOT NULL DEFAULT 30,
    status VARCHAR(30) NOT NULL DEFAULT 'agent_pending' CHECK (status IN ('agent_pending', 'resolved', 'bot_handled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_warranty_status ON warranty_tickets(status);
CREATE INDEX IF NOT EXISTS idx_warranty_order ON warranty_tickets(order_id);
-- Supports server-enforced daily replacement quota per customer email
CREATE INDEX IF NOT EXISTS idx_warranty_email_created ON warranty_tickets(customer_email, created_at);

-- ───────────────────────── 003: users.status (lock/ban accounts) ─────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'banned'));
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
