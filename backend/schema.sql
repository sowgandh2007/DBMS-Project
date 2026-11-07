-- ============================================================
-- Inventory Management System : PostgreSQL schema (DDL only)
-- 11 tables, 2 views, 1 trigger.
-- Run order matters: parent tables are created before children.
-- ============================================================

DROP VIEW  IF EXISTS product_location  CASCADE;
DROP VIEW  IF EXISTS product_stock     CASCADE;
DROP TABLE IF EXISTS sales_item        CASCADE;
DROP TABLE IF EXISTS sales_order       CASCADE;
DROP TABLE IF EXISTS purchase_item     CASCADE;
DROP TABLE IF EXISTS purchase_order    CASCADE;
DROP TABLE IF EXISTS product_supplier  CASCADE;
DROP TABLE IF EXISTS product           CASCADE;
DROP TABLE IF EXISTS shelf             CASCADE;
DROP TABLE IF EXISTS rack              CASCADE;
DROP TABLE IF EXISTS supplier          CASCADE;
DROP TABLE IF EXISTS category          CASCADE;
DROP TABLE IF EXISTS employee          CASCADE;
DROP FUNCTION IF EXISTS fn_check_stock_before_sale() CASCADE;

-- 1. EMPLOYEE : users of the system
CREATE TABLE employee (
    employee_id   SERIAL PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(120) NOT NULL UNIQUE,
    role          VARCHAR(20)  NOT NULL
                  CHECK (role IN ('Admin', 'Manager', 'Staff')),
    hire_date     DATE         NOT NULL DEFAULT CURRENT_DATE
);

-- 2. CATEGORY : product grouping
CREATE TABLE category (
    category_id   SERIAL PRIMARY KEY,
    name          VARCHAR(60)  NOT NULL UNIQUE,
    description   TEXT
);

-- 3. SUPPLIER
CREATE TABLE supplier (
    supplier_id     SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    contact_person  VARCHAR(100),
    phone           VARCHAR(20)  NOT NULL,
    email           VARCHAR(120) UNIQUE,
    address         TEXT
);

-- 4. RACK : a physical rack in the store
CREATE TABLE rack (
    rack_id    SERIAL PRIMARY KEY,
    rack_code  VARCHAR(10) NOT NULL UNIQUE,
    aisle      VARCHAR(20) NOT NULL
);

-- 5. SHELF : numbered shelf inside a rack (1 rack : N shelves)
CREATE TABLE shelf (
    shelf_id      SERIAL PRIMARY KEY,
    rack_id       INT NOT NULL REFERENCES rack(rack_id)
                  ON UPDATE CASCADE ON DELETE CASCADE,
    shelf_number  INT NOT NULL CHECK (shelf_number > 0),
    UNIQUE (rack_id, shelf_number)
);

-- 6. PRODUCT
--    shelf_id = the shelf where the product is kept (1 shelf : N products).
--    Stock quantity is NOT stored here: it is derived (see view product_stock).
CREATE TABLE product (
    product_id      SERIAL PRIMARY KEY,
    sku             VARCHAR(30)   NOT NULL UNIQUE,
    name            VARCHAR(120)  NOT NULL,
    category_id     INT           NOT NULL
                    REFERENCES category(category_id)
                    ON UPDATE CASCADE ON DELETE RESTRICT,
    shelf_id        INT
                    REFERENCES shelf(shelf_id)
                    ON UPDATE CASCADE ON DELETE SET NULL,
    unit_price      NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    reorder_level   INT           NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE
);

-- 7. PRODUCT_SUPPLIER : M:N between product and supplier
CREATE TABLE product_supplier (
    product_id    INT NOT NULL REFERENCES product(product_id)
                  ON UPDATE CASCADE ON DELETE CASCADE,
    supplier_id   INT NOT NULL REFERENCES supplier(supplier_id)
                  ON UPDATE CASCADE ON DELETE CASCADE,
    supply_price  NUMERIC(10,2) NOT NULL CHECK (supply_price >= 0),
    lead_time_days INT CHECK (lead_time_days >= 0),
    PRIMARY KEY (product_id, supplier_id)
);

-- 8. PURCHASE_ORDER : stock-in header
CREATE TABLE purchase_order (
    po_id          SERIAL PRIMARY KEY,
    supplier_id    INT NOT NULL REFERENCES supplier(supplier_id)
                   ON UPDATE CASCADE ON DELETE RESTRICT,
    employee_id    INT NOT NULL REFERENCES employee(employee_id)
                   ON UPDATE CASCADE ON DELETE RESTRICT,
    order_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    received_date  DATE,
    status         VARCHAR(15) NOT NULL DEFAULT 'Pending'
                   CHECK (status IN ('Pending', 'Received', 'Cancelled')),
    CHECK (received_date IS NULL OR received_date >= order_date)
);

