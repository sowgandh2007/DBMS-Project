# Retail Inventory & Rack Management System
## Complete College DBMS Project & Viva Examination Guide

This document is a comprehensive, student-friendly guide designed to help you understand every aspect of your project and answer any question during your college DBMS evaluation, lab viva, and project presentation.

---

# Table of Contents
1. [Project Introduction](#1-project-introduction)
2. [System Architecture](#2-system-architecture)
3. [Frontend Explanation](#3-frontend-explanation)
4. [Backend Explanation](#4-backend-explanation)
5. [Flask REST API Explanation](#5-flask-rest-api-explanation)
6. [Supabase PostgreSQL Explanation](#6-supabase-postgresql-explanation)
7. [Database Tables and Relationships](#7-database-tables-and-relationships)
8. [Entity-Relationship (ER) Diagram](#8-entity-relationship-er-diagram)
9. [Primary Keys, Foreign Keys, and Constraints](#9-primary-keys-foreign-keys-and-constraints)
10. [SQL Queries Used](#10-sql-queries-used)
11. [CRUD Operations Breakdown](#11-crud-operations-breakdown)
12. [Joins and Subqueries](#12-joins-and-subqueries)
13. [Database Views](#13-database-views)
14. [Transactions & ACID Properties](#14-transactions--acid-properties)
15. [Frontend-to-Backend Communication](#15-frontend-to-backend-communication)
16. [Complete Local Execution Workflow](#16-complete-local-execution-workflow)
17. [Important Code Explanations](#17-important-code-explanations)
18. [55 Potential Viva Questions and Answers](#18-55-potential-viva-questions-and-answers)

---

# 1. Project Introduction

### What is this project?
The **Retail Inventory & Rack Management System** (named **RackMaster**) is a full-stack database application designed to solve retail inventory tracking, stock movements, and physical warehouse rack/shelf mapping.

### What problem does it solve?
In physical supermarkets and warehouses, businesses suffer from two major problems:
1. **Stock Discrepancies**: Knowing how many items exist versus how many were sold or damaged.
2. **Location Ambiguity**: Workers not knowing which physical rack, aisle, or shelf tier an item is placed on.

### Key Capabilities
- **Product Catalog Management**: Track Stock Keeping Units (SKUs), names, selling prices, and reorder levels.
- **Physical Rack & Shelf Layout**: Multi-tier vertical shelf hierarchy mapped to physical warehouse aisles.
- **Inbound Procurement (Purchase Orders)**: Purchasing from suppliers with transactional stock-in receipt verification.
- **Outbound Point of Sale (POS & Quick Record Sale)**: Fast customer checkout that automatically deducts inventory and tracks gross margins.
- **Automated Low-Stock Alerts**: Visual warnings when stock drops below minimum safety thresholds.
- **Analytical Reports**: Category valuation, rack space utilization, and product turnover.

---

# 2. System Architecture

The project uses a standard **Three-Tier Client-Server Architecture**:

```
+-----------------------------------------------------------+
|                   TIER 1: PRESENTATION                    |
|             React 19 + Vite + Tailwind CSS                |
|               (Runs on http://localhost:5173)              |
+-----------------------------------------------------------+
                             |
                             | HTTP JSON REST Requests (/api/*)
                             v
+-----------------------------------------------------------+
|                   TIER 2: APPLICATION LOGIC               |
|                   Python 3.12 + Flask API                 |
|               (Runs on http://127.0.0.1:5000)             |
+-----------------------------------------------------------+
                             |
                             | TCP Port 5432 / psycopg2 Connection Pool
                             v
+-----------------------------------------------------------+
|                   TIER 3: DATABASE TIER                   |
|                  Supabase PostgreSQL Cloud                |
|             (11 Tables, 2 Views, 1 Safety Trigger)        |
+-----------------------------------------------------------+
```

### Why this 3-tier architecture?
1. **Separation of Concerns**: The frontend handles display, the backend handles business rules and security, and the database handles persistence and relational integrity.
2. **Security**: Browser client code NEVER talks directly to PostgreSQL. Database passwords and credentials stay safely on the backend server.
3. **Maintainability**: Changes in the UI do not break database tables, and schema enhancements do not require frontend rewrites.

---

# 3. Frontend Explanation

### Core Technologies
- **React 19**: Modern JavaScript UI library using functional components and declarative hooks (`useState`, `useEffect`).
- **Vite 8**: Modern development server and build tool with instant Hot Module Replacement (HMR).
- **Tailwind CSS 3.4**: Utility-first CSS framework providing a responsive, clean, enterprise light theme.
- **Lucide React**: Modern SVG icon set for intuitive navigation and status indicators.

### Structure of Frontend Components
```
src/
├── App.jsx                        # Main state container & view router
├── main.jsx                       # React DOM entry point
├── index.css                      # Global Tailwind directives & design tokens
├── components/
│   ├── common/                    # Reusable widgets
│   │   ├── Modal.jsx              # Accessible modal dialog with stopPropagation
│   │   ├── RecordSaleModal.jsx    # Scaled-up instant sale checkout with live profit calculation
│   │   ├── StatCard.jsx           # Responsive KPI metric counter cards
│   │   └── StatusBadge.jsx        # Color-coded status pills (IN_STOCK, PENDING, etc.)
│   ├── layout/                    # Page structure
│   │   ├── Header.jsx             # Top bar, search status, and database indicator
│   │   ├── Sidebar.jsx            # Left navigation menu (responsive drawer on mobile)
│   │   └── QueryInspectorModal.jsx# Displays the exact SQL query powering each page
│   └── views/                     # Main feature screens
│       ├── DashboardView.jsx      # High-level KPIs, fast actions, top-margin products
│       ├── ProductSearchView.jsx  # Catalog with search, category filter, and CRUD
│       ├── CategoriesView.jsx     # Product category manager
│       ├── StoreInventoryView.jsx # Physical stock valuation, location, and quick sale
│       ├── LocationFinderView.jsx # Instant lookup for aisle, rack, and shelf
│       ├── RacksShelvesView.jsx   # Warehouse physical rack and shelf configuration
│       ├── LowStockAlertsView.jsx # Automatic reorder warning dashboard
│       ├── SuppliersView.jsx      # Vendor profiles, contacts, and PO links
│       ├── PurchaseOrdersView.jsx # Procurement orders and stock receipt
│       ├── SalesPOSView.jsx       # POS register with cart + historic sales ledger
│       └── ReportsView.jsx        # Aggregate business intelligence reports
└── services/                      # API integration layer calling backend
    ├── api/apiClient.js           # Centralized fetch client
    ├── productService.js          # Product API calls
    ├── inventoryService.js        # Stock queries
    ├── salesService.js            # POS checkout API calls
    └── ...
```

---

# 4. Backend Explanation

### Core Technologies
- **Python 3.12+**: High-level, readable language chosen for rapid development and clean database driver support.
- **Flask 3.1**: Lightweight, un-opinionated Python web framework using the **Blueprint** pattern.
- **psycopg2-binary 2.9**: Fast, rock-solid PostgreSQL adapter for Python implementing the Python DB-API 2.0 specification.
- **python-dotenv**: Automatically loads database credentials from `.env` without hardcoding passwords.

### Backend Directory Layout
```
backend/
├── app.py                         # App factory, CORS, and blueprint registration
├── config.py                      # Environment config & database URL loading
├── db.py                          # Threaded connection pool & cursor context manager
├── requirements.txt               # Python package dependencies
├── schema.sql                     # Canonical DDL: 11 tables, 2 views, 1 trigger
├── routes/                        # Modular REST endpoints
│   ├── products.py                # /api/products
│   ├── categories.py              # /api/categories
│   ├── inventory.py               # /api/inventory
│   ├── purchases.py               # /api/purchases & /api/purchase-orders
│   ├── sales.py                   # /api/sales
│   ├── racks.py                   # /api/racks & /api/shelves
│   ├── suppliers.py               # /api/suppliers
│   ├── reports.py                 # /api/reports
│   └── dashboard.py               # /api/dashboard
├── services/
│   └── query_service.py           # Loads and executes raw .sql files with parameter binding
└── queries/                       # 11 Canonical SQL files executed by query_service
    ├── 01_product_search.sql
    ├── 02_low_stock.sql
    ├── 03_current_stock_location.sql
    ├── 04_stock_value_by_category.sql
    ├── 05_purchase_order_summary.sql
    ├── 06_sales_summary.sql
    ├── 07_supplier_products.sql
    ├── 08_insert_product.sql
    ├── 09_update_product.sql
    ├── 10_delete_product.sql
    └── 11_advanced_subqueries.sql
```

---

# 5. Flask REST API Explanation

The backend organizes endpoints using **Flask Blueprints**. Each blueprint represents an independent entity or feature:

| Method | Endpoint | Description | SQL Query / Action |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Checks database connectivity | `SELECT 1` ping |
| `GET` | `/api/products` | Search catalog with filters | Executes `01_product_search.sql` |
| `POST` | `/api/products` | Create a new SKU | Executes `08_insert_product.sql` |
| `PUT` | `/api/products/<id>` | Update price/stock/details | Executes `09_update_product.sql` |
| `DELETE` | `/api/products/<id>` | Soft-deactivates or deletes SKU | Executes `10_delete_product.sql` |
| `GET` | `/api/inventory` | Real-time physical inventory | Reads view `product_stock` |
| `GET` | `/api/inventory/low-stock` | Low-stock items needing reorder | Executes `02_low_stock.sql` |
| `GET` | `/api/locations` | Locate item by SKU or name | Executes `03_current_stock_location.sql` |
| `GET` | `/api/racks` | Warehouse racks and aisles | Queries `rack` & `shelf` |
| `POST` | `/api/purchases` | Create purchase order | Inserts `purchase_order` & `purchase_item` |
| `POST` | `/api/purchases/<id>/receive`| Mark order received | Updates status, credits stock |
| `POST` | `/api/sales` | Record customer sale | Inserts `sales_order` & `sales_item` |
| `GET` | `/api/reports/stock-value` | Valuation by category | Executes `04_stock_value_by_category.sql` |
| `GET` | `/api/reports/turnover` | Fast moving products report | Executes `11_advanced_subqueries.sql` |

---

# 6. Supabase PostgreSQL Explanation

### What is Supabase?
Supabase provides a hosted, enterprise-grade cloud **PostgreSQL** relational database. In this project, we connect to Supabase over standard PostgreSQL port `5432` using `psycopg2`.

### Why PostgreSQL over MySQL or SQLite?
1. **Strict Standards Compliance**: Full support for ACID transactions, CHECK constraints, and ANSI SQL.
2. **Advanced SQL Features**: Native support for schema views (`CREATE VIEW`), window functions, and PL/pgSQL stored procedures.
3. **Data Integrity**: Enforces strict Foreign Key rules (`ON DELETE RESTRICT`, `CASCADE`) and triggers.

---

# 7. Database Tables and Relationships

The schema consists of **11 tables** structured in 3NF (Third Normal Form):

| # | Table Name | Description | Cardinality Relationships |
| :--- | :--- | :--- | :--- |
| 1 | `employee` | System users, managers, and cashiers | 1 employee : N purchase orders, 1 employee : N sales |
| 2 | `category` | Product groupings (Electronics, Office, etc.) | 1 category : N products |
| 3 | `supplier` | Authorized merchandise vendors | 1 supplier : N purchase orders, M:N with products |
| 4 | `rack` | Physical warehouse racks in aisles | 1 rack : N shelves |
| 5 | `shelf` | Vertical tiers inside a physical rack | 1 shelf : N products |
| 6 | `product` | Catalog items, SKUs, and pricing | Belongs to 1 category and 1 shelf |
| 7 | `product_supplier` | Junction table for suppliers and products | M:N relationship with `supply_price` & `lead_time_days` |
| 8 | `purchase_order` | Inbound procurement order headers | 1 supplier, 1 employee, N line items |
| 9 | `purchase_item` | Junction table for PO line items | M:N between purchase orders and products |
| 10 | `sales_order` | Outbound customer checkout headers | 1 employee, 1 sale date, N line items |
| 11 | `sales_item` | Junction table for sales line items | M:N between sales orders and products |

---

# 8. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    EMPLOYEE ||--o{ PURCHASE_ORDER : "places"
    EMPLOYEE ||--o{ SALES_ORDER : "processes"
    CATEGORY ||--o{ PRODUCT : "classifies"
    SUPPLIER ||--o{ PURCHASE_ORDER : "supplies"
    SUPPLIER ||--o{ PRODUCT_SUPPLIER : "offers"
    PRODUCT ||--o{ PRODUCT_SUPPLIER : "supplied_by"
    RACK ||--o{ SHELF : "contains"
    SHELF ||--o{ PRODUCT : "stores"
    PURCHASE_ORDER ||--|{ PURCHASE_ITEM : "contains"
    PRODUCT ||--o{ PURCHASE_ITEM : "ordered_in"
    SALES_ORDER ||--|{ SALES_ITEM : "contains"
    PRODUCT ||--o{ SALES_ITEM : "sold_in"

    EMPLOYEE {
        int employee_id PK
        string full_name
        string email UK
        string role
        date hire_date
    }
    CATEGORY {
        int category_id PK
        string name UK
        text description
    }
    SUPPLIER {
        int supplier_id PK
        string name
        string contact_person
        string phone
        string email UK
    }
    RACK {
        int rack_id PK
        string rack_code UK
        string aisle
    }
    SHELF {
        int shelf_id PK
        int rack_id FK
        int shelf_number
    }
    PRODUCT {
        int product_id PK
        string sku UK
        string name
        int category_id FK
        int shelf_id FK
        decimal unit_price
        int reorder_level
        boolean is_active
    }
    PRODUCT_SUPPLIER {
        int product_id PK,FK
        int supplier_id PK,FK
        decimal supply_price
        int lead_time_days
    }
    PURCHASE_ORDER {
        int po_id PK
        int supplier_id FK
        int employee_id FK
        date order_date
        date received_date
        string status
    }
    PURCHASE_ITEM {
        int po_id PK,FK
        int product_id PK,FK
        int quantity
        decimal unit_cost
    }
    SALES_ORDER {
        int sale_id PK
        int employee_id FK
        string customer_name
        date sale_date
    }
    SALES_ITEM {
        int sale_id PK,FK
        int product_id PK,FK
        int quantity
        decimal unit_price
    }
```

---

# 9. Primary Keys, Foreign Keys, and Constraints

### Primary Keys (PK)
Uniquely identifies every row in a table.
- **Single-column PK**: `product_id`, `category_id`, `rack_id`, `shelf_id`, `supplier_id`, `employee_id`, `po_id`, `sale_id`.
- **Composite Primary Keys**:
  - `product_supplier`: Composite `(product_id, supplier_id)` ensures a supplier is not linked to the same product more than once.
  - `purchase_item`: Composite `(po_id, product_id)`.
  - `sales_item`: Composite `(sale_id, product_id)`.

### Foreign Keys (FK) and Referential Actions
1. **`shelf.rack_id -> rack.rack_id`**:
   - `ON UPDATE CASCADE ON DELETE CASCADE`: Deleting a rack removes its shelves automatically.
2. **`product.category_id -> category.category_id`**:
   - `ON DELETE RESTRICT`: Cannot delete a category if active products belong to it.
3. **`product.shelf_id -> shelf.shelf_id`**:
   - `ON DELETE SET NULL`: Deleting a shelf leaves the product unassigned rather than deleting the product.
4. **`purchase_order.supplier_id -> supplier.supplier_id`**:
   - `ON DELETE RESTRICT`: Historic procurement audit records cannot be corrupted.

### Check Constraints
- `CHECK (unit_price >= 0)`: Product retail price cannot be negative.
- `CHECK (reorder_level >= 0)`: Minimum stock safety threshold cannot be negative.
- `CHECK (quantity > 0)`: Line items must order or sell at least 1 unit.
- `CHECK (status IN ('Pending', 'Received', 'Cancelled'))`: Validates order states.
- `CHECK (received_date IS NULL OR received_date >= order_date)`: Chronological logic check.

---

# 10. SQL Queries Used

Every major feature in this application executes an exact SQL query matching typical college DBMS syllabus requirements:

### Query 1: Product Search & Filter (`01_product_search.sql`)
- **DBMS Concepts**: Multi-table INNER JOIN, ILIKE pattern matching, parameter binding (`$1, $2, $3`).
```sql
SELECT
    p.product_id, pl.sku, pl.name AS product_name, c.name AS category_name,
    pl.rack_code, pl.aisle, pl.shelf_number, pl.stock_quantity, pl.low_stock
FROM product_location pl
JOIN product p ON p.product_id = pl.product_id
JOIN category c ON c.category_id = p.category_id
WHERE ($3::boolean OR p.is_active = TRUE)
  AND ($1::text = '' OR pl.name ILIKE '%' || $1::text || '%' OR pl.sku ILIKE '%' || $1::text || '%')
  AND ($2::integer IS NULL OR p.category_id = $2::integer)
ORDER BY pl.name;
```

### Query 2: Low-Stock Shortfall Alert (`02_low_stock.sql`)
- **DBMS Concepts**: Computed column arithmetic (`reorder_level - stock_quantity AS shortfall`), boolean filtering.
```sql
SELECT
    ps.product_id, ps.sku, ps.name AS product_name,
    ps.stock_quantity, ps.reorder_level,
    ps.reorder_level - ps.stock_quantity AS shortfall
FROM product_stock ps
WHERE ($1::boolean OR ps.is_active = TRUE)
  AND ps.low_stock = TRUE
ORDER BY shortfall DESC, ps.name;
```

### Query 3: Stock Value by Category (`04_stock_value_by_category.sql`)
- **DBMS Concepts**: Aggregate functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`), `GROUP BY`, and `HAVING`.
```sql
SELECT
    c.category_id, c.name AS category_name,
    COUNT(ps.product_id) AS product_count,
    SUM(ps.stock_quantity) AS total_stock_units,
    ROUND(AVG(ps.unit_price), 2) AS avg_unit_price,
    MIN(ps.unit_price) AS min_price,
    MAX(ps.unit_price) AS max_price,
    SUM(ps.stock_quantity * ps.unit_price) AS total_stock_value
FROM category c
JOIN product_stock ps ON ps.category_id = c.category_id
WHERE ($1::boolean OR ps.is_active = TRUE)
GROUP BY c.category_id, c.name
HAVING COUNT(ps.product_id) > 0
ORDER BY total_stock_value DESC;
```

### Query 4: Sales Revenue Summaries (`06_sales_summary.sql`)
- **DBMS Concepts**: Grouping by Date, Product, and Employee across orders and items.
```sql
SELECT
    so.sale_date,
    COUNT(DISTINCT so.sale_id) AS number_of_sales,
    SUM(si.quantity) AS items_sold,
    SUM(si.quantity * si.unit_price) AS total_sales
FROM sales_order so
JOIN sales_item si ON si.sale_id = so.sale_id
WHERE ($1::date IS NULL OR so.sale_date >= $1::date)
  AND ($2::date IS NULL OR so.sale_date <= $2::date)
GROUP BY so.sale_date
ORDER BY so.sale_date;
```

### Query 5: Advanced Subqueries (`11_advanced_subqueries.sql`)
- **DBMS Concepts**: Scalar Subquery and `IN` Subquery.
```sql
-- Scalar Subquery: Products priced above catalog average
SELECT p.product_id, p.sku, p.product_name, p.unit_price
FROM product p
WHERE p.is_active = TRUE
  AND p.unit_price > (SELECT AVG(unit_price) FROM product WHERE is_active = TRUE)
ORDER BY p.unit_price DESC;

-- IN Subquery: Suppliers with active products
SELECT s.supplier_id, s.supplier_name, s.contact_person
FROM supplier s
WHERE s.supplier_id IN (
    SELECT DISTINCT ps.supplier_id 
    FROM product_supplier ps 
    JOIN product p ON p.product_id = ps.product_id 
    WHERE p.is_active = TRUE
);
```

---

# 11. CRUD Operations Breakdown

Every core entity in the database supports complete **C-R-U-D** (Create, Read, Update, Delete) operations:

### 1. Products CRUD
- **Create**: Inserts new row with generated `product_id`, links `category_id` and `shelf_id`.
- **Read**: Filtered query over `product_location` view.
- **Update**: Modifies `name`, `unit_price`, `reorder_level`, or assigned `shelf_id`.
- **Delete**: Soft-delete via `is_active = FALSE` if referenced in historical sales; hard delete if never sold.

### 2. Categories CRUD
- **Create**: Inserts new category name and description.
- **Read**: Queries all categories ordered alphabetically.
- **Update**: Modifies category name or description.
- **Delete**: Protected by `ON DELETE RESTRICT`—cannot delete if products exist.

### 3. Racks & Shelves CRUD
- **Create**: Inserts physical rack code and aisle; bulk generates numbered shelves.
- **Read**: Selects rack cards with vertical shelf tier breakdown.
- **Update**: Renames rack code or changes aisle assignment.
- **Delete**: Cascade deletes empty shelves; blocks if products are actively stored.

### 4. Sales & POS Checkout
- **Create**: Inserts `sales_order` header and child rows in `sales_item`.
- **Read**: Retrieves ledger with receipt numbers, date filters, and revenue.
- **Delete Protection**: Sales orders are permanent financial records; deletion is blocked to preserve inventory accounting.

---

# 12. Joins and Subqueries

### Joins Used
1. **INNER JOIN**: Returns rows with matches in both tables (e.g., `product JOIN category ON product.category_id = category.category_id`).
2. **LEFT OUTER JOIN**: Preserves all rows from the primary table even if no match exists (e.g., `product LEFT JOIN shelf ON product.shelf_id = shelf.shelf_id` ensures unassigned products are still listed).

### Subqueries Used
1. **Scalar Subquery**: Returns a single value to compare against:
   `SELECT AVG(unit_price) FROM product;`
2. **Correlated / IN Subquery**: Filters outer rows based on a nested query's result set:
   `WHERE supplier_id IN (SELECT DISTINCT supplier_id FROM product_supplier);`
3. **Derived Table (FROM clause subquery)**: Aggregates total received stock inside a subquery before joining to products.

---

# 13. Database Views

A **View** is a saved, named `SELECT` query stored in the database dictionary. It acts as a virtual table without duplicating data.

### View 1: `product_stock`
Calculates dynamic stock quantity on the fly by subtracting total units sold from total units received:
```sql
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
```
**Why this is superior**: We never store `stock_count` as a static integer in `product`. Static integers easily go out of sync. Using a view guarantees the stock count is always 100% accurate based on audit records.

### View 2: `product_location`
Joins `product_stock` with `shelf` and `rack` to provide physical coordinates (Aisle, Rack, Shelf Tier) alongside live stock counts.

---

# 14. Transactions & ACID Properties

A **Database Transaction** is a sequence of one or more SQL statements executed as a single, atomic unit of work.

### Example in this Project: Sales Checkout
When a customer buys items:
1. An order header is inserted into `sales_order`.
2. Multiple item records are inserted into `sales_item`.
3. The database trigger verifies stock availability.

If line item 2 fails (e.g., insufficient stock), the **ENTIRE transaction rolls back** so that order header 1 is never saved.

### The ACID Properties in RackMaster
- **Atomicity ("All or Nothing")**: In `create_sale_transaction()` and `create_purchase_order()`, either all order headers and items are saved, or none are.
- **Consistency**: The database trigger `fn_check_stock_before_sale` rejects transactions that would drive stock below zero.
- **Isolation**: Concurrent checkouts do not interfere with each other thanks to PostgreSQL transaction isolation levels.
- **Durability**: Once a transaction is committed, changes are written to Write-Ahead Logs (WAL) on disk and survive server restarts.

---

# 15. Frontend-to-Backend Communication

1. **User Action**: The user clicks **"Record Sale"** in the UI.
2. **React State**: `RecordSaleModal.jsx` collects `quantity`, `sold_price`, and `payment_method`.
3. **Service Call**: `recordSale()` in `salesService.js` prepares a JSON payload.
4. **HTTP Dispatch**: `fetch('/api/sales', { method: 'POST', body: JSON.stringify(...) })` is sent.
5. **Vite Proxy**: In local development, Vite proxies `/api/*` requests to `http://127.0.0.1:5000`.
6. **Flask Route**: `sales_bp` in `backend/routes/sales.py` receives the request and validates inputs.
7. **Database Execution**: `create_sale_transaction()` in `query_service.py` executes inside a psycopg2 transaction block.
8. **JSON Response**: Flask returns `{ success: true, data: { sale_id: 304, ... } }`.
9. **UI Refresh**: React receives the response, shows a success toast, and refreshes the inventory view.

---

# 16. Complete Local Execution Workflow

### Step 1: Open Project in VS Code
Open your VS Code terminal (`Ctrl + ~`) in the project directory:
```bash
cd "C:\Users\avadh\Downloads\DBMS project"
```

### Step 2: Ensure Environment File Exists
Make sure `backend/.env` contains your Supabase PostgreSQL connection string:
```ini
DATABASE_URL=postgresql://postgres.xxx:xxx@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
PORT=5000
DEBUG=True
```

### Step 3: Start the Application with ONE Command
```bash
npm run dev
```

### What happens when you run `npm run dev`:
1. `concurrently` starts both processes simultaneously:
   - `python backend/app.py` runs the Flask API on `http://127.0.0.1:5000`.
   - `vite` runs the React frontend on `http://localhost:5173`.
2. Open your web browser to **`http://localhost:5173`**.
3. To stop both servers at any time, simply press **`Ctrl + C`** in your VS Code terminal.

---

# 17. Important Code Explanations

### 1. Database Connection Pool (`backend/db.py`)
```python
# Creates a pool of reusable connections to avoid reconnecting on every request
_connection_pool = psycopg2.pool.ThreadedConnectionPool(
    minconn=1,
    maxconn=10,
    dsn=Config.DATABASE_URL
)

@contextmanager
def get_db_cursor(commit=False):
    conn = _connection_pool.getconn()
    try:
        # RealDictCursor returns rows as Python dictionaries: row['product_name']
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            yield cursor
        if commit:
            conn.commit()
    except Exception:
        conn.rollback() # Automatically rolls back if an error occurs
        raise
    finally:
        _connection_pool.putconn(conn) # Returns connection to pool
```

### 2. Auto-Generating Sequential IDs (`backend/services/query_service.py`)
```python
# Calculates next ID safely for tables without an auto-incrementing serial sequence
cursor.execute("SELECT COALESCE(MAX(sale_id), 300) + 1 AS next_id FROM sales_order;")
sale_id = cursor.fetchone()['next_id']

cursor.execute(
    """
    INSERT INTO sales_order (sale_id, employee_id, sale_date)
    VALUES (%s, %s, CURRENT_DATE)
    RETURNING sale_id, employee_id, sale_date;
    """,
    (sale_id, employee_id)
)
```

### 3. Parameterized Query Execution
```python
# NEVER use f-strings or string concatenation for user inputs!
# Passing params as a tuple ensures psycopg2 binds them safely against SQL Injection:
cursor.execute(
    "SELECT * FROM product WHERE product_id = %s AND is_active = %s;",
    (product_id, True)
)
```

---

# 18. 55 Potential Viva Questions and Answers

### Category 1: Project Overview & Architecture
**Q1: What is the title and objective of your project?**
> **A:** The project is a Retail Inventory & Rack Management System (RackMaster). Its objective is to manage retail product stock counts and map each item to a physical warehouse location (Aisle, Rack, Shelf Tier) with real-time stock deduction and sales tracking.

**Q2: What architecture did you use in this project?**
> **A:** A 3-Tier Client-Server Architecture: Frontend (React 19 + Tailwind CSS), Application Server (Python Flask REST API), and Database Tier (Supabase PostgreSQL).

**Q3: Why did you separate the frontend and backend into two layers?**
> **A:** For security, separation of concerns, and scalability. Frontend code runs in the user's browser and should never store database passwords or run raw SQL directly. The backend validates requests and manages database connections securely.

**Q4: How does the frontend communicate with the backend?**
> **A:** Via HTTP REST requests exchanging JSON data. The frontend sends requests using the browser `fetch` API, and Flask returns JSON responses using `jsonify()`.

**Q5: What web port does each service run on locally?**
> **A:** The React/Vite development server runs on port `5173`, and the Flask backend runs on port `5000`.

**Q6: What is Vite and why did you use it over Create React App (CRA)?**
> **A:** Vite is a modern frontend build tool that uses native ES modules. It provides near-instant server startup and Hot Module Replacement (HMR), making it much faster than older webpack-based CRA setups.

**Q7: How do you start both frontend and backend simultaneously?**
> **A:** Using `npm run dev`, which runs `concurrently` to launch `python backend/app.py` and `vite` in a single terminal.

**Q8: What is CORS and how did you handle it?**
> **A:** Cross-Origin Resource Sharing (CORS) is a browser security mechanism that blocks web pages from making requests to a different domain or port. We used `flask-cors` in Flask to allow requests from `http://localhost:5173`.

---

### Category 2: Relational Database & PostgreSQL
**Q9: What is a DBMS?**
> **A:** A Database Management System is software that allows users to create, define, maintain, and control access to structured data.

**Q10: What is an RDBMS and why is PostgreSQL classified as one?**
> **A:** A Relational DBMS stores data in tables consisting of rows and columns, enforcing mathematical relations through Primary Keys and Foreign Keys. PostgreSQL is an advanced object-relational database.

**Q11: What is Supabase?**
> **A:** Supabase is an open-source cloud platform that provides a managed, hosted PostgreSQL database with high availability and connection pooling.

**Q12: What is Normalization? Which normal form is your schema in?**
> **A:** Normalization is the process of organizing tables to eliminate data redundancy and prevent insert/update/delete anomalies. Our database is in **Third Normal Form (3NF)** because all attributes depend only on the primary key, and there are no transitive dependencies.

**Q13: What is the difference between DDL and DML?**
> **A:** 
> - **DDL (Data Definition Language)** defines table structures (`CREATE`, `ALTER`, `DROP`).
> - **DML (Data Manipulation Language)** handles data manipulation (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).

**Q14: What is the difference between `CHAR` and `VARCHAR`?**
> **A:** `CHAR(n)` is fixed-length and pads empty spaces with whitespace; `VARCHAR(n)` is variable-length and only stores the actual characters entered.

**Q15: Why did you use `NUMERIC(10,2)` for prices instead of `FLOAT`?**
> **A:** `FLOAT` uses binary floating-point representation which causes rounding inaccuracies (e.g., `0.1 + 0.2 = 0.30000000000000004`). `NUMERIC` stores exact decimal values essential for monetary transactions.

**Q16: What is a Connection Pool?**
> **A:** A cache of reusable database connections. Instead of opening a new TCP connection on every HTTP request (which is slow), `psycopg2.pool.ThreadedConnectionPool` lends an existing connection and reclaims it when the query finishes.

---

### Category 3: Keys, Constraints & Relationships
**Q17: What is a Primary Key?**
> **A:** A column (or set of columns) that uniquely identifies each record in a table. It cannot contain `NULL` values and must be unique.

**Q18: What is a Foreign Key?**
> **A:** A column in a child table that refers to the Primary Key of a parent table, establishing a relationship and enforcing referential integrity.

**Q19: What is a Composite Primary Key? Give an example from your project.**
> **A:** A primary key made up of two or more columns. In our project, `product_supplier` uses `(product_id, supplier_id)`, `purchase_item` uses `(po_id, product_id)`, and `sales_item` uses `(sale_id, product_id)`.

**Q20: What is the purpose of `CHECK` constraints?**
> **A:** To validate that data entered into a column meets specific business rules before being accepted (e.g., `CHECK (unit_price >= 0)` or `CHECK (quantity > 0)`).

**Q21: What is the difference between `UNIQUE` and `PRIMARY KEY`?**
> **A:** A table can have only one Primary Key, and it cannot accept `NULL` values. A table can have multiple `UNIQUE` constraints, and they can accept `NULL` (unless explicitly defined `NOT NULL`).

**Q22: Explain the relationship between Racks and Shelves.**
> **A:** It is a One-to-Many (1:N) relationship. One physical rack contains multiple vertical shelves. `shelf.rack_id` is a Foreign Key referencing `rack.rack_id`.

**Q23: Explain the relationship between Products and Suppliers.**
> **A:** It is a Many-to-Many (M:N) relationship. One supplier supplies many products, and one product can be sourced from multiple suppliers. It is resolved using the junction table `product_supplier`.

**Q24: What is referential integrity? What happens when a category is deleted?**
> **A:** Referential integrity ensures relationships between tables remain valid. In our schema, `product.category_id` has `ON DELETE RESTRICT`. If a user attempts to delete a category that still has products, PostgreSQL rejects the deletion.

---

### Category 4: Joins, Aggregations & Subqueries
**Q25: What is an INNER JOIN?**
> **A:** It returns records that have matching values in both tables. If a product has no matching category, it is omitted.

**Q26: What is a LEFT OUTER JOIN? Why is it used in the shelf lookup?**
> **A:** It returns all records from the left table, and matched records from the right table (or `NULL` if no match). We use `product LEFT JOIN shelf` so that newly created products without an assigned shelf still appear in catalog searches.

**Q27: What is the difference between `WHERE` and `HAVING`?**
> **A:** `WHERE` filters individual rows **before** grouping occurs; `HAVING` filters aggregated groups **after** the `GROUP BY` clause has been evaluated.

**Q28: Give an example of `HAVING` from your project.**
> **A:** In `04_stock_value_by_category.sql`, we write:
> `GROUP BY c.category_id, c.name HAVING COUNT(ps.product_id) > 0;`
> This excludes empty categories with zero products from the stock valuation report.

**Q29: What are aggregate functions? Name five used in your project.**
> **A:** Functions that perform calculations on a set of rows and return a single summary value: `COUNT()`, `SUM()`, `AVG()`, `MIN()`, and `MAX()`.

**Q30: What is a Subquery?**
> **A:** A query nested inside another query (e.g., inside a `WHERE`, `FROM`, or `SELECT` clause).

**Q31: What is a Scalar Subquery?**
> **A:** A subquery that returns exactly one row and one column (a single scalar value). In `11_advanced_subqueries.sql`, `(SELECT AVG(unit_price) FROM product)` calculates the catalog average price to compare against each item.

**Q32: What is the `ILIKE` operator in PostgreSQL?**
> **A:** `ILIKE` is PostgreSQL's case-insensitive pattern matching operator (`LIKE` is case-sensitive). We use `ILIKE '%' || $1 || '%'` to allow searching for "mouse" and finding "Wireless Mouse".

---

### Category 5: Database Views & Triggers
**Q33: What is a Database View?**
> **A:** A view is a virtual table based on the result-set of an SQL statement. It contains no physical data of its own; instead, the database runs the view query dynamically whenever the view is queried.

**Q34: How is stock quantity calculated in your project?**
> **A:** It is dynamically computed in the view `product_stock`:
> `stock_quantity = Total Units Received from Received POs - Total Units Sold from Sales Items`.

**Q35: Why not simply add a `quantity` integer column inside the `product` table?**
> **A:** Storing stock as a static integer causes data redundancy and leads to synchronization bugs if a sale or purchase order is modified or rolled back. Deriving stock from audit receipts guarantees 100% mathematical accuracy.

**Q36: What is a Database Trigger?**
> **A:** A special stored procedure that automatically executes (fires) when a specified database event (such as `INSERT`, `UPDATE`, or `DELETE`) occurs on a table.

**Q37: What does the trigger `trg_check_stock_before_sale` do?**
> **A:** It fires `BEFORE INSERT OR UPDATE ON sales_item`. It calculates the available stock and raises an exception if `requested_quantity > available_stock`, preventing negative inventory.

**Q38: What is PL/pgSQL?**
> **A:** Procedural Language for PostgreSQL. It extends SQL with procedural capabilities like `IF/THEN/ELSE`, variables, loops, and custom error raising (`RAISE EXCEPTION`).

---

### Category 6: Transactions & ACID
**Q39: What is a Transaction?**
> **A:** A logical unit of work comprising one or more SQL statements that must either all succeed or all fail together.

**Q40: Explain the "A" in ACID (Atomicity).**
> **A:** "All or Nothing". When recording a sale, if inserting the sale items fails, the sale order header is rolled back completely.

**Q41: Explain the "C" in ACID (Consistency).**
> **A:** A transaction brings the database from one valid state to another, maintaining all constraints, triggers, and foreign keys.

**Q42: Explain the "I" in ACID (Isolation).**
> **A:** Ensures that concurrent transactions do not interfere with or see uncommitted changes from other transactions.

**Q43: Explain the "D" in ACID (Durability).**
> **A:** Once a transaction commits, its changes are permanently recorded in non-volatile storage and will survive crashes or power failures.

**Q44: What is the difference between `COMMIT` and `ROLLBACK`?**
> **A:** `COMMIT` permanently saves all transaction changes; `ROLLBACK` cancels all changes made during the current uncommitted transaction.

---

### Category 7: Flask API & Security
**Q45: What is a Flask Blueprint?**
> **A:** A way to organize Flask applications into smaller, independent modules (e.g., separating product routes from sales routes) rather than writing all endpoints in one file.

**Q46: What is SQL Injection? How does your project prevent it?**
> **A:** An attack where malicious SQL code is injected into input fields to manipulate database queries. Our project prevents it by using **parameterized queries** through `psycopg2` (`%s` placeholders), where user inputs are treated strictly as data literals, never executable SQL.

**Q47: Why do you keep database passwords in a `.env` file?**
> **A:** To prevent sensitive credentials from being committed to public version control (GitHub). The `.env` file is listed in `.gitignore`.

**Q48: What does HTTP Status Code `200` vs `201` mean?**
> **A:** `200 OK` indicates a successful standard request; `201 Created` indicates that a new resource (e.g., a new product or purchase order) was successfully created.

**Q49: What does HTTP Status Code `400` vs `500` mean?**
> **A:** `400 Bad Request` indicates client-side validation errors (e.g., negative prices); `500 Internal Server Error` indicates an unexpected server or database crash.

**Q50: What is JSON?**
> **A:** JavaScript Object Notation—a lightweight, human-readable text format used for data interchange between browser clients and servers.

---

### Category 8: React Frontend & Integration
**Q51: What is a React Hook? Name the two primary hooks used.**
> **A:** Functions that let functional components hook into React state and lifecycle features. The two primary hooks used are:
> 1. `useState`: Holds component-level state (e.g., search text, active modals).
> 2. `useEffect`: Performs side effects, such as fetching data from the API when the component mounts or filters change.

**Q52: What is the purpose of `e.stopPropagation()` in modals?**
> **A:** It stops a mouse click or touch event from bubbling up to the backdrop, preventing the modal from closing prematurely when the user taps inside the form.

**Q53: How does the "Record Sale" feature calculate profit in real time?**
> **A:** As the user adjusts units or sold price, React recalculates:
> `Realized Profit = (Sold Price - Wholesale Cost Basis) * Units Sold`.

**Q54: What is `npm`?**
> **A:** Node Package Manager—a package manager and dependency registry for JavaScript libraries used to install React, Tailwind, and Vite.

**Q55: What is the purpose of the SQL Inspector modal in the UI?**
> **A:** It displays the exact, underlying parameterized SQL query matching the current active view, allowing examiners and students to inspect the database query directly while viewing live data.

---

### Summary Checklist for Evaluation Day
- [x] Run `npm run dev` in the project root.
- [x] Verify browser opens at `http://localhost:5173`.
- [x] Verify status pill in header displays **"Supabase PostgreSQL: Connected"**.
- [x] Open **Product Catalog** and test adding/editing an item.
- [x] Open **Store Inventory** and test **Record Sale** (observe profit margin banner).
- [x] Click the **"SQL Query"** button on any view to display the query to the examiner.
- [x] Explain the 3-Tier architecture and ER diagram confidently!
