-- DBS Project Requirement: INSERT Operation
-- $1 = product_id, $2 = name, $3 = sku, $4 = category_id, $5 = shelf_id, $6 = unit_price, $7 = reorder_level
INSERT INTO product (
    product_id,
    product_name,
    sku,
    category_id,
    shelf_id,
    unit_price,
    reorder_level,
    is_active
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    TRUE
)
RETURNING product_id, sku, product_name, category_id, shelf_id, unit_price, reorder_level, is_active;
