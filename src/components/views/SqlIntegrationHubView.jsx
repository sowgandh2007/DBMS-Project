import React, { useState } from 'react';
import { 
  Database, 
  Code2, 
  FileText, 
  CheckCircle2, 
  Copy, 
  ShieldCheck, 
  Server, 
  ExternalLink,
  Layers,
  ArrowRight,
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
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* View Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">SQL Query & Database Integration Hub</h2>
        <p className="text-xs text-slate-400 mt-0.5">Central repository of parameterized queries, canonical views, and backend endpoints.</p>
      </div>

      {/* Core Rules & Security Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-brand-500/30 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-brand-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Client-Server Security Rule</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Never run SQL queries in browser code. User inputs from React are sent via HTTP (e.g. <code className="text-brand-300">GET /api/products</code>) and executed with parameterized bindings (<code className="text-slate-300">:param</code> or <code className="text-slate-300">$1</code>) on your backend.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-indigo-500/30 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
            <Database className="w-4 h-4" />
            <span>Canonical View: product_stock</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Aggregates total inventory on hand, compares against <code className="text-slate-300">min_stock_level</code>, and outputs <code className="text-slate-300">stock_status</code> and <code className="text-slate-300">stock_deficit</code>. Avoids duplicate stock calculations.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-teal-500/30 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
            <Layers className="w-4 h-4" />
            <span>Canonical View: product_location</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Joins products with racks, aisles, and shelf tiers. Provides exact physical coordinates, capacity, and occupancy percentage for warehouse navigation.
          </p>
        </div>
      </div>

      {/* Interactive SQL Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* File Navigator (Left 4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
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
                      ? 'bg-dark-800 border-brand-500 text-white shadow-md'
                      : 'bg-dark-900 border-slate-800 text-slate-400 hover:text-white hover:bg-dark-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brand-400">{f.name}</span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-brand-400"></span>}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300">{f.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Uses: {f.view}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Query Details & Code Viewer (Right 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col gap-5">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
              <div>
                <h3 className="text-base font-bold text-white">{activeMapping.title}</h3>
                <span className="text-xs text-brand-400 font-mono">{activeMapping.sqlFile}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-200 text-xs font-bold transition-colors border border-slate-700"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>
            </div>

            {/* Integration Specifications */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-dark-800 border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Frontend Service Layer
                </span>
                <span className="font-mono text-indigo-300 font-semibold">{activeMapping.serviceFile}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-800 border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Backend API Endpoint
                </span>
                <span className="font-mono text-emerald-400 font-bold">{activeMapping.apiRoute}</span>
              </div>
            </div>

            {/* Parameter Bindings Table */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Input Form Fields & Parameter Mapping
              </span>
              <div className="rounded-xl border border-slate-800 overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-dark-800 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                      <th className="p-2.5">UI Form Input</th>
                      <th className="p-2.5">API Request Key</th>
                      <th className="p-2.5">SQL Parameter Marker</th>
                      <th className="p-2.5">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-dark-900/40">
                    {activeMapping.parameters.map((p, idx) => (
                      <tr key={idx} className="hover:bg-dark-700/30">
                        <td className="p-2.5 font-semibold text-slate-200">{p.field}</td>
                        <td className="p-2.5 font-mono text-indigo-400">{p.apiParam}</td>
                        <td className="p-2.5 font-mono text-brand-400 font-bold">{p.sqlParam}</td>
                        <td className="p-2.5 text-slate-400">{p.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Raw SQL Display */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Parameterized SQL Implementation
              </span>
              <pre className="p-4 rounded-xl bg-dark-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
                {activeMapping.sqlSnippet}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Backend Connection Guide */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col gap-4 text-xs">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Quick Guide: Hooking Up Your Database in 3 Simple Steps
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-dark-800 border border-slate-800 flex flex-col gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-500 text-white font-black text-xs flex items-center justify-center">1</div>
            <span className="font-bold text-white">Create Database & Views</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Run <code className="text-slate-300">queries/schema_reference.sql</code> in MySQL/PostgreSQL to create base tables and the two canonical views: <code className="text-brand-300">product_stock</code> and <code className="text-brand-300">product_location</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-dark-800 border border-slate-800 flex flex-col gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500 text-white font-black text-xs flex items-center justify-center">2</div>
            <span className="font-bold text-white">Build Backend API Routes</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Create your Node/Express or FastAPI server. Implement the routes (e.g. <code className="text-indigo-300">GET /api/products</code>) executing the parameterized SQL files in <code className="text-slate-300">queries/</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-dark-800 border border-slate-800 flex flex-col gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-black text-xs flex items-center justify-center">3</div>
            <span className="font-bold text-white">Switch Mode to Live</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              In <code className="text-slate-300">src/services/api/apiClient.js</code>, configure your backend URL and toggle off <code className="text-amber-300">USE_MOCK_DATA</code> (or click the Mode pill in the top header).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
