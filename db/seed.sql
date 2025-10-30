-- seed.sql
USE JelouDB;
-- =====================
-- CUSTOMERS
-- =====================
INSERT INTO customers (name, email, phone)
VALUES
('Alice Johnson', 'alice@example.com', '555-0101'),
('Bob Smith', 'bob@example.com', '555-0102'),
('Charlie Brown', 'charlie@example.com', '555-0103');

-- =====================
-- PRODUCTS
-- =====================
INSERT INTO products (sku, name, price_cents, stock)
VALUES
('SKU001', 'Wireless Mouse', 2500, 50),
('SKU002', 'Mechanical Keyboard', 7500, 30),
('SKU003', 'HD Monitor', 12000, 20);

-- =====================
-- ORDERS
-- =====================
INSERT INTO orders (customer_id, status, total_cents)
VALUES
(1, 'CREATED', 10000),
(2, 'CONFIRMED', 19500);

-- =====================
-- ORDER ITEMS
-- =====================
INSERT INTO order_items (order_id, product_id, qty, unit_price_cents, subtotal_cents)
VALUES
(1, 1, 2, 2500, 5000),
(1, 2, 1, 5000, 5000),
(2, 3, 1, 12000, 12000),
(2, 2, 1, 7500, 7500);

-- =====================
-- IDEMPOTENCY KEYS
-- =====================
INSERT INTO idempotency_keys (`key`, target_type, target_id, status, response_body, expires_at)
VALUES
('key-12345', 'ORDER', 1, 'SUCCESS', JSON_OBJECT('order_id', 1, 'status', 'CREATED'), DATE_ADD(NOW(), INTERVAL 1 DAY)),
('key-67890', 'ORDER', 2, 'SUCCESS', JSON_OBJECT('order_id', 2, 'status', 'CONFIRMED'), DATE_ADD(NOW(), INTERVAL 1 DAY));
