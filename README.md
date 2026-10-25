# 🛒 RackMaster — Retail Inventory & Rack Management System

A modern, responsive, professional **Retail Inventory and Rack Management System** frontend template inspired by the dark dashboard aesthetic of `sowgandh.vercel.app` (Stockly Admin).

Built with **React + Vite + Tailwind CSS + Lucide Icons**.

> [!IMPORTANT]
> **DBMS Integration Notice**: This project is built as a clean, decoupled **frontend template** with a complete visual preview using realistic mock data. **No SQL queries or database connections are run directly inside the browser.** All parameterized queries are cleanly organized in the `queries/` folder for you to execute through your backend API server.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Vite Dev Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎯 Features & Pages

| Feature | Navigation Label | Description |
| :--- | :--- | :--- |
| **Executive Dashboard** | `Dashboard Overview` | Real-time inventory valuation, gross profit yield, rack occupancy %, high-margin items widget, and recent activity audit stream. |
| **Store Inventory** | `Store Inventory` | Search and audit on-hand stock counts, selling prices, and projected profit margins powered by view `product_stock`. |
| **Product Search** | `Product Catalog` | Search items by SKU/name, filter by category, stock status, and price thresholds, with an "Add Product" modal. |
| **Location Finder** | `Rack Location Finder` | Physical warehouse coordinate lookup (Aisle, Rack, Shelf Level) with shelf reassign modal powered by view `product_location`. |
| **Racks & Shelves** | `Racks & Shelves` | Interactive warehouse floor plan, visual rack occupancy bars (<70%, 70-90%, >90%), and vertical shelf tier inspector. |
| **Low-Stock Alerts** | `Low-Stock Alerts` | Threshold monitoring, deficit units count, automated reorder suggestions, and 1-click PO generator powered by view `product_stock`. |
| **Suppliers Directory** | `Suppliers Directory` | Vendor profiles, contact cards, supplied catalog items, and procurement spend totals. |
| **Purchase Orders** | `Purchase Orders` | Procurement tracking, dynamic line-item order creator, and receiving shipments directly into target rack shelves. |
| **Sales & POS Billing** | `Sales & Billing POS` | Fast Point-of-Sale checkout terminal (cart, tax, discount, UPI/Card/Cash) and sales audit log with realized gross profit tracking. |
| **Reports & Analytics** | `Reports & Analytics` | Category inventory valuation, aisle space utilization, and fast-moving turnover reports with CSV export placeholder. |
| **SQL & Query Hub** | `SQL & Query Hub` | Developer handbook with an interactive SQL code viewer, parameter mapping table, and database connection instructions. |

---

## 🗄️ Central `queries/` Folder Structure

All SQL queries are organized by feature and parameterized to prevent SQL injection:

```
queries/
├── schema_reference.sql    # DDL for all base tables + canonical views (product_stock, product_location)
├── dashboard.sql           # KPI metrics, high-margin products, and activity audit log
├── products.sql            # Search, filter, insert, and update catalog products
├── inventory.sql           # Store inventory listings & valuation (uses product_stock view)
├── locations.sql           # Physical coordinates lookup & shelf transfer (uses product_location view)
├── racks_shelves.sql       # Rack occupancy calculation and shelf levels
├── suppliers.sql           # Supplier directory and procurement statistics
├── purchase_orders.sql     # PO headers, line items, and stock receiving transaction
├── sales.sql               # Point-of-sale checkout, shelf stock deduction, and profit audit log
├── low_stock.sql           # Threshold alerts & suggested reorder quantities (uses product_stock view)
├── reports.sql             # Category valuation, aisle capacity, and fast-moving turnover
└── README.md               # Architectural handbook for SQL and backend integration
```

---

## 🔍 Canonical Views (No Redundancy Rule)

Per project design, all stock calculations and physical warehouse coordinate queries strictly use the two existing database views:

1. **`product_stock` View**:
   - Calculates total on-hand stock by summing units across all shelf placements.
   - Computes `stock_status` (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`) and `stock_deficit`.
   - Used in `inventory.sql`, `low_stock.sql`, `dashboard.sql`, and `reports.sql`.

2. **`product_location` View**:
   - Joins products with racks, aisles, zones, and shelf tiers.
   - Computes shelf capacity and occupancy percentage.
   - Used in `locations.sql` and the interactive rack visualizer.

---

## 🔌 How to Connect Your Backend Database

All service functions in `src/services/` are structured with clearly marked `// TODO: BACKEND INTEGRATION` placeholders:

1. **Database Setup**: Execute `queries/schema_reference.sql` on your MySQL / PostgreSQL instance.
2. **Backend API**: Build your backend server (e.g., Express.js, FastAPI, Flask, Spring Boot) to expose endpoints such as `GET /api/products` and execute the corresponding query in `queries/`.
3. **Configure Frontend**: In `src/services/api/apiClient.js`, update `BASE_URL`:
   ```javascript
   export const API_CONFIG = {
     BASE_URL: 'http://localhost:5000/api',
     USE_MOCK_DATA: false, // Set to false when your backend is running
   };
   ```
4. **On-Screen Mode Toggle**: You can also toggle between **"Mock Preview"** and **"Live Backend"** directly from the top header!
5. **Inspect SQL on Any Page**: Click the **"SQL Spec"** or **"View SQL Query"** button on any page to open the interactive Inspector Modal showing the exact SQL file, route, and parameter mappings!
