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
  AlertTriangle 
} from 'lucide-react';
import { getSuppliers, getSupplierProducts, createSupplier } from '../../services/supplierService';

export default function SuppliersView({ onOpenInspector, onNewPOForSupplier }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters (User Inputs)
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('ALL');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierProducts, setSupplierProducts] = useState([]);

  // New Supplier Form
  const [formData, setFormData] = useState({
    supplier_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    status: 'ACTIVE'
  });

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
      loadSuppliers();
    } catch (err) {
      alert("Error adding supplier: " + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
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
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vendor name, contact person, or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-slate-700/80 focus:outline-none focus:border-brand-500 rounded-xl text-xs font-semibold text-white placeholder:text-slate-500"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', 'PREFERRED', 'ACTIVE', 'INACTIVE'].map((st) => (
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

      {/* Suppliers Grid */}
      {error ? (
        <div className="p-8 text-center glass-card rounded-2xl border border-rose-800/40">
          <div className="flex flex-col items-center justify-center gap-2 text-rose-400">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
            <span className="font-bold">{error}</span>
            <button onClick={loadSuppliers} className="mt-2 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-xs font-semibold">
              Retry Connection
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="p-12 text-center glass-card rounded-2xl border border-slate-800">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading suppliers from PostgreSQL...</span>
          </div>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="p-12 text-center glass-card rounded-2xl border border-slate-800 text-slate-500 italic">
          No suppliers found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {suppliers.map((s) => (
          <div key={s.supplier_id} className="glass-card rounded-2xl p-5 flex flex-col justify-between gap-4 glass-card-hover border border-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">{s.supplier_name}</h3>
                <span className="text-xs text-slate-400 font-semibold">{s.contact_name}</span>
              </div>
              <StatusBadge status={s.status} type="supplier" />
            </div>

            {/* Contact details */}
            <div className="flex flex-col gap-1.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{s.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{s.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{s.address || 'Standard warehouse delivery'}</span>
              </div>
            </div>

            {/* Metric pill row */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center">
              <div className="p-2 rounded-xl bg-dark-700/60 border border-slate-800">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Catalog</span>
                <span className="text-xs font-black text-white">{s.total_products_supplied} SKUs</span>
              </div>
              <div className="p-2 rounded-xl bg-dark-700/60 border border-slate-800">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Orders</span>
                <span className="text-xs font-black text-white">{s.total_orders_placed} POs</span>
              </div>
              <div className="p-2 rounded-xl bg-dark-700/60 border border-slate-800">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Spend</span>
                <span className="text-xs font-black text-brand-400">₹{(s.total_procurement_spend / 1000).toFixed(0)}k</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
              <button
                onClick={() => handleOpenProducts(s)}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-300 hover:text-white transition-colors border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>View Products</span>
              </button>
              <button
                onClick={() => onNewPOForSupplier && onNewPOForSupplier(s)}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Create PO</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    )}

      {/* Supplier Products Modal */}
      <Modal
        isOpen={isProductsOpen}
        onClose={() => setIsProductsOpen(false)}
        title={`Products Supplied by ${selectedSupplier?.supplier_name || 'Vendor'}`}
        subtitle="Catalog items currently sourced from this supplier. Query in queries/suppliers.sql."
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
                    <th className="p-3 text-right">Cost Price</th>
                    <th className="p-3 text-right">Selling Price</th>
                    <th className="p-3 text-center">Current Stock</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-dark-900/40">
                  {supplierProducts.map((p) => (
                    <tr key={p.product_id} className="hover:bg-dark-700/30">
                      <td className="p-3">
                        <div className="font-bold text-white">{p.product_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{p.sku}</div>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-400">₹{p.cost_price.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-white font-bold">₹{p.unit_price.toFixed(2)}</td>
                      <td className="p-3 text-center font-bold text-white">{p.total_stock} units</td>
                      <td className="p-3">
                        <StatusBadge status={p.stock_status} type="stock" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register New Supplier"
        subtitle="Insert vendor record into suppliers table. Parameterized query in queries/suppliers.sql."
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company / Vendor Name</label>
              <input
                type="text"
                required
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                placeholder="e.g. Metro Fresh Supplies"
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Primary Contact Name</label>
              <input
                type="text"
                required
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="e.g. Ramesh Patel"
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Business Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="orders@metrofresh.com"
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98200 12345"
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vendor Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-input text-white bg-dark-700"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="PREFERRED">PREFERRED</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Warehouse / Office Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Industrial Area, Phase 1..."
                className="form-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md transition-all"
            >
              Register Supplier
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
