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
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 md:px-8 py-3 flex items-center justify-between sticky top-0 z-20 select-none shadow-sm w-full max-w-full">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden w-9 h-9 shrink-0 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors touch-manipulation"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">{currentInfo.title}</h1>
            <button
              onClick={onOpenInspector}
              title="Inspect underlying SQL query for this page"
              className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80 text-[10px] font-bold transition-all shrink-0"
            >
              <Code2 className="w-3 h-3 text-teal-600" />
              <span>SQL Spec</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block mt-0.5 truncate">{currentInfo.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Status Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
          <span className="text-slate-700 font-semibold text-[11px] sm:text-xs">
            <span className="hidden sm:inline">PostgreSQL </span>Active
          </span>
        </div>

        <button
          onClick={onOpenInspector}
          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 sm:hidden text-teal-700 flex items-center justify-center touch-manipulation"
          title="Inspect SQL Query"
        >
          <Code2 className="w-4 h-4 text-teal-600" />
        </button>
      </div>
    </header>
  );
}
