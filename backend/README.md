# Retail Inventory and Rack Management System — Backend API

Backend REST API for the **Retail Inventory and Rack Management System** built with **Python Flask** and **Supabase PostgreSQL**.

---

## 1. Architectural Highlights

- **Strict SQL Preservation**: All 7 parameterized SQL query files in `backend/queries/` are kept 100% untouched and executed directly.
- **Safe Parameter Binding**: Positional placeholders (`$1`, `$2`, etc.) are mapped to named parameter dictionaries (`%(_p_N)s`) via Python driver adapter layer (`query_service.py`). No string concatenation or SQL injection risks.
- **Database Business Rules Preserved**:
  - Stock is derived automatically via the canonical `product_stock` view (`received units - sold units`).
  - Only purchase orders with status `'Received'` contribute to stock.
  - Sales checkout enforces the PostgreSQL database trigger `trg_check_stock_before_sale`, which rejects sales where requested quantity exceeds available stock.
- **Multi-statement Execution**: Statement A (date), Statement B (product turnover), and Statement C (employee performance) in `06_sales_summary.sql` are parsed and executed individually per client request.
- **Resilient Frontend Fallback**: When live database credentials are missing or the database is offline, frontend views seamlessly display sample preview data with clear indicators.

---

## 2. Directory Structure

```text
backend/
├── app.py                     # Flask entry point, CORS, blueprint registration, health check
├── config.py                  # Environment config and database settings
├── db.py                      # psycopg2 direct connection pool and cursor context managers
├── requirements.txt           # Python dependencies
├── .env.example               # Template environment variables
├── .gitignore                 # Git ignore for local environment files and caches
├── routes/
│   ├── products.py            # GET /api/products -> 01_product_search.sql
│   ├── inventory.py           # GET /api/inventory -> 03_current_stock_location.sql & GET /api/inventory/low-stock -> 02_low_stock.sql
│   ├── purchases.py           # GET /api/purchases -> 05_purchase_order_summary.sql & POST /api/purchases/:id/receive
│   ├── sales.py               # GET /api/reports/sales -> 06_sales_summary.sql & POST /api/sales (trigger enforced)
│   ├── suppliers.py           # GET /api/suppliers -> 07_supplier_products.sql & GET /api/suppliers/list
│   ├── reports.py             # GET /api/reports/stock-value -> 04_stock_value_by_category.sql
│   └── dashboard.py           # GET /api/dashboard/stats, margin-chart, recent-activity
├── services/
│   └── query_service.py       # Query file loader, parameter adapter, SQL executors
├── queries/                   # Canonical SQL query files (100% UNTOUCHED)
│   ├── 01_product_search.sql
│   ├── 02_low_stock.sql
│   ├── 03_current_stock_location.sql
│   ├── 04_stock_value_by_category.sql
│   ├── 05_purchase_order_summary.sql
│   ├── 06_sales_summary.sql
│   └── 07_supplier_products.sql
├── schema.sql                 # Reference PostgreSQL schema DDL (11 tables, 2 views, 1 trigger)
└── tests/
    └── test_backend.py        # Pytest test suite (6 automated tests)
```

---

## 3. How to Setup and Run

### Step 1: Install Python Dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 2: Configure Supabase Connection
1. In your **Supabase Dashboard**, navigate to **Project Settings** -> **Database**.
2. Locate the **Connection string** section and select the **URI** tab (Transaction or Session pooler).
3. Copy the URI (format: `postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`).
4. Copy `backend/.env.example` to `backend/.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```
5. Set your `DATABASE_URL` in `backend/.env`:
   ```ini
   DATABASE_URL=postgresql://postgres.yourprojectref:yourpassword@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require
   PORT=5000
   ```

### Step 3: Initialize Database Schema (First-Time Only)
In your Supabase SQL Editor, run `backend/schema.sql` to create the 11 tables, 2 views (`product_stock`, `product_location`), and the stock validation trigger `trg_check_stock_before_sale`.

### Step 4: Start the Flask Backend Server
```bash
python backend/app.py
```
The server will start on `http://localhost:5000`.

### Step 5: Start the React Frontend
In a separate terminal:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser. Use the header toggle to switch between **Live Backend** and **Mock Preview**.

---

## 4. API Endpoints Reference

