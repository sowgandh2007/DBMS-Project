// =============================================================================
// SERVICE: Product Catalog & Search
// File: src/services/productService.js
// =============================================================================
// MATCHING SQL FILE: backend/queries/01_product_search.sql
// =============================================================================

import { apiRequest, getUseMockData } from './api/apiClient';
import { MOCK_PRODUCT_STOCK } from '../data/mockData';

/**
 * Search and filter products catalog.
 * Executes: backend/queries/01_product_search.sql via GET /api/products
 * 
 * @param {Object} filters
 */
export async function searchProducts(filters = {}) {
  const { 
    searchTerm = '', 
    category = 'all', 
    status = 'ALL', 
    minPrice = 0, 
    maxPrice = Infinity,
    sortBy = 'newest'
  } = filters;

  if (!getUseMockData()) {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.append('search', searchTerm.trim());
    if (category && category !== 'all' && !isNaN(category)) {
      params.append('category_id', category);
    }
    params.append('include_inactive', 'false');

    const response = await apiRequest(`/products?${params.toString()}`);
    if (response && response.data) {
      let liveData = response.data.map(p => {
        const qty = Number(p.current_stock ?? p.stock_quantity ?? 0);
        const isLow = Boolean(p.low_stock);
        const unitPrice = Number(p.unit_price ?? 100);
        const costPrice = Number(p.cost_price ?? (unitPrice * 0.7));

        let stockStatus = 'IN_STOCK';
        if (qty <= 0) stockStatus = 'OUT_OF_STOCK';
        else if (isLow) stockStatus = 'LOW_STOCK';

        return {
          product_id: p.product_id,
          sku: p.sku,
          product_name: p.product_name,
          category: p.category_name || p.category || 'General',
          category_name: p.category_name,
          unit_price: unitPrice,
          cost_price: costPrice,
          total_stock: qty,
          stock_quantity: qty,
          current_stock: qty,
          stock_status: stockStatus,
          low_stock: isLow,
          rack_code: p.rack_code || 'A1',
          aisle: p.aisle || '01',
          shelf_number: p.shelf_number || 1,
          _is_live: true
        };
      });

      if (status && status !== 'ALL') {
        liveData = liveData.filter(p => p.stock_status === status);
      }
      if (minPrice > 0) {
        liveData = liveData.filter(p => p.unit_price >= minPrice);
      }
      if (maxPrice < Infinity && maxPrice > 0) {
        liveData = liveData.filter(p => p.unit_price <= maxPrice);
      }

      return liveData;
    }
    throw new Error(response.message || "Failed to load products from database.");
  }

  // Explicit mock preview mode
  let result = [...MOCK_PRODUCT_STOCK];

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    result = result.filter(p => 
      p.product_name.toLowerCase().includes(term) || 
      p.sku.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  }

  if (category && category !== 'all') {
    result = result.filter(p => p.category === category);
  }

  if (status && status !== 'ALL') {
    result = result.filter(p => p.stock_status === status);
  }

  if (minPrice > 0) {
    result = result.filter(p => p.unit_price >= minPrice);
  }

  if (maxPrice < Infinity && maxPrice > 0) {
    result = result.filter(p => p.unit_price <= maxPrice);
  }

  // Sorting
  if (sortBy === 'name-asc') result.sort((a, b) => a.product_name.localeCompare(b.product_name));
  else if (sortBy === 'name-desc') result.sort((a, b) => b.product_name.localeCompare(a.product_name));
  else if (sortBy === 'price-asc') result.sort((a, b) => a.unit_price - b.unit_price);
  else if (sortBy === 'price-desc') result.sort((a, b) => b.unit_price - a.unit_price);
  else if (sortBy === 'stock-desc') result.sort((a, b) => b.total_stock - a.total_stock);

  return result;
}

/**
 * Add a new product to the database.
 */
export async function createProduct(productData) {
  if (!getUseMockData()) {
    return await apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  console.log("[Mock Preview] Simulating create product:", productData);
  const newProduct = {
    product_id: Date.now(),
    sku: productData.sku || `SKU-MAN-${Math.floor(100 + Math.random() * 900)}`,
    product_name: productData.product_name,
    category: productData.category,
    cost_price: parseFloat(productData.cost_price) || 0,
    unit_price: parseFloat(productData.unit_price) || 0,
    min_stock_level: parseInt(productData.min_stock_level, 10) || 10,
    total_stock: 0,
    stock_status: 'OUT_OF_STOCK',
    stock_deficit: parseInt(productData.min_stock_level, 10) || 10,
    supplier_id: productData.supplier_id ? parseInt(productData.supplier_id, 10) : null,
    supplier_name: productData.supplier_name || 'Assigned Supplier'
  };
  MOCK_PRODUCT_STOCK.unshift(newProduct);
  return { success: true, product: newProduct };
}

export const getProducts = searchProducts;
