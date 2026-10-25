-- FR-7.3 / FR-8.2
-- $1 = include_inactive (boolean; normally FALSE)
-- Low stock is already calculated by product_stock.low_stock.
-- Shortfall = reorder_level - stock_quantity.
SELECT
    ps.product_id,
    ps.sku,
    ps.name AS product_name,
    ps.stock_quantity,
    ps.reorder_level,
    ps.reorder_level - ps.stock_quantity AS shortfall
FROM product_stock ps
WHERE ($1::boolean OR ps.is_active = TRUE)
  AND ps.low_stock = TRUE
ORDER BY shortfall DESC, ps.name;
