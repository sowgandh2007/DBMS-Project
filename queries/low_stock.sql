-- =============================================================================
-- FEATURE: Low-Stock Alerts & Restocking Triggers
-- File: queries/low_stock.sql
-- =============================================================================
-- Integration Point:
-- Frontend Service: src/services/alertService.js
-- Suggested API Route:
--   GET  /api/alerts/low-stock?urgency=:urgency&category=:category
-- =============================================================================
-- ARCHITECTURAL NOTE:
-- This module queries the CANONICAL VIEW `product_stock`.
-- `product_stock` already contains calculated `stock_status` ('LOW_STOCK', 'OUT_OF_STOCK')
-- and `stock_deficit`. Do NOT recalculate these in custom subqueries.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. GET ALL LOW STOCK AND OUT-OF-STOCK PRODUCTS
-- Parameters:
--   :urgency  - 'ALL_ALERTS', 'OUT_OF_STOCK', 'LOW_STOCK'
--   :category - string or NULL ('all' or specific category)
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
    -- Suggested reorder quantity: deficit plus 50% safety buffer
    (ps.stock_deficit + CEIL(ps.min_stock_level * 0.5)) AS suggested_reorder_qty,
    -- Estimated reorder cost
    ((ps.stock_deficit + CEIL(ps.min_stock_level * 0.5)) * ps.cost_price) AS estimated_reorder_cost,
    ps.supplier_id,
    ps.supplier_name
FROM product_stock ps
WHERE 
    ps.stock_status IN ('LOW_STOCK', 'OUT_OF_STOCK')
    AND (:urgency IS NULL OR :urgency = 'ALL_ALERTS' OR ps.stock_status = :urgency)
    AND (:category IS NULL OR :category = 'all' OR ps.category = :category)
ORDER BY 
    CASE WHEN ps.stock_status = 'OUT_OF_STOCK' THEN 0 ELSE 1 END,
    ps.stock_deficit DESC,
    ps.product_name ASC;

-- -----------------------------------------------------------------------------
-- 2. GET LOW STOCK SUMMARY BADGE COUNT
-- -----------------------------------------------------------------------------
SELECT 
    COUNT(*) AS total_alert_count,
    SUM(CASE WHEN stock_status = 'OUT_OF_STOCK' THEN 1 ELSE 0 END) AS critical_out_of_stock,
    SUM(CASE WHEN stock_status = 'LOW_STOCK' THEN 1 ELSE 0 END) AS warning_low_stock
FROM product_stock
WHERE stock_status IN ('LOW_STOCK', 'OUT_OF_STOCK');
