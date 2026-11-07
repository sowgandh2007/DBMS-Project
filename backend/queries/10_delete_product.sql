-- DBS Project Requirement: Complete Product Deletion
-- Permanently deletes product and preserves constraint integrity
-- $1 = product_id
DELETE FROM product
WHERE product_id = $1
RETURNING product_id, sku, product_name;
