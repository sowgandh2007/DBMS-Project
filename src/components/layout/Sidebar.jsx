import React from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  Search, 
  MapPin, 
  Layers, 
  AlertTriangle, 
  Truck, 
  ClipboardList, 
  Receipt, 
  BarChart3, 
  Database,
  ChevronRight,
  Package
} from 'lucide-react';
import { getUseMockData } from '../../services/api/apiClient';

export default function Sidebar({ currentView, onSelectView, alertCount = 5, onOpenInspector }) {
  const isMock = getUseMockData();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'inventory', label: 'Store Inventory', icon: Boxes },
    { id: 'products', label: 'Product Catalog', icon: Search },
    { id: 'locations', label: 'Rack Location Finder', icon: MapPin, highlight: 'VIEW: product_location' },
    { id: 'racks', label: 'Racks & Shelves', icon: Layers },
    { id: 'low-stock', label: 'Low-Stock Alerts', icon: AlertTriangle, badge: alertCount, badgeColor: 'bg-rose-500/20 text-rose-400' },
    { id: 'suppliers', label: 'Suppliers Directory', icon: Truck },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: ClipboardList },
    { id: 'sales', label: 'Sales & Billing POS', icon: Receipt },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'sql-hub', label: 'SQL & Query Hub', icon: Database, isDev: true },
  ];

  return (
    <aside className="w-full md:w-64 bg-dark-800 border-r border-slate-800/80 flex flex-col justify-between p-5 select-none shrink-0 z-20">
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white block leading-tight">RackMaster</span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wide">Retail Inventory & Racks</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Navigation</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-dark-700/80'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.isDev ? 'text-brand-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white text-brand-600' : item.badgeColor || 'bg-slate-700 text-slate-300'}`}>
                    {item.badge}
                  </span>
                )}
                {item.isDev && !isActive && (
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/30">
                    SQL
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Database Integration Status pill (inspired by sowgandh.vercel.app) */}
      <div className="border-t border-slate-800/80 pt-4 mt-6 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Database Status</span>
          <button 
            onClick={onOpenInspector}
            className="text-[10px] text-brand-400 hover:text-brand-300 underline font-semibold"
          >
            Inspect SQL
          </button>
        </div>

        <div className="p-2.5 rounded-xl bg-dark-900 border border-slate-800 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isMock ? 'bg-amber-400 animate-pulse' : 'bg-brand-500'}`}></span>
            <span className="text-xs font-bold text-slate-200">
              {isMock ? 'Mock Preview Mode' : 'Backend Connected'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {isMock ? 'DB queries ready in /queries. Toggle mode anytime.' : 'Live API connected.'}
          </span>
        </div>
      </div>
    </aside>
  );
}
