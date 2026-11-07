-- FR-8.1
-- $1 = include_inactive (boolean; normally FALSE)
-- Uses product_location joined with product and category.
SELECT
    pl.product_id,
    pl.sku,
    pl.name AS product_name,
    p.unit_price,
    COALESCE(
        (SELECT psup.supply_price FROM product_supplier psup WHERE psup.product_id = p.product_id ORDER BY psup.supply_price ASC LIMIT 1),
        (SELECT pi.unit_cost FROM purchase_item pi WHERE pi.product_id = p.product_id ORDER BY pi.po_id DESC LIMIT 1),
        ROUND(p.unit_price * 0.70, 2)
    ) AS cost_price,
    c.name AS category_name,
    pl.rack_code,
    pl.aisle,
    pl.shelf_number,
    pl.stock_quantity,
    pl.low_stock
FROM product_location pl
JOIN product p ON p.product_id = pl.product_id
LEFT JOIN category c ON c.category_id = p.category_id
WHERE ($1::boolean OR p.is_active = TRUE)
ORDER BY pl.name;
