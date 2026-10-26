import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { 
  Truck, 
  Search, 
  Plus, 
  Mail, 
  ClipboardList, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Package
} from 'lucide-react';
import { 
  getSuppliers, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier 
} from '../../services/supplierService';

export default function SuppliersView({ onNewPOForSupplier }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Notifications
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('ALL');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    supplier_name: '',
    email: '',
    phone: ''
  });

  const [editData, setEditData] = useState({
    supplier_id: null,
    supplier_name: '',
    email: ''
  });

  const [deleteTarget, setDeleteTarget] = useState(null);

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

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplier_name.trim()) return;
    setIsSubmitting(true);
    try {
      await createSupplier({
        supplier_name: formData.supplier_name.trim(),
        email: formData.email.trim()
      });
      setIsAddOpen(false);
      setFormData({ supplier_name: '', email: '', phone: '' });
      notify("New supplier registered successfully!");
      loadSuppliers();
    } catch (err) {
      notify("Failed to add supplier: " + err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (s) => {
    setEditData({
      supplier_id: s.supplier_id,
      supplier_name: s.supplier_name,
      email: s.email || ''
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editData.supplier_id || !editData.supplier_name.trim()) return;
    setIsSubmitting(true);
    try {
      await updateSupplier(editData.supplier_id, {
        supplier_name: editData.supplier_name.trim(),
        email: editData.email.trim()
      });
      setIsEditOpen(false);
      notify(`Supplier #${editData.supplier_id} updated.`);
      loadSuppliers();
    } catch (err) {
      notify("Update error: " + err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (s) => {
    setDeleteTarget(s);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await deleteSupplier(deleteTarget.supplier_id);
      setIsDeleteOpen(false);
      notify(`Supplier "${deleteTarget.supplier_name}" deleted.`);
      setDeleteTarget(null);
      loadSuppliers();
    } catch (err) {
      notify(err.message || "Cannot delete supplier referenced in purchase orders.", true);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Suppliers</h2>
          <p className="text-xs text-slate-500 mt-0.5">Authorized vendors, contact profiles, and procurement spend.</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="premium-card rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vendor name or email..."
            className="form-input pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'ACTIVE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatus(st)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap ${
                status === st
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white border-transparent shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st === 'ALL' ? 'All Vendors' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Supplier Cards */}
      {error ? (
        <div className="premium-card rounded-2xl p-8 text-center text-rose-600">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
          <p className="font-semibold">{error}</p>
          <button onClick={loadSuppliers} className="mt-3 btn-secondary mx-auto">
            Retry Connection
          </button>
        </div>
      ) : loading ? (
        <div className="premium-card rounded-2xl p-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading suppliers from database...</span>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="premium-card rounded-2xl p-12 text-center text-slate-400 italic">
          No suppliers found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div key={s.supplier_id} className="premium-card rounded-2xl p-5 flex flex-col justify-between gap-4 premium-card-hover">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{s.supplier_name}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">Vendor ID: #{s.supplier_id}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      title="Edit Supplier"
                      className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg border border-slate-200 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(s)}
                      title="Delete Supplier"
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-xs text-slate-600 mt-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{s.email || 'N/A'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-slate-100 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Assortment</span>
                    <span className="text-xs font-bold text-slate-800">{s.total_products_supplied ?? 0} SKUs</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Orders Placed</span>
                    <span className="text-xs font-bold text-slate-800">{s.total_orders_placed ?? 0} POs</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => onNewPOForSupplier && onNewPOForSupplier(s)}
                  className="w-full btn-secondary"
                >
                  <ClipboardList className="w-3.5 h-3.5 text-teal-600" />
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
        subtitle="Insert vendor record into supplier table."
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Company / Vendor Name</label>
            <input
              type="text"
              required
              value={formData.supplier_name}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              placeholder="e.g. Apex Distribution Ltd"
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Business Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="orders@supplier.com"
              className="form-input"
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
              {isSubmitting ? 'Registering...' : 'Register Vendor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- EDIT SUPPLIER MODAL --- */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Supplier Contact"
        subtitle="Update supplier contact information in Supabase."
      >
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Supplier Name</label>
            <input
              type="text"
              required
              value={editData.supplier_name}
              onChange={(e) => setEditData({ ...editData, supplier_name: e.target.value })}
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Business Email</label>
            <input
              type="email"
              required
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              className="form-input"
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

      {/* --- DELETE SUPPLIER CONFIRMATION MODAL --- */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Supplier Deletion"
        subtitle="Safely handle vendor removal."
      >
        <div className="flex flex-col gap-4 text-xs">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900 text-sm">
                Delete supplier "{deleteTarget?.supplier_name}"?
              </div>
              <p className="text-slate-600 mt-1">
                Vendor ID: #{deleteTarget?.supplier_id} | Email: {deleteTarget?.email}
              </p>
              <p className="text-slate-500 mt-2">
                Suppliers referenced in existing purchase orders cannot be deleted because historic procurement records must be preserved.
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
