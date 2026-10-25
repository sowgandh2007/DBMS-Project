-- FR-8.4
-- $1 = status (text or NULL for all statuses)
-- $2 = supplier_id (integer or NULL for all suppliers)
-- $3 = start date (date or NULL for no lower bound)
-- $4 = end date (date or NULL for no upper bound)
-- Total cost = SUM(quantity * unit_cost). All statuses are included by default.
SELECT
    po.po_id,
    s.name AS supplier_name,
    po.status,
    po.order_date,
    po.received_date,
    COALESCE(SUM(pi.quantity * pi.unit_cost), 0) AS total_cost
FROM purchase_order po
JOIN supplier s ON s.supplier_id = po.supplier_id
LEFT JOIN purchase_item pi ON pi.po_id = po.po_id
WHERE ($1::text IS NULL OR po.status = $1::text)
  AND ($2::integer IS NULL OR po.supplier_id = $2::integer)
  AND ($3::date IS NULL OR po.order_date >= $3::date)
  AND ($4::date IS NULL OR po.order_date <= $4::date)
GROUP BY po.po_id, s.name, po.status, po.order_date, po.received_date
ORDER BY po.order_date DESC, po.po_id;
