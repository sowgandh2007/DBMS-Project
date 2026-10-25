// =============================================================================
// SERVICE: Sales & POS Transactions
// File: src/services/salesService.js
// =============================================================================
// MATCHING SQL FILE: backend/queries/06_sales_summary.sql
// =============================================================================

import { apiRequest, getUseMockData } from './api/apiClient';
import { MOCK_SALES_LOG, MOCK_PRODUCT_STOCK } from '../data/mockData';

/**
 * Fetch sales history log with filters.
 * Executes: GET /api/sales/history
 * 
 * @param {Object} filters
 */
export async function getSalesLog(filters = {}) {
  const { searchTerm = '', paymentMethod = 'ALL', fromDate = '', toDate = '' } = filters;

  if (!getUseMockData()) {
    const res = await apiRequest('/sales/history?limit=50');
    if (res && res.data) {
      let liveData = res.data.map(s => {
        const totalAmt = Number(s.total_amount ?? 0);
        const totalUnits = Number(s.total_units_sold ?? 0);

        return {
          sale_id: s.sale_id,
          receipt_number: `REC-2026-${String(s.sale_id).padStart(4, '0')}`,
          sale_date: s.sale_date ? String(s.sale_date) : '2026-04-10',
          customer_name: s.customer_name || 'Walk-in Customer',
          payment_method: 'UPI',
          subtotal: totalAmt,
          tax_amount: 0,
          discount_amount: 0,
          total_amount: totalAmt,
          cashier_name: s.employee_name || 'Staff Cashier',
          total_units_sold: totalUnits,
          total_cost_basis: totalAmt * 0.7,
          realized_profit: totalAmt * 0.3,
          items: [
            {
              product_id: 1,
              product_name: 'Store Merchandise Item',
              quantity: totalUnits || 1,
              unit_price: totalUnits > 0 ? (totalAmt / totalUnits) : totalAmt,
              buy_price: (totalUnits > 0 ? (totalAmt / totalUnits) : totalAmt) * 0.7
            }
          ],
          _is_live: true
        };
      });

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        liveData = liveData.filter(s => 
          s.receipt_number.toLowerCase().includes(term) ||
          s.customer_name.toLowerCase().includes(term)
        );
      }

      if (fromDate) {
        liveData = liveData.filter(s => s.sale_date.split(' ')[0] >= fromDate);
      }

      if (toDate) {
        liveData = liveData.filter(s => s.sale_date.split(' ')[0] <= toDate);
      }

      return liveData;
    }
    throw new Error(res.message || "Failed to load sales log from database.");
  }

  // Explicit mock preview
  let result = [...MOCK_SALES_LOG];

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    result = result.filter(s => 
      s.receipt_number.toLowerCase().includes(term) ||
      s.customer_name.toLowerCase().includes(term)
    );
  }

  if (paymentMethod && paymentMethod !== 'ALL') {
    result = result.filter(s => s.payment_method === paymentMethod);
  }

  if (fromDate) {
    result = result.filter(s => s.sale_date.split(' ')[0] >= fromDate);
  }

  if (toDate) {
    result = result.filter(s => s.sale_date.split(' ')[0] <= toDate);
  }

  return result;
}

/**
 * Process and record a new sale (POS billing).
 * Executes: POST /api/sales
 * 
 * @param {Object} saleData
 */
export async function recordSale(saleData) {
  if (!getUseMockData()) {
    const payload = {
      employee_id: 1,
      customer_name: saleData.customer_name || 'Walk-in Customer',
      items: saleData.items.map(it => ({
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: it.unit_price
      }))
    };

    return await apiRequest('/sales', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  console.log("[Mock Preview] Recording sale transaction:", saleData);
  const newSale = {
    sale_id: Date.now(),
    receipt_number: `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    sale_date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    customer_name: saleData.customer_name || 'Walk-in Customer',
    payment_method: saleData.payment_method || 'UPI',
    subtotal: saleData.subtotal,
    tax_amount: saleData.tax_amount,
    discount_amount: saleData.discount_amount || 0,
    total_amount: saleData.total_amount,
    cashier_name: saleData.cashier_name || 'Admin',
    total_units_sold: saleData.items.reduce((sum, item) => sum + item.quantity, 0),
    total_cost_basis: saleData.items.reduce((sum, item) => sum + (item.quantity * item.buy_price), 0),
    realized_profit: saleData.total_amount - saleData.items.reduce((sum, item) => sum + (item.quantity * item.buy_price), 0),
    items: saleData.items
  };

  saleData.items.forEach(soldItem => {
    const p = MOCK_PRODUCT_STOCK.find(prod => prod.product_id === soldItem.product_id);
    if (p) {
      p.total_stock = Math.max(0, p.total_stock - soldItem.quantity);
      p.stock_status = p.total_stock === 0 ? 'OUT_OF_STOCK' : (p.total_stock <= p.min_stock_level ? 'LOW_STOCK' : 'IN_STOCK');
    }
  });

  MOCK_SALES_LOG.unshift(newSale);
  return { success: true, receipt: newSale };
}
