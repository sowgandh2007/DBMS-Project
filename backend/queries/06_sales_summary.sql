-- FR-8.5
-- Contains THREE separate queries. Execute each statement separately.
-- Sales totals use sales_item.unit_price, not product.unit_price.

-- A) Sales summary by date
-- $1 = start date (date or NULL), $2 = end date (date or NULL)
SELECT
    so.sale_date,
    COUNT(DISTINCT so.sale_id) AS number_of_sales,
    SUM(si.quantity) AS items_sold,
    SUM(si.quantity * si.unit_price) AS total_sales
FROM sales_order so
JOIN sales_item si ON si.sale_id = so.sale_id
WHERE ($1::date IS NULL OR so.sale_date >= $1::date)
  AND ($2::date IS NULL OR so.sale_date <= $2::date)
GROUP BY so.sale_date
ORDER BY so.sale_date;

-- B) Sales summary by product
-- $1 = start date (date or NULL), $2 = end date (date or NULL)
SELECT
    p.product_id,
    p.sku,
    p.name AS product_name,
    SUM(si.quantity) AS quantity_sold,
    SUM(si.quantity * si.unit_price) AS total_sales
FROM sales_order so
JOIN sales_item si ON si.sale_id = so.sale_id
JOIN product p ON p.product_id = si.product_id
WHERE ($1::date IS NULL OR so.sale_date >= $1::date)
  AND ($2::date IS NULL OR so.sale_date <= $2::date)
GROUP BY p.product_id, p.sku, p.name
ORDER BY total_sales DESC;

-- C) Sales summary by employee
-- $1 = start date (date or NULL), $2 = end date (date or NULL)
SELECT
    e.employee_id,
    e.full_name AS employee_name,
    COUNT(DISTINCT so.sale_id) AS number_of_sales,
    SUM(si.quantity * si.unit_price) AS total_sales
FROM sales_order so
JOIN employee e ON e.employee_id = so.employee_id
JOIN sales_item si ON si.sale_id = so.sale_id
WHERE ($1::date IS NULL OR so.sale_date >= $1::date)
  AND ($2::date IS NULL OR so.sale_date <= $2::date)
GROUP BY e.employee_id, e.full_name
ORDER BY total_sales DESC;
