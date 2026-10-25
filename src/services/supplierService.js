// =============================================================================
// SERVICE: Suppliers Directory
// File: src/services/supplierService.js
// =============================================================================
// MATCHING SQL FILE: backend/queries/07_supplier_products.sql
// =============================================================================

import { apiRequest, getUseMockData } from './api/apiClient';
import { MOCK_SUPPLIERS, MOCK_PRODUCT_STOCK } from '../data/mockData';

/**
 * Search and list suppliers.
 * Executes: GET /api/suppliers/list or GET /api/suppliers
 * 
 * @param {Object} filters
 */
export async function getSuppliers(filters = {}) {
  const { searchTerm = '', status = 'ALL' } = filters;

  if (!getUseMockData()) {
    const res = await apiRequest('/suppliers/list');
    if (res && res.data) {
      let liveData = res.data.map(s => ({
        supplier_id: s.supplier_id,
        supplier_name: s.name || s.supplier_name,
        contact_name: s.contact_person || 'Procurement Rep',
        email: s.email || 'contact@supplier.com',
        phone: s.phone || '+91 98765 43210',
        address: s.address || 'Industrial Area, Phase 2',
        status: 'ACTIVE',
        total_products_supplied: 4,
        total_orders_placed: 2,
        total_procurement_spend: 35000,
        _is_live: true
      }));

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        liveData = liveData.filter(s => 
          s.supplier_name.toLowerCase().includes(term) ||
          s.contact_name.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term)
        );
      }

      if (status && status !== 'ALL') {
        liveData = liveData.filter(s => s.status === status);
      }

      return liveData;
    }
    throw new Error(res.message || "Failed to load suppliers from database.");
  }

  // Explicit mock preview
  let result = [...MOCK_SUPPLIERS];

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    result = result.filter(s => 
      s.supplier_name.toLowerCase().includes(term) ||
      s.contact_name.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term)
    );
  }

  if (status && status !== 'ALL') {
    result = result.filter(s => s.status === status);
  }

  return result;
}

/**
 * Get products supplied by a specific supplier.
 * Executes: backend/queries/07_supplier_products.sql via GET /api/suppliers?supplier_id=:id
 * 
 * @param {number} supplierId
 */
export async function getSupplierProducts(supplierId) {
  if (!getUseMockData()) {
    const res = await apiRequest(`/suppliers?supplier_id=${supplierId}`);
    if (res && res.data) {
      return res.data.map(p => ({
        product_id: p.product_id,
        sku: p.sku || 'SKU-SUP',
        product_name: p.product_name || 'Supplied Item',
        unit_price: Number(p.supply_price || 100),
        cost_price: Number(p.supply_price || 80),
        lead_time_days: p.lead_time_days || 3,
        supplier_id: p.supplier_id,
        supplier_name: p.supplier_name,
        _is_live: true
      }));
    }
    throw new Error(res.message || "Failed to load supplier products from database.");
  }

  return MOCK_PRODUCT_STOCK.filter(p => p.supplier_id === supplierId);
}

/**
 * Register a new supplier.
 */
export async function createSupplier(supplierData) {
  if (!getUseMockData()) {
    return await apiRequest('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData)
    });
  }

  console.log("[Mock Preview] Creating supplier:", supplierData);
  const newSupplier = {
    supplier_id: Date.now(),
    supplier_name: supplierData.supplier_name,
    contact_name: supplierData.contact_name,
    email: supplierData.email,
    phone: supplierData.phone,
    address: supplierData.address,
    status: supplierData.status || 'ACTIVE',
    total_products_supplied: 0,
    total_orders_placed: 0,
    total_procurement_spend: 0
  };
  MOCK_SUPPLIERS.push(newSupplier);
  return { success: true, supplier: newSupplier };
}
