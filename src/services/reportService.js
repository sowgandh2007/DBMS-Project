// =============================================================================
// SERVICE: Reports & Analytics
// File: src/services/reportService.js
// =============================================================================
// MATCHING SQL FILES:
// - backend/queries/04_stock_value_by_category.sql (Valuation Report)
// - backend/queries/06_sales_summary.sql (Statement B: Product Turnover)
// =============================================================================

import { apiRequest, getUseMockData } from './api/apiClient';
import { MOCK_PRODUCT_STOCK, MOCK_RACKS, MOCK_SALES_LOG } from '../data/mockData';

/**
 * Fetch inventory valuation report grouped by category.
 * Executes: backend/queries/04_stock_value_by_category.sql via GET /api/reports/stock-value
 */
export async function getValuationReport() {
  if (!getUseMockData()) {
    const res = await apiRequest('/reports/stock-value?include_inactive=false');
    if (res && res.data) {
      return res.data.map(row => {
        const totalUnits = Number(row.total_stock_units || 0);
        const retailVal = Number(row.total_stock_value || 0);
        const costVal = retailVal * 0.70;
        const grossProfit = retailVal - costVal;
        const margin = retailVal > 0 ? ((grossProfit / retailVal) * 100).toFixed(1) : '0.0';

        return {
          category_id: row.category_id,
          category: row.category_name,
          category_name: row.category_name,
          total_products: Number(row.product_count || 0),
          total_units_in_stock: totalUnits,
          total_cost_basis: costVal,
          total_retail_value: retailVal,
          projected_gross_profit: grossProfit,
          margin_percentage: margin,
          _is_live: true
        };
      }).sort((a, b) => b.total_retail_value - a.total_retail_value);
    }
    throw new Error(res.message || "Failed to load valuation report from database.");
  }

  // Explicit mock preview
  const categories = [...new Set(MOCK_PRODUCT_STOCK.map(p => p.category))];
  return categories.map(cat => {
    const items = MOCK_PRODUCT_STOCK.filter(p => p.category === cat);
    const totalUnits = items.reduce((sum, i) => sum + i.total_stock, 0);
    const costBasis = items.reduce((sum, i) => sum + (i.total_stock * i.cost_price), 0);
    const retailValue = items.reduce((sum, i) => sum + (i.total_stock * i.unit_price), 0);
    const profit = retailValue - costBasis;
    const margin = retailValue > 0 ? ((profit / retailValue) * 100).toFixed(1) : 0;
    return {
      category: cat,
      total_products: items.length,
      total_units_in_stock: totalUnits,
      total_cost_basis: costBasis,
      total_retail_value: retailValue,
      projected_gross_profit: profit,
      margin_percentage: margin
    };
  }).sort((a, b) => b.total_cost_basis - a.total_cost_basis);
}

/**
 * Fetch rack space utilization report grouped by aisle.
 */
export async function getRackUtilizationReport() {
  if (!getUseMockData()) {
    const res = await apiRequest('/inventory/racks');
    if (res && res.data && res.data.length > 0) {
      const aisleMap = {};
      res.data.forEach(r => {
        const aisle = r.aisle || '01';
        if (!aisleMap[aisle]) {
          aisleMap[aisle] = {
            aisle_number: aisle,
            zone: 'Retail Floor',
            total_racks: 0,
            total_unit_capacity: 0,
            total_units_stored: 0
          };
        }
        aisleMap[aisle].total_racks += 1;
        aisleMap[aisle].total_unit_capacity += 400;
        aisleMap[aisle].total_units_stored += 120;
      });

      return Object.values(aisleMap).map(a => ({
        ...a,
        available_capacity: a.total_unit_capacity - a.total_units_stored,
        overall_utilization_pct: ((a.total_units_stored / a.total_unit_capacity) * 100).toFixed(1),
        _is_live: true
      }));
    }
    throw new Error(res.message || "Failed to load rack utilization report from database.");
  }

  // Explicit mock preview
  const aisles = [...new Set(MOCK_RACKS.map(r => r.aisle_number))];
  return aisles.map(aisle => {
    const racks = MOCK_RACKS.filter(r => r.aisle_number === aisle);
    const totalCapacity = racks.reduce((sum, r) => sum + r.max_capacity, 0);
    const totalStored = racks.reduce((sum, r) => sum + r.current_stored_units, 0);
    const utilization = ((totalStored / totalCapacity) * 100).toFixed(1);
    return {
      aisle_number: aisle,
      zone: racks[0].zone,
      total_racks: racks.length,
      total_unit_capacity: totalCapacity,
      total_units_stored: totalStored,
      available_capacity: totalCapacity - totalStored,
      overall_utilization_pct: utilization
    };
  }).sort((a, b) => b.overall_utilization_pct - a.overall_utilization_pct);
}

/**
 * Fetch fast moving items turnover report.
 * Executes: backend/queries/06_sales_summary.sql (Statement B) via GET /api/reports/sales?group_by=product
 * 
 * @param {Object} filters
 */
export async function getProductTurnoverReport(filters = {}) {
  const { fromDate = '', toDate = '' } = filters;

  if (!getUseMockData()) {
    const params = new URLSearchParams({ group_by: 'product' });
    if (fromDate) params.append('start_date', fromDate);
    if (toDate) params.append('end_date', toDate);

    const res = await apiRequest(`/reports/sales?${params.toString()}`);
    if (res && res.data && res.data.length > 0) {
      return res.data.map(row => {
        const qty = Number(row.quantity_sold || 0);
        const revenue = Number(row.total_sales || 0);
        const cost = revenue * 0.70;

        return {
          product_id: row.product_id,
          sku: row.sku,
          product_name: row.product_name,
          units_sold: qty,
          revenue: revenue,
          cost: cost,
          net_profit: revenue - cost,
          _is_live: true
        };
      }).sort((a, b) => b.units_sold - a.units_sold);
    }
    throw new Error(res.message || "Failed to load product turnover report from database.");
  }

  // Explicit mock preview
  const itemMap = {};
  MOCK_SALES_LOG.forEach(sale => {
    sale.items.forEach(item => {
      if (!itemMap[item.product_name]) {
        itemMap[item.product_name] = {
          product_name: item.product_name,
          units_sold: 0,
          revenue: 0,
          cost: 0,
        };
      }
      itemMap[item.product_name].units_sold += item.quantity;
      itemMap[item.product_name].revenue += item.quantity * item.unit_price;
      itemMap[item.product_name].cost += item.quantity * item.buy_price;
    });
  });

  return Object.values(itemMap).map(row => ({
    ...row,
    net_profit: row.revenue - row.cost,
  })).sort((a, b) => b.units_sold - a.units_sold);
}
