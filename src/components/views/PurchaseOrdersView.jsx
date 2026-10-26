import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { 
  ClipboardList, 
  Search, 
  Plus, 
  PackageCheck, 
  Calendar, 
  Building2, 
  DollarSign, 
  Code2, 
  Eye, 
  Trash2,
  Edit2,
  CheckCircle2,
  Boxes,
  AlertTriangle,
  AlertCircle,
  X
} from 'lucide-react';
import { 
  getPurchaseOrders, 
  createPurchaseOrder, 
  updatePurchaseOrder,
  deletePurchaseOrder,
  receiveShipment 
} from '../../services/purchaseOrderService';
import { getSuppliers } from '../../services/supplierService';
import { searchProducts } from '../../services/productService';
import { MOCK_SUPPLIERS, MOCK_PRODUCT_STOCK, MOCK_SHELVES } from '../../data/mockData';

export default function PurchaseOrdersView({ onOpenInspector, prefilledItem = null, prefilledSupplier = null }) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Notifications
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [status, setStatus] = useState('ALL');
  const [supplierId, setSupplierId] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  // Edit PO Form state
  const [editPoData, setEditPoData] = useState({
    po_id: null,
    supplier_id: 1,
    status: 'Pending'
  });

  // Receive into rack shelf form state
  const [receiveShelfId, setReceiveShelfId] = useState('');

  // New PO Form state
  const [newPoData, setNewPoData] = useState({
    supplier_id: prefilledSupplier ? prefilledSupplier.supplier_id : 1,
    order_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    status: 'Pending',
    items: prefilledItem ? [
      {
        product_id: prefilledItem.product_id,
        sku: prefilledItem.sku,
        product_name: prefilledItem.product_name,
        quantity_ordered: prefilledItem.suggested_reorder_qty || 25,
        unit_cost: prefilledItem.cost_price || 50
      }
    ] : [
      {
        product_id: 101,
        sku: 'EL101',
        product_name: 'Wireless Mouse',
        quantity_ordered: 20,
        unit_cost: 350
      }
    ]
  });

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

  const loadReference = async () => {
    try {
      const [sups, prods] = await Promise.all([
        getSuppliers().catch(() => MOCK_SUPPLIERS),
        searchProducts().catch(() => MOCK_PRODUCT_STOCK)
      ]);
      setSuppliersList(sups || []);
      setProductsList(prods || []);
    } catch (err) {
      console.warn(err);
    }
  };

  const loadPOs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPurchaseOrders({
        status,
        supplierId,
        fromDate,
        toDate
      });
      setPurchaseOrders(res || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Database connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReference();
  }, []);

  useEffect(() => {
    loadPOs();
  }, [status, supplierId, fromDate, toDate]);

  useEffect(() => {
    if (prefilledItem || prefilledSupplier) {
      setIsCreateOpen(true);
    }
  }, [prefilledItem, prefilledSupplier]);

  const handleAddItemToPO = () => {
    const firstProd = productsList[0] || { product_id: 101, sku: 'EL101', product_name: 'Item', cost_price: 50 };
    setNewPoData({
      ...newPoData,
      items: [
        ...newPoData.items,
        {
          product_id: firstProd.product_id,
          sku: firstProd.sku,
          product_name: firstProd.product_name,
          quantity_ordered: 10,
          unit_cost: firstProd.cost_price || 50
        }
      ]
    });
  };

  const handleRemoveItem = (index) => {
    const updated = [...newPoData.items];
    updated.splice(index, 1);
    setNewPoData({ ...newPoData, items: updated });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createPurchaseOrder({
        supplier_id: parseInt(newPoData.supplier_id, 10),
        status: newPoData.status || 'Pending',
        items: newPoData.items.map(it => ({
          product_id: parseInt(it.product_id, 10),
          quantity: parseInt(it.quantity_ordered, 10) || 1,
          unit_cost: parseFloat(it.unit_cost) || 50.0
        }))
      });
      setIsCreateOpen(false);
      notify("Purchase order created successfully!");
      loadPOs();
    } catch (err) {
      notify("Error creating purchase order: " + err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (po) => {
    if (po.status === 'Received') {
      notify("Cannot edit a Received purchase order as stock was already added to inventory.", true);
      return;
    }
    setSelectedPO(po);
    setEditPoData({
      po_id: po.po_id,
      supplier_id: po.supplier_id,
      status: po.status
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updatePurchaseOrder(editPoData.po_id, {
        supplier_id: parseInt(editPoData.supplier_id, 10),
        status: editPoData.status
      });
      setIsEditOpen(false);
      notify(`Purchase order #${editPoData.po_id} updated successfully!`);
      loadPOs();
    } catch (err) {
      notify("Error updating purchase order: " + err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (po) => {
    setSelectedPO(po);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPO) return;
    setIsSubmitting(true);
    try {
      await deletePurchaseOrder(selectedPO.po_id);
      setIsDeleteOpen(false);
      notify(`Purchase order #${selectedPO.po_id} deleted successfully.`);
      setSelectedPO(null);
      loadPOs();
    } catch (err) {
      notify(err.message || "Cannot delete purchase order.", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReceive = (po) => {
    setSelectedPO(po);
    setIsReceiveOpen(true);
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPO) return;
    setIsSubmitting(true);
    try {
      await receiveShipment(selectedPO.po_id, { shelf_id: receiveShelfId });
      setIsReceiveOpen(false);
      notify(`Purchase order #${selectedPO.po_id} marked as Received! Stock counts updated in PostgreSQL views.`);
      loadPOs();
    } catch (err) {
      notify("Error receiving order: " + err.message, true);
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
          <h2 className="text-xl font-extrabold text-white tracking-tight">Purchase Orders & Receiving Register</h2>
          <p className="text-xs text-slate-400 mt-0.5">Procurement orders, inbound stock receipts, and supplier delivery tracking.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenInspector('purchase-orders')}
            className="bg-dark-700 hover:bg-dark-600 text-slate-300 font-bold text-xs py-2 px-3 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Code2 className="w-3.5 h-3.5 text-brand-400" />
            <span>SQL Query</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-brand-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create PO</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'Pending', 'Received', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatus(st)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors whitespace-nowrap ${
                  status === st
                    ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                    : 'bg-dark-700 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'All Statuses' : st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="form-input text-xs"
            >
              <option value="all">All Suppliers</option>
              {suppliersList.map((s) => (
                <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Purchase Order Register</span>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{purchaseOrders.length} Orders</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-dark-800 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider select-none">
                <th className="p-4">PO ID</th>
                <th className="p-4">Supplier</th>
                <th className="p-4">Order Date</th>
                <th className="p-4">Received Date</th>
                <th className="p-4 text-right">Total Cost</th>
                <th className="p-4">Status</th>
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
                      <span>Loading purchase orders from PostgreSQL...</span>
                    </div>
                  </td>
                </tr>
              ) : purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 italic">
                    No purchase orders match your filters.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => (
                  <tr key={po.po_id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-white text-xs">
                      #{po.po_id}
                    </td>
                    <td className="p-4 font-semibold text-slate-200">{po.supplier_name}</td>
                    <td className="p-4 text-slate-400 font-mono">{po.order_date}</td>
                    <td className="p-4 text-slate-400 font-mono">{po.received_date || <span className="text-slate-500 italic">Pending</span>}</td>
                    <td className="p-4 text-right font-mono font-bold text-white text-xs">
                      ₹{po.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) ?? '0.00'}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={po.status} type="po" />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {po.status !== 'Received' && (
                          <button
                            onClick={() => handleReceiveSubmit({ preventDefault: () => {} }, po)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-1"
                          >
                            <PackageCheck className="w-3 h-3" />
                            <span>Receive</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(po)}
                          title="Edit PO"
                          className="p-1.5 text-slate-400 hover:text-white bg-dark-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(po)}
                          title="Delete PO"
                          className="p-1.5 text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/20"
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

      {/* --- CREATE PURCHASE ORDER MODAL --- */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Purchase Order"
        subtitle="Issues a stock-in order with suppliers inside a transactional boundary."
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier</label>
            <select
              value={newPoData.supplier_id}
              onChange={(e) => setNewPoData({ ...newPoData, supplier_id: e.target.value })}
              className="form-input text-white bg-dark-700"
            >
              {suppliersList.map((s) => (
                <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Line Items</label>
              <button
                type="button"
                onClick={handleAddItemToPO}
                className="text-brand-400 hover:text-brand-300 font-bold text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {newPoData.items.map((it, idx) => (
                <div key={idx} className="p-2.5 bg-dark-800/80 rounded-xl border border-slate-700/60 flex items-center gap-2">
                  <select
                    value={it.product_id}
                    onChange={(e) => {
                      const selProd = productsList.find(p => p.product_id === parseInt(e.target.value, 10));
                      const updated = [...newPoData.items];
                      updated[idx].product_id = parseInt(e.target.value, 10);
                      if (selProd) {
                        updated[idx].product_name = selProd.product_name;
                        updated[idx].sku = selProd.sku;
                      }
                      setNewPoData({ ...newPoData, items: updated });
                    }}
                    className="form-input text-xs flex-1"
                  >
                    {productsList.map((p) => (
                      <option key={p.product_id} value={p.product_id}>{p.product_name} ({p.sku})</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    required
                    value={it.quantity_ordered}
                    onChange={(e) => {
                      const updated = [...newPoData.items];
                      updated[idx].quantity_ordered = parseInt(e.target.value, 10) || 1;
                      setNewPoData({ ...newPoData, items: updated });
                    }}
                    placeholder="Qty"
                    className="form-input text-xs w-20 text-center"
                  />

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={it.unit_cost}
                    onChange={(e) => {
                      const updated = [...newPoData.items];
                      updated[idx].unit_cost = parseFloat(e.target.value) || 0;
                      setNewPoData({ ...newPoData, items: updated });
                    }}
                    placeholder="Cost"
                    className="form-input text-xs w-24 text-right"
                  />

                  {newPoData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-rose-400 hover:text-rose-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- EDIT PO MODAL --- */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Purchase Order #${editPoData.po_id}`}
        subtitle="Modify supplier or pending order status."
      >
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier</label>
            <select
              value={editPoData.supplier_id}
              onChange={(e) => setEditPoData({ ...editPoData, supplier_id: e.target.value })}
              className="form-input text-white bg-dark-700"
            >
              {suppliersList.map((s) => (
                <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Order Status</label>
            <select
              value={editPoData.status}
              onChange={(e) => setEditPoData({ ...editPoData, status: e.target.value })}
              className="form-input text-white bg-dark-700"
            >
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
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

      {/* --- DELETE PO MODAL --- */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Purchase Order Deletion"
        subtitle="Safeguard against inventory calculation corruption."
      >
        <div className="flex flex-col gap-4 text-xs">
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white text-sm">
                Delete Purchase Order #{selectedPO?.po_id}?
              </div>
              <p className="text-slate-400 mt-1">
                Supplier: <span className="font-bold text-white">{selectedPO?.supplier_name}</span> | Status: <span className="font-bold text-amber-400">{selectedPO?.status}</span>
              </p>
              {selectedPO?.status === 'Received' ? (
                <p className="text-rose-300 font-bold mt-2">
                  CRITICAL: This order is already marked as 'Received'. Deletion is strictly blocked to protect store stock calculations from being corrupted.
                </p>
              ) : (
                <p className="text-slate-400 mt-2">
                  This pending/cancelled order will be safely removed from the system.
                </p>
              )}
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
              disabled={isSubmitting || selectedPO?.status === 'Received'}
              onClick={handleDeleteConfirm}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md disabled:opacity-40"
            >
              {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
