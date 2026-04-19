CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- System Tables
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_ticket_id VARCHAR(50) UNIQUE,
    customer_email VARCHAR(255),
    subject TEXT,
    content TEXT NOT NULL,
    expected_action TEXT,
    source VARCHAR(50),
    data_source VARCHAR(100),
    llm_status VARCHAR(50),
    fallback_used BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'queued',
    priority INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS external_ticket_id VARCHAR(50) UNIQUE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS expected_action TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS source VARCHAR(50);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS data_source VARCHAR(100);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS llm_status VARCHAR(50);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS fallback_used BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS ticket_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'started',
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    step INT NOT NULL,
    tool_name VARCHAR(100) NOT NULL,
    input JSONB NOT NULL,
    output JSONB,
    status VARCHAR(50) NOT NULL,
    attempt INT NOT NULL DEFAULT 1,
    decision TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_data_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_type VARCHAR(50) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    data_source VARCHAR(100) NOT NULL DEFAULT 'default',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(record_type, external_id)
);

CREATE TABLE IF NOT EXISTS import_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_source VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    errors JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Mock E-commerce Entities
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(50) UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    tier VARCHAR(50) DEFAULT 'standard',
    member_since DATE,
    total_orders INT DEFAULT 0,
    total_spent REAL DEFAULT 0,
    address JSONB,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active'
);

ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_id VARCHAR(50) UNIQUE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tier VARCHAR(50) DEFAULT 'standard';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS member_since DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_orders INT DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_spent REAL DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address JSONB;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price REAL NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    warranty_months INT DEFAULT 0,
    return_window_days INT DEFAULT 30,
    returnable BOOLEAN DEFAULT true,
    notes TEXT
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS product_id VARCHAR(50) UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty_months INT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS return_window_days INT DEFAULT 30;
ALTER TABLE products ADD COLUMN IF NOT EXISTS returnable BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(50) UNIQUE,
    customer_id VARCHAR(50),
    product_id VARCHAR(50),
    quantity INT DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'processing',
    total_amount REAL NOT NULL,
    order_date DATE,
    delivery_date DATE,
    return_deadline DATE,
    refund_status VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Drop old constraints that might use UUID
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_product_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_customer;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_product;

-- Ensure correct types for business IDs across all tables
ALTER TABLE customers ALTER COLUMN customer_id TYPE VARCHAR(50);
ALTER TABLE products ALTER COLUMN product_id TYPE VARCHAR(50);
ALTER TABLE orders ALTER COLUMN customer_id TYPE VARCHAR(50);
ALTER TABLE orders ALTER COLUMN product_id TYPE VARCHAR(50);

-- Re-add foreign keys targeting business ID columns (VARCHAR to VARCHAR)
ALTER TABLE orders ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE;
ALTER TABLE orders ADD CONSTRAINT orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_id VARCHAR(50) UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_deadline DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE TABLE IF NOT EXISTS knowledge_base (
    id VARCHAR(100) PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
