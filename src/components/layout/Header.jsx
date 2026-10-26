import React from 'react';
import { 
  Code2, 
  Menu,
  Database
} from 'lucide-react';

export default function Header({ currentView, onOpenInspector, onToggleSidebar }) {
  const titles = {
    'dashboard': { title: 'Dashboard', subtitle: 'Live inventory valuation, rack utilization, and sales metrics.' },
    'products': { title: 'Products', subtitle: 'Search, filter, and manage catalog SKUs and selling prices.' },
    'categories': { title: 'Categories', subtitle: 'Product classifications and inventory grouping hierarchy.' },
    'inventory': { title: 'Store Inventory', subtitle: 'Physical stock counts and current valuation from view product_stock.' },
    'racks': { title: 'Racks & Shelves', subtitle: 'Warehouse storage locations, tiers, and vertical capacity.' },
    'suppliers': { title: 'Suppliers Directory', subtitle: 'Vendor contacts, procurement history, and product lines.' },
    'purchase-orders': { title: 'Purchase Orders', subtitle: 'Inbound procurement tracking and stock receiving workflows.' },
    'sales': { title: 'Sales & POS', subtitle: 'Counter checkout terminal and completed transactions ledger.' },
    'reports': { title: 'Reports & Analytics', subtitle: 'Category valuation, sales turnover, and storage metrics.' },
  };

  const currentInfo = titles[currentView] || { title: 'RackMaster', subtitle: 'Retail Inventory and Rack Management' };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-5 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 select-none shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{currentInfo.title}</h1>
            <button
              onClick={onOpenInspector}
              title="Inspect underlying SQL query for this page"
              className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80 text-[10px] font-bold transition-all"
            >
              <Code2 className="w-3 h-3 text-teal-600" />
              <span>SQL Spec</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block mt-0.5">{currentInfo.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Status Pill */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-slate-700 font-semibold text-xs">PostgreSQL Active</span>
        </div>

        <button
          onClick={onOpenInspector}
          className="btn-secondary sm:hidden"
        >
          <Code2 className="w-3.5 h-3.5 text-teal-600" />
        </button>
      </div>
    </header>
  );
}
