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
  Code2, 
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
        getSuppliers(),
        searchProducts()
      ]);
      setSuppliersList(sups || []);
      setProductsList(prods || []);
    } catch (err) {
      console.warn("Error loading purchase order reference data:", err);
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
      notify("Cannot edit a Received purchase order as stock was already credited to inventory.", true);
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

  const handleReceiveShipment = async (po) => {
    setIsSubmitting(true);
    try {
      await receiveShipment(po.po_id, { shelf_id: receiveShelfId });
      notify(`Purchase order #${po.po_id} marked as Received! Stock counts updated in PostgreSQL.`);
      loadPOs();
    } catch (err) {
      notify("Error receiving order: " + err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Alert Banners */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Orders</h2>
          <p className="text-xs text-slate-500 mt-0.5">Procurement orders, inbound stock receipts, and supplier delivery tracking.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenInspector('purchase-orders')}
            className="btn-secondary text-xs flex items-center gap-1.5"
            title="Inspect SQL Query"
          >
            <Code2 className="w-3.5 h-3.5 text-teal-600" />
            <span>SQL Query</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create PO</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="premium-card p-3.5 flex flex-col sm:flex-row gap-3 items-stretch justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'Pending', 'Received', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatus(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                status === st
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white border-teal-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st === 'ALL' ? 'All Orders' : st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="form-input text-xs py-1.5"
          >
            <option value="all">All Suppliers</option>
            {suppliersList.map((s) => (
              <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="premium-card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Purchase Order Register</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">{purchaseOrders.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider select-none">
                <th className="py-3 px-4">PO ID</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Received Date</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
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
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading purchase orders...</span>
                    </div>
                  </td>
                </tr>
              ) : purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 italic">
                    No purchase orders match your filters.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => (
                  <tr key={po.po_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-xs">
                      #{po.po_id}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{po.supplier_name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">{po.order_date}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                      {po.received_date || <span className="text-slate-400 italic">Pending</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-xs">
                      ₹{po.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) ?? '0.00'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={po.status} type="po" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {po.status !== 'Received' && (
                          <button
                            onClick={() => handleReceiveShipment(po)}
                            disabled={isSubmitting}
                            title="Mark as Received and update stock"
                            className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors flex items-center gap-1 shadow-xs"
                          >
                            <PackageCheck className="w-3 h-3 text-emerald-600" />
                            <span>Receive</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(po)}
                          title="Edit Order"
                          className="p-1.5 text-slate-500 hover:text-teal-700 bg-slate-50 hover:bg-teal-50 rounded-lg transition-colors border border-slate-200"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(po)}
                          title="Delete Order"
                          className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
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
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Supplier</label>
            <select
              value={newPoData.supplier_id}
              onChange={(e) => setNewPoData({ ...newPoData, supplier_id: e.target.value })}
              className="form-input text-xs"
            >
              {suppliersList.map((s) => (
                <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Line Items</label>
              <button
                type="button"
                onClick={handleAddItemToPO}
                className="text-teal-700 hover:text-teal-800 font-semibold text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
              {newPoData.items.map((it, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
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
                    className="form-input text-xs flex-1 py-1.5"
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
                    className="form-input text-xs w-20 text-center py-1.5"
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
                    placeholder="Cost (₹)"
                    className="form-input text-xs w-24 text-right py-1.5"
                  />

                  {newPoData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove line"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs disabled:opacity-50"
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
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Supplier</label>
            <select
              value={editPoData.supplier_id}
              onChange={(e) => setEditPoData({ ...editPoData, supplier_id: e.target.value })}
              className="form-input text-xs"
            >
              {suppliersList.map((s) => (
                <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Order Status</label>
            <select
              value={editPoData.status}
              onChange={(e) => setEditPoData({ ...editPoData, status: e.target.value })}
              className="form-input text-xs"
            >
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs disabled:opacity-50"
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
        title="Confirm Deletion"
        subtitle="Safeguard against inventory calculation corruption."
      >
        <div className="flex flex-col gap-4 text-xs">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900 text-sm">
                Delete Purchase Order #{selectedPO?.po_id}?
              </div>
              <p className="text-slate-600 mt-1">
                Supplier: <span className="font-semibold text-slate-900">{selectedPO?.supplier_name}</span> | Status: <span className="font-semibold text-amber-700">{selectedPO?.status}</span>
              </p>
              {selectedPO?.status === 'Received' ? (
                <p className="text-rose-700 font-semibold mt-2">
                  CRITICAL: This order is already marked as 'Received'. Deletion is blocked to preserve inventory calculations.
                </p>
              ) : (
                <p className="text-slate-500 mt-2">
                  This pending or cancelled order will be permanently removed.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting || selectedPO?.status === 'Received'}
              onClick={handleDeleteConfirm}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs disabled:opacity-40 transition-colors"
            >
              {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
