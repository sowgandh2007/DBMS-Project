# 🗄️ SQL Queries & Database Integration Architecture

This folder contains the complete, production-grade SQL queries for the **Retail Inventory and Rack Management System**.

## 📌 Architecture Overview

```
┌─────────────────────────────────┐
│     React + Vite Frontend       │  <-- (This Project Template)
│  (UI Components & User Inputs)  │
└────────────────┬────────────────┘
                 │ HTTP Requests (JSON: filters, IDs, search text)
                 ▼
┌─────────────────────────────────┐
│   Backend / REST API Layer      │  <-- (Your Node.js / Python / Java backend)
│  (Parameterized SQL Execution)  │
└────────────────┬────────────────┘
                 │ Parameterized SQL Queries ($1, $2 or :param)
                 ▼
┌─────────────────────────────────┐
│      Relational Database        │  <-- (MySQL / PostgreSQL / SQLite)
│  Base Tables + Standard Views   │
│ (`product_stock`, `locations`)  │
└─────────────────────────────────┘
```

> [!IMPORTANT]
> **Security Rule**: The browser NEVER connects directly to the database or runs raw SQL strings. All user inputs from the UI forms are sent via HTTP API calls (e.g. `POST /api/products/search`) and executed using parameterized queries (`?`, `:param`, or `$1`) on your backend server.

---

## 📂 Query Files by Feature

| SQL File | Associated Frontend Page | Corresponding Service | Views / Tables Used |
| :--- | :--- | :--- | :--- |
| [`schema_reference.sql`](./schema_reference.sql) | Global Database Architecture | None (DDL) | Base tables + Canonical views |
| [`dashboard.sql`](./dashboard.sql) | Dashboard Overview | `src/services/dashboardService.js` | `product_stock`, `racks`, `sales` |
| [`products.sql`](./products.sql) | Product Search & Catalog | `src/services/productService.js` | `products`, `suppliers`, `product_stock` |
| [`inventory.sql`](./inventory.sql) | Store Inventory | `src/services/inventoryService.js` | **`product_stock` View** |
| [`locations.sql`](./locations.sql) | Inventory / Location Finder | `src/services/locationService.js` | **`product_location` View** |
| [`racks_shelves.sql`](./racks_shelves.sql) | Racks & Shelves Visualizer | `src/services/rackService.js` | `racks`, `shelves`, `product_rack_placement` |
| [`suppliers.sql`](./suppliers.sql) | Suppliers Directory | `src/services/supplierService.js` | `suppliers`, `products`, `purchase_orders` |
| [`purchase_orders.sql`](./purchase_orders.sql) | Purchase Orders & Receiving | `src/services/purchaseOrderService.js` | `purchase_orders`, `purchase_order_items`, `racks` |
| [`sales.sql`](./sales.sql) | Sales Counter & Sales Log | `src/services/salesService.js` | `sales`, `sale_items`, `product_rack_placement` |
| [`low_stock.sql`](./low_stock.sql) | Low-Stock Alerts | `src/services/alertService.js` | **`product_stock` View** |
| [`reports.sql`](./reports.sql) | Reports & Analytics | `src/services/reportService.js` | `product_stock`, `racks`, `sales` |

---

## 🔍 Canonical Views (No Redundancy Rule)

Per project specifications, this system strictly uses two existing views without creating redundant stock or location calculations:

1. **`product_stock` View**:
   - Calculates on-hand total stock by summing units across all shelf placements.
   - Computes `stock_status` (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`) and `stock_deficit`.
   - Used in `inventory.sql`, `low_stock.sql`, `dashboard.sql`, and `reports.sql`.

2. **`product_location` View**:
   - Joins products with racks, aisles, zones, and shelf levels.
   - Calculates shelf capacity and occupancy percentage.
   - Used in `locations.sql` and the interactive Rack visualizer.

---

## 🛠️ How to Connect Your Backend

1. In `src/services/api/apiClient.js`, update `API_BASE_URL` to point to your backend server (e.g. `http://localhost:5000/api`).
2. Set `const USE_MOCK_DATA = false;` in `src/services/api/apiClient.js` (or toggle it via the onscreen Mode pill in the header).
3. In each service file under `src/services/`, replace the mock response with the indicated `apiClient` call.
