-- DBS Project Requirement: DELETE / Deactivate Operation
-- Demonstrates referential integrity & safe record deactivation
-- $1 = product_id
UPDATE product
SET is_active = FALSE
WHERE product_id = $1
RETURNING product_id, sku, product_name, is_active;
