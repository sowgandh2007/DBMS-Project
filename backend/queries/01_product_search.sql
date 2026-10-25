-- FR-4.1 / FR-4.2 / FR-4.3
-- $1 = search text (name or SKU; empty string means no text filter)
-- $2 = category_id (integer or NULL for all categories)
-- $3 = include_inactive (boolean; normally FALSE)
-- Uses product_location because it already provides location and stock.
SELECT
    p.product_id,
    pl.sku,
    pl.name AS product_name,
    c.name AS category_name,
    pl.rack_code,
    pl.aisle,
    pl.shelf_number,
    pl.stock_quantity,
    pl.low_stock
FROM product_location pl
JOIN product p ON p.product_id = pl.product_id
JOIN category c ON c.category_id = p.category_id
WHERE ($3::boolean OR p.is_active = TRUE)
  AND (
      $1::text = ''
      OR pl.name ILIKE '%' || $1::text || '%'
      OR pl.sku ILIKE '%' || $1::text || '%'
  )
  AND ($2::integer IS NULL OR p.category_id = $2::integer)
ORDER BY pl.name;
