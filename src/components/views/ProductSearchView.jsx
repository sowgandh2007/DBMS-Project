import React, { useState, useEffect } from 'react';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { 
  Search, 
  Plus, 
  Package, 
  Tag, 
  CheckCircle2, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  X, 
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  searchProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getCategories 
} from '../../services/productService';
import { getRacks } from '../../services/rackService';

export default function ProductSearchView({ onNavigateToLocation }) {
  const [products, setProducts] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [racksList, setRacksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User Notifications
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination (Compact)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active form objects
  const [newProd, setNewProd] = useState({
    sku: '',
    product_name: '',
    category_id: 1,
    unit_price: '',
    reorder_level: 10,
    shelf_id: ''
  });

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

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchProducts({
        searchTerm,
        category,
        status,
        sortBy
      });
      setProducts(res || []);
      setCurrentPage(1);
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
    loadProducts();
  }, [searchTerm, category, status, sortBy]);

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

  // Add Product Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createProduct({
        product_name: newProd.product_name.trim(),
        sku: newProd.sku.trim(),
        category_id: parseInt(newProd.category_id, 10),
        unit_price: parseFloat(newProd.unit_price) || 0,
        reorder_level: parseInt(newProd.reorder_level, 10) || 10,
        shelf_id: newProd.shelf_id ? parseInt(newProd.shelf_id, 10) : null
      });
      setIsAddModalOpen(false);
      setNewProd({
        sku: '',
        product_name: '',
        category_id: 1,
        unit_price: '',
        reorder_level: 10,
        shelf_id: ''
      });
      notify("New product added to catalog successfully!");
      loadProducts();
    } catch (err) {
      notify(err.message || "Failed to create product.", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Product Submit
  const handleOpenEdit = (p) => {
    setEditProd({
      product_id: p.product_id,
      sku: p.sku || '',
      product_name: p.product_name || '',
      category_id: p.category_id || 1,
      unit_price: p.unit_price ?? 0,
      reorder_level: p.reorder_level ?? 10,
      shelf_id: p.shelf_id || '',
      is_active: p.is_active !== false
    });
    setIsEditModalOpen(true);
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
      setIsEditModalOpen(false);
      notify(`Product "${editProd.product_name}" updated successfully.`);
      loadProducts();
    } catch (err) {
      notify(err.message || "Failed to update product.", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Product
  const handleOpenDelete = (p) => {
    setDeleteTarget(p);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await deleteProduct(deleteTarget.product_id, false);
      setIsDeleteOpen(false);
      notify(`Product "${deleteTarget.product_name}" removed/deactivated successfully.`);
      setDeleteTarget(null);
      loadProducts();
    } catch (err) {
      notify(err.message || "Cannot delete product.", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(products.length / pageSize) || 1;
  const paginatedProducts = products.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Alert Banners */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Products</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage SKUs, categories, selling prices, and storage locations.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="premium-card rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="form-input pl-10"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-input text-xs w-auto cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categoriesList.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="form-input text-xs w-auto cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-input text-xs w-auto cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="premium-card rounded-2xl overflow-hidden">
        <div className="p-3.5 px-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-4 h-4 text-teal-600" />
            Catalog Listings ({products.length})
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider select-none">
                <th className="p-3.5 pl-4">Product & SKU</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 text-right">Selling Price</th>
                <th className="p-3.5 text-center">Stock</th>
                <th className="p-3.5 text-center">Rack Location</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {error ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-rose-600">
                    <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-rose-500" />
                    <span className="font-semibold">{error}</span>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading products from database...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 italic">
                    No products matched your search or filters.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => (
                  <tr key={p.product_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 pl-4">
                      <div className="font-bold text-slate-900 text-xs">{p.product_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      ₹{p.unit_price.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-900">
                      {p.total_stock} <span className="text-[10px] text-slate-400 font-normal">units</span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-mono text-[11px] font-semibold border border-sky-200/80">
                        {p.rack_code ? `${p.rack_code}-${p.shelf_number || 'S1'}` : 'Unassigned'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={p.stock_status} type="stock" />
                    </td>
                    <td className="p-3.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Product"
                          className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg border border-slate-200 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(p)}
                          title="Delete Product"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD PRODUCT MODAL --- */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Catalog Product"
        subtitle="Insert a new SKU into PostgreSQL database."
      >
        <form onSubmit={handleAddSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Product Name</label>
            <input
              type="text"
              required
              value={newProd.product_name}
              onChange={(e) => setNewProd({ ...newProd, product_name: e.target.value })}
              placeholder="e.g. Wireless Mouse"
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">SKU Code</label>
              <input
                type="text"
                required
                value={newProd.sku}
                onChange={(e) => setNewProd({ ...newProd, sku: e.target.value.toUpperCase() })}
                placeholder="e.g. EL-204"
                className="form-input font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Category</label>
              <select
                value={newProd.category_id}
                onChange={(e) => setNewProd({ ...newProd, category_id: e.target.value })}
                className="form-input cursor-pointer"
              >
                {categoriesList.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Selling Price (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={newProd.unit_price}
                onChange={(e) => setNewProd({ ...newProd, unit_price: e.target.value })}
                placeholder="0.00"
                className="form-input font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Reorder Level (Min Stock)</label>
              <input
                type="number"
                min="0"
                required
                value={newProd.reorder_level}
                onChange={(e) => setNewProd({ ...newProd, reorder_level: e.target.value })}
                className="form-input font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- EDIT PRODUCT MODAL --- */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Product"
        subtitle="Update product pricing and inventory settings in Supabase."
      >
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Product Name</label>
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
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">SKU Code</label>
              <input
                type="text"
                required
                value={editProd.sku}
                onChange={(e) => setEditProd({ ...editProd, sku: e.target.value.toUpperCase() })}
                className="form-input font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Category</label>
              <select
                value={editProd.category_id}
                onChange={(e) => setEditProd({ ...editProd, category_id: e.target.value })}
                className="form-input cursor-pointer"
              >
                {categoriesList.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Selling Price (₹)</label>
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
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Reorder Level</label>
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

          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="edit-is-active"
              checked={editProd.is_active}
              onChange={(e) => setEditProd({ ...editProd, is_active: e.target.checked })}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="edit-is-active" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Active in store inventory
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Product Deletion"
        subtitle="Safely manage product removal."
      >
        <div className="flex flex-col gap-4 text-xs">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900 text-sm">
                Delete "{deleteTarget?.product_name}"?
              </div>
              <p className="text-slate-600 mt-1">
                SKU: <span className="font-mono font-semibold">{deleteTarget?.sku}</span> | ID: #{deleteTarget?.product_id}
              </p>
              <p className="text-slate-500 mt-2">
                If historic purchase orders or sales exist, this SKU will be safely deactivated to protect inventory calculations.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-2 px-3.5 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
