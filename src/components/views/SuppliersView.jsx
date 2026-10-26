import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { 
  Truck, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Package, 
  ClipboardList, 
  DollarSign, 
  Code2, 
  Eye,
  AlertTriangle,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { 
  getSuppliers, 
  getSupplierProducts, 
  createSupplier,
  updateSupplier,
  deleteSupplier 
} from '../../services/supplierService';

export default function SuppliersView({ onOpenInspector, onNewPOForSupplier }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Notifications
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters (User Inputs)
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('ALL');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierProducts, setSupplierProducts] = useState([]);

  // Forms
  const [formData, setFormData] = useState({
    supplier_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    status: 'ACTIVE'
  });

  const [editData, setEditData] = useState({
    supplier_id: null,
    supplier_name: '',
    email: '',
    contact_name: '',
    phone: '',
    address: ''
  });

  const [deleteTarget, setDeleteTarget] = useState(null);

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

  const loadSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSuppliers({ searchTerm, status });
      setSuppliers(res || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Database connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [searchTerm, status]);

  const handleOpenProducts = async (sup) => {
    setSelectedSupplier(sup);
    try {
      const prods = await getSupplierProducts(sup.supplier_id);
      setSupplierProducts(prods || []);
      setIsProductsOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createSupplier(formData);
      setIsAddOpen(false);
      setFormData({
        supplier_name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        status: 'ACTIVE'
      });
      notify("Supplier registered successfully!");
      loadSuppliers();
    } catch (err) {
      notify("Error adding supplier: " + err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (sup) => {
    setEditData({
      supplier_id: sup.supplier_id,
      supplier_name: sup.supplier_name,
      email: sup.email || '',
      contact_name: sup.contact_name || '',
      phone: sup.phone || '',
      address: sup.address || ''
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateSupplier(editData.supplier_id, {
        supplier_name: editData.supplier_name,
        email: editData.email
      });
      setIsEditOpen(false);
      notify(`Supplier #${editData.supplier_id} updated successfully!`);
      loadSuppliers();
    } catch (err) {
      notify("Update failed: " + err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (sup) => {
    setDeleteTarget(sup);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await deleteSupplier(deleteTarget.supplier_id);
      setIsDeleteOpen(false);
      notify(`Supplier '${deleteTarget.supplier_name}' deleted successfully.`);
      setDeleteTarget(null);
      loadSuppliers();
    } catch (err) {
      notify(err.message || "Cannot delete supplier.", true);
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
          <h2 className="text-xl font-extrabold text-white tracking-tight">Suppliers Directory & Procurement</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage authorized vendors, product assortments, and procurement spend.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenInspector('suppliers')}
            className="bg-dark-700 hover:bg-dark-600 text-slate-300 font-bold text-xs py-2 px-3 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Code2 className="w-3.5 h-3.5 text-brand-400" />
            <span>SQL Query</span>
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-brand-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vendor name or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-slate-700/80 focus:outline-none focus:border-brand-500 rounded-xl text-xs font-semibold text-white placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', 'ACTIVE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatus(st)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors whitespace-nowrap ${
                status === st
                  ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                  : 'bg-dark-700 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'All Vendors' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Supplier Cards */}
      {error ? (
        <div className="glass-card rounded-2xl p-8 text-center text-rose-400">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-rose-400" />
          <p className="font-bold">{error}</p>
          <button onClick={loadSuppliers} className="mt-3 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-semibold">
            Retry Connection
          </button>
        </div>
      ) : loading ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading suppliers from PostgreSQL...</span>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-500 italic">
          No suppliers found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div key={s.supplier_id} className="glass-card rounded-2xl p-5 flex flex-col justify-between gap-4 border border-slate-800 hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-white text-sm">{s.supplier_name}</h3>
                    <span className="text-[10px] text-slate-500 font-mono">ID: #{s.supplier_id}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      title="Edit Supplier"
                      className="p-1.5 text-slate-400 hover:text-white bg-dark-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(s)}
                      title="Delete Supplier"
                      className="p-1.5 text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-xs text-slate-400 mt-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{s.email || 'N/A'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-slate-800/80 text-center">
                  <div className="p-2 rounded-xl bg-dark-700/60 border border-slate-800">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Assortment</span>
                    <span className="text-xs font-black text-white">{s.total_products_supplied ?? 0} SKUs</span>
                  </div>
                  <div className="p-2 rounded-xl bg-dark-700/60 border border-slate-800">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Orders Placed</span>
                    <span className="text-xs font-black text-white">{s.total_orders_placed ?? 0} POs</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => onNewPOForSupplier && onNewPOForSupplier(s)}
                  className="w-full py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Create PO</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ADD SUPPLIER MODAL --- */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register New Supplier"
        subtitle="Insert vendor record into supplier table. Validated with parameter bindings."
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company / Vendor Name</label>
            <input
              type="text"
              required
              value={formData.supplier_name}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              placeholder="e.g. Paramount Supplies"
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="orders@paramount.com"
              className="form-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register Vendor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- EDIT SUPPLIER MODAL --- */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Supplier #${editData.supplier_id}`}
        subtitle="Update vendor contact details in PostgreSQL database."
      >
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vendor Name</label>
            <input
              type="text"
              required
              value={editData.supplier_name}
              onChange={(e) => setEditData({ ...editData, supplier_name: e.target.value })}
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email"
              required
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              className="form-input"
            />
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
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- DELETE SUPPLIER MODAL --- */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Supplier Deletion"
        subtitle="Verify foreign-key dependencies before removing vendor."
      >
        <div className="flex flex-col gap-4 text-xs">
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white text-sm">
                Delete supplier "{deleteTarget?.supplier_name}"?
              </div>
              <p className="text-slate-400 mt-1">
                Vendor ID: #{deleteTarget?.supplier_id} | Email: {deleteTarget?.email}
              </p>
              <p className="text-slate-400 mt-2">
                Suppliers referenced in existing purchase orders cannot be deleted because historic procurement records must be preserved.
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
              disabled={isSubmitting}
              onClick={handleDeleteConfirm}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* --- SUPPLIER PRODUCTS MODAL --- */}
      <Modal
        isOpen={isProductsOpen}
        onClose={() => setIsProductsOpen(false)}
        title={`Products Supplied by ${selectedSupplier?.supplier_name || 'Vendor'}`}
        subtitle="Catalog items currently sourced from this supplier. Query in queries/07_supplier_products.sql."
      >
        <div className="flex flex-col gap-3 text-xs">
          {supplierProducts.length === 0 ? (
            <p className="text-slate-500 italic py-4 text-center">No catalog items assigned to this vendor yet.</p>
          ) : (
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-dark-800 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
                    <th className="p-3">SKU & Name</th>
                    <th className="p-3 text-right">Supply Price</th>
                    <th className="p-3 text-center">Lead Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-dark-900/40">
                  {supplierProducts.map((p) => (
                    <tr key={p.product_id} className="hover:bg-dark-700/30">
                      <td className="p-3">
                        <div className="font-bold text-white">{p.product_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{p.sku}</div>
                      </td>
                      <td className="p-3 text-right font-mono text-white font-bold">₹{p.unit_price.toFixed(2)}</td>
                      <td className="p-3 text-center text-slate-300 font-medium">{p.lead_time_days ?? 3} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
