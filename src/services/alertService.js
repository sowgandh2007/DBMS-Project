// =============================================================================
// SERVICE: Low-Stock Alerts & Restocking Triggers
// File: src/services/alertService.js
// =============================================================================
// MATCHING SQL FILE: backend/queries/02_low_stock.sql
// CANONICAL VIEW USED: product_stock
// =============================================================================

import { apiRequest, getUseMockData } from './api/apiClient';
import { MOCK_PRODUCT_STOCK } from '../data/mockData';

/**
 * Fetch low stock and out of stock items from 02_low_stock.sql via GET /api/inventory/low-stock
 * 
 * @param {Object} filters
 */
export async function getLowStockAlerts(filters = {}) {
  const { urgency = 'ALL_ALERTS', category = 'all' } = filters;

  if (!getUseMockData()) {
    const res = await apiRequest('/inventory/low-stock?include_inactive=false');
    if (res && res.data) {
      let liveData = res.data.map(item => {
        const qty = Number(item.current_stock ?? item.stock_quantity ?? 0);
        const reorderLevel = Number(item.reorder_level ?? 10);
        const deficit = Number(item.shortfall ?? Math.max(0, reorderLevel - qty));
        const stockStatus = qty <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK';
        const suggestedReorder = deficit + Math.ceil(reorderLevel * 0.5);
        const estCost = suggestedReorder * 60;

        return {
          product_id: item.product_id,
          sku: item.sku,
          product_name: item.product_name,
          category: item.category_name || item.category || 'General',
          stock_quantity: qty,
          current_stock: qty,
          total_stock: qty,
          reorder_level: reorderLevel,
          min_stock_level: reorderLevel,
          shortfall: deficit,
          stock_deficit: deficit,
          stock_status: stockStatus,
          suggested_reorder_qty: suggestedReorder,
          estimated_reorder_cost: estCost,
          supplier_id: 1,
          supplier_name: 'Primary Supplier',
          _is_live: true
        };
      });

      if (urgency === 'OUT_OF_STOCK') {
        liveData = liveData.filter(p => p.stock_status === 'OUT_OF_STOCK');
      } else if (urgency === 'LOW_STOCK') {
        liveData = liveData.filter(p => p.stock_status === 'LOW_STOCK');
      }

      if (category && category !== 'all') {
        liveData = liveData.filter(p => p.category === category);
      }

      return liveData;
    }
    throw new Error(res.message || "Failed to load low stock alerts from database.");
  }

  // Explicit mock preview
  let result = MOCK_PRODUCT_STOCK.filter(p => 
    p.stock_status === 'LOW_STOCK' || p.stock_status === 'OUT_OF_STOCK'
  );

  if (urgency === 'OUT_OF_STOCK') {
    result = result.filter(p => p.stock_status === 'OUT_OF_STOCK');
  } else if (urgency === 'LOW_STOCK') {
    result = result.filter(p => p.stock_status === 'LOW_STOCK');
  }

  if (category && category !== 'all') {
    result = result.filter(p => p.category === category);
  }

  return result.map(item => ({
    ...item,
    suggested_reorder_qty: item.stock_deficit + Math.ceil(item.min_stock_level * 0.5),
    estimated_reorder_cost: (item.stock_deficit + Math.ceil(item.min_stock_level * 0.5)) * item.cost_price,
  }));
}
