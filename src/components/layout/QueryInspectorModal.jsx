import React, { useState } from 'react';
import Modal from '../common/Modal';
import { Database, Code, CheckCircle2, Copy, FileText, ArrowRight } from 'lucide-react';

export const PAGE_SQL_MAPPINGS = {
  'dashboard': {
    title: 'Dashboard Overview & KPI Metrics',
    sqlFile: 'queries/dashboard.sql',
    serviceFile: 'src/services/dashboardService.js',
    apiRoute: 'GET /api/dashboard/stats',
    viewsUsed: ['product_stock (Stock counts & values)', 'racks & shelves (Occupancy)'],
    parameters: [
      { field: 'Date Filter / Today', apiParam: 'current_date', sqlParam: 'CURRENT_DATE()', type: 'System Date' },
      { field: 'Top Margin Limit', apiParam: 'limit', sqlParam: 'LIMIT 5', type: 'Integer' }
    ],
    sqlSnippet: `-- Total SKUs and valuation using canonical view product_stock
SELECT 
    COUNT(DISTINCT ps.product_id) AS total_skus,
    COALESCE(SUM(ps.total_stock), 0) AS total_units_in_stock,
    COALESCE(SUM(ps.total_stock * ps.cost_price), 0.00) AS total_inventory_valuation,
    COALESCE(SUM(ps.total_stock * (ps.unit_price - ps.cost_price)), 0.00) AS estimated_potential_profit,
    COALESCE(SUM(CASE WHEN ps.stock_status = 'LOW_STOCK' THEN 1 ELSE 0 END), 0) AS low_stock_count
FROM product_stock ps;`
  },
  'products': {
    title: 'Product Catalog & Search',
    sqlFile: 'queries/products.sql',
    serviceFile: 'src/services/productService.js',
    apiRoute: 'GET /api/products',
    viewsUsed: ['product_stock (Joined for total on-hand stock and status)'],
    parameters: [
      { field: 'Search Bar (Text)', apiParam: 'search', sqlParam: ':search_term', type: 'String (Wildcard %term%)' },
      { field: 'Category Dropdown', apiParam: 'category', sqlParam: ':category', type: 'String / Enum' },
      { field: 'Stock Status Dropdown', apiParam: 'status', sqlParam: ':stock_status', type: 'Enum ("IN_STOCK", etc.)' },
      { field: 'Min Price Input', apiParam: 'min_price', sqlParam: ':min_price', type: 'Decimal' },
      { field: 'Max Price Input', apiParam: 'max_price', sqlParam: ':max_price', type: 'Decimal' },
      { field: 'Sort Dropdown', apiParam: 'sort_by', sqlParam: 'ORDER BY clause', type: 'Identifier' }
    ],
    sqlSnippet: `SELECT 
    p.product_id, p.sku, p.product_name, p.category,
    p.cost_price, p.unit_price, p.min_stock_level,
    COALESCE(ps.total_stock, 0) AS current_stock,
    COALESCE(ps.stock_status, 'OUT_OF_STOCK') AS stock_status
FROM products p
LEFT JOIN product_stock ps ON p.product_id = ps.product_id
WHERE (:search_term IS NULL OR p.product_name LIKE CONCAT('%', :search_term, '%'))
  AND (:category IS NULL OR :category = 'all' OR p.category = :category);`
  },
  'inventory': {
    title: 'Store Inventory Table',
    sqlFile: 'queries/inventory.sql',
    serviceFile: 'src/services/inventoryService.js',
    apiRoute: 'GET /api/inventory',
    viewsUsed: ['product_stock (Direct query on canonical view)'],
    parameters: [
      { field: 'Search Input', apiParam: 'search', sqlParam: ':search_term', type: 'String' },
      { field: 'Status Filter Buttons', apiParam: 'status', sqlParam: ':status', type: 'Enum ("ALL", "IN_STOCK", "LOW_STOCK")' },
      { field: 'Category Filter', apiParam: 'category', sqlParam: ':category', type: 'String' }
    ],
    sqlSnippet: `-- Direct query on view product_stock (No duplicate stock calculations!)
SELECT 
    ps.product_id, ps.sku, ps.product_name, ps.category,
    ps.cost_price, ps.unit_price, ps.total_stock,
    ps.stock_status, ps.stock_deficit,
    (ps.total_stock * ps.cost_price) AS inventory_valuation
FROM product_stock ps
WHERE (:search_term IS NULL OR ps.product_name LIKE CONCAT('%', :search_term, '%'))
  AND (:status IS NULL OR :status = 'ALL' OR ps.stock_status = :status);`
  },
  'locations': {
    title: 'Inventory & Rack Location Finder',
    sqlFile: 'queries/locations.sql',
    serviceFile: 'src/services/locationService.js',
    apiRoute: 'GET /api/locations/find',
    viewsUsed: ['product_location (Direct query on canonical view)'],
    parameters: [
      { field: 'Product Name / SKU', apiParam: 'product', sqlParam: ':search_term', type: 'String' },
      { field: 'Aisle Dropdown', apiParam: 'aisle', sqlParam: ':aisle', type: 'String (e.g. "Aisle 01")' },
      { field: 'Rack Code Dropdown', apiParam: 'rack_code', sqlParam: ':rack_code', type: 'String (e.g. "RACK-A1")' }
    ],
    sqlSnippet: `-- Direct query on view product_location
SELECT 
    pl.placement_id, pl.sku, pl.product_name, pl.category,
    pl.rack_code, pl.aisle_number, pl.shelf_code, pl.shelf_level,
    pl.quantity, pl.shelf_capacity, pl.shelf_occupancy_pct
FROM product_location pl
WHERE (:search_term IS NULL OR pl.product_name LIKE CONCAT('%', :search_term, '%'))
  AND (:aisle IS NULL OR :aisle = 'all' OR pl.aisle_number = :aisle);`
  },
  'racks': {
    title: 'Racks & Shelves Management',
    sqlFile: 'queries/racks_shelves.sql',
    serviceFile: 'src/services/rackService.js',
    apiRoute: 'GET /api/racks & GET /api/racks/:id/shelves',
    viewsUsed: ['racks', 'shelves', 'product_rack_placement'],
    parameters: [
      { field: 'Aisle Selector', apiParam: 'aisle', sqlParam: ':aisle', type: 'String' },
      { field: 'Zone Selector', apiParam: 'zone', sqlParam: ':zone', type: 'String' }
    ],
    sqlSnippet: `SELECT 
    r.rack_id, r.rack_code, r.aisle_number, r.zone, r.max_capacity,
    COUNT(DISTINCT sh.shelf_id) AS total_shelves,
    COALESCE(SUM(prp.quantity), 0) AS current_stored_units,
    ROUND((COALESCE(SUM(prp.quantity), 0) / NULLIF(r.max_capacity, 0)) * 100, 1) AS occupancy_percentage
FROM racks r
LEFT JOIN shelves sh ON r.rack_id = sh.rack_id
LEFT JOIN product_rack_placement prp ON sh.shelf_id = prp.shelf_id
GROUP BY r.rack_id, r.rack_code, r.aisle_number, r.zone, r.max_capacity;`
  },
  'low-stock': {
    title: 'Low-Stock Alerts & Triggers',
    sqlFile: 'queries/low_stock.sql',
    serviceFile: 'src/services/alertService.js',
    apiRoute: 'GET /api/alerts/low-stock',
    viewsUsed: ['product_stock (Filters status = "LOW_STOCK" | "OUT_OF_STOCK")'],
    parameters: [
      { field: 'Urgency Filter (All / Out of stock / Low)', apiParam: 'urgency', sqlParam: ':urgency', type: 'Enum' },
      { field: 'Category Filter', apiParam: 'category', sqlParam: ':category', type: 'String' }
    ],
    sqlSnippet: `SELECT 
    ps.product_id, ps.sku, ps.product_name, ps.category,
    ps.min_stock_level, ps.total_stock, ps.stock_status, ps.stock_deficit,
    (ps.stock_deficit + CEIL(ps.min_stock_level * 0.5)) AS suggested_reorder_qty,
    ps.supplier_name
FROM product_stock ps
WHERE ps.stock_status IN ('LOW_STOCK', 'OUT_OF_STOCK');`
  },
  'suppliers': {
    title: 'Suppliers Directory & Management',
    sqlFile: 'queries/suppliers.sql',
    serviceFile: 'src/services/supplierService.js',
    apiRoute: 'GET /api/suppliers',
    viewsUsed: ['suppliers', 'products', 'purchase_orders'],
    parameters: [
      { field: 'Supplier Name / Contact Search', apiParam: 'search', sqlParam: ':search_term', type: 'String' },
      { field: 'Status Filter', apiParam: 'status', sqlParam: ':status', type: 'Enum ("ACTIVE", "PREFERRED")' }
    ],
    sqlSnippet: `SELECT 
    s.supplier_id, s.supplier_name, s.contact_name, s.email, s.phone, s.status,
    COUNT(DISTINCT p.product_id) AS total_products_supplied,
    COUNT(DISTINCT po.po_id) AS total_orders_placed,
    COALESCE(SUM(po.total_amount), 0.00) AS total_procurement_spend
FROM suppliers s
LEFT JOIN products p ON s.supplier_id = p.supplier_id
LEFT JOIN purchase_orders po ON s.supplier_id = po.supplier_id
GROUP BY s.supplier_id, s.supplier_name, s.contact_name, s.email, s.phone, s.status;`
  },
  'purchase-orders': {
    title: 'Purchase Orders & Stock Receiving',
    sqlFile: 'queries/purchase_orders.sql',
    serviceFile: 'src/services/purchaseOrderService.js',
    apiRoute: 'GET /api/purchase-orders & POST /api/purchase-orders/:id/receive',
    viewsUsed: ['purchase_orders', 'purchase_order_items', 'product_rack_placement'],
    parameters: [
      { field: 'Status Tabs (Ordered, Received, etc.)', apiParam: 'status', sqlParam: ':status', type: 'Enum' },
      { field: 'Supplier Filter', apiParam: 'supplier_id', sqlParam: ':supplier_id', type: 'Integer' },
      { field: 'From Date Picker', apiParam: 'from_date', sqlParam: ':from_date', type: 'Date (YYYY-MM-DD)' },
      { field: 'To Date Picker', apiParam: 'to_date', sqlParam: ':to_date', type: 'Date (YYYY-MM-DD)' }
    ],
    sqlSnippet: `SELECT 
    po.po_id, po.po_number, po.supplier_id, s.supplier_name,
    po.order_date, po.expected_date, po.status, po.total_amount,
    COUNT(poi.po_item_id) AS total_items,
    COALESCE(SUM(poi.quantity_ordered), 0) AS total_units_ordered
FROM purchase_orders po
JOIN suppliers s ON po.supplier_id = s.supplier_id
LEFT JOIN purchase_order_items poi ON po.po_id = poi.po_id
GROUP BY po.po_id, po.po_number, po.supplier_id, s.supplier_name, po.order_date, po.expected_date, po.status, po.total_amount;`
  },
  'sales': {
    title: 'Sales & POS Billing',
    sqlFile: 'queries/sales.sql',
    serviceFile: 'src/services/salesService.js',
    apiRoute: 'GET /api/sales & POST /api/sales',
    viewsUsed: ['sales', 'sale_items', 'product_rack_placement'],
    parameters: [
      { field: 'Receipt / Customer Search', apiParam: 'search', sqlParam: ':search_term', type: 'String' },
      { field: 'Payment Method Filter', apiParam: 'payment_method', sqlParam: ':payment_method', type: 'Enum ("UPI", "CARD", "CASH")' },
      { field: 'From / To Date', apiParam: 'from_date / to_date', sqlParam: ':from_date / :to_date', type: 'Date' }
    ],
    sqlSnippet: `-- Audit log with realized profit calculation (like sowgandh.vercel.app)
SELECT 
    s.sale_id, s.receipt_number, s.sale_date, s.customer_name, s.payment_method,
    s.total_amount, COUNT(si.sale_item_id) AS total_items_count,
    COALESCE(s.total_amount - SUM(si.quantity * p.cost_price), 0.00) AS realized_profit
FROM sales s
LEFT JOIN sale_items si ON s.sale_id = si.sale_id
LEFT JOIN products p ON si.product_id = p.product_id
GROUP BY s.sale_id, s.receipt_number, s.sale_date, s.customer_name, s.payment_method, s.total_amount;`
  },
  'reports': {
    title: 'Reports & Analytics',
    sqlFile: 'queries/reports.sql',
    serviceFile: 'src/services/reportService.js',
    apiRoute: 'GET /api/reports/valuation & GET /api/reports/rack-utilization',
    viewsUsed: ['product_stock (Category Valuation)', 'racks & shelves (Space Utilization)'],
    parameters: [
      { field: 'Report Type Selector', apiParam: 'type', sqlParam: 'Separate queries in reports.sql', type: 'Tab Key' },
      { field: 'Date Range Filters', apiParam: 'from_date / to_date', sqlParam: ':from_date / :to_date', type: 'Date' }
    ],
    sqlSnippet: `-- Inventory Valuation by Category using product_stock view
SELECT 
    ps.category,
    COUNT(ps.product_id) AS total_products,
    COALESCE(SUM(ps.total_stock), 0) AS total_units_in_stock,
    COALESCE(SUM(ps.total_stock * ps.cost_price), 0.00) AS total_cost_basis,
    COALESCE(SUM(ps.total_stock * ps.unit_price), 0.00) AS total_retail_value,
    ROUND((COALESCE(SUM(ps.total_stock * (ps.unit_price - ps.cost_price)), 0) / NULLIF(SUM(ps.total_stock * ps.unit_price), 0)) * 100, 1) AS margin_percentage
FROM product_stock ps
GROUP BY ps.category;`
  }
};

