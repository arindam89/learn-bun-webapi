-- MySQL initialization script for Bun 1.3 examples
-- This script runs when the MySQL container starts

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS testdb;

-- Use the database
USE testdb;

-- Create tables for examples
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_active (is_active)
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_price (price)
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Insert sample data for testing
INSERT INTO users (name, email, password_hash) VALUES
('John Doe', 'john@example.com', SHA2('password123', 256)),
('Jane Smith', 'jane@example.com', SHA2('password456', 256)),
('Mike Johnson', 'mike@example.com', SHA2('password789', 256))
ON DUPLICATE KEY UPDATE email=email;

INSERT INTO products (name, description, price, category, stock) VALUES
('Laptop Pro', 'High-performance laptop with 16GB RAM', 1299.99, 'electronics', 50),
('Wireless Headphones', 'Noise-cancelling Bluetooth headphones', 199.99, 'audio', 100),
('Smart Watch', 'Fitness tracker with heart rate monitor', 299.99, 'wearables', 75),
('USB-C Cable', '3-meter USB-C charging cable', 24.99, 'accessories', 200),
('Mechanical Keyboard', 'RGB mechanical gaming keyboard', 149.99, 'electronics', 30)
ON DUPLICATE KEY UPDATE name=name;

-- Create stored procedures for examples
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS GetOrderStatistics(IN userId INT)
BEGIN
    SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_spent,
        COALESCE(AVG(total_amount), 0) as avg_order_value,
        MAX(created_at) as last_order_date
    FROM orders
    WHERE user_id = userId;
END//

CREATE PROCEDURE IF NOT EXISTS UpdateProductStock(IN productId INT, IN quantityChange INT)
BEGIN
    DECLARE currentStock INT;

    SELECT stock INTO currentStock FROM products WHERE id = productId;

    IF currentStock IS NOT NULL AND (currentStock + quantityChange) >= 0 THEN
        UPDATE products
        SET stock = stock + quantityChange
        WHERE id = productId;

        SELECT 'Stock updated successfully' as result,
               (currentStock + quantityChange) as new_stock;
    ELSE
        SELECT 'Stock update failed - insufficient stock or product not found' as result,
               NULL as new_stock;
    END IF;
END//

DELIMITER ;

-- Create a view for order summaries
CREATE OR REPLACE VIEW order_summary AS
SELECT
    o.id as order_id,
    u.name as customer_name,
    u.email as customer_email,
    o.total_amount,
    o.status,
    o.created_at,
    COUNT(oi.id) as item_count
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, u.name, u.email, o.total_amount, o.status, o.created_at;