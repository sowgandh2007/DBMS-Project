-- DBS Project Requirement: UPDATE Operation
-- $1 = product_id, $2 = product_name, $3 = category_id, $4 = unit_price, $5 = reorder_level, $6 = shelf_id
UPDATE product
SET
    product_name  = COALESCE($2, product_name),
    category_id   = COALESCE($3, category_id),
    unit_price    = COALESCE($4, unit_price),
    reorder_level = COALESCE($5, reorder_level),
    shelf_id      = COALESCE($6, shelf_id)
WHERE product_id = $1
RETURNING product_id, sku, product_name, category_id, shelf_id, unit_price, reorder_level, is_active;