### 1. Product Search
- **Endpoint**: `GET /api/products`
- **Executes**: `01_product_search.sql`
- **Query Parameters**:
  - `search` (string): Text filter matching name or SKU (`$1`)
  - `category_id` (integer): Filter by category ID (`$2`)
  - `include_inactive` (boolean): Default `false` (`$3`)
- **Example Response**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "product_id": 1,
        "sku": "SKU-BAS-001",
        "product_name": "Premium Basmati Rice 5kg",
        "category_name": "Grocery & Staples",
        "rack_code": "A1",
        "aisle": "01",
        "shelf_number": 2,
        "stock_quantity": 45,
        "low_stock": false
      }
    ]
  }
  ```

### 2. Low-Stock Products
- **Endpoint**: `GET /api/inventory/low-stock` or `GET /api/alerts/low-stock`
- **Executes**: `02_low_stock.sql`
- **Query Parameters**:
  - `include_inactive` (boolean): Default `false` (`$1`)
- **Example Response**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "product_id": 4,
        "sku": "SKU-DAI-004",
        "product_name": "Greek Yogurt Plain 400g",
        "stock_quantity": 4,
        "reorder_level": 15,
        "shortfall": 11
      }
    ]
  }
  ```

### 3. Current Stock and Location
- **Endpoint**: `GET /api/inventory` or `GET /api/inventory/locations`
- **Executes**: `03_current_stock_location.sql`
- **Query Parameters**:
  - `include_inactive` (boolean): Default `false` (`$1`)
- **Features**: Preserves `LEFT JOIN`s from the view so products without assigned shelves remain visible.

### 4. Stock Value by Category
- **Endpoint**: `GET /api/reports/stock-value`
- **Executes**: `04_stock_value_by_category.sql`
- **Query Parameters**:
  - `include_inactive` (boolean): Default `false` (`$1`)
- **Example Response**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "category_id": 1,
        "category_name": "Grocery & Staples",
        "product_count": 8,
        "total_stock_units": 420,
        "total_stock_value": 85400.00
      }
    ]
  }
  ```

### 5. Purchase Order Summary
- **Endpoint**: `GET /api/purchases` or `GET /api/reports/purchases`
- **Executes**: `05_purchase_order_summary.sql`
- **Query Parameters**:
  - `status` (string, optional): `'Pending'`, `'Received'`, `'Cancelled'` (`$1`)
  - `supplier_id` (integer, optional): Filter by supplier ID (`$2`)
  - `start_date` (date string YYYY-MM-DD, optional): Lower order date bound (`$3`)
  - `end_date` (date string YYYY-MM-DD, optional): Upper order date bound (`$4`)

### 6. Sales Summaries
- **Endpoint**: `GET /api/reports/sales` or `GET /api/sales`
- **Executes**: `06_sales_summary.sql` (single requested statement)
- **Query Parameters**:
  - `group_by`: `'date'` (Statement A), `'product'` (Statement B), or `'employee'` (Statement C)
  - `start_date` (date string YYYY-MM-DD, optional) (`$1`)
  - `end_date` (date string YYYY-MM-DD, optional) (`$2`)

### 7. Supplier Products
- **Endpoint**: `GET /api/suppliers` or `GET /api/reports/suppliers`
- **Executes**: `07_supplier_products.sql`
- **Query Parameters**:
  - `supplier_id` (integer, optional): Filter by supplier ID (`$1`)
  - `search` / `product_search` (string, optional): Product name or SKU filter (`$2`)

### 8. POS Checkout Transaction
- **Endpoint**: `POST /api/sales`
- **Enforces**: Database trigger `fn_check_stock_before_sale()`.
- **Payload**:
  ```json
  {
    "employee_id": 1,
    "customer_name": "Aarav Sharma",
    "items": [
      { "product_id": 1, "quantity": 2, "unit_price": 495.00 }
    ]
  }
  ```
- **Error Response When Stock Insufficient**:
  ```json
  {
    "success": false,
    "error": "Stock Validation Trigger Rejection",
    "message": "Insufficient stock for product_id 1: requested 100, available 45"
  }
  ```

### 9. Receive Purchase Order
- **Endpoint**: `POST /api/purchases/<po_id>/receive`
- **Business Rule**: Updates status to `'Received'` and `received_date = CURRENT_DATE`. Units immediately appear in `product_stock`.

---

## 5. Running Automated Tests

Run the test suite with `pytest`:
```bash
pytest backend/tests -v
```

All 6 unit and integration tests pass cleanly.
