-- =============================================================================
-- FEATURE: Store Inventory
-- File: queries/inventory.sql
-- =============================================================================
-- Integration Point:
-- Frontend Service: src/services/inventoryService.js
-- Suggested API Route:
--   GET  /api/inventory?search=:search&status=:status&category=:category
--   POST /api/inventory/adjust (adjust quantity in shelf placement)
-- =============================================================================
-- ARCHITECTURAL NOTE:
-- This module queries the CANONICAL VIEW `product_stock` directly.
-- Do NOT calculate stock sums or deficits from raw tables here; let the view handle it!
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. GET INVENTORY LISTING (USING CANONICAL VIEW product_stock)
-- Parameters:
--   :search_term - string or NULL (SKU or Product Name)
--   :status      - 'ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'
--   :category    - string or NULL ('all' or specific category)
-- -----------------------------------------------------------------------------
SELECT 
    ps.product_id,
    ps.sku,
    ps.product_name,
    ps.category,
    ps.cost_price,
    ps.unit_price,
    ps.min_stock_level,
    ps.total_stock,
    ps.stock_status,
    ps.stock_deficit,
    ps.supplier_id,
    ps.supplier_name,
    (ps.total_stock * ps.cost_price) AS inventory_valuation,
    (ps.total_stock * ps.unit_price) AS potential_revenue
FROM product_stock ps
WHERE 
    (:search_term IS NULL OR ps.product_name LIKE CONCAT('%', :search_term, '%') OR ps.sku LIKE CONCAT('%', :search_term, '%'))
    AND (:status IS NULL OR :status = 'ALL' OR ps.stock_status = :status)
    AND (:category IS NULL OR :category = 'all' OR ps.category = :category)
ORDER BY 
    CASE 
        WHEN ps.stock_status = 'OUT_OF_STOCK' THEN 1
        WHEN ps.stock_status = 'LOW_STOCK' THEN 2
        ELSE 3 
    END,
    ps.product_name ASC;

-- -----------------------------------------------------------------------------
-- 2. GET INVENTORY AGGREGATE SUMMARY (For stats cards)
-- Uses product_stock view
-- -----------------------------------------------------------------------------
SELECT 
    COUNT(product_id) AS total_skus,
    COALESCE(SUM(total_stock), 0) AS total_units_in_stock,
    COALESCE(SUM(total_stock * cost_price), 0.00) AS total_inventory_valuation,
    COALESCE(SUM(total_stock * unit_price), 0.00) AS total_potential_revenue,
    COALESCE(SUM(CASE WHEN stock_status = 'LOW_STOCK' THEN 1 ELSE 0 END), 0) AS low_stock_count,
    COALESCE(SUM(CASE WHEN stock_status = 'OUT_OF_STOCK' THEN 1 ELSE 0 END), 0) AS out_of_stock_count
FROM product_stock;

-- -----------------------------------------------------------------------------
-- 3. ADJUST STOCK ON SPECIFIC SHELF (Physical Stock Audit adjustment)
-- Parameters:
--   :product_id - integer
--   :shelf_id   - integer
--   :new_qty    - integer
-- -----------------------------------------------------------------------------
-- Note: Modifying product_rack_placement will automatically update product_stock view.
INSERT INTO product_rack_placement (product_id, shelf_id, quantity)
VALUES (:product_id, :shelf_id, :new_qty)
ON DUPLICATE KEY UPDATE 
    quantity = :new_qty,
    last_restocked = CURRENT_TIMESTAMP;
