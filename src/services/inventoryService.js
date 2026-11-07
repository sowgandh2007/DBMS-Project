// =============================================================================
// SERVICE: Store Inventory
// File: src/services/inventoryService.js
// =============================================================================
// MATCHING SQL FILE: backend/queries/03_current_stock_location.sql
// CANONICAL VIEW USED: product_location & product_stock
// =============================================================================

import { apiRequest, getUseMockData } from './api/apiClient';
import { MOCK_PRODUCT_STOCK } from '../data/mockData';

/**
 * Fetch inventory items using 03_current_stock_location.sql via GET /api/inventory
 * 
 * @param {Object} filters
 */
export async function getInventory(filters = {}) {
  const { searchTerm = '', status = 'ALL', category = 'all' } = filters;

  if (!getUseMockData()) {
    const res = await apiRequest('/inventory?include_inactive=false');
    if (res && res.data) {
      let liveData = res.data.map(p => {
        const qty = Number(p.current_stock ?? p.stock_quantity ?? 0);
        const isLow = Boolean(p.low_stock);
        let stockStatus = 'IN_STOCK';
        if (qty <= 0) stockStatus = 'OUT_OF_STOCK';
        else if (isLow) stockStatus = 'LOW_STOCK';

        const unitPrice = p.unit_price !== undefined && p.unit_price !== null ? Number(p.unit_price) : 0;
        const costPrice = p.cost_price !== undefined && p.cost_price !== null ? Number(p.cost_price) : Number((unitPrice * 0.7).toFixed(2));

        return {
          product_id: p.product_id,
          sku: p.sku,
          product_name: p.product_name,
          category: p.category_name || p.category || 'General',
          rack_code: p.rack_code || 'UNASSIGNED',
          aisle: p.aisle || '-',
          shelf_number: p.shelf_number || '-',
          stock_quantity: qty,
          current_stock: qty,
          total_stock: qty,
          unit_price: unitPrice,
          cost_price: costPrice,
          low_stock: isLow,
          stock_status: stockStatus,
          stock_deficit: Math.max(0, 15 - qty),
          _is_live: true
        };
      });

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        liveData = liveData.filter(p =>
          p.product_name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term)
        );
      }
      if (status && status !== 'ALL') {
        liveData = liveData.filter(p => p.stock_status === status);
      }
      if (category && category !== 'all') {
        liveData = liveData.filter(p => p.category === category);
      }

      return liveData;
    }
    throw new Error(res.message || "Failed to load inventory from database.");
  }

  // Explicit mock preview
  let result = [...MOCK_PRODUCT_STOCK];

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    result = result.filter(p => 
      p.product_name.toLowerCase().includes(term) || 
      p.sku.toLowerCase().includes(term)
    );
  }

  if (status && status !== 'ALL') {
    result = result.filter(p => p.stock_status === status);
  }

  if (category && category !== 'all') {
    result = result.filter(p => p.category === category);
  }

  return result;
}

/**
 * Adjust stock quantity on a physical shelf.
 */
export async function adjustShelfStock(adjustment) {
  if (!getUseMockData()) {
    return await apiRequest('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(adjustment)
    });
  }

  console.log("[Mock Preview] Stock audit adjustment:", adjustment);
  const item = MOCK_PRODUCT_STOCK.find(p => p.product_id === adjustment.product_id);
  if (item) {
    item.total_stock = adjustment.new_qty;
    item.stock_status = item.total_stock === 0 ? 'OUT_OF_STOCK' : (item.total_stock <= item.min_stock_level ? 'LOW_STOCK' : 'IN_STOCK');
    item.stock_deficit = Math.max(0, item.min_stock_level - item.total_stock);
  }
  return { success: true };
}
