-- FR-8.6
-- $1 = supplier_id (integer or NULL for all suppliers)
-- $2 = product search text (text or NULL to disable product filter)
-- LEFT JOIN includes suppliers with no linked products when no product filter is used.
SELECT
    s.supplier_id,
    s.name AS supplier_name,
    s.contact_person,
    s.phone,
    s.email,
    s.address,
    p.product_id,
    p.sku,
    p.name AS product_name,
    ps.supply_price,
    ps.lead_time_days
FROM supplier s
LEFT JOIN product_supplier ps ON ps.supplier_id = s.supplier_id
LEFT JOIN product p ON p.product_id = ps.product_id
WHERE ($1::integer IS NULL OR s.supplier_id = $1::integer)
  AND (
      $2::text IS NULL
      OR p.name ILIKE '%' || $2::text || '%'
      OR p.sku ILIKE '%' || $2::text || '%'
  )
ORDER BY s.name, p.name;
