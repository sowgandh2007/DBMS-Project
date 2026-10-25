-- =============================================================================
-- FEATURE: Reports & Analytics
-- File: queries/reports.sql
-- =============================================================================
-- Integration Point:
-- Frontend Service: src/services/reportService.js
-- Suggested API Route:
--   GET  /api/reports/valuation
--   GET  /api/reports/rack-utilization
--   GET  /api/reports/turnover?from_date=:from_date&to_date=:to_date
--   GET  /api/reports/supplier-spend
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. INVENTORY VALUATION REPORT (BY CATEGORY)
-- Uses product_stock view
-- -----------------------------------------------------------------------------
SELECT 
    ps.category,
    COUNT(ps.product_id) AS total_products,
    COALESCE(SUM(ps.total_stock), 0) AS total_units_in_stock,
    COALESCE(SUM(ps.total_stock * ps.cost_price), 0.00) AS total_cost_basis,
    COALESCE(SUM(ps.total_stock * ps.unit_price), 0.00) AS total_retail_value,
    COALESCE(SUM(ps.total_stock * (ps.unit_price - ps.cost_price)), 0.00) AS projected_gross_profit,
    ROUND(
        (COALESCE(SUM(ps.total_stock * (ps.unit_price - ps.cost_price)), 0) / 
        NULLIF(SUM(ps.total_stock * ps.unit_price), 0)) * 100, 
        1
    ) AS margin_percentage
FROM product_stock ps
GROUP BY ps.category
ORDER BY total_cost_basis DESC;

-- -----------------------------------------------------------------------------
-- 2. RACK SPACE UTILIZATION REPORT (BY AISLE)
-- Shows which aisles have available shelf space
-- -----------------------------------------------------------------------------
SELECT 
    r.aisle_number,
    r.zone,
    COUNT(DISTINCT r.rack_id) AS total_racks,
    COUNT(DISTINCT sh.shelf_id) AS total_shelves,
    COALESCE(SUM(r.max_capacity), 0) AS total_unit_capacity,
    COALESCE(SUM(prp.quantity), 0) AS total_units_stored,
    GREATEST(0, COALESCE(SUM(r.max_capacity), 0) - COALESCE(SUM(prp.quantity), 0)) AS available_capacity,
    ROUND((COALESCE(SUM(prp.quantity), 0) / NULLIF(SUM(r.max_capacity), 0)) * 100, 1) AS overall_utilization_pct
FROM racks r
LEFT JOIN shelves sh ON r.rack_id = sh.rack_id
LEFT JOIN product_rack_placement prp ON sh.shelf_id = prp.shelf_id
GROUP BY r.aisle_number, r.zone
ORDER BY overall_utilization_pct DESC;

-- -----------------------------------------------------------------------------
-- 3. PRODUCT SALES TURNOVER (FAST MOVING ITEMS)
-- Parameters:
--   :from_date - date string or NULL
--   :to_date   - date string or NULL
-- -----------------------------------------------------------------------------
SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    p.category,
    COALESCE(SUM(si.quantity), 0) AS units_sold,
    COALESCE(SUM(si.subtotal), 0.00) AS total_revenue,
    COALESCE(SUM(si.quantity * p.cost_price), 0.00) AS total_cost,
    COALESCE(SUM(si.subtotal) - SUM(si.quantity * p.cost_price), 0.00) AS net_profit,
    ps.total_stock AS current_remaining_stock
FROM products p
JOIN sale_items si ON p.product_id = si.product_id
JOIN sales s ON si.sale_id = s.sale_id
LEFT JOIN product_stock ps ON p.product_id = ps.product_id
WHERE 
    (:from_date IS NULL OR DATE(s.sale_date) >= :from_date)
    AND (:to_date IS NULL OR DATE(s.sale_date) <= :to_date)
GROUP BY p.product_id, p.sku, p.product_name, p.category, ps.total_stock
ORDER BY units_sold DESC
LIMIT 10;
