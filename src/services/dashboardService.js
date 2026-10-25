// =============================================================================
// SERVICE: Dashboard Overview
// File: src/services/dashboardService.js
// =============================================================================
// CANONICAL VIEWS USED: product_stock, product_location
// TABLES USED: sales_order, purchase_order, rack
// =============================================================================

import { apiRequest, getUseMockData } from './api/apiClient';
import { 
  MOCK_PRODUCT_STOCK, 
  MOCK_RACKS, 
  MOCK_SALES_LOG, 
  MOCK_RECENT_ACTIVITIES 
} from '../data/mockData';

/**
 * Fetch overview dashboard statistics.
 * Executes: GET /api/dashboard/stats
 */
export async function getDashboardStats() {
  if (!getUseMockData()) {
    const res = await apiRequest('/dashboard/stats');
    if (res && res.data) {
      return {
        ...res.data,
        _is_live: true
      };
    }
    throw new Error(res.message || "Failed to load dashboard metrics from database.");
  }

  // Explicit mock preview
  const totalSkus = MOCK_PRODUCT_STOCK.length;
  const totalUnits = MOCK_PRODUCT_STOCK.reduce((sum, item) => sum + item.total_stock, 0);
  const totalInventoryValue = MOCK_PRODUCT_STOCK.reduce((sum, item) => sum + (item.total_stock * item.cost_price), 0);
  const potentialRevenue = MOCK_PRODUCT_STOCK.reduce((sum, item) => sum + (item.total_stock * item.unit_price), 0);
  const estimatedProfit = potentialRevenue - totalInventoryValue;
  const avgMargin = potentialRevenue > 0 ? ((estimatedProfit / potentialRevenue) * 100).toFixed(1) : 0;
  const lowStockCount = MOCK_PRODUCT_STOCK.filter(item => item.stock_status === 'LOW_STOCK' || item.stock_status === 'OUT_OF_STOCK').length;
  
  const totalCapacity = MOCK_RACKS.reduce((sum, r) => sum + r.max_capacity, 0);
  const totalOccupied = MOCK_RACKS.reduce((sum, r) => sum + r.current_stored_units, 0);
  const rackOccupancyPct = ((totalOccupied / totalCapacity) * 100).toFixed(1);
  const todaySales = MOCK_SALES_LOG.reduce((sum, s) => sum + s.total_amount, 0);

  return {
    totalSkus,
    totalUnits,
    totalInventoryValue,
    potentialRevenue,
    estimatedProfit,
    avgMargin,
    lowStockCount,
    totalCapacity,
    totalOccupied,
    rackOccupancyPct,
    todaySales,
  };
}

/**
 * Fetch top high-margin products for the dashboard bar chart widget.
 * Executes: GET /api/dashboard/margin-chart
 */
export async function getHighestMarginProducts() {
  if (!getUseMockData()) {
    const res = await apiRequest('/dashboard/margin-chart');
    if (res && res.data && res.data.length > 0) {
      return res.data.map(p => ({
        product_id: p.product_id,
        product_name: p.product_name,
        category: p.category,
        cost_price: Number(p.cost_price),
        unit_price: Number(p.unit_price),
        unit_profit: Number(p.unit_profit),
        margin_pct: String(p.margin_pct),
        total_stock: Number(p.total_stock),
        _is_live: true
      }));
    }
    throw new Error(res.message || "Failed to load margin chart from database.");
  }

  return MOCK_PRODUCT_STOCK
    .filter(p => p.total_stock > 0)
    .map(p => ({
      product_id: p.product_id,
      product_name: p.product_name,
      category: p.category,
      cost_price: p.cost_price,
      unit_price: p.unit_price,
      unit_profit: p.unit_price - p.cost_price,
      margin_pct: (((p.unit_price - p.cost_price) / p.unit_price) * 100).toFixed(1),
      total_stock: p.total_stock,
    }))
    .sort((a, b) => b.margin_pct - a.margin_pct)
    .slice(0, 5);
}

/**
 * Fetch recent inventory and sales activities.
 * Executes: GET /api/dashboard/recent-activity
 */
export async function getRecentActivities() {
  if (!getUseMockData()) {
    const res = await apiRequest('/dashboard/recent-activity');
    if (res && res.data && res.data.length > 0) {
      return res.data;
    }
    throw new Error(res.message || "Failed to load recent activity from database.");
  }

  return MOCK_RECENT_ACTIVITIES;
}
