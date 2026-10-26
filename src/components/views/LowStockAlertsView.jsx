import React, { useState, useEffect } from 'react';
import StatusBadge from '../common/StatusBadge';
import { 
  AlertTriangle, 
  Search, 
  ShoppingCart, 
  Boxes, 
  Code2, 
  DollarSign
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
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Low-Stock Alerts</h2>
          <p className="text-xs text-slate-500 mt-0.5">Automated stock replenishment thresholds and deficit tracking.</p>
        </div>
        <button
          onClick={() => onOpenInspector('low-stock')}
          className="btn-secondary text-xs flex items-center gap-1.5"
          title="Inspect SQL Query"
        >
          <Code2 className="w-3.5 h-3.5 text-teal-600" />
          <span>SQL Query</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Out of Stock</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{outOfStockCount}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Immediate replenishment risk</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/60 shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="premium-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Low Stock</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{lowStockCount}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Below reorder minimum</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60 shadow-xs">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="premium-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Total Deficit Units</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalDeficitUnits}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Units to restore buffer</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200/60 shadow-xs">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="premium-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Est. Reorder Cost</span>
            <div className="text-2xl font-bold text-teal-700 mt-1">₹{totalReorderCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Required procurement capital</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/60 shadow-xs">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="premium-card p-3.5 flex flex-col md:flex-row gap-3 items-stretch justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search affected product name or SKU..."
            className="form-input w-full pl-10 pr-4 py-2 text-xs"
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
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
                urgency === u.id
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white border-teal-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
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
          className="form-input text-xs py-1.5 w-auto"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
          ))}
        </select>
      </div>

      {/* Low Stock Alerts Table */}
      <div className="premium-card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Replenishment Priority Queue</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">{filteredAlerts.length} Alerts Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider select-none">
                <th className="py-3 px-4">SKU & Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Current Stock</th>
                <th className="py-3 px-4 text-center">Min Level</th>
                <th className="py-3 px-4 text-center">Deficit</th>
                <th className="py-3 px-4 text-center">Suggested Reorder</th>
                <th className="py-3 px-4 text-right">Est. Cost</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {error ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-rose-600">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      <span className="font-semibold">{error}</span>
                      <button onClick={loadAlerts} className="mt-2 btn-secondary text-xs">
                        Retry Connection
                      </button>
                    </div>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Checking stock levels against thresholds...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-400 italic">
                    Great news! No inventory items currently match this threshold alert filter.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((item) => {
                  const isOut = item.stock_status === 'OUT_OF_STOCK';

                  return (
                    <tr key={item.product_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">{item.product_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{item.category}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-mono font-bold text-xs ${isOut ? 'text-rose-600' : 'text-amber-700'}`}>
                          {item.total_stock} units
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {item.min_stock_level} units
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-mono font-bold text-[11px] border border-rose-200/60">
                          -{item.stock_deficit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded text-xs">
                          {item.suggested_reorder_qty} units
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900 font-bold">
                        ₹{item.estimated_reorder_cost.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-medium text-xs">{item.supplier_name || 'Assigned Vendor'}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onGeneratePO && onGeneratePO(item)}
                          className="btn-primary py-1 px-2.5 text-xs font-semibold flex items-center gap-1.5 ml-auto"
                          title="Generate Purchase Order"
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
