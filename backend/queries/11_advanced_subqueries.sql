-- DBS Project Requirement: Subqueries Demonstration
-- Demonstrates: Scalar subquery & IN subquery
-- Subquery A: Find all products priced higher than the catalog average price
SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    p.unit_price,
    ROUND((SELECT AVG(unit_price) FROM product WHERE is_active = TRUE), 2) AS catalog_avg_price,
    ROUND(p.unit_price - (SELECT AVG(unit_price) FROM product WHERE is_active = TRUE), 2) AS price_diff_from_avg
FROM product p
WHERE p.is_active = TRUE
  AND p.unit_price > (SELECT AVG(unit_price) FROM product WHERE is_active = TRUE)
ORDER BY p.unit_price DESC;

-- Subquery B: Suppliers who have active products linked in the catalog (IN subquery)
SELECT 
    s.supplier_id,
    s.supplier_name,
    s.contact_person
FROM supplier s
WHERE s.supplier_id IN (
    SELECT DISTINCT ps.supplier_id 
    FROM product_supplier ps 
    JOIN product p ON p.product_id = ps.product_id 
    WHERE p.is_active = TRUE
)
ORDER BY s.supplier_name;