-- 9. PURCHASE_ITEM : stock-in lines (M:N between purchase_order and product)
CREATE TABLE purchase_item (
    po_id       INT NOT NULL REFERENCES purchase_order(po_id)
                ON UPDATE CASCADE ON DELETE CASCADE,
    product_id  INT NOT NULL REFERENCES product(product_id)
                ON UPDATE CASCADE ON DELETE RESTRICT,
    quantity    INT NOT NULL CHECK (quantity > 0),
    unit_cost   NUMERIC(10,2) NOT NULL CHECK (unit_cost >= 0),
    PRIMARY KEY (po_id, product_id)
);

-- 10. SALES_ORDER : stock-out header
CREATE TABLE sales_order (
    sale_id        SERIAL PRIMARY KEY,
    employee_id    INT NOT NULL REFERENCES employee(employee_id)
                   ON UPDATE CASCADE ON DELETE RESTRICT,
    customer_name  VARCHAR(100),
    sale_date      DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 11. SALES_ITEM : stock-out lines (M:N between sales_order and product)
CREATE TABLE sales_item (
    sale_id     INT NOT NULL REFERENCES sales_order(sale_id)
                ON UPDATE CASCADE ON DELETE CASCADE,
    product_id  INT NOT NULL REFERENCES product(product_id)
                ON UPDATE CASCADE ON DELETE RESTRICT,
    quantity    INT NOT NULL CHECK (quantity > 0),
    unit_price  NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    PRIMARY KEY (sale_id, product_id)
);

-- Indexes on foreign keys that are searched often
CREATE INDEX idx_shelf_rack         ON shelf(rack_id);
CREATE INDEX idx_product_category   ON product(category_id);
CREATE INDEX idx_product_shelf      ON product(shelf_id);
CREATE INDEX idx_po_supplier        ON purchase_order(supplier_id);
CREATE INDEX idx_purchase_item_prod ON purchase_item(product_id);
CREATE INDEX idx_sales_item_prod    ON sales_item(product_id);

-- ============================================================
-- VIEW 1 : product_stock
-- Stock is a derived value: units received - units sold.
-- Only purchase orders with status 'Received' add stock.
-- ============================================================
CREATE VIEW product_stock AS
SELECT p.product_id,
       p.sku,
       p.name,
       p.category_id,
       p.shelf_id,
       p.unit_price,
       p.reorder_level,
       p.is_active,
       (COALESCE(r.received, 0) - COALESCE(s.sold, 0))::INT AS stock_quantity,
       (COALESCE(r.received, 0) - COALESCE(s.sold, 0)) < p.reorder_level AS low_stock
FROM product p
LEFT JOIN (SELECT pi.product_id, SUM(pi.quantity) AS received
           FROM purchase_item pi
           JOIN purchase_order po ON po.po_id = pi.po_id
           WHERE po.status = 'Received'
           GROUP BY pi.product_id) r ON r.product_id = p.product_id
LEFT JOIN (SELECT product_id, SUM(quantity) AS sold
           FROM sales_item
           GROUP BY product_id) s ON s.product_id = p.product_id;

-- ============================================================
-- VIEW 2 : product_location
-- Answers "where is this product?" (rack, aisle, shelf) with stock.
-- ============================================================
CREATE VIEW product_location AS
SELECT ps.product_id,
       ps.sku,
       ps.name,
       ps.unit_price,
       r.rack_code,
       r.aisle,
       sh.shelf_number,
       ps.stock_quantity,
       ps.low_stock
FROM product_stock ps
LEFT JOIN shelf sh ON sh.shelf_id = ps.shelf_id
LEFT JOIN rack  r  ON r.rack_id   = sh.rack_id;

-- ============================================================
-- TRIGGER : reject a sale line that is larger than available stock
-- ============================================================
CREATE FUNCTION fn_check_stock_before_sale() RETURNS TRIGGER AS $$
DECLARE
    available INT;
BEGIN
    SELECT COALESCE((SELECT SUM(pi.quantity)
                     FROM purchase_item pi
                     JOIN purchase_order po ON po.po_id = pi.po_id
                     WHERE pi.product_id = NEW.product_id
                       AND po.status = 'Received'), 0)
         - COALESCE((SELECT SUM(si.quantity)
                     FROM sales_item si
                     WHERE si.product_id = NEW.product_id
                       AND NOT (TG_OP = 'UPDATE'
                                AND si.sale_id = OLD.sale_id
                                AND si.product_id = OLD.product_id)), 0)
    INTO available;

    IF NEW.quantity > available THEN
        RAISE EXCEPTION 'Insufficient stock for product_id %: requested %, available %',
                        NEW.product_id, NEW.quantity, available;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_stock_before_sale
BEFORE INSERT OR UPDATE ON sales_item
FOR EACH ROW EXECUTE FUNCTION fn_check_stock_before_sale();
