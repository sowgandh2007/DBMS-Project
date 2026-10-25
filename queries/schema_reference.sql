-- =============================================================================
-- RETAIL INVENTORY & RACK MANAGEMENT SYSTEM
-- Schema Reference & Architecture Guide
-- =============================================================================
-- NOTE FOR DEVELOPER / STUDENT:
-- This file serves as the canonical reference for the database schema.
-- The frontend is intentionally decoupled from direct DB access:
-- - The browser communicates ONLY with your backend API endpoints.
-- - Your backend executes parameterized queries against this schema.
-- - Views `product_stock` and `product_location` are your core operational views.
--   Use them wherever stock levels and physical rack locations are queried.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. BASE TABLES
-- -----------------------------------------------------------------------------

-- Categories (or direct VARCHAR category in products)
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(120),
    phone VARCHAR(30),
    address TEXT,
    status ENUM('ACTIVE', 'INACTIVE', 'PREFERRED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    min_stock_level INT NOT NULL DEFAULT 10,
    supplier_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL
);

-- Racks (Physical storage racks inside aisles/zones)
CREATE TABLE IF NOT EXISTS racks (
    rack_id INT AUTO_INCREMENT PRIMARY KEY,
    rack_code VARCHAR(30) NOT NULL UNIQUE,      -- e.g. 'RACK-A1'
    aisle_number VARCHAR(20) NOT NULL,          -- e.g. 'Aisle 01'
    zone VARCHAR(50) DEFAULT 'Main Retail Zone',-- e.g. 'Cold Storage', 'High Value', 'Bulk'
    max_capacity INT NOT NULL DEFAULT 500,      -- Total unit capacity across all shelves
    category_type VARCHAR(100),                 -- Assigned category affinity (optional)
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shelves (Vertical tiers inside a specific rack)
CREATE TABLE IF NOT EXISTS shelves (
    shelf_id INT AUTO_INCREMENT PRIMARY KEY,
    rack_id INT NOT NULL,
    shelf_code VARCHAR(30) NOT NULL,            -- e.g. 'RACK-A1-S1'
    shelf_level INT NOT NULL,                   -- Level 1 (bottom), 2, 3, 4 (top)
    max_capacity INT NOT NULL DEFAULT 150,      -- Max items that can fit on this shelf
    FOREIGN KEY (rack_id) REFERENCES racks(rack_id) ON DELETE CASCADE,
    UNIQUE KEY uq_rack_shelf (rack_id, shelf_level)
);

-- Product Rack Placement (Junction tracking which product is on which shelf)
CREATE TABLE IF NOT EXISTS product_rack_placement (
    placement_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    shelf_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    last_restocked TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (shelf_id) REFERENCES shelves(shelf_id) ON DELETE CASCADE,
    UNIQUE KEY uq_product_shelf (product_id, shelf_id)
);

-- Purchase Orders (Procurement)
CREATE TABLE IF NOT EXISTS purchase_orders (
    po_id INT AUTO_INCREMENT PRIMARY KEY,
    po_number VARCHAR(50) NOT NULL UNIQUE,      -- e.g. 'PO-2026-0042'
    supplier_id INT NOT NULL,
    order_date DATE NOT NULL,
    expected_date DATE,
    status ENUM('DRAFT', 'PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED') DEFAULT 'DRAFT',
    total_amount DECIMAL(12, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    po_item_id INT AUTO_INCREMENT PRIMARY KEY,
    po_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity_ordered INT NOT NULL,
    quantity_received INT NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Sales Orders / Invoices
CREATE TABLE IF NOT EXISTS sales (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    receipt_number VARCHAR(50) NOT NULL UNIQUE, -- e.g. 'REC-2026-1089'
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    customer_name VARCHAR(120) DEFAULT 'Walk-in Customer',
    payment_method ENUM('CASH', 'CARD', 'UPI', 'SPLIT') DEFAULT 'UPI',
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    cashier_name VARCHAR(100) DEFAULT 'Admin'
);

-- Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
    sale_item_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    shelf_id INT,                               -- Shelf from which the item was physically picked
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (shelf_id) REFERENCES shelves(shelf_id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 2. CANONICAL SYSTEM VIEWS (Required for stock and location queries)
-- -----------------------------------------------------------------------------

-- View: product_stock
-- Purpose: Aggregates total on-hand stock per product across all shelves,
--          calculates deficit relative to min_stock_level, and flags status.
CREATE OR REPLACE VIEW product_stock AS
SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    p.category,
    p.cost_price,
    p.unit_price,
    p.min_stock_level,
    COALESCE(SUM(prp.quantity), 0) AS total_stock,
    CASE 
        WHEN COALESCE(SUM(prp.quantity), 0) = 0 THEN 'OUT_OF_STOCK'
        WHEN COALESCE(SUM(prp.quantity), 0) <= p.min_stock_level THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
    END AS stock_status,
    GREATEST(0, p.min_stock_level - COALESCE(SUM(prp.quantity), 0)) AS stock_deficit,
    p.supplier_id,
    s.supplier_name
FROM products p
LEFT JOIN product_rack_placement prp ON p.product_id = prp.product_id
LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
GROUP BY 
    p.product_id, p.sku, p.product_name, p.category, 
    p.cost_price, p.unit_price, p.min_stock_level, 
    p.supplier_id, s.supplier_name;

-- View: product_location
-- Purpose: Real-time map of which product is stored on which rack and shelf,
--          along with aisle and shelf utilization.
CREATE OR REPLACE VIEW product_location AS
SELECT 
    prp.placement_id,
    p.product_id,
    p.sku,
    p.product_name,
    p.category,
    r.rack_id,
    r.rack_code,
    r.aisle_number,
    r.zone,
    sh.shelf_id,
    sh.shelf_code,
    sh.shelf_level,
    prp.quantity,
    sh.max_capacity AS shelf_capacity,
    ROUND((prp.quantity / NULLIF(sh.max_capacity, 0)) * 100, 1) AS shelf_occupancy_pct,
    prp.last_restocked
FROM product_rack_placement prp
JOIN products p ON prp.product_id = p.product_id
JOIN shelves sh ON prp.shelf_id = sh.shelf_id
JOIN racks r ON sh.rack_id = r.rack_id;
