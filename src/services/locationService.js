// =============================================================================
// SERVICE: Product Location & Rack Finder
// File: src/services/locationService.js
// =============================================================================
// MATCHING SQL FILE: backend/queries/03_current_stock_location.sql
// CANONICAL VIEW USED: product_location
// =============================================================================

import { apiRequest, getUseMockData } from './api/apiClient';
import { MOCK_PRODUCT_LOCATIONS } from '../data/mockData';

/**
 * Search product physical location coordinates across racks and shelves.
 * Executes: backend/queries/03_current_stock_location.sql via GET /api/inventory
 * 
 * @param {Object} filters
 */
export async function findProductLocations(filters = {}) {
  const { searchTerm = '', aisle = 'all', rackCode = 'all' } = filters;

  if (!getUseMockData()) {
    const res = await apiRequest('/inventory?include_inactive=false');
    if (res && res.data) {
      let liveData = res.data.map(loc => {
        const rCode = loc.rack_code || 'UNASSIGNED';
        const sNum = loc.shelf_number || 1;
        const qty = Number(loc.current_stock ?? loc.stock_quantity ?? 0);

        return {
          placement_id: loc.product_id,
          product_id: loc.product_id,
          product_name: loc.product_name,
          sku: loc.sku,
          rack_code: rCode,
          aisle_number: loc.aisle || '01',
          shelf_number: sNum,
          shelf_code: `${rCode}-${String(sNum).padStart(2, '0')}`,
          shelf_id: sNum,
          quantity: qty,
          current_stock: qty,
          low_stock: Boolean(loc.low_stock),
          last_restocked: '2026-04-10 14:30',
          _is_live: true
        };
      });

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        liveData = liveData.filter(loc => 
          loc.product_name.toLowerCase().includes(term) ||
          loc.sku.toLowerCase().includes(term) ||
          loc.shelf_code.toLowerCase().includes(term)
        );
      }

      if (aisle && aisle !== 'all') {
        liveData = liveData.filter(loc => loc.aisle_number === aisle);
      }

      if (rackCode && rackCode !== 'all') {
        liveData = liveData.filter(loc => loc.rack_code === rackCode);
      }

      return liveData;
    }
    throw new Error(res.message || "Failed to load product locations from database.");
  }

  // Explicit mock preview
  let result = [...MOCK_PRODUCT_LOCATIONS];

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    result = result.filter(loc => 
      loc.product_name.toLowerCase().includes(term) ||
      loc.sku.toLowerCase().includes(term) ||
      loc.shelf_code.toLowerCase().includes(term)
    );
  }

  if (aisle && aisle !== 'all') {
    result = result.filter(loc => loc.aisle_number === aisle);
  }

  if (rackCode && rackCode !== 'all') {
    result = result.filter(loc => loc.rack_code === rackCode);
  }

  return result;
}

/**
 * Reassign / Move a product to a new shelf.
 */
export async function moveProductToShelf(moveData) {
  if (!getUseMockData()) {
    return await apiRequest('/locations/move', {
      method: 'POST',
      body: JSON.stringify(moveData)
    });
  }

  console.log("[Mock Preview] Moving product location:", moveData);
  const loc = MOCK_PRODUCT_LOCATIONS.find(l => l.placement_id === moveData.placement_id);
  if (loc) {
    loc.shelf_id = moveData.new_shelf_id;
    loc.shelf_code = moveData.new_shelf_code || loc.shelf_code;
    loc.last_restocked = new Date().toISOString().replace('T', ' ').substring(0, 16);
  }
  return { success: true };
}
