import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Boxes, 
  Layers, 
  Truck, 
  ClipboardList, 
  Receipt, 
  BarChart3, 
  Sparkles,
  ChevronRight,
  Database,
  X
} from 'lucide-react';

export default function Sidebar({ currentView, onSelectView, isOpen, onClose }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'inventory', label: 'Store Inventory', icon: Boxes },
    { id: 'racks', label: 'Racks & Shelves', icon: Layers },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: ClipboardList },
    { id: 'sales', label: 'Sales & POS', icon: Receipt },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 md:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Content */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between p-4 select-none shrink-0 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 pt-1 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 font-bold">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-extrabold tracking-tight text-slate-900 block leading-tight">
                  RackMaster
                </span>
                <span className="text-[10px] font-semibold text-slate-400 tracking-wide uppercase">
                  Retail & Inventory
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button 
              onClick={onClose}
              className="md:hidden w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
              Menu
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    if (onClose) onClose();
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-50 to-sky-50/60 text-teal-800 border-l-2 border-teal-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Database Status Footer Card */}
        <div className="border-t border-slate-100 pt-3 mt-4 flex flex-col gap-2">
          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Database</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-600 truncate">
              Supabase PostgreSQL
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
