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
  CheckCircle2,
  Boxes,
  AlertTriangle
} from 'lucide-react';
import { getPurchaseOrders, createPurchaseOrder, receiveShipment } from '../../services/purchaseOrderService';
import { MOCK_SUPPLIERS, MOCK_PRODUCT_STOCK, MOCK_SHELVES } from '../../data/mockData';

export default function PurchaseOrdersView({ onOpenInspector, prefilledItem = null, prefilledSupplier = null }) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [status, setStatus] = useState('ALL');
  const [supplierId, setSupplierId] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  // Receive into rack shelf form state
  const [receiveShelfId, setReceiveShelfId] = useState('');

  // New PO Form state
  const [newPoData, setNewPoData] = useState({
    supplier_id: prefilledSupplier ? prefilledSupplier.supplier_id : 1,
    order_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    notes: '',
    items: prefilledItem ? [
      {
        product_id: prefilledItem.product_id,
        sku: prefilledItem.sku,
        product_name: prefilledItem.product_name,
        quantity_ordered: prefilledItem.suggested_reorder_qty || 25,
        unit_cost: prefilledItem.cost_price
      }
    ] : [
      {
        product_id: MOCK_PRODUCT_STOCK[0].product_id,
        sku: MOCK_PRODUCT_STOCK[0].sku,
        product_name: MOCK_PRODUCT_STOCK[0].product_name,
        quantity_ordered: 20,
        unit_cost: MOCK_PRODUCT_STOCK[0].cost_price
      }
    ]
  });

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
    loadPOs();
  }, [status, supplierId, fromDate, toDate]);

  useEffect(() => {
    if (prefilledItem || prefilledSupplier) {
      setIsCreateOpen(true);
    }
  }, [prefilledItem, prefilledSupplier]);

  const handleAddItemToPO = () => {
    const firstProd = MOCK_PRODUCT_STOCK[0];
    setNewPoData({
      ...newPoData,
      items: [
        ...newPoData.items,
        {
          product_id: firstProd.product_id,
          sku: firstProd.sku,
          product_name: firstProd.product_name,
          quantity_ordered: 10,
          unit_cost: firstProd.cost_price
        }
      ]
    });
  };

  const handleRemoveItem = (index) => {
    const updated = [...newPoData.items];
    updated.splice(index, 1);
    setNewPoData({ ...newPoData, items: updated });
  };

  const handleItemProductChange = (index, prodId) => {
    const prod = MOCK_PRODUCT_STOCK.find(p => p.product_id === parseInt(prodId, 10));
    if (!prod) return;
    const updated = [...newPoData.items];
    updated[index] = {
      ...updated[index],
      product_id: prod.product_id,
      sku: prod.sku,
      product_name: prod.product_name,
      unit_cost: prod.cost_price
    };
    setNewPoData({ ...newPoData, items: updated });
  };

  const handleItemQtyChange = (index, qty) => {
    const updated = [...newPoData.items];
    updated[index].quantity_ordered = parseInt(qty, 10) || 1;
    setNewPoData({ ...newPoData, items: updated });
  };

  const handleItemCostChange = (index, cost) => {
    const updated = [...newPoData.items];
    updated[index].unit_cost = parseFloat(cost) || 0;
    setNewPoData({ ...newPoData, items: updated });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const sup = MOCK_SUPPLIERS.find(s => s.supplier_id === parseInt(newPoData.supplier_id, 10));
    try {
      await createPurchaseOrder({
        ...newPoData,
        supplier_name: sup ? sup.supplier_name : 'Supplier'
      });
      setIsCreateOpen(false);
      loadPOs();
    } catch (err) {
      alert("Error creating PO: " + err.message);
    }
  };

  const handleOpenReceive = (po) => {
    setSelectedPO(po);
    setReceiveShelfId(MOCK_SHELVES[0].shelf_id.toString());
    setIsReceiveOpen(true);
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPO) return;
    try {
      await receiveShipment(selectedPO.po_id, {
        shelf_id: parseInt(receiveShelfId, 10)
      });
      setIsReceiveOpen(false);
      loadPOs();
    } catch (err) {
      alert("Error receiving shipment: " + err.message);
    }
  };

  const poTotal = newPoData.items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_cost), 0);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Purchase Orders & Receiving</h2>
          <p className="text-xs text-slate-400 mt-0.5">Procurement tracking and physical stock receiving directly onto warehouse shelves.</p>
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

      {/* Filter Toolbar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'ORDERED', 'RECEIVED', 'PENDING', 'DRAFT'].map((st) => (
            <button
              key={st}
              onClick={() => setStatus(st)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors whitespace-nowrap ${
                status === st
                  ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                  : 'bg-dark-700 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Supplier & Date filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="form-input text-white bg-dark-700 cursor-pointer w-auto"
          >
            <option value="all">All Suppliers</option>
            {MOCK_SUPPLIERS.map((s) => (
              <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            title="From Date"
            className="form-input text-white bg-dark-700 w-auto text-xs"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            title="To Date"
            className="form-input text-white bg-dark-700 w-auto text-xs"
          />
        </div>
      </div>

      {/* PO Table */}
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
                <th className="p-4">PO Number</th>
                <th className="p-4">Supplier</th>
                <th className="p-4">Order Date</th>
                <th className="p-4">Expected Date</th>
                <th className="p-4 text-center">Items & Units</th>
                <th className="p-4 text-right">Total Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-dark-900/30">
              {error ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-rose-400">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <span className="font-bold">{error}</span>
                      <button onClick={loadPOs} className="mt-2 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-xs font-semibold">
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
                      <span>Loading purchase orders from PostgreSQL...</span>
                    </div>
                  </td>
                </tr>
              ) : purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500 italic">
                    No purchase orders match your filters.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => (
                  <tr key={po.po_id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white font-mono text-xs">{po.po_number}</div>
                      {po.notes && <div className="text-[10px] text-slate-500 truncate max-w-xs">{po.notes}</div>}
                    </td>
                    <td className="p-4 font-semibold text-slate-200">{po.supplier_name}</td>
                    <td className="p-4 text-slate-400 font-mono">{po.order_date}</td>
                    <td className="p-4 text-slate-400 font-mono">{po.expected_date || 'N/A'}</td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-white">{po.total_items} items</span>
                      <span className="text-[10px] text-slate-500 block">({po.total_units_ordered} units)</span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-white text-xs">
                      ₹{po.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={po.status} type="po" />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedPO(po);
                            setIsItemsOpen(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-dark-700 hover:bg-dark-600 text-slate-300 hover:text-white transition-colors border border-slate-700"
                        >
                          Items
                        </button>
                        {po.status === 'ORDERED' && (
                          <button
                            onClick={() => handleOpenReceive(po)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-1"
                          >
                            <PackageCheck className="w-3 h-3" />
                            <span>Receive</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO Line Items Modal */}
      <Modal
        isOpen={isItemsOpen}
        onClose={() => setIsItemsOpen(false)}
        title={`Line Items: ${selectedPO?.po_number}`}
        subtitle={`Vendor: ${selectedPO?.supplier_name} • Total: ₹${selectedPO?.total_amount.toFixed(2)}`}
      >
        <div className="flex flex-col gap-3 text-xs">
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-dark-800 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
                  <th className="p-3">SKU & Item Name</th>
                  <th className="p-3 text-center">Ordered</th>
                  <th className="p-3 text-center">Received</th>
                  <th className="p-3 text-right">Unit Cost</th>
                  <th className="p-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-dark-900/40">
                {selectedPO?.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-3">
                      <div className="font-bold text-white">{item.product_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.sku}</div>
                    </td>
                    <td className="p-3 text-center font-bold text-white">{item.quantity_ordered}</td>
                    <td className="p-3 text-center font-bold text-emerald-400">{item.quantity_received}</td>
                    <td className="p-3 text-right font-mono text-slate-300">₹{item.unit_cost.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold text-white">
                      ₹{(item.quantity_ordered * item.unit_cost).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Receive Shipment into Rack Modal */}
      <Modal
        isOpen={isReceiveOpen}
        onClose={() => setIsReceiveOpen(false)}
        title={`Receive Shipment: ${selectedPO?.po_number}`}
        subtitle="Stock the received items onto physical warehouse shelves. Parameterized query in queries/purchase_orders.sql."
      >
        <form onSubmit={handleReceiveSubmit} className="flex flex-col gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-dark-800 border border-slate-700/60 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shipment Details</span>
            <div className="flex items-center justify-between text-white font-bold">
              <span>{selectedPO?.supplier_name}</span>
              <span>{selectedPO?.total_units_ordered} Units Total</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Contains {selectedPO?.items?.length} SKUs ready for warehouse shelving
            </span>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Select Destination Rack & Shelf for Placement
            </label>
            <select
              value={receiveShelfId}
              onChange={(e) => setReceiveShelfId(e.target.value)}
              className="form-input text-white bg-dark-700 font-semibold cursor-pointer"
            >
              {MOCK_SHELVES.map((sh) => (
                <option key={sh.shelf_id} value={sh.shelf_id}>
                  {sh.rack_code} • {sh.shelf_code} (Level {sh.shelf_level} - Capacity: {sh.max_capacity} units)
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-dark-900 border border-slate-800 text-slate-400 text-[11px]">
            <span className="font-bold text-brand-400 block mb-0.5">DBMS Transaction Note:</span>
            Submitting executes a transaction that marks the PO as <code className="text-white font-mono">RECEIVED</code> and increments <code className="text-slate-200 font-mono">product_rack_placement</code> on the selected shelf. The <code className="text-brand-300 font-mono">product_stock</code> view will instantly reflect updated on-hand units!
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsReceiveOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md transition-all flex items-center gap-1.5"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Confirm Stock Reception</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Purchase Order Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Draft New Purchase Order"
        subtitle="Create procurement order header & line items. Parameterized query in queries/purchase_orders.sql."
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Supplier</label>
              <select
                value={newPoData.supplier_id}
                onChange={(e) => setNewPoData({ ...newPoData, supplier_id: e.target.value })}
                className="form-input text-white bg-dark-700"
              >
                {MOCK_SUPPLIERS.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Order Date</label>
              <input
                type="date"
                required
                value={newPoData.order_date}
                onChange={(e) => setNewPoData({ ...newPoData, order_date: e.target.value })}
                className="form-input text-white bg-dark-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expected Delivery</label>
              <input
                type="date"
                value={newPoData.expected_date}
                onChange={(e) => setNewPoData({ ...newPoData, expected_date: e.target.value })}
                className="form-input text-white bg-dark-700"
              />
            </div>
          </div>

          {/* Line items list */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">Purchase Line Items</span>
              <button
                type="button"
                onClick={handleAddItemToPO}
                className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
              {newPoData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-2.5 rounded-xl bg-dark-800 border border-slate-700/60 items-center">
                  <div className="col-span-5">
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemProductChange(index, e.target.value)}
                      className="form-input text-white bg-dark-700 py-1.5 text-xs"
                    >
                      {MOCK_PRODUCT_STOCK.map((p) => (
                        <option key={p.product_id} value={p.product_id}>{p.product_name} ({p.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity_ordered}
                      onChange={(e) => handleItemQtyChange(index, e.target.value)}
                      placeholder="Qty"
                      className="form-input py-1.5 text-xs font-bold text-center"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={item.unit_cost}
                      onChange={(e) => handleItemCostChange(index, e.target.value)}
                      placeholder="Cost"
                      className="form-input py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    {newPoData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes & PO Total Summary */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800">
            <div className="w-full sm:w-1/2">
              <input
                type="text"
                value={newPoData.notes}
                onChange={(e) => setNewPoData({ ...newPoData, notes: e.target.value })}
                placeholder="Order notes / delivery instructions..."
                className="form-input text-xs"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-xs">Estimated Total:</span>
              <span className="text-lg font-black text-white font-mono">
                ₹{poTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md transition-all"
            >
              Issue Purchase Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
