import React, { useState } from 'react';
import { 
  Database, 
  Code2, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Layers,
  BookOpen
} from 'lucide-react';
import { PAGE_SQL_MAPPINGS } from '../layout/QueryInspectorModal';

export default function SqlIntegrationHubView() {
  const [selectedFile, setSelectedFile] = useState('products');
  const [copied, setCopied] = useState(false);

  const filesList = [
    { key: 'dashboard', name: 'queries/dashboard.sql', label: 'Dashboard & KPI Queries', view: 'product_stock' },
    { key: 'inventory', name: 'queries/inventory.sql', label: 'Store Inventory Queries', view: 'product_stock' },
    { key: 'products', name: 'queries/products.sql', label: 'Product Catalog & Search', view: 'products + product_stock' },
    { key: 'locations', name: 'queries/locations.sql', label: 'Rack Location Finder', view: 'product_location' },
    { key: 'racks', name: 'queries/racks_shelves.sql', label: 'Racks & Shelves Management', view: 'racks + shelves' },
    { key: 'low-stock', name: 'queries/low_stock.sql', label: 'Low-Stock Alerts & Triggers', view: 'product_stock' },
    { key: 'suppliers', name: 'queries/suppliers.sql', label: 'Suppliers Directory & Spend', view: 'suppliers' },
    { key: 'purchase-orders', name: 'queries/purchase_orders.sql', label: 'Purchase Orders & Stock Receiving', view: 'purchase_orders' },
    { key: 'sales', name: 'queries/sales.sql', label: 'Sales POS & Audit Log', view: 'sales + sale_items' },
    { key: 'reports', name: 'queries/reports.sql', label: 'Valuation & Rack Space Reports', view: 'product_stock + racks' },
  ];

  const activeMapping = PAGE_SQL_MAPPINGS[selectedFile] || PAGE_SQL_MAPPINGS['products'];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(activeMapping.sqlSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* View Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">SQL Query & Database Integration Hub</h2>
        <p className="text-xs text-slate-500 mt-0.5">Central repository of parameterized queries, canonical views, and backend endpoints.</p>
      </div>

      {/* Core Rules & Security Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="premium-card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Client-Server Security Rule</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Never run SQL queries in browser code. User inputs from React are sent via HTTP (e.g. <code className="text-teal-700 font-mono">GET /api/products</code>) and executed with parameterized bindings (<code className="text-slate-700 font-mono">%s</code> or <code className="text-slate-700 font-mono">$1</code>) on Flask.
          </p>
        </div>

        <div className="premium-card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
            <Database className="w-4 h-4" />
            <span>Canonical View: product_stock</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Aggregates total inventory on hand, compares against <code className="text-slate-700 font-mono">min_stock_level</code>, and outputs <code className="text-slate-700 font-mono">stock_status</code> and <code className="text-slate-700 font-mono">stock_deficit</code>. Avoids duplicate stock calculations.
          </p>
        </div>

        <div className="premium-card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sky-700 font-bold text-xs">
            <Layers className="w-4 h-4" />
            <span>Canonical View: product_location</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Joins products with racks, aisles, and shelf tiers. Provides exact physical coordinates, capacity, and occupancy percentage for warehouse navigation.
          </p>
        </div>
      </div>

      {/* Interactive SQL Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* File Navigator (Left 4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
            Central queries/ Folder Files
          </span>

          <div className="flex flex-col gap-1.5">
            {filesList.map((f) => {
              const isSelected = selectedFile === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setSelectedFile(f.key)}
                  className={`flex flex-col gap-1 p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-teal-50 to-sky-50 border-teal-500 text-teal-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-teal-700">{f.name}</span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-teal-600"></span>}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-800">{f.label}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Uses: {f.view}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Query Details & Code Viewer (Right 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="premium-card p-5 flex flex-col gap-5">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{activeMapping.title}</h3>
                <span className="text-xs text-teal-700 font-mono">{activeMapping.sqlFile}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>
            </div>

            {/* Integration Specifications */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Frontend Service Layer
                </span>
                <span className="font-mono text-purple-700 font-semibold">{activeMapping.serviceFile}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Backend API Endpoint
                </span>
                <span className="font-mono text-emerald-700 font-bold">{activeMapping.apiRoute}</span>
              </div>
            </div>

            {/* Parameter Bindings Table */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Input Form Fields & Parameter Mapping
              </span>
              <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <th className="p-2.5">UI Form Input</th>
                      <th className="p-2.5">API Request Key</th>
                      <th className="p-2.5">SQL Parameter Marker</th>
                      <th className="p-2.5">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {activeMapping.parameters.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="p-2.5 font-medium text-slate-800">{p.field}</td>
                        <td className="p-2.5 font-mono text-purple-700">{p.apiParam}</td>
                        <td className="p-2.5 font-mono text-teal-700 font-bold">{p.sqlParam}</td>
                        <td className="p-2.5 text-slate-500">{p.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Raw SQL Display */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Parameterized SQL Implementation
              </span>
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed shadow-inner">
                {activeMapping.sqlSnippet}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
