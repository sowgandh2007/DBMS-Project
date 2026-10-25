-- =============================================================================
-- FEATURE: Suppliers Directory & Management
-- File: queries/suppliers.sql
-- =============================================================================
-- Integration Point:
-- Frontend Service: src/services/supplierService.js
-- Suggested API Route:
--   GET  /api/suppliers?search=:search&status=:status
--   GET  /api/suppliers/:id
--   POST /api/suppliers
--   PUT  /api/suppliers/:id
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SEARCH & LIST SUPPLIERS WITH PRODUCT & PO STATS
-- Parameters:
--   :search_term - string or NULL (matches supplier_name, contact_name, or email)
--   :status      - 'ALL', 'ACTIVE', 'INACTIVE', 'PREFERRED'
-- -----------------------------------------------------------------------------
SELECT 
    s.supplier_id,
    s.supplier_name,
    s.contact_name,
    s.email,
    s.phone,
    s.address,
    s.status,
    COUNT(DISTINCT p.product_id) AS total_products_supplied,
    COUNT(DISTINCT po.po_id) AS total_orders_placed,
    COALESCE(SUM(po.total_amount), 0.00) AS total_procurement_spend,
    s.created_at
FROM suppliers s
LEFT JOIN products p ON s.supplier_id = p.supplier_id
LEFT JOIN purchase_orders po ON s.supplier_id = po.supplier_id
WHERE 
    (:search_term IS NULL OR s.supplier_name LIKE CONCAT('%', :search_term, '%') OR s.contact_name LIKE CONCAT('%', :search_term, '%'))
    AND (:status IS NULL OR :status = 'ALL' OR s.status = :status)
GROUP BY 
    s.supplier_id, s.supplier_name, s.contact_name, s.email, s.phone, s.address, s.status, s.created_at
ORDER BY s.supplier_name ASC;

-- -----------------------------------------------------------------------------
-- 2. GET SUPPLIER DETAILS AND SUPPLIED PRODUCTS
-- Parameters:
--   :supplier_id - integer
-- -----------------------------------------------------------------------------
SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    p.category,
    p.cost_price,
    p.unit_price,
    ps.total_stock,
    ps.stock_status
FROM products p
LEFT JOIN product_stock ps ON p.product_id = ps.product_id
WHERE p.supplier_id = :supplier_id
ORDER BY p.product_name ASC;

-- -----------------------------------------------------------------------------
-- 3. CREATE NEW SUPPLIER
-- Parameters:
--   :supplier_name, :contact_name, :email, :phone, :address, :status
-- -----------------------------------------------------------------------------
INSERT INTO suppliers (supplier_name, contact_name, email, phone, address, status)
VALUES (:supplier_name, :contact_name, :email, :phone, :address, :status);

-- -----------------------------------------------------------------------------
-- 4. UPDATE SUPPLIER
-- Parameters:
--   :supplier_id, :supplier_name, :contact_name, :email, :phone, :address, :status
-- -----------------------------------------------------------------------------
UPDATE suppliers
SET 
    supplier_name = :supplier_name,
    contact_name = :contact_name,
    email = :email,
    phone = :phone,
    address = :address,
    status = :status
WHERE supplier_id = :supplier_id;
