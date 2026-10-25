import React, { useState, useEffect } from 'react';
import StatusBadge from '../common/StatusBadge';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  ShoppingCart, 
  ArrowRight, 
  DollarSign, 
  Building2, 
  Boxes, 
  Code2, 
  Database 
} from 'lucide-react';
import { getLowStockAlerts } from '../../services/alertService';

export default function LowStockAlertsView({ onOpenInspector, onGeneratePO }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters (User Inputs)
  const [urgency, setUrgency] = useState('ALL_ALERTS');
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLowStockAlerts({ urgency, category });
      setAlerts(res || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Database connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [urgency, category]);

  const filteredAlerts = alerts.filter(item => 
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const outOfStockCount = alerts.filter(a => a.stock_status === 'OUT_OF_STOCK').length;
  const lowStockCount = alerts.filter(a => a.stock_status === 'LOW_STOCK').length;
  const totalDeficitUnits = alerts.reduce((sum, a) => sum + a.stock_deficit, 0);
  const totalReorderCost = alerts.reduce((sum, a) => sum + a.estimated_reorder_cost, 0);

  const categories = [
    'all',
    'Grocery & Staples',
    'Personal Hygiene',
    'Dairy & Chilled',
    'Drinks & Juices',
    'Cleaning Supplies',
    'Cooking Essentials'
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Low-Stock Alerts & Restocking Triggers</h2>
          <p className="text-xs text-slate-400 mt-0.5">Automated stock threshold monitoring powered by the canonical view <code className="text-brand-300">product_stock</code>.</p>
        </div>
        <button
          onClick={() => onOpenInspector('low-stock')}
          className="bg-dark-700 hover:bg-dark-600 text-slate-300 font-bold text-xs py-2 px-3 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Code2 className="w-3.5 h-3.5 text-brand-400" />
          <span>SQL Query (product_stock)</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Out of Stock (Critical)</span>
            <div className="text-2xl font-black text-white mt-1">{outOfStockCount}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Immediate stockout risk</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Low Stock Warnings</span>
            <div className="text-2xl font-black text-white mt-1">{lowStockCount}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Below minimum safety levels</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Deficit Units</span>
            <div className="text-2xl font-black text-white mt-1">{totalDeficitUnits}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Units required to reach safety</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Est. Reorder Cost</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">₹{totalReorderCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Working capital required</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search affected product name or SKU..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-slate-700/80 focus:outline-none focus:border-brand-500 rounded-xl text-xs font-semibold text-white placeholder:text-slate-500"
          />
        </div>

        {/* Urgency buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL_ALERTS', label: 'All Alerts' },
            { id: 'OUT_OF_STOCK', label: 'Out of Stock' },
            { id: 'LOW_STOCK', label: 'Low Stock Only' }
          ].map((u) => (
            <button
              key={u.id}
              onClick={() => setUrgency(u.id)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors whitespace-nowrap ${
                urgency === u.id
                  ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                  : 'bg-dark-700 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>

        {/* Category dropdown */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="form-input text-white bg-dark-700 cursor-pointer w-auto"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
          ))}
        </select>
      </div>

      {/* Low Stock Alerts Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Replenishment Priority Queue</span>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{filteredAlerts.length} Alerts Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-dark-800 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider select-none">
                <th className="p-4">SKU & Product Name</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-center">Current Stock</th>
                <th className="p-4 text-center">Min Level</th>
                <th className="p-4 text-center">Deficit</th>
                <th className="p-4 text-center">Suggested Reorder</th>
                <th className="p-4 text-right">Est. Cost</th>
                <th className="p-4">Supplier</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-dark-900/30">
              {error ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-rose-400">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <span className="font-bold">{error}</span>
                      <button onClick={loadAlerts} className="mt-2 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-xs font-semibold">
                        Retry Connection
                      </button>
                    </div>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Checking low stock thresholds in PostgreSQL...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-500 italic">
                    Great news! No inventory items currently match this threshold alert filter.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((item) => {
                  const isOut = item.stock_status === 'OUT_OF_STOCK';

                  return (
                    <tr key={item.product_id} className="hover:bg-dark-700/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white text-xs">{item.product_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.sku}</div>
                      </td>
                      <td className="p-4 text-slate-300 font-medium">{item.category}</td>
                      <td className="p-4 text-center">
                        <span className={`font-mono font-black text-xs ${isOut ? 'text-rose-400' : 'text-amber-400'}`}>
                          {item.total_stock} units
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono text-slate-400">
                        {item.min_stock_level} units
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono font-bold text-[11px] border border-rose-500/20">
                          -{item.stock_deficit}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-mono font-black text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded text-xs">
                          {item.suggested_reorder_qty} units
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-200 font-bold">
                        ₹{item.estimated_reorder_cost.toFixed(2)}
                      </td>
                      <td className="p-4 text-slate-300">
                        <div className="font-semibold text-xs">{item.supplier_name || 'Assigned Vendor'}</div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => onGeneratePO && onGeneratePO(item)}
                          className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-all shadow-sm flex items-center gap-1.5 ml-auto"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>Order</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
