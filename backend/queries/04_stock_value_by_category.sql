-- FR-8.3 & DBS Project Requirement (Aggregate Functions & HAVING)
-- Demonstrates: COUNT, SUM, AVG, MIN, MAX, GROUP BY, HAVING, ORDER BY
-- $1 = include_inactive (boolean; normally FALSE)
SELECT
    c.category_id,
    c.name AS category_name,
    COUNT(ps.product_id) AS product_count,
    SUM(ps.stock_quantity) AS total_stock_units,
    ROUND(AVG(ps.unit_price), 2) AS avg_unit_price,
    MIN(ps.unit_price) AS min_price,
    MAX(ps.unit_price) AS max_price,
    SUM(ps.stock_quantity * ps.unit_price) AS total_stock_value
FROM category c
JOIN product_stock ps ON ps.category_id = c.category_id
WHERE ($1::boolean OR ps.is_active = TRUE)
GROUP BY c.category_id, c.name
HAVING COUNT(ps.product_id) > 0
ORDER BY total_stock_value DESC;
