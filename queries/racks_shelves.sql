-- =============================================================================
-- FEATURE: Racks and Shelves Management
-- File: queries/racks_shelves.sql
-- =============================================================================
-- Integration Point:
-- Frontend Service: src/services/rackService.js
-- Suggested API Route:
--   GET  /api/racks?aisle=:aisle&zone=:zone
--   GET  /api/racks/:id/shelves
--   POST /api/racks
--   POST /api/racks/:id/shelves
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. LIST RACKS WITH AGGREGATED OCCUPANCY & UTILIZATION
-- Parameters:
--   :aisle - string or NULL ('all' or specific aisle, e.g. 'Aisle 01')
--   :zone  - string or NULL ('all' or specific zone)
-- -----------------------------------------------------------------------------
SELECT 
    r.rack_id,
    r.rack_code,
    r.aisle_number,
    r.zone,
    r.category_type,
    r.max_capacity,
    COUNT(DISTINCT sh.shelf_id) AS total_shelves,
    COALESCE(SUM(prp.quantity), 0) AS current_stored_units,
    ROUND((COALESCE(SUM(prp.quantity), 0) / NULLIF(r.max_capacity, 0)) * 100, 1) AS occupancy_percentage,
    CASE 
        WHEN (COALESCE(SUM(prp.quantity), 0) / NULLIF(r.max_capacity, 0)) >= 0.90 THEN 'NEAR_FULL'
        WHEN (COALESCE(SUM(prp.quantity), 0) / NULLIF(r.max_capacity, 0)) >= 0.70 THEN 'OPTIMAL'
        ELSE 'AVAILABLE'
    END AS capacity_status
FROM racks r
LEFT JOIN shelves sh ON r.rack_id = sh.rack_id
LEFT JOIN product_rack_placement prp ON sh.shelf_id = prp.shelf_id
WHERE 
    (:aisle IS NULL OR :aisle = 'all' OR r.aisle_number = :aisle)
    AND (:zone IS NULL OR :zone = 'all' OR r.zone = :zone)
GROUP BY 
    r.rack_id, r.rack_code, r.aisle_number, r.zone, r.category_type, r.max_capacity
ORDER BY r.aisle_number ASC, r.rack_code ASC;

-- -----------------------------------------------------------------------------
-- 2. GET SHELVES FOR A SPECIFIC RACK WITH STORED ITEM BREAKDOWN
-- Parameters:
--   :rack_id - integer
-- -----------------------------------------------------------------------------
SELECT 
    sh.shelf_id,
    sh.rack_id,
    sh.shelf_code,
    sh.shelf_level,
    sh.max_capacity,
    COALESCE(SUM(prp.quantity), 0) AS current_quantity,
    COUNT(DISTINCT prp.product_id) AS unique_sku_count,
    ROUND((COALESCE(SUM(prp.quantity), 0) / NULLIF(sh.max_capacity, 0)) * 100, 1) AS shelf_occupancy_pct
FROM shelves sh
LEFT JOIN product_rack_placement prp ON sh.shelf_id = prp.shelf_id
WHERE sh.rack_id = :rack_id
GROUP BY sh.shelf_id, sh.rack_id, sh.shelf_code, sh.shelf_level, sh.max_capacity
ORDER BY sh.shelf_level ASC;

-- -----------------------------------------------------------------------------
-- 3. CREATE NEW RACK
-- Parameters:
--   :rack_code, :aisle_number, :zone, :max_capacity, :category_type, :description
-- -----------------------------------------------------------------------------
INSERT INTO racks (rack_code, aisle_number, zone, max_capacity, category_type, description)
VALUES (:rack_code, :aisle_number, :zone, :max_capacity, :category_type, :description);

-- -----------------------------------------------------------------------------
-- 4. CREATE NEW SHELF FOR RACK
-- Parameters:
--   :rack_id, :shelf_code, :shelf_level, :max_capacity
-- -----------------------------------------------------------------------------
INSERT INTO shelves (rack_id, shelf_code, shelf_level, max_capacity)
VALUES (:rack_id, :shelf_code, :shelf_level, :max_capacity);

-- -----------------------------------------------------------------------------
-- 5. GET DISTINCT AISLES (For dropdown filters)
-- -----------------------------------------------------------------------------
SELECT DISTINCT aisle_number 
FROM racks 
ORDER BY aisle_number ASC;
