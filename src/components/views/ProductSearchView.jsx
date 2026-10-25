import React, { useState, useEffect } from 'react';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { 
  Search, 
  Filter, 
  Plus, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Package, 
  Tag, 
  DollarSign, 
  Truck, 
  Layers, 
  CheckCircle2, 
  Code2,
  AlertTriangle 
} from 'lucide-react';
import { searchProducts, createProduct } from '../../services/productService';
import { MOCK_SUPPLIERS } from '../../data/mockData';

export default function ProductSearchView({ onOpenInspector, onNavigateToLocation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search States (User Inputs)
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Product Form State
  const [newProd, setNewProd] = useState({
    sku: '',
    product_name: '',
    category: 'Electronics',
    cost_price: '',
    unit_price: '',
    min_stock_level: 10,
    supplier_id: '1',
    description: ''
  });

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchProducts({
        searchTerm,
        category,
        status,
        sortBy,
        minPrice: minPrice ? parseFloat(minPrice) : 0,
        maxPrice: maxPrice ? parseFloat(maxPrice) : Infinity,
      });
      setProducts(res || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Database error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchTerm, category, status, sortBy, minPrice, maxPrice]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await createProduct(newProd);
      setIsAddModalOpen(false);
      setNewProd({
        sku: '',
        product_name: '',
        category: 'Electronics',
        cost_price: '',
        unit_price: '',
        min_stock_level: 10,
        supplier_id: '1',
        description: ''
      });
      loadProducts();
    } catch (err) {
      alert("Error adding product: " + err.message);
    }
  };

  const categories = [
    'all',
    'Electronics',
    'Stationery',
    'Furniture'
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* View Header with Add Product */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Product Catalog & Search</h2>
          <p className="text-xs text-slate-400 mt-0.5">Filter items by keyword, categories, price thresholds, and live stock statuses.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenInspector('products')}
            className="bg-dark-700 hover:bg-dark-600 text-slate-300 font-bold text-xs py-2 px-3 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <Code2 className="w-3.5 h-3.5 text-brand-400" />
            <span>SQL Query</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-brand-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Controls & Filter Toolbar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch justify-between">
          {/* Search Input */}
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

          {/* Status Quick Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'].map((st) => (
              <button
                key={st}
                onClick={() => setStatus(st)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors whitespace-nowrap ${
                  status === st
                    ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                    : 'bg-dark-700 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'All Items' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-800/60">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-input text-white bg-dark-700 cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sort Ordering</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-input text-white bg-dark-700 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Lowest First)</option>
              <option value="price-desc">Price (Highest First)</option>
              <option value="stock-desc">Highest Stock Count</option>
              <option value="margin-desc">Highest Margin %</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Min Price (₹)</label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0.00"
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Max Price (₹)</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="No limit"
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Catalog Listings</span>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{products.length} Products Found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-dark-800 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider select-none">
                <th className="p-4">SKU & Product Name</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Cost Price</th>
                <th className="p-4 text-right">Selling Price</th>
                <th className="p-4 text-right">Profit Margin</th>
                <th className="p-4 text-center">Live Stock</th>
                <th className="p-4">Stock Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-dark-900/30">
              {error ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-rose-400">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <span className="font-bold">{error}</span>
                      <button onClick={loadProducts} className="mt-2 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-xs font-semibold">
                        Retry Connection
                      </button>
                    </div>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Querying PostgreSQL database...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500 italic">
                    No products matched your search or filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const marginPct = (((p.unit_price - p.cost_price) / p.unit_price) * 100).toFixed(1);

                  return (
                    <tr key={p.product_id} className="hover:bg-dark-700/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white text-xs">{p.product_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.sku}</div>
                      </td>
                      <td className="p-4 text-slate-300 font-medium">{p.category}</td>
                      <td className="p-4 text-right font-mono text-slate-400">₹{p.cost_price.toFixed(2)}</td>
                      <td className="p-4 text-right font-mono font-bold text-white">₹{p.unit_price.toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <span className="font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                          +{marginPct}%
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-white">
                        {p.total_stock} <span className="text-[10px] text-slate-500 font-normal">units</span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={p.stock_status} type="stock" />
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => onNavigateToLocation && onNavigateToLocation(p.sku)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-dark-700 hover:bg-dark-600 text-brand-400 hover:text-brand-300 transition-colors border border-slate-700"
                        >
                          Find Rack
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

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Catalog Product"
        subtitle="Insert a new SKU into the database catalog. Parameterized query in queries/products.sql."
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SKU Code</label>
              <input
                type="text"
                required
                value={newProd.sku}
                onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })}
                placeholder="e.g. SKU-CARE-205"
                className="form-input font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Product Name</label>
              <input
                type="text"
                required
                value={newProd.product_name}
                onChange={(e) => setNewProd({ ...newProd, product_name: e.target.value })}
                placeholder="e.g. Dove Moisture Shampoo (250ml)"
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
              <select
                value={newProd.category}
                onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                className="form-input text-white bg-dark-700"
              >
                {categories.filter(c => c !== 'all').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Supplier</label>
              <select
                value={newProd.supplier_id}
                onChange={(e) => setNewProd({ ...newProd, supplier_id: e.target.value })}
                className="form-input text-white bg-dark-700"
              >
                {MOCK_SUPPLIERS.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cost Price (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={newProd.cost_price}
                onChange={(e) => setNewProd({ ...newProd, cost_price: e.target.value })}
                placeholder="0.00"
                className="form-input font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sell Price (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={newProd.unit_price}
                onChange={(e) => setNewProd({ ...newProd, unit_price: e.target.value })}
                placeholder="0.00"
                className="form-input font-mono font-bold text-brand-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Min Alert Stock</label>
              <input
                type="number"
                required
                value={newProd.min_stock_level}
                onChange={(e) => setNewProd({ ...newProd, min_stock_level: e.target.value })}
                placeholder="20"
                className="form-input font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description / Notes</label>
            <textarea
              rows="2"
              value={newProd.description}
              onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
              placeholder="Packaging details, handling instructions..."
              className="form-input resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md transition-all"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