export default function QueryInspectorModal({ isOpen, onClose, currentViewId = 'dashboard' }) {
  const [selectedKey, setSelectedKey] = useState(currentViewId);
  const [copied, setCopied] = useState(false);

  const activeMapping = PAGE_SQL_MAPPINGS[selectedKey] || PAGE_SQL_MAPPINGS['dashboard'];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(activeMapping.sqlSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="SQL & API Integration Inspector"
      subtitle="Examine the query mapping, backend endpoints, and input parameters for this page"
      maxWidth="max-w-4xl"
    >
      <div className="flex flex-col gap-6 text-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800">
          {Object.keys(PAGE_SQL_MAPPINGS).map((key) => {
            const map = PAGE_SQL_MAPPINGS[key];
            const isSelected = selectedKey === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedKey(key)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  isSelected 
                    ? 'bg-brand-500 text-white shadow-sm' 
                    : 'bg-dark-700 text-slate-400 hover:text-white hover:bg-dark-600'
                }`}
              >
                {map.title.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* Feature Overview Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-dark-800/80 rounded-xl p-4 border border-slate-800 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target SQL Query File</span>
            <div className="flex items-center gap-2 text-brand-400 font-mono font-bold text-xs bg-dark-900/60 p-2 rounded-lg border border-slate-800">
              <FileText className="w-4 h-4 text-brand-500 shrink-0" />
              <span>{activeMapping.sqlFile}</span>
            </div>
            <span className="text-[10px] text-slate-400">Organized in root <code className="text-slate-300">queries/</code> directory</span>
          </div>

          <div className="bg-dark-800/80 rounded-xl p-4 border border-slate-800 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Frontend Service & Backend Route</span>
            <div className="flex items-center justify-between text-xs bg-dark-900/60 p-2 rounded-lg border border-slate-800 font-mono">
              <span className="text-indigo-300">{activeMapping.serviceFile}</span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono font-bold flex items-center gap-1.5 text-emerald-400">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[10px]">ROUTE</span>
              {activeMapping.apiRoute}
            </div>
          </div>
        </div>

        {/* Canonical Views Used */}
        <div className="bg-dark-800/50 rounded-xl p-4 border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-brand-500" />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">Canonical Views / Schema Integration</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {activeMapping.viewsUsed.map((v, i) => (
              <span key={i} className="px-2.5 py-1 bg-dark-700 text-slate-300 rounded-md border border-slate-700/60 font-mono text-[11px]">
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* User Input Mapping Table */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold text-white uppercase tracking-wider">User Input Controls & Parameter Binding</span>
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-dark-800 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
                  <th className="p-3">UI Form Field / Filter</th>
                  <th className="p-3">API Payload Key</th>
                  <th className="p-3">SQL Parameter Marker</th>
                  <th className="p-3">Data Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-dark-900/40">
                {activeMapping.parameters.map((p, idx) => (
                  <tr key={idx} className="hover:bg-dark-700/30">
                    <td className="p-3 font-semibold text-slate-200">{p.field}</td>
                    <td className="p-3 font-mono text-indigo-400">{p.apiParam}</td>
                    <td className="p-3 font-mono text-brand-400 font-bold">{p.sqlParam}</td>
                    <td className="p-3 text-slate-400">{p.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SQL Snippet Preview */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">SQL Query Preview</span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-dark-700 hover:bg-dark-600 text-slate-300 hover:text-white transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Query'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-dark-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
            {activeMapping.sqlSnippet}
          </pre>
        </div>
      </div>
    </Modal>
  );
}
