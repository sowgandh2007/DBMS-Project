-- =============================================================================
-- FEATURE: Purchase Orders & Receiving
-- File: queries/purchase_orders.sql
-- =============================================================================
-- Integration Point:
-- Frontend Service: src/services/purchaseOrderService.js
-- Suggested API Route:
--   GET  /api/purchase-orders?status=:status&supplier_id=:supplier_id&from_date=:from_date&to_date=:to_date
--   GET  /api/purchase-orders/:id
--   POST /api/purchase-orders
--   POST /api/purchase-orders/:id/receive
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. LIST PURCHASE ORDERS WITH FILTERS
-- Parameters:
--   :status      - 'ALL', 'DRAFT', 'PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED'
--   :supplier_id - integer or NULL
--   :from_date   - date string (YYYY-MM-DD) or NULL
--   :to_date     - date string (YYYY-MM-DD) or NULL
-- -----------------------------------------------------------------------------
SELECT 
    po.po_id,
    po.po_number,
    po.supplier_id,
    s.supplier_name,
    po.order_date,
    po.expected_date,
    po.status,
    po.total_amount,
    COUNT(poi.po_item_id) AS total_items,
    COALESCE(SUM(poi.quantity_ordered), 0) AS total_units_ordered,
    COALESCE(SUM(poi.quantity_received), 0) AS total_units_received,
    po.notes,
    po.created_at
FROM purchase_orders po
JOIN suppliers s ON po.supplier_id = s.supplier_id
LEFT JOIN purchase_order_items poi ON po.po_id = poi.po_id
WHERE 
    (:status IS NULL OR :status = 'ALL' OR po.status = :status)
    AND (:supplier_id IS NULL OR po.supplier_id = :supplier_id)
    AND (:from_date IS NULL OR po.order_date >= :from_date)
    AND (:to_date IS NULL OR po.order_date <= :to_date)
GROUP BY 
    po.po_id, po.po_number, po.supplier_id, s.supplier_name, 
    po.order_date, po.expected_date, po.status, po.total_amount, po.notes, po.created_at
ORDER BY po.order_date DESC, po.po_id DESC;

-- -----------------------------------------------------------------------------
-- 2. GET SINGLE PURCHASE ORDER WITH LINE ITEMS
-- Parameters:
--   :po_id - integer
-- -----------------------------------------------------------------------------
SELECT 
    poi.po_item_id,
    poi.po_id,
    poi.product_id,
    p.sku,
    p.product_name,
    p.category,
    poi.quantity_ordered,
    poi.quantity_received,
    poi.unit_cost,
    (poi.quantity_ordered * poi.unit_cost) AS line_total
FROM purchase_order_items poi
JOIN products p ON poi.product_id = p.product_id
WHERE poi.po_id = :po_id;

-- -----------------------------------------------------------------------------
-- 3. CREATE PURCHASE ORDER HEADER
-- Parameters:
--   :po_number, :supplier_id, :order_date, :expected_date, :status, :total_amount, :notes
-- -----------------------------------------------------------------------------
INSERT INTO purchase_orders (po_number, supplier_id, order_date, expected_date, status, total_amount, notes)
VALUES (:po_number, :supplier_id, :order_date, :expected_date, :status, :total_amount, :notes);

-- -----------------------------------------------------------------------------
-- 4. INSERT PURCHASE ORDER LINE ITEM
-- Parameters:
--   :po_id, :product_id, :quantity_ordered, :unit_cost
-- -----------------------------------------------------------------------------
INSERT INTO purchase_order_items (po_id, product_id, quantity_ordered, unit_cost)
VALUES (:po_id, :product_id, :quantity_ordered, :unit_cost);

-- -----------------------------------------------------------------------------
-- 5. RECEIVE SHIPMENT INTO RACK / SHELF (Transaction Step)
-- When a shipment arrives, received quantities are placed onto specific shelves.
-- Parameters:
--   :po_id, :po_item_id, :product_id, :shelf_id, :quantity_received
-- -----------------------------------------------------------------------------
-- Step A: Mark item received in PO items
UPDATE purchase_order_items
SET quantity_received = :quantity_received
WHERE po_item_id = :po_item_id;

-- Step B: Insert or increment quantity on target shelf in rack placement
INSERT INTO product_rack_placement (product_id, shelf_id, quantity)
VALUES (:product_id, :shelf_id, :quantity_received)
ON DUPLICATE KEY UPDATE 
    quantity = quantity + :quantity_received,
    last_restocked = CURRENT_TIMESTAMP;

-- Step C: Update PO status to RECEIVED when complete
UPDATE purchase_orders
SET status = 'RECEIVED'
WHERE po_id = :po_id;
