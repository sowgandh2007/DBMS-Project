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
        const unitPrice = p.unit_price !== undefined && p.unit_price !== null ? Number(p.unit_price) : 0;
        const costPrice = p.cost_price !== undefined && p.cost_price !== null ? Number(p.cost_price) : Number((unitPrice * 0.7).toFixed(2));

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
    category: productData.category || 'General',
    cost_price: parseFloat(productData.cost_price) || 0,
    unit_price: parseFloat(productData.unit_price) || 0,
    reorder_level: parseInt(productData.reorder_level, 10) || 10,
    total_stock: 0,
    stock_status: 'OUT_OF_STOCK',
    is_active: true
  };
  MOCK_PRODUCT_STOCK.unshift(newProduct);
  return { success: true, data: newProduct };
}

/**
 * Update an existing product in the database.
 */
export async function updateProduct(productId, productData) {
  if (!getUseMockData()) {
    return await apiRequest(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }

  const idx = MOCK_PRODUCT_STOCK.findIndex(p => p.product_id === productId);
  if (idx !== -1) {
    MOCK_PRODUCT_STOCK[idx] = { ...MOCK_PRODUCT_STOCK[idx], ...productData };
    return { success: true, data: MOCK_PRODUCT_STOCK[idx] };
  }
  throw new Error(`Product #${productId} not found.`);
}

/**
 * Delete or deactivate a product.
 */
export async function deleteProduct(productId, hardDelete = true) {
  if (!getUseMockData()) {
    return await apiRequest(`/products/${productId}?hard=${hardDelete}`, {
      method: 'DELETE'
    });
  }

  const idx = MOCK_PRODUCT_STOCK.findIndex(p => p.product_id === productId);
  if (idx !== -1) {
    if (hardDelete) {
      MOCK_PRODUCT_STOCK.splice(idx, 1);
    } else {
      MOCK_PRODUCT_STOCK[idx].is_active = false;
    }
    return { success: true };
  }
  throw new Error(`Product #${productId} not found.`);
}

/**
 * Category Management Functions
 */
export async function getCategories() {
  if (!getUseMockData()) {
    const res = await apiRequest('/categories');
    return res.data || [];
  }
  return [
    { category_id: 1, category_name: 'Electronics', product_count: 4 },
    { category_id: 2, category_name: 'Stationery', product_count: 1 },
    { category_id: 3, category_name: 'Furniture', product_count: 1 }
  ];
}

export async function createCategory(categoryData) {
  if (!getUseMockData()) {
    return await apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  }
  return { success: true, data: { category_id: Date.now(), ...categoryData } };
}

export async function updateCategory(categoryId, categoryData) {
  if (!getUseMockData()) {
    return await apiRequest(`/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
  }
  return { success: true, data: { category_id: categoryId, ...categoryData } };
}

export async function deleteCategory(categoryId) {
  if (!getUseMockData()) {
    return await apiRequest(`/categories/${categoryId}`, {
      method: 'DELETE'
    });
  }
  return { success: true };
}

export const getProducts = searchProducts;
