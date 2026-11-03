import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { 
  FolderTree, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Package, 
  Boxes,
  X
} from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/productService';

export default function CategoriesView() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Notification states
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCat, setSelectedCat] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');

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

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setIsSubmitting(true);
    try {
      await createCategory({ category_name: newCategoryName.trim() });
      setIsAddOpen(false);
      setNewCategoryName('');
      notify("Category created successfully!");
      loadCategories();
    } catch (err) {
      notify(err.message || "Failed to create category.", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (cat) => {
    setSelectedCat(cat);
    setEditCategoryName(cat.category_name);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCat || !editCategoryName.trim()) return;
    setIsSubmitting(true);
    try {
      await updateCategory(selectedCat.category_id, { category_name: editCategoryName.trim() });
      setIsEditOpen(false);
      notify(`Category updated to "${editCategoryName.trim()}".`);
      loadCategories();
    } catch (err) {
      notify(err.message || "Failed to update category.", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (cat) => {
    setSelectedCat(cat);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCat) return;
    setIsSubmitting(true);
    try {
      await deleteCategory(selectedCat.category_id);
      setIsDeleteOpen(false);
      notify(`Category "${selectedCat.category_name}" deleted successfully.`);
      setSelectedCat(null);
      loadCategories();
    } catch (err) {
      notify(err.message || "Cannot delete category referenced by products.", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.category_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Categories</h2>
          <p className="text-xs text-slate-500 mt-0.5">Organize inventory catalog hierarchy and product groupings.</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="premium-card rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search categories..."
            className="form-input pl-10"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {filteredCategories.length} Categories
        </span>
      </div>

      {/* Categories Content (Mobile Cards + Desktop Table) */}
      <div className="premium-card rounded-2xl overflow-hidden w-full max-w-full">
        {/* Mobile View (block md:hidden) */}
        <div className="block md:hidden divide-y divide-slate-100 bg-white">
          {error ? (
            <div className="p-6 text-center text-rose-600 text-xs">
              <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-rose-500" />
              <span className="font-semibold">{error}</span>
            </div>
          ) : loading ? (
            <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
              <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading categories...</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic text-xs">
              No categories found.
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div key={cat.category_id} className="p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400 font-semibold">#{cat.category_id}</span>
                    <h4 className="font-bold text-slate-900 text-sm truncate">{cat.category_name}</h4>
                  </div>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
                      <Package className="w-2.5 h-2.5" />
                      {cat.product_count ?? 0} SKUs
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center touch-manipulation shadow-xs"
                    title="Edit Category"
                  >
                    <Edit2 className="w-4 h-4 text-teal-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDelete(cat)}
                    className="w-9 h-9 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center touch-manipulation"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="p-4">ID</th>
                <th className="p-4">Category Name</th>
                <th className="p-4 text-center">Assigned Products</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {error ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-rose-600">
                    <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-rose-500" />
                    <span className="font-semibold">{error}</span>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading categories from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-400 italic">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.category_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-mono font-semibold text-slate-400">#{cat.category_id}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-xs">{cat.category_name}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
                        <Package className="w-3 h-3" />
                        {cat.product_count ?? 0} SKUs
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cat)}
                          title="Edit Category"
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg border border-slate-200 transition-colors touch-manipulation"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(cat)}
                          title="Delete Category"
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors touch-manipulation"
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

      {/* --- ADD CATEGORY MODAL --- */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Category"
        subtitle="Create a new classification for store inventory."
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Category Name</label>
            <input
              type="text"
              required
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Beverages, Dairy, Hardware"
              className="form-input text-xs"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- EDIT CATEGORY MODAL --- */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Category"
        subtitle="Rename category in Supabase PostgreSQL."
      >
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Category Name</label>
            <input
              type="text"
              required
              value={editCategoryName}
              onChange={(e) => setEditCategoryName(e.target.value)}
              className="form-input text-xs"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
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
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Category Deletion"
        subtitle="Validate foreign-key dependencies before removal."
      >
        <div className="flex flex-col gap-4 text-xs">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900 text-sm">
                Delete "{selectedCat?.category_name}"?
              </div>
              <p className="text-slate-600 mt-1">
                Category ID: <span className="font-mono font-semibold">#{selectedCat?.category_id}</span>
              </p>
              <p className="text-slate-500 mt-2">
                PostgreSQL foreign-key rules prevent deletion if any product is assigned to this category.
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
