import React, { useState, useEffect } from 'react';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { 
  Boxes, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Edit3, 
  MapPin, 
  Plus, 
  Code2, 
  Database,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { getInventory, adjustShelfStock } from '../../services/inventoryService';

export default function StoreInventoryView({ onOpenInspector, onNavigateToLocation, onAddProduct }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters (User Inputs)
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('ALL');
  const [category, setCategory] = useState('all');

  // Adjust Modal
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustedQty, setAdjustedQty] = useState('');

  const loadInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getInventory({
        searchTerm,
        status,
        category
      });
      setItems(res || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Database connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [searchTerm, status, category]);

  const handleOpenAdjust = (item) => {
    setSelectedItem(item);
    setAdjustedQty(item.total_stock.toString());
    setIsAdjustOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await adjustShelfStock({
        product_id: selectedItem.product_id,
        shelf_id: 101, // default placement shelf for quick audit
        new_qty: parseInt(adjustedQty, 10) || 0
      });
      setIsAdjustOpen(false);
      loadInventory();
    } catch (err) {
      alert("Error adjusting stock: " + err.message);
    }
  };

  const categories = [
    'all',
    'Grocery & Staples',
    'Cooking Essentials',
    'Personal Hygiene',
    'Dairy & Chilled',
    'Drinks & Juices',
    'Cleaning Supplies'
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Store Inventory</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time stock valuation and audit controls via canonical view <code className="text-brand-300">product_stock</code>.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenInspector('inventory')}
            className="bg-dark-700 hover:bg-dark-600 text-slate-300 font-bold text-xs py-2 px-3 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Code2 className="w-3.5 h-3.5 text-brand-400" />
            <span>SQL Query (product_stock)</span>
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

      {/* Filter Toolbar (matching sowgandh.vercel.app style) */}
      <div className="glass-card rounded-2xl p-4 flex flex-col lg:flex-row gap-3 items-stretch justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by SKU, Product Name, or Category..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-slate-700/80 focus:outline-none focus:border-brand-500 rounded-xl text-xs font-semibold text-white placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setStatus('ALL')}
              className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors ${
                status === 'ALL'
                  ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                  : 'bg-dark-700 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatus('IN_STOCK')}
              className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors ${
                status === 'IN_STOCK'
                  ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                  : 'bg-dark-700 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => setStatus('LOW_STOCK')}
              className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors ${
                status === 'LOW_STOCK'
                  ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                  : 'bg-dark-700 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStatus('OUT_OF_STOCK')}
              className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors ${
                status === 'OUT_OF_STOCK'
                  ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                  : 'bg-dark-700 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Out of Stock
            </button>
          </div>

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
      </div>

      {/* Inventory Table (exact sowgandh.vercel.app columns) */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Store On-Hand Stock</span>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{items.length} Products in View</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-dark-800 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider select-none">
                <th className="p-4">Product Name</th>
                <th className="p-4 text-right">Buy Price</th>
                <th className="p-4 text-right">Sell Price</th>
                <th className="p-4 text-right">Proj. Profit</th>
                <th className="p-4 text-center">Current Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-dark-900/30">
              {error ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-rose-400">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <span className="font-bold">{error}</span>
                      <button onClick={loadInventory} className="mt-2 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-xs font-semibold">
                        Retry Connection
                      </button>
                    </div>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading inventory from PostgreSQL...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 italic">
                    No products matched your inventory filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const projProfit = item.total_stock * (item.unit_price - item.cost_price);

                  return (
                    <tr key={item.product_id} className="hover:bg-dark-700/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white text-xs">{item.product_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.sku} • {item.category}</div>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-400">₹{item.cost_price.toFixed(2)}</td>
                      <td className="p-4 text-right font-mono font-bold text-white">₹{item.unit_price.toFixed(2)}</td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-400">
                        ₹{projProfit.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-bold text-white font-mono text-xs">{item.total_stock}</span>
                        <span className="text-[10px] text-slate-500 block">min: {item.min_stock_level}</span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={item.stock_status} type="stock" />
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAdjust(item)}
                            title="Adjust quantity"
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-dark-700 hover:bg-dark-600 text-slate-300 hover:text-white transition-colors border border-slate-700"
                          >
                            Audit
                          </button>
                          <button
                            onClick={() => onNavigateToLocation && onNavigateToLocation(item.sku)}
                            title="Find on rack"
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 transition-colors border border-brand-500/30 flex items-center gap-1"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>Location</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Audit Modal */}
      <Modal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title="Stock Count Audit Adjustment"
        subtitle="Perform physical shelf stock audit. Parameterized query in queries/inventory.sql."
      >
        {selectedItem && (
          <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-dark-800 border border-slate-700/60 flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Product for Stock Count</span>
              <span className="font-bold text-white text-sm">{selectedItem.product_name}</span>
              <span className="text-slate-400 font-mono text-[11px]">
                SKU: {selectedItem.sku} • Current View Stock: {selectedItem.total_stock} units
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                New Verified Physical Count (Units)
              </label>
              <input
                type="number"
                min="0"
                required
                value={adjustedQty}
                onChange={(e) => setAdjustedQty(e.target.value)}
                placeholder="Enter count"
                className="form-input text-base font-bold font-mono"
              />
            </div>

            <div className="p-3 rounded-xl bg-dark-900 border border-slate-800 text-slate-400 text-[11px]">
              <span className="font-bold text-brand-400 block mb-0.5">Database View Architecture Note:</span>
              This adjustment executes <code className="text-slate-200 font-mono">queries/inventory.sql (SECTION 3)</code> to update shelf placement. The canonical view <code className="text-brand-300 font-mono">product_stock</code> will automatically recalculate new total stock, stock status, and stock deficit!
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAdjustOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md transition-all"
              >
                Save Verified Count
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
