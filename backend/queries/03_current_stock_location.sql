-- FR-8.1
-- $1 = include_inactive (boolean; normally FALSE)
-- Uses product_location, whose LEFT JOINs preserve products without shelves.
SELECT
    pl.product_id,
    pl.sku,
    pl.name AS product_name,
    pl.rack_code,
    pl.aisle,
    pl.shelf_number,
    pl.stock_quantity,
    pl.low_stock
FROM product_location pl
WHERE ($1::boolean OR EXISTS (
    SELECT 1
    FROM product p
    WHERE p.product_id = pl.product_id
      AND p.is_active = TRUE
))
ORDER BY pl.name;
