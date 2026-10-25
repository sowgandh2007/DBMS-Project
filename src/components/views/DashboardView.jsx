import React, { useState, useEffect } from 'react';
import StatCard from '../common/StatCard';
import { 
  DollarSign, 
  TrendingUp, 
  Percent, 
  AlertTriangle, 
  Layers, 
  Boxes, 
  Plus, 
  Receipt, 
  MapPin, 
  ArrowUpRight, 
  Clock, 
  Code2,
  Database
} from 'lucide-react';
import { getDashboardStats, getHighestMarginProducts, getRecentActivities } from '../../services/dashboardService';

export default function DashboardView({ onNavigate, onOpenInspector, onAddProduct, onNewSale }) {
  const [stats, setStats] = useState(null);
  const [marginItems, setMarginItems] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [st, mi, act] = await Promise.all([
        getDashboardStats(),
        getHighestMarginProducts(),
        getRecentActivities()
      ]);
      setStats(st);
      setMarginItems(mi || []);
      setActivities(act || []);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setError(err.message || 'Database connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Top action banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Executive Overview</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time inventory metrics, rack space utilization, and profit performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onNewSale}
            className="bg-dark-700 hover:bg-dark-600 text-slate-200 font-bold text-xs py-2 px-3.5 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Receipt className="w-3.5 h-3.5 text-brand-400" />
            <span>POS Checkout</span>
          </button>
          <button 
            onClick={onAddProduct}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-brand-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* SQL Integration Callout */}
      <div className="p-3.5 rounded-2xl bg-dark-800/90 border border-brand-500/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Template Mode • SQL Backend Decoupled</span>
            <span className="text-[11px] text-slate-400">
              This dashboard calculates metrics using the existing <code className="text-brand-300">product_stock</code> view. Query file: <code className="text-slate-300">queries/dashboard.sql</code>.
            </span>
          </div>
        </div>
        <button
          onClick={onOpenInspector}
          className="text-xs font-bold text-brand-400 hover:text-brand-300 underline flex items-center gap-1 shrink-0"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>View SQL</span>
        </button>
      </div>

      {/* Database Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4 text-rose-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold block text-sm">Failed to connect to database or fetch dashboard metrics</span>
              <span className="text-xs text-rose-400/90">{error}</span>
            </div>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 rounded-lg text-xs font-semibold shrink-0 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Stats Counter Grid (Styled after sowgandh.vercel.app) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Inventory Valuation"
          value={stats ? `₹${stats.totalInventoryValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00'}
          subtitle={stats ? `${stats.totalUnits} total units in stock` : '0 units'}
          icon={DollarSign}
          color="indigo"
        />

        <StatCard
          title="Potential Revenue"
          value={stats ? `₹${stats.potentialRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00'}
          subtitle="Gross retail sales if fully sold"
          icon={TrendingUp}
          color="emerald"
        />

        <StatCard
          title="Est. Gross Profit"
          value={stats ? `₹${stats.estimatedProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00'}
          subtitle="Net markup across all SKUs"
          icon={DollarSign}
          color="teal"
        />

        <StatCard
          title="Average Profit Margin"
          value={stats ? `${stats.avgMargin}%` : '0%'}
          subtitle="Markup yield on inventory"
          icon={Percent}
          color="amber"
        />
      </div>

      {/* Secondary Stats Row: Rack Occupancy + Low Stock alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between glass-card-hover">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Catalog SKUs</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{stats ? stats.totalSkus : 0}</div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Across 4 Store Aisles</span>
            <button onClick={() => onNavigate('products')} className="text-brand-400 hover:underline font-semibold">View Catalog →</button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between glass-card-hover">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rack Occupancy Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{stats ? `${stats.rackOccupancyPct}%` : '0%'}</div>
          <div className="w-full bg-dark-700 rounded-full h-2 mt-2 overflow-hidden">
            <div 
              className="bg-brand-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats ? stats.rackOccupancyPct : 0}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
            <span>{stats ? `${stats.totalOccupied} / ${stats.totalCapacity} units stored` : '0 units'}</span>
            <button onClick={() => onNavigate('racks')} className="text-brand-400 hover:underline font-semibold">Warehouse Map →</button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between glass-card-hover">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Low-Stock Warnings</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400">{stats ? stats.lowStockCount : 0}</div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Items below minimum stock level</span>
            <button onClick={() => onNavigate('low-stock')} className="text-rose-400 hover:underline font-semibold">Review Alerts →</button>
          </div>
        </div>
      </div>

      {/* Main Split Section: Highest Margin Products & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Highest Margin Items bar chart widget (from sowgandh.vercel.app style) */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-2 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Highest Margin Products (In Stock)</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Top profit contributors based on retail selling price vs purchase cost basis.</p>
            </div>
            <button 
              onClick={() => onNavigate('inventory')}
              className="text-xs text-brand-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>Inventory</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-3.5 min-h-[220px]">
            {marginItems.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">No products found</p>
            ) : (
              marginItems.map((item) => (
                <div key={item.product_id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 truncate max-w-xs">{item.product_name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-[11px]">Cost: ₹{item.cost_price} → Sell: ₹{item.unit_price}</span>
                      <span className="font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                        +{item.margin_pct}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-dark-700/80 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(15, parseFloat(item.margin_pct) * 1.5))}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Logs */}
        <div className="glass-card rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Recent Activities</h3>
            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" /> Live
            </span>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[260px] text-xs">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-dark-700/40 border border-slate-800">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-slate-200 text-xs">{act.text}</span>
                  <span className="text-[10px] text-slate-500">{act.time}</span>
                </div>
                <span className="text-[11px] font-bold text-brand-400 whitespace-nowrap bg-brand-500/10 px-2 py-0.5 rounded">
                  {act.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
