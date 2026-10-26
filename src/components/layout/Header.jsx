import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Code2, 
  Building2, 
  ToggleLeft, 
  ToggleRight, 
  Info, 
  Bell, 
  Sparkles,
  ExternalLink 
} from 'lucide-react';
import { getUseMockData, setUseMockData } from '../../services/api/apiClient';

export default function Header({ currentView, onOpenInspector, onQuickAction }) {
  const [isMock, setIsMock] = useState(getUseMockData());

  useEffect(() => {
    const handleStorage = () => setIsMock(getUseMockData());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleToggleMock = () => {
    const nextVal = !isMock;
    setUseMockData(nextVal);
    setIsMock(nextVal);
    // Reload or notify views
    window.location.reload();
  };

  const titles = {
    'dashboard': { title: 'Dashboard Overview', subtitle: 'Real-time retail inventory valuation, rack capacity, and margins' },
    'inventory': { title: 'Store Inventory', subtitle: 'Track unit counts, prices, and stock statuses via product_stock view' },
    'products': { title: 'Product Catalog & Search', subtitle: 'Search products by SKU, category, supplier, and price ranges' },
    'locations': { title: 'Rack Location Finder', subtitle: 'Locate products by Aisle, Rack, and Shelf via product_location view' },
    'racks': { title: 'Racks & Shelves Management', subtitle: 'Physical warehouse layout, shelf capacity, and visual occupancy' },
    'low-stock': { title: 'Low-Stock Alerts & Triggers', subtitle: 'Threshold monitoring and automated restocking suggestions' },
    'suppliers': { title: 'Suppliers Directory', subtitle: 'Vendor contacts, catalog items, and procurement spend' },
    'purchase-orders': { title: 'Purchase Orders & Receiving', subtitle: 'Procurement workflows and receiving shipments directly into racks' },
    'sales': { title: 'Sales Counter & POS Terminal', subtitle: 'Point-of-sale checkout and transactions ledger' },
    'reports': { title: 'Reports & Analytics', subtitle: 'Valuation, rack utilization, and turnover reports' },
    'sql-hub': { title: 'SQL & Database Query Hub', subtitle: 'Interactive reference of all SQL files in /queries and backend mapping' },
  };

  const currentInfo = titles[currentView] || { title: 'RackMaster Admin', subtitle: 'Retail Inventory and Rack Management' };

  return (
    <header className="bg-dark-800/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-10 select-none">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold text-white tracking-tight">{currentInfo.title}</h1>
          <button
            onClick={onOpenInspector}
            title="Inspect SQL query for this page"
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 text-[10px] font-bold transition-all"
          >
            <Code2 className="w-3 h-3" />
            <span>SQL Spec</span>
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{currentInfo.subtitle}</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Store Branch Indicator */}
        <div className="hidden lg:flex items-center gap-2 bg-dark-700/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs">
          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-300 font-semibold">Store: Central Retail Hub</span>
          <span className="text-[10px] text-slate-500 font-mono">(Aisles 01-04)</span>
        </div>

        {/* Database Mode Switcher */}
        <div 
          onClick={handleToggleMock}
          className="cursor-pointer flex items-center gap-2 bg-dark-700/90 hover:bg-dark-600 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs transition-colors"
          title="Click to toggle between Mock Data Preview and Real Backend Connection"
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mode:</span>
          {isMock ? (
            <span className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Mock Preview
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-brand-400 font-bold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-brand-400"></span>
              Live Backend
            </span>
          )}
          {isMock ? (
            <ToggleLeft className="w-4 h-4 text-amber-400 ml-1" />
          ) : (
            <ToggleRight className="w-4 h-4 text-brand-400 ml-1" />
          )}
        </div>

        {/* SQL Queries Folder Quick Link */}
        <button
          onClick={onOpenInspector}
          className="flex items-center gap-1.5 bg-dark-700 hover:bg-dark-600 active:bg-dark-600 text-slate-300 hover:text-white font-bold text-xs py-2 px-3 rounded-xl border border-slate-700 transition-all shadow-sm"
        >
          <Database className="w-3.5 h-3.5 text-brand-400" />
          <span>View SQL Query</span>
        </button>
      </div>
    </header>
  );
}
