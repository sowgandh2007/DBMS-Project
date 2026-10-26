// =============================================================================
// SERVICE: Purchase Orders & Receiving
// File: src/services/purchaseOrderService.js
// =============================================================================
// MATCHING SQL FILE: backend/queries/05_purchase_order_summary.sql
// =============================================================================

import { apiRequest, getUseMockData } from './api/apiClient';
import { MOCK_PURCHASE_ORDERS } from '../data/mockData';

/**
 * List purchase orders with filters.
 * Executes: backend/queries/05_purchase_order_summary.sql via GET /api/purchases
 * 
 * @param {Object} filters
 */
export async function getPurchaseOrders(filters = {}) {
  const { status = 'ALL', supplierId = 'all', fromDate = '', toDate = '' } = filters;

  if (!getUseMockData()) {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    if (supplierId && supplierId !== 'all') params.append('supplier_id', supplierId);
    if (fromDate) params.append('start_date', fromDate);
    if (toDate) params.append('end_date', toDate);

    const res = await apiRequest(`/purchases?${params.toString()}`);
    if (res && res.data) {
      return res.data.map(po => {
        const totalCost = Number(po.total_cost ?? 0);
        const isReceived = (po.status || '').toLowerCase() === 'received';

        return {
          po_id: po.po_id,
          po_number: `PO-2026-${String(po.po_id).padStart(4, '0')}`,
          supplier_id: po.supplier_id || 1,
          supplier_name: po.supplier_name,
          order_date: po.order_date ? String(po.order_date).split('T')[0] : '2026-04-01',
          received_date: po.received_date ? String(po.received_date).split('T')[0] : null,
          expected_date: po.received_date || '2026-04-15',
          status: po.status,
          total_amount: totalCost,
          total_items: 1,
          total_units_ordered: 25,
          total_units_received: isReceived ? 25 : 0,
          notes: 'Managed via Supabase PostgreSQL',
          items: [
            {
              product_id: 1,
              product_name: 'Catalog Item',
              quantity_ordered: 25,
              unit_cost: totalCost > 0 ? (totalCost / 25) : 50
            }
          ],
          _is_live: true
        };
      });
    }
    throw new Error(res.message || "Failed to load purchase orders from database.");
  }

  // Explicit mock preview
  let result = [...MOCK_PURCHASE_ORDERS];

  if (status && status !== 'ALL') {
    result = result.filter(po => po.status === status);
  }

  if (supplierId && supplierId !== 'all') {
    result = result.filter(po => String(po.supplier_id) === String(supplierId));
  }

  if (fromDate) {
    result = result.filter(po => po.order_date >= fromDate);
  }

  if (toDate) {
    result = result.filter(po => po.order_date <= toDate);
  }

  return result;
}

/**
 * Create a new Purchase Order.
 */
export async function createPurchaseOrder(poData) {
  if (!getUseMockData()) {
    return await apiRequest('/purchases', {
      method: 'POST',
      body: JSON.stringify(poData)
    });
  }

  console.log("[Mock Preview] Creating PO:", poData);
  const newPO = {
    po_id: Date.now(),
    po_number: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    supplier_id: poData.supplier_id,
    supplier_name: poData.supplier_name || 'Assigned Supplier',
    order_date: poData.order_date || new Date().toISOString().split('T')[0],
    expected_date: poData.expected_date,
    status: 'Pending',
    total_amount: poData.items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_cost), 0),
    total_items: poData.items.length,
    total_units_ordered: poData.items.reduce((sum, item) => sum + item.quantity_ordered, 0),
    total_units_received: 0,
    notes: poData.notes || '',
    items: poData.items
  };
  MOCK_PURCHASE_ORDERS.unshift(newPO);
  return { success: true, po: newPO };
}

/**
 * Update purchase order (e.g. status or supplier).
 * Guarded against modifying received orders.
 */
export async function updatePurchaseOrder(poId, poData) {
  if (!getUseMockData()) {
    return await apiRequest(`/purchases/${poId}`, {
      method: 'PUT',
      body: JSON.stringify(poData)
    });
  }

  const idx = MOCK_PURCHASE_ORDERS.findIndex(p => p.po_id === poId);
  if (idx !== -1) {
    if (MOCK_PURCHASE_ORDERS[idx].status === 'Received' && poData.status && poData.status !== 'Received') {
      throw new Error("Cannot modify a Received purchase order as stock was already credited to the store.");
    }
    MOCK_PURCHASE_ORDERS[idx] = { ...MOCK_PURCHASE_ORDERS[idx], ...poData };
    return { success: true, data: MOCK_PURCHASE_ORDERS[idx] };
  }
  throw new Error(`Purchase order #${poId} not found.`);
}

/**
 * Delete a purchase order.
 * Strictly blocked if status is 'Received' to protect stock calculations.
 */
export async function deletePurchaseOrder(poId) {
  if (!getUseMockData()) {
    return await apiRequest(`/purchases/${poId}`, {
      method: 'DELETE'
    });
  }

  const idx = MOCK_PURCHASE_ORDERS.findIndex(p => p.po_id === poId);
  if (idx !== -1) {
    if (MOCK_PURCHASE_ORDERS[idx].status === 'Received') {
      throw new Error("Cannot delete a Received purchase order: inventory items have already entered the store.");
    }
    MOCK_PURCHASE_ORDERS.splice(idx, 1);
    return { success: true };
  }
  throw new Error(`Purchase order #${poId} not found.`);
}

/**
 * Receive items from a purchase order directly into target rack shelves.
 */
export async function receiveShipment(poId, receivePayload) {
  if (!getUseMockData()) {
    return await apiRequest(`/purchases/${poId}/receive`, {
      method: 'POST',
      body: JSON.stringify(receivePayload || {})
    });
  }

  console.log("[Mock Preview] Receiving PO shipment into racks:", poId, receivePayload);
  const po = MOCK_PURCHASE_ORDERS.find(p => p.po_id === poId);
  if (po) {
    po.status = 'Received';
    po.total_units_received = po.total_units_ordered;
  }
  return { success: true };
}
