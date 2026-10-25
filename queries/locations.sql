-- =============================================================================
-- FEATURE: Product Location & Rack Finder
-- File: queries/locations.sql
-- =============================================================================
-- Integration Point:
-- Frontend Service: src/services/locationService.js
-- Suggested API Route:
--   GET  /api/locations/find?product=:search&aisle=:aisle&rack_code=:rack_code
--   GET  /api/locations/shelf/:shelf_id
--   POST /api/locations/move
-- =============================================================================
-- ARCHITECTURAL NOTE:
-- This feature uses the CANONICAL VIEW `product_location`.
-- Use this view to find physical rack coordinates (Aisle, Rack, Shelf Level).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. FIND PRODUCT LOCATION (USING CANONICAL VIEW product_location)
-- Parameters:
--   :search_term - string or NULL (SKU or Product Name)
--   :aisle       - string or NULL (e.g. 'Aisle 01', 'all')
--   :rack_code   - string or NULL (e.g. 'RACK-A1', 'all')
-- -----------------------------------------------------------------------------
SELECT 
    pl.placement_id,
    pl.product_id,
    pl.sku,
    pl.product_name,
    pl.category,
    pl.rack_id,
    pl.rack_code,
    pl.aisle_number,
    pl.zone,
    pl.shelf_id,
    pl.shelf_code,
    pl.shelf_level,
    pl.quantity,
    pl.shelf_capacity,
    pl.shelf_occupancy_pct,
    pl.last_restocked
FROM product_location pl
WHERE 
    (:search_term IS NULL OR pl.product_name LIKE CONCAT('%', :search_term, '%') OR pl.sku LIKE CONCAT('%', :search_term, '%'))
    AND (:aisle IS NULL OR :aisle = 'all' OR pl.aisle_number = :aisle)
    AND (:rack_code IS NULL OR :rack_code = 'all' OR pl.rack_code = :rack_code)
ORDER BY pl.aisle_number ASC, pl.rack_code ASC, pl.shelf_level ASC;

-- -----------------------------------------------------------------------------
-- 2. GET ALL ITEMS ON A SPECIFIC SHELF
-- Parameters:
--   :shelf_id - integer
-- -----------------------------------------------------------------------------
SELECT 
    pl.placement_id,
    pl.product_id,
    pl.sku,
    pl.product_name,
    pl.category,
    pl.quantity,
    pl.shelf_capacity,
    pl.shelf_occupancy_pct,
    pl.last_restocked
FROM product_location pl
WHERE pl.shelf_id = :shelf_id
ORDER BY pl.product_name ASC;

-- -----------------------------------------------------------------------------
-- 3. MOVE / REASSIGN PRODUCT TO DIFFERENT SHELF
-- Parameters:
--   :placement_id - integer
--   :new_shelf_id - integer
-- -----------------------------------------------------------------------------
UPDATE product_rack_placement 
SET 
    shelf_id = :new_shelf_id,
    last_restocked = CURRENT_TIMESTAMP
WHERE placement_id = :placement_id;

-- -----------------------------------------------------------------------------
-- 4. TRANSFER PARTIAL QUANTITY BETWEEN SHELVES
-- Parameters:
--   :product_id   - integer
--   :from_shelf_id- integer
--   :to_shelf_id  - integer
--   :transfer_qty - integer
-- -----------------------------------------------------------------------------
-- Step A: Deduct from source shelf
UPDATE product_rack_placement 
SET quantity = quantity - :transfer_qty
WHERE product_id = :product_id AND shelf_id = :from_shelf_id;

-- Step B: Insert or increment on target shelf
INSERT INTO product_rack_placement (product_id, shelf_id, quantity)
VALUES (:product_id, :to_shelf_id, :transfer_qty)
ON DUPLICATE KEY UPDATE 
    quantity = quantity + :transfer_qty,
    last_restocked = CURRENT_TIMESTAMP;
