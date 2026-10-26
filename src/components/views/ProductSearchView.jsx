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
  AlertTriangle,
  Edit2,
  Trash2,
  FolderTree,
  X,
  AlertCircle
} from 'lucide-react';
import { 
  searchProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../../services/productService';
import { getRacks } from '../../services/rackService';
import { MOCK_SUPPLIERS } from '../../data/mockData';

export default function ProductSearchView({ onOpenInspector, onNavigateToLocation }) {
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
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Active form objects
  const [newProd, setNewProd] = useState({
    sku: '',
    product_name: '',
    category_id: 1,
    cost_price: '',
    unit_price: '',
    reorder_level: 10,
    shelf_id: '',
    supplier_id: '1',
    description: ''
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

  // Category Management Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  const loadReferenceData = async () => {
    try {
      const [cats, rks] = await Promise.all([
        getCategories().catch(() => []),
        getRacks().catch(() => [])
      ]);
      setCategoriesList(cats || []);
      setRacksList(rks || []);
    } catch (err) {
      console.warn("Reference data load error:", err);
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
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [searchTerm, category, status, sortBy, minPrice, maxPrice]);

  const notify = (msg, isErr = false) => {
    if (isErr) {
      setActionError(msg);
      setActionSuccess(null);
    } else {
      setActionSuccess(msg);
      setActionError(null);
    }
    setTimeout(() => {
      setActionSuccess(null);
      setActionError(null);
    }, 4500);
  };

  // --- CRUD HANDLERS FOR PRODUCTS ---

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createProduct({
        ...newProd,
        unit_price: parseFloat(newProd.unit_price) || 0,
        cost_price: parseFloat(newProd.cost_price) || (parseFloat(newProd.unit_price) * 0.7),
        reorder_level: parseInt(newProd.reorder_level, 10) || 10,
        shelf_id: newProd.shelf_id ? parseInt(newProd.shelf_id, 10) : null
      });
      setIsAddModalOpen(false);
      setNewProd({
        sku: '',
        product_name: '',
        category_id: categoriesList[0]?.category_id || 1,
        cost_price: '',
        unit_price: '',
        reorder_level: 10,
        shelf_id: '',
        supplier_id: '1',
        description: ''
      });
      notify("Product created successfully in database!");
      loadProducts();
      loadReferenceData();
    } catch (err) {
      notify("Error adding product: " + err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (p) => {
    const matchedCat = categoriesList.find(c => c.category_name?.toLowerCase() === p.category?.toLowerCase());
    setEditProd({
      product_id: p.product_id,
      sku: p.sku,
      product_name: p.product_name,
      category_id: matchedCat ? matchedCat.category_id : (p.category_id || 1),
      unit_price: p.unit_price,
      reorder_level: p.reorder_level || 10,
      shelf_id: p.shelf_id || '',
      is_active: p.is_active !== false
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateProduct(editProd.product_id, {
        product_name: editProd.product_name,
        sku: editProd.sku,
        category_id: parseInt(editProd.category_id, 10),
        unit_price: parseFloat(editProd.unit_price),
        reorder_level: parseInt(editProd.reorder_level, 10),
        shelf_id: editProd.shelf_id ? parseInt(editProd.shelf_id, 10) : null,
        is_active: editProd.is_active
      });
      setIsEditModalOpen(false);
      notify(`Product #${editProd.product_id} updated successfully!`);
      loadProducts();
    } catch (err) {
      notify("Update failed: " + err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (p) => {
    setDeleteTarget(p);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async (hard = false) => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await deleteProduct(deleteTarget.product_id, hard);
      setIsDeleteModalOpen(false);
      notify(`Product '${deleteTarget.product_name}' was successfully removed/deactivated.`);
      setDeleteTarget(null);
      loadProducts();
    } catch (err) {
      notify(err.message || "Failed to delete product.", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- CATEGORY CRUD HANDLERS ---

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setIsSubmitting(true);
    try {
      await createCategory({ category_name: newCategoryName.trim() });
      setNewCategoryName('');
      notify("Category created successfully!");
      loadReferenceData();
    } catch (err) {
      notify(err.message || "Failed to create category.", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategory = async (catId) => {
    if (!editingCategoryName.trim()) return;
    setIsSubmitting(true);
    try {
      await updateCategory(catId, { category_name: editingCategoryName.trim() });
      setEditingCategoryId(null);
      setEditingCategoryName('');
      notify("Category updated successfully!");
      loadReferenceData();
      loadProducts();
    } catch (err) {
      notify(err.message || "Failed to update category.", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Are you sure you want to delete category '${catName}'?`)) return;
    setIsSubmitting(true);
    try {
      await deleteCategory(catId);
      notify(`Category '${catName}' deleted successfully!`);
      loadReferenceData();
      loadProducts();
    } catch (err) {
      notify(err.message || "Cannot delete category due to active product dependencies.", true);
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

      {/* View Header with Add Product & Category Management */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Product Catalog & Inventory Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">Filter items, edit catalog specifications, and manage product categories.</p>
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
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-dark-700 hover:bg-dark-600 text-slate-200 font-bold text-xs py-2 px-3.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <FolderTree className="w-3.5 h-3.5 text-amber-400" />
            <span>Manage Categories</span>
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
                {st === 'ALL' ? 'All Statuses' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/60">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-input text-xs"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name} ({c.product_count ?? 0})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sort Catalog</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-input text-xs"
            >
              <option value="newest">Newest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
              <option value="stock-desc">Highest Stock Units</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Min Price (₹)</label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0.00"
              className="form-input text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Max Price (₹)</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="No limit"
              className="form-input text-xs"
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
                <th className="p-4 text-right">Selling Price</th>
                <th className="p-4 text-center">Live Stock</th>
                <th className="p-4 text-center">Shelf Location</th>
                <th className="p-4">Stock Status</th>
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
                      <button onClick={loadProducts} className="mt-2 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-xs font-semibold">
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
                      <span>Querying PostgreSQL database...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 italic">
                    No products matched your search or filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.product_id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white text-xs">{p.product_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.sku}</div>
                    </td>
                    <td className="p-4 text-slate-300 font-medium">
                      <span className="px-2 py-0.5 bg-dark-700 border border-slate-700/80 rounded-md text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-white">₹{p.unit_price.toFixed(2)}</td>
                    <td className="p-4 text-center font-bold text-white">
                      {p.total_stock} <span className="text-[10px] text-slate-500 font-normal">units</span>
                    </td>
                    <td className="p-4 text-center font-mono text-slate-300">
                      {p.rack_code ? `${p.rack_code}-${p.shelf_number || 'S1'}` : <span className="text-slate-500 italic">Unassigned</span>}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={p.stock_status} type="stock" />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigateToLocation && onNavigateToLocation(p.sku)}
                          title="View Shelf Location"
                          className="px-2 py-1 text-[11px] font-bold rounded-lg bg-dark-700 hover:bg-dark-600 text-brand-400 border border-slate-700"
                        >
                          Locate
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Product"
                          className="p-1.5 text-slate-300 hover:text-white bg-dark-700 hover:bg-slate-600 rounded-lg border border-slate-700 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(p)}
                          title="Delete / Deactivate Product"
                          className="p-1.5 text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg border border-rose-500/20 transition-colors"
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
        title="Add New Catalog Product"
        subtitle="Insert a new SKU into PostgreSQL database. Validated with parameter bindings."
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SKU Code</label>
              <input
                type="text"
                required
                value={newProd.sku}
                onChange={(e) => setNewProd({ ...newProd, sku: e.target.value.toUpperCase() })}
                placeholder="e.g. EL107"
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
                placeholder="e.g. Ergonomic Keyboard"
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
              <select
                value={newProd.category_id}
                onChange={(e) => setNewProd({ ...newProd, category_id: e.target.value })}
                className="form-input text-white bg-dark-700"
              >
                {categoriesList.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Shelf Assignment</label>
              <input
                type="number"
                value={newProd.shelf_id}
                onChange={(e) => setNewProd({ ...newProd, shelf_id: e.target.value })}
                placeholder="Shelf ID (e.g. 11, 12)"
                className="form-input"
              />
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
                value={newProd.unit_price}
                onChange={(e) => setNewProd({ ...newProd, unit_price: e.target.value })}
                placeholder="0.00"
                className="form-input font-mono font-bold text-brand-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reorder Alert Level</label>
              <input
                type="number"
                min="0"
                required
                value={newProd.reorder_level}
                onChange={(e) => setNewProd({ ...newProd, reorder_level: e.target.value })}
                placeholder="10"
                className="form-input font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- EDIT PRODUCT MODAL --- */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Product #${editProd.product_id}`}
        subtitle="Update product fields with live database synchronization."
      >
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SKU Code</label>
              <input
                type="text"
                required
                value={editProd.sku}
                onChange={(e) => setEditProd({ ...editProd, sku: e.target.value.toUpperCase() })}
                className="form-input font-mono"
              />
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
              <select
                value={editProd.category_id}
                onChange={(e) => setEditProd({ ...editProd, category_id: e.target.value })}
                className="form-input text-white bg-dark-700"
              >
                {categoriesList.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Shelf ID</label>
              <input
                type="number"
                value={editProd.shelf_id}
                onChange={(e) => setEditProd({ ...editProd, shelf_id: e.target.value })}
                placeholder="Unassigned (leave empty)"
                className="form-input"
              />
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
                className="form-input font-mono font-bold text-brand-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reorder Level</label>
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

          <div className="flex items-center gap-2 p-3 bg-dark-700/50 rounded-xl border border-slate-700/60">
            <input
              type="checkbox"
              id="edit-is-active"
              checked={editProd.is_active}
              onChange={(e) => setEditProd({ ...editProd, is_active: e.target.checked })}
              className="rounded bg-dark-800 border-slate-700 text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="edit-is-active" className="text-xs font-semibold text-slate-200 cursor-pointer">
              Product is Active (unchecking will deactivate item from store inventory)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Product Deletion / Deactivation"
        subtitle="Ensure database transaction integrity and audit safety."
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
                If this product has associated sales or purchase orders, PostgreSQL transaction rules will safely <strong>deactivate</strong> it instead of corrupting historical sales audits.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleDeleteConfirm(false)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Deactivation'}
            </button>
          </div>
        </div>
      </Modal>

      {/* --- CATEGORY MANAGEMENT MODAL --- */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Category Management"
        subtitle="Add, edit, or delete product categories with dependency integrity protection."
      >
        <div className="flex flex-col gap-4 text-xs">
          {/* Add Category Form */}
          <form onSubmit={handleCreateCategory} className="flex gap-2">
            <input
              type="text"
              required
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name (e.g. Beverages)..."
              className="form-input flex-1"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newCategoryName.trim()}
              className="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Categories List */}
          <div className="rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800/60 bg-dark-800/40 max-h-72 overflow-y-auto">
            {categoriesList.map((cat) => (
              <div key={cat.category_id} className="p-3 flex items-center justify-between hover:bg-dark-700/30 transition-colors">
                {editingCategoryId === cat.category_id ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      className="form-input py-1 text-xs"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateCategory(cat.category_id)}
                      className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-[11px]"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCategoryId(null)}
                      className="px-2 py-1 bg-dark-700 text-slate-400 rounded-lg text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    <span className="font-bold text-white text-xs">{cat.category_name}</span>
                    <span className="ml-2 text-[10px] text-slate-400 bg-dark-700 px-1.5 py-0.5 rounded-full font-mono">
                      {cat.product_count ?? 0} products
                    </span>
                  </div>
                )}

                {editingCategoryId !== cat.category_id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingCategoryId(cat.category_id);
                        setEditingCategoryName(cat.category_name);
                      }}
                      className="p-1 text-slate-400 hover:text-white hover:bg-dark-700 rounded-lg"
                      title="Rename Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.category_id, cat.category_name)}
                      className="p-1 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 rounded-lg"
                      title={cat.product_count > 0 ? "Cannot delete: products reference this category" : "Delete Category"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 bg-dark-700/40 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>Categories referenced by active products cannot be deleted until those products are reassigned or removed first.</span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsCategoryModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
