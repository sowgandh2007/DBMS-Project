-- =============================================================================
-- FEATURE: Products Catalog & Search
-- File: queries/products.sql
-- =============================================================================
-- Integration Point:
-- Frontend Service: src/services/productService.js
-- Suggested API Route:
--   GET  /api/products?search=:search&category=:category&supplier_id=:supplier_id&min_price=:min_price&max_price=:max_price
--   POST /api/products
--   PUT  /api/products/:id
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SEARCH & FILTER PRODUCTS
-- Parameters:
--   :search_term   - string (matches sku or product_name, wildcards %...%)
--   :category      - string or NULL (filters by category)
--   :supplier_id   - integer or NULL
--   :min_price     - decimal or NULL
--   :max_price     - decimal or NULL
--   :sort_by       - column name (e.g., product_name, unit_price, created_at)
-- -----------------------------------------------------------------------------
-- NOTE: For full stock status, we join with the canonical `product_stock` view.
SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    p.category,
    p.description,
    p.cost_price,
    p.unit_price,
    ROUND(((p.unit_price - p.cost_price) / NULLIF(p.unit_price, 0)) * 100, 1) AS margin_percentage,
    p.min_stock_level,
    p.supplier_id,
    s.supplier_name,
    COALESCE(ps.total_stock, 0) AS current_stock,
    COALESCE(ps.stock_status, 'OUT_OF_STOCK') AS stock_status,
    p.created_at
FROM products p
LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
LEFT JOIN product_stock ps ON p.product_id = ps.product_id
WHERE 
    (:search_term IS NULL OR p.product_name LIKE CONCAT('%', :search_term, '%') OR p.sku LIKE CONCAT('%', :search_term, '%'))
    AND (:category IS NULL OR :category = 'all' OR p.category = :category)
    AND (:supplier_id IS NULL OR p.supplier_id = :supplier_id)
    AND (:min_price IS NULL OR p.unit_price >= :min_price)
    AND (:max_price IS NULL OR p.unit_price <= :max_price)
ORDER BY p.product_id DESC;

-- -----------------------------------------------------------------------------
-- 2. GET SINGLE PRODUCT DETAILS WITH STORAGE LOCATIONS
-- Parameters:
--   :product_id - integer
-- -----------------------------------------------------------------------------
SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    p.category,
    p.description,
    p.cost_price,
    p.unit_price,
    p.min_stock_level,
    p.supplier_id,
    s.supplier_name,
    s.contact_name AS supplier_contact,
    s.phone AS supplier_phone,
    ps.total_stock,
    ps.stock_status
FROM products p
LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
LEFT JOIN product_stock ps ON p.product_id = ps.product_id
WHERE p.product_id = :product_id;

-- -----------------------------------------------------------------------------
-- 3. INSERT NEW PRODUCT
-- Parameters:
--   :sku, :product_name, :category, :description, :cost_price, :unit_price, :min_stock_level, :supplier_id
-- -----------------------------------------------------------------------------
INSERT INTO products (
    sku, 
    product_name, 
    category, 
    description, 
    cost_price, 
    unit_price, 
    min_stock_level, 
    supplier_id
) VALUES (
    :sku, 
    :product_name, 
    :category, 
    :description, 
    :cost_price, 
    :unit_price, 
    :min_stock_level, 
    :supplier_id
);

-- -----------------------------------------------------------------------------
-- 4. UPDATE PRODUCT
-- Parameters:
--   :product_id, :product_name, :category, :description, :cost_price, :unit_price, :min_stock_level, :supplier_id
-- -----------------------------------------------------------------------------
UPDATE products 
SET 
    product_name = :product_name,
    category = :category,
    description = :description,
    cost_price = :cost_price,
    unit_price = :unit_price,
    min_stock_level = :min_stock_level,
    supplier_id = :supplier_id
WHERE product_id = :product_id;

-- -----------------------------------------------------------------------------
-- 5. GET ALL DISTINCT PRODUCT CATEGORIES (For filter dropdowns)
-- -----------------------------------------------------------------------------
SELECT DISTINCT category 
FROM products 
WHERE category IS NOT NULL AND category != '' 
ORDER BY category ASC;
