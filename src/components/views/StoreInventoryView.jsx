import React, { useState, useEffect } from 'react';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { 
  Boxes, 
  Search, 
  Filter, 
  Plus, 
  Code2, 
  Database,
  AlertTriangle,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  AlertCircle
} from 'lucide-react';
import { getInventory } from '../../services/inventoryService';
import { updateProduct, deleteProduct, getCategories } from '../../services/productService';
import { getRacks } from '../../services/rackService';

export default function StoreInventoryView({ onOpenInspector, onAddProduct }) {
  const [items, setItems] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [racksList, setRacksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Notification Banners
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters (User Inputs)
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('ALL');
  const [category, setCategory] = useState('all');

  // Edit Product Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editProd, setEditProd] = useState({
    product_id: null,
    sku: '',
    product_name: '',
    category_id: 1,
    unit_price: 0,
    reorder_level: 10,
    shelf_id: '',
    is_active: true
  });

  // Delete Product Confirmation Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadReferenceData = async () => {
    try {
      const [cats, rks] = await Promise.all([
        getCategories().catch(() => []),
        getRacks().catch(() => [])
      ]);
      setCategoriesList(cats || []);
      setRacksList(rks || []);
    } catch (err) {
      console.warn("Could not load categories or racks:", err);
    }
  };

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
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadInventory();
  }, [searchTerm, status, category]);

  const notify = (msg, isErr = false) => {
    if (isErr) {
      setActionError(msg);
      setActionSuccess(null);
    } else {
      setActionSuccess(msg);
      setActionError(null);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const handleOpenEdit = (item) => {
    setEditProd({
      product_id: item.product_id,
      sku: item.sku || '',
      product_name: item.product_name || '',
      category_id: item.category_id || 1,
      unit_price: Number(item.unit_price || 0),
      reorder_level: Number(item.reorder_level || item.min_stock_level || 10),
      shelf_id: item.shelf_id || '',
      is_active: true
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editProd.product_id) return;
    setIsSubmitting(true);
    try {
      await updateProduct(editProd.product_id, {
        product_name: editProd.product_name.trim(),
        sku: editProd.sku.trim(),
        category_id: parseInt(editProd.category_id, 10),
        unit_price: parseFloat(editProd.unit_price),
        reorder_level: parseInt(editProd.reorder_level, 10),
        shelf_id: editProd.shelf_id ? parseInt(editProd.shelf_id, 10) : null,
        is_active: editProd.is_active
      });
      setIsEditOpen(false);
      notify(`Product "${editProd.product_name}" updated successfully.`);
      loadInventory();
    } catch (err) {
      notify(err.message || "Failed to update product.", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (item) => {
    setDeleteTarget(item);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await deleteProduct(deleteTarget.product_id, false);
      setIsDeleteOpen(false);
      notify(`Product "${deleteTarget.product_name}" deleted/deactivated successfully.`);
      setDeleteTarget(null);
      loadInventory();
    } catch (err) {
      notify(err.message || "Failed to delete product.", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Alert Banners */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Store Inventory</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time stock valuation and inventory control via canonical view <code className="text-brand-300">product_stock</code>.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenInspector('inventory')}
            className="bg-dark-700 hover:bg-dark-600 text-slate-300 font-bold text-xs py-2 px-3 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Code2 className="w-3.5 h-3.5 text-brand-400" />
            <span>SQL Query</span>
          </button>
          {onAddProduct && (
            <button
              onClick={onAddProduct}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-brand-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          )}
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
            placeholder="Filter by product name, SKU..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-slate-700/80 focus:outline-none focus:border-brand-500 rounded-xl text-xs font-semibold text-white placeholder:text-slate-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Items' },
            { id: 'IN_STOCK', label: 'In Stock' },
            { id: 'LOW_STOCK', label: 'Low Stock' },
            { id: 'OUT_OF_STOCK', label: 'Out of Stock' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatus(st.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                status === st.id
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-dark-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Store Inventory Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Inventory Ledger</span>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{items.length} SKUs Listed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-dark-800 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider select-none">
                <th className="p-4">Product & SKU</th>
                <th className="p-4 text-right">Cost Price</th>
                <th className="p-4 text-right">Selling Price</th>
                <th className="p-4 text-right">Projected Profit</th>
                <th className="p-4 text-center">Physical Stock</th>
                <th className="p-4">Stock Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-dark-900/30">
              {error ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-rose-400">
                    <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-rose-400" />
                    <span className="font-bold">{error}</span>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading physical stock from PostgreSQL...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 italic">
                    No items found matching the selected filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const unitPrice = Number(item.unit_price || 0);
                  const costPrice = Number(item.cost_price || (unitPrice * 0.7));
                  const projProfit = (unitPrice - costPrice) * (item.total_stock || 0);

                  return (
                    <tr key={item.product_id} className="hover:bg-dark-700/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white text-xs">{item.product_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.sku} • {item.category}</div>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-400">₹{costPrice.toFixed(2)}</td>
                      <td className="p-4 text-right font-mono font-bold text-white">₹{unitPrice.toFixed(2)}</td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-400">
                        ₹{projProfit.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-bold text-white font-mono text-xs">{item.total_stock}</span>
                        <span className="text-[10px] text-slate-500 block">min: {item.min_stock_level || 10}</span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={item.stock_status} type="stock" />
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Product"
                            className="p-1.5 text-slate-400 hover:text-white bg-dark-700 hover:bg-slate-600 rounded-lg border border-slate-700 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(item)}
                            title="Delete Product"
                            className="p-1.5 text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg border border-rose-500/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* --- EDIT PRODUCT MODAL --- */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Inventory Product"
        subtitle="Update product pricing and reorder levels directly in Supabase PostgreSQL."
      >
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Product Name</label>
            <input
              type="text"
              required
              value={editProd.product_name}
              onChange={(e) => setEditProd({ ...editProd, product_name: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SKU Code</label>
              <input
                type="text"
                required
                value={editProd.sku}
                onChange={(e) => setEditProd({ ...editProd, sku: e.target.value.toUpperCase() })}
                className="form-input font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
              <select
                value={editProd.category_id}
                onChange={(e) => setEditProd({ ...editProd, category_id: e.target.value })}
                className="form-input"
              >
                {categoriesList.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Selling Price (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={editProd.unit_price}
                onChange={(e) => setEditProd({ ...editProd, unit_price: e.target.value })}
                className="form-input font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reorder Level (Min Stock)</label>
              <input
                type="number"
                min="0"
                required
                value={editProd.reorder_level}
                onChange={(e) => setEditProd({ ...editProd, reorder_level: e.target.value })}
                className="form-input font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Product Deletion"
        subtitle="Safely delete or deactivate product from PostgreSQL database."
      >
        <div className="flex flex-col gap-4 text-xs">
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white text-sm">
                Delete "{deleteTarget?.product_name}"?
              </div>
              <p className="text-slate-400 mt-1">
                SKU: <span className="font-mono text-slate-300 font-bold">{deleteTarget?.sku}</span> | Product ID: #{deleteTarget?.product_id}
              </p>
              <p className="text-slate-400 mt-2">
                If transaction history exists in sales or purchase orders, this item will be safely deactivated to protect stock consistency.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
