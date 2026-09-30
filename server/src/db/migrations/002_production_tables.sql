-- =====================================================================
-- Migration 002: Production tables (Inventory accounts & Warranty tickets)
-- Chuyển dữ liệu quản lý dạng mock/dev sang lưu trữ tập trung PostgreSQL
-- =====================================================================

-- Kho tài khoản AI (Inventory Pool)
CREATE TABLE IF NOT EXISTS inventory_accounts (
    id VARCHAR(60) PRIMARY KEY,                     -- e.g. ACC-1712345678901
    tool VARCHAR(255) NOT NULL,                     -- Tên công cụ (Cursor Pro, Claude Pro...)
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

-- Khiếu nại bảo hành (Warranty / Dispute Tickets)
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
