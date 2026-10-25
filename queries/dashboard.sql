-- =============================================================================
-- FEATURE: Dashboard Overview & KPI Metrics
-- File: queries/dashboard.sql
-- =============================================================================
-- Integration Point:
-- Frontend Service: src/services/dashboardService.js
-- Suggested API Route:
--   GET /api/dashboard/stats
--   GET /api/dashboard/margin-chart
--   GET /api/dashboard/recent-activity
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. OVERVIEW KPI METRIC CARDS
-- Computes key metrics using the canonical `product_stock` view
-- -----------------------------------------------------------------------------
SELECT 
    COUNT(DISTINCT ps.product_id) AS total_skus,
    COALESCE(SUM(ps.total_stock), 0) AS total_units_in_stock,
    COALESCE(SUM(ps.total_stock * ps.cost_price), 0.00) AS total_inventory_valuation,
    COALESCE(SUM(ps.total_stock * (ps.unit_price - ps.cost_price)), 0.00) AS estimated_potential_profit,
    ROUND(
        (COALESCE(SUM(ps.total_stock * (ps.unit_price - ps.cost_price)), 0) / 
        NULLIF(SUM(ps.total_stock * ps.unit_price), 0)) * 100, 
        1
    ) AS average_margin_percentage,
    COALESCE(SUM(CASE WHEN ps.stock_status = 'LOW_STOCK' THEN 1 ELSE 0 END), 0) AS low_stock_count,
    COALESCE(SUM(CASE WHEN ps.stock_status = 'OUT_OF_STOCK' THEN 1 ELSE 0 END), 0) AS out_of_stock_count
FROM product_stock ps;

-- -----------------------------------------------------------------------------
-- 2. TODAY'S SALES & REVENUE KPI
-- -----------------------------------------------------------------------------
SELECT 
    COUNT(sale_id) AS sales_count_today,
    COALESCE(SUM(total_amount), 0.00) AS revenue_today
FROM sales
WHERE DATE(sale_date) = CURRENT_DATE();

-- -----------------------------------------------------------------------------
-- 3. OVERALL RACK WAREHOUSE UTILIZATION %
-- -----------------------------------------------------------------------------
SELECT 
    COALESCE(SUM(r.max_capacity), 0) AS total_capacity,
    COALESCE(SUM(prp.quantity), 0) AS total_occupied,
    ROUND((COALESCE(SUM(prp.quantity), 0) / NULLIF(SUM(r.max_capacity), 0)) * 100, 1) AS rack_occupancy_pct
FROM racks r
LEFT JOIN shelves sh ON r.rack_id = sh.rack_id
LEFT JOIN product_rack_placement prp ON sh.shelf_id = prp.shelf_id;

-- -----------------------------------------------------------------------------
-- 4. HIGHEST MARGIN PRODUCTS (IN STOCK) - Widget inspired by sowgandh.vercel.app
-- Uses product_stock view
-- -----------------------------------------------------------------------------
SELECT 
    ps.product_id,
    ps.sku,
    ps.product_name,
    ps.category,
    ps.cost_price,
    ps.unit_price,
    (ps.unit_price - ps.cost_price) AS unit_profit,
    ROUND(((ps.unit_price - ps.cost_price) / NULLIF(ps.unit_price, 0)) * 100, 1) AS margin_pct,
    ps.total_stock
FROM product_stock ps
WHERE ps.total_stock > 0
ORDER BY margin_pct DESC
LIMIT 5;

-- -----------------------------------------------------------------------------
-- 5. RECENT ACTIVITY LOG (Combined latest sales and rack restocks)
-- -----------------------------------------------------------------------------
(
    SELECT 
        'SALE' AS activity_type,
        CONCAT('Sale ', s.receipt_number, ' - ', s.customer_name) AS description,
        CONCAT('₹', FORMAT(s.total_amount, 2)) AS extra_info,
        s.sale_date AS activity_timestamp
    FROM sales s
    ORDER BY s.sale_date DESC
    LIMIT 5
)
UNION ALL
(
    SELECT 
        'RESTOCK' AS activity_type,
        CONCAT('Restocked ', p.product_name, ' on ', r.rack_code, ' (', sh.shelf_code, ')') AS description,
        CONCAT('+', prp.quantity, ' units') AS extra_info,
        prp.last_restocked AS activity_timestamp
    FROM product_rack_placement prp
    JOIN products p ON prp.product_id = p.product_id
    JOIN shelves sh ON prp.shelf_id = sh.shelf_id
    JOIN racks r ON sh.rack_id = r.rack_id
    ORDER BY prp.last_restocked DESC
    LIMIT 5
)
ORDER BY activity_timestamp DESC
LIMIT 8;
