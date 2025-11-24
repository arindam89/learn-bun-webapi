-- PostgreSQL initialization script for Bun 1.3 examples
-- This script runs when the PostgreSQL container starts

-- Create additional schemas for organization
CREATE SCHEMA IF NOT EXISTS api;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS audit;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT ALL ON TABLES TO postgres;

-- Create sample tables for examples
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS api.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api.orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics.user_metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON api.products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON api.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON api.orders(status);
CREATE INDEX IF NOT EXISTS idx_user_metrics_user_id ON analytics.user_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_metrics_recorded_at ON analytics.user_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_user_metrics_name ON analytics.user_metrics(metric_name);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE
    ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE
    ON api.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE
    ON api.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO users (name, email, password_hash) VALUES
('Alice Johnson', 'alice@example.com', '$2b$12$hashed_password_here'),
('Bob Smith', 'bob@example.com', '$2b$12$hashed_password_here'),
('Carol Davis', 'carol@example.com', '$2b$12$hashed_password_here')
ON CONFLICT (email) DO NOTHING;

INSERT INTO api.products (name, description, price, category, stock) VALUES
('Wireless Mouse', 'Ergonomic wireless mouse with precision tracking', 29.99, 'electronics', 150),
('Mechanical Keyboard', 'RGB backlit mechanical keyboard', 89.99, 'electronics', 75),
('USB-C Hub', '7-in-1 USB-C hub with HDMI and USB 3.0', 49.99, 'accessories', 200),
('Webcam HD', '1080p HD webcam with noise cancellation', 79.99, 'electronics', 50)
ON CONFLICT DO NOTHING;

-- Grant permissions to any future users (in production, you'd create specific roles)
GRANT USAGE ON SCHEMA api TO PUBLIC;
GRANT USAGE ON SCHEMA analytics TO PUBLIC;
GRANT USAGE ON SCHEMA audit TO PUBLIC;

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create a view for commonly used data
CREATE OR REPLACE VIEW user_order_summary AS
SELECT
    u.id,
    u.name,
    u.email,
    u.created_at as user_created,
    COUNT(o.id) as order_count,
    COALESCE(SUM(o.total_amount), 0) as total_spent,
    MAX(o.created_at) as last_order_date
FROM users u
LEFT JOIN api.orders o ON u.id = o.user_id
GROUP BY u.id, u.name, u.email, u.created_at;

-- Create a function for sample data generation
CREATE OR REPLACE FUNCTION generate_sample_metrics()
RETURNS VOID AS $$
BEGIN
    INSERT INTO analytics.user_metrics (user_id, metric_name, metric_value, metadata)
    SELECT
        id,
        CASE WHEN RANDOM() < 0.3 THEN 'page_views'
             WHEN RANDOM() < 0.6 THEN 'logins'
             ELSE 'purchases' END,
        (RANDOM() * 100)::INTEGER,
        jsonb_build_object('source', CASE WHEN RANDOM() < 0.5 THEN 'web' ELSE 'mobile' END)
    FROM users
    WHERE id <= 3;  -- Limit to sample users
END;
$$ LANGUAGE plpgsql;

-- Log initialization
INSERT INTO audit.log_events (event_type, message, created_at)
VALUES ('database_init', 'PostgreSQL initialized for Bun 1.3 examples', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS audit.log_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);