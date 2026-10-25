-- =============================================================================
-- FEATURE: Sales & POS Transactions
-- File: queries/sales.sql
-- =============================================================================
-- Integration Point:
-- Frontend Service: src/services/salesService.js
-- Suggested API Route:
--   GET  /api/sales?search=:search&from_date=:from_date&to_date=:to_date&payment_method=:method
--   GET  /api/sales/:id
--   POST /api/sales (Process sale transaction)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. RECORD NEW SALE (Header)
-- Parameters:
--   :receipt_number, :customer_name, :payment_method, :subtotal, :tax_amount, :discount_amount, :total_amount, :cashier_name
-- -----------------------------------------------------------------------------
INSERT INTO sales (
    receipt_number, 
    customer_name, 
    payment_method, 
    subtotal, 
    tax_amount, 
    discount_amount, 
    total_amount, 
    cashier_name
) VALUES (
    :receipt_number, 
    :customer_name, 
    :payment_method, 
    :subtotal, 
    :tax_amount, 
    :discount_amount, 
    :total_amount, 
    :cashier_name
);

-- -----------------------------------------------------------------------------
-- 2. INSERT SALE ITEM & DEDUCT FROM SHELF (Transaction Step)
-- Parameters:
--   :sale_id, :product_id, :shelf_id, :quantity, :unit_price, :subtotal
-- -----------------------------------------------------------------------------
INSERT INTO sale_items (sale_id, product_id, shelf_id, quantity, unit_price, subtotal)
VALUES (:sale_id, :product_id, :shelf_id, :quantity, :unit_price, :subtotal);

-- Deduct from physical shelf placement:
UPDATE product_rack_placement
SET quantity = quantity - :quantity
WHERE product_id = :product_id AND shelf_id = :shelf_id;

-- -----------------------------------------------------------------------------
-- 3. LIST SALES HISTORY LOG
-- Parameters:
--   :search_term    - string or NULL (receipt_number or customer_name)
--   :from_date      - date string or NULL
--   :to_date        - date string or NULL
--   :payment_method - 'ALL', 'CASH', 'CARD', 'UPI', 'SPLIT'
-- -----------------------------------------------------------------------------
SELECT 
    s.sale_id,
    s.receipt_number,
    s.sale_date,
    s.customer_name,
    s.payment_method,
    s.subtotal,
    s.tax_amount,
    s.discount_amount,
    s.total_amount,
    s.cashier_name,
    COUNT(si.sale_item_id) AS total_items_count,
    COALESCE(SUM(si.quantity), 0) AS total_units_sold,
    COALESCE(SUM(si.quantity * p.cost_price), 0.00) AS total_cost_basis,
    COALESCE(s.total_amount - SUM(si.quantity * p.cost_price), 0.00) AS realized_profit
FROM sales s
LEFT JOIN sale_items si ON s.sale_id = si.sale_id
LEFT JOIN products p ON si.product_id = p.product_id
WHERE 
    (:search_term IS NULL OR s.receipt_number LIKE CONCAT('%', :search_term, '%') OR s.customer_name LIKE CONCAT('%', :search_term, '%'))
    AND (:from_date IS NULL OR DATE(s.sale_date) >= :from_date)
    AND (:to_date IS NULL OR DATE(s.sale_date) <= :to_date)
    AND (:payment_method IS NULL OR :payment_method = 'ALL' OR s.payment_method = :payment_method)
GROUP BY 
    s.sale_id, s.receipt_number, s.sale_date, s.customer_name, 
    s.payment_method, s.subtotal, s.tax_amount, s.discount_amount, s.total_amount, s.cashier_name
ORDER BY s.sale_date DESC;

-- -----------------------------------------------------------------------------
-- 4. GET SALE RECEIPT DETAILS
-- Parameters:
--   :sale_id - integer
-- -----------------------------------------------------------------------------
SELECT 
    si.sale_item_id,
    si.sale_id,
    si.product_id,
    p.sku,
    p.product_name,
    p.cost_price,
    si.quantity,
    si.unit_price,
    si.subtotal,
    sh.shelf_code,
    r.rack_code,
    (si.subtotal - (si.quantity * p.cost_price)) AS item_profit
FROM sale_items si
JOIN products p ON si.product_id = p.product_id
LEFT JOIN shelves sh ON si.shelf_id = sh.shelf_id
LEFT JOIN racks r ON sh.rack_id = r.rack_id
WHERE si.sale_id = :sale_id;

-- -----------------------------------------------------------------------------
-- 5. SALES KPI METRICS (Inspired by sowgandh.vercel.app sales counters)
-- -----------------------------------------------------------------------------
SELECT 
    COUNT(DISTINCT s.sale_id) AS total_transactions,
    COALESCE(SUM(si.quantity), 0) AS units_sold,
    COALESCE(SUM(si.quantity * p.cost_price), 0.00) AS cost_basis,
    COALESCE(SUM(s.total_amount), 0.00) AS total_revenue,
    COALESCE(SUM(s.total_amount) - SUM(si.quantity * p.cost_price), 0.00) AS net_profit_realized
FROM sales s
LEFT JOIN sale_items si ON s.sale_id = si.sale_id
LEFT JOIN products p ON si.product_id = p.product_id;
