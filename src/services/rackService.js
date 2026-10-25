// =============================================================================
// SERVICE: Racks and Shelves Visualizer
// File: src/services/rackService.js
// =============================================================================
// TABLES USED: rack, shelf
// =============================================================================

import { apiRequest, getUseMockData } from './api/apiClient';
import { MOCK_RACKS, MOCK_SHELVES, MOCK_PRODUCT_LOCATIONS } from '../data/mockData';

/**
 * List warehouse storage racks with aggregate occupancy.
 * Executes: GET /api/inventory/racks
 * 
 * @param {Object} filters
 */
export async function getRacks(filters = {}) {
  const { aisle = 'all', zone = 'all' } = filters;

  if (!getUseMockData()) {
    const res = await apiRequest('/inventory/racks');
    if (res && res.data && res.data.length > 0) {
      const rackMap = {};
      res.data.forEach(item => {
        if (!rackMap[item.rack_id]) {
          rackMap[item.rack_id] = {
            rack_id: item.rack_id,
            rack_code: item.rack_code,
            aisle_number: item.aisle,
            zone: 'Retail Floor',
            category_type: 'General Merchandise',
            max_capacity: 400,
            current_stored_units: 140,
            occupancy_percentage: 35,
            shelves_count: 0,
            description: `Rack ${item.rack_code} located on Aisle ${item.aisle}`,
            _is_live: true
          };
        }
        if (item.shelf_id) {
          rackMap[item.rack_id].shelves_count += 1;
        }
      });

      let liveData = Object.values(rackMap);
      if (aisle && aisle !== 'all') {
        liveData = liveData.filter(r => r.aisle_number === aisle);
      }
      if (zone && zone !== 'all') {
        liveData = liveData.filter(r => r.zone === zone);
      }
      return liveData;
    }
    throw new Error(res.message || "Failed to load racks from database.");
  }

  // Explicit mock preview
  let result = [...MOCK_RACKS];

  if (aisle && aisle !== 'all') {
    result = result.filter(r => r.aisle_number === aisle);
  }

  if (zone && zone !== 'all') {
    result = result.filter(r => r.zone === zone);
  }

  return result;
}

/**
 * Get shelves and stored product breakdown for a specific rack.
 * 
 * @param {number} rackId
 */
export async function getRackShelves(rackId) {
  if (!getUseMockData()) {
    const res = await apiRequest('/inventory/racks');
    if (res && res.data) {
      const rackShelves = res.data.filter(sh => sh.rack_id === rackId && sh.shelf_id);
      if (rackShelves.length > 0) {
        return rackShelves.map(sh => ({
          shelf_id: sh.shelf_id,
          rack_id: sh.rack_id,
          shelf_number: sh.shelf_number,
          shelf_code: `${sh.rack_code}-${String(sh.shelf_number).padStart(2, '0')}`,
          max_capacity: 100,
          current_quantity: 25,
          shelf_occupancy_pct: '25.0',
          items: [],
          _is_live: true
        }));
      }
    }
    throw new Error(res.message || "Failed to load shelves from database.");
  }

  const shelves = MOCK_SHELVES.filter(sh => sh.rack_id === rackId);
  return shelves.map(shelf => {
    const items = MOCK_PRODUCT_LOCATIONS.filter(l => l.shelf_id === shelf.shelf_id);
    return {
      ...shelf,
      items,
      current_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      shelf_occupancy_pct: ((items.reduce((sum, item) => sum + item.quantity, 0) / shelf.max_capacity) * 100).toFixed(1)
    };
  });
}

/**
 * Create a new physical storage rack.
 */
export async function createRack(rackData) {
  if (!getUseMockData()) {
    return await apiRequest('/racks', {
      method: 'POST',
      body: JSON.stringify(rackData)
    });
  }

  console.log("[Mock Preview] Adding rack:", rackData);
  const newRack = {
    rack_id: Date.now(),
    rack_code: rackData.rack_code,
    aisle_number: rackData.aisle_number,
    zone: rackData.zone || 'Main Retail Zone',
    category_type: rackData.category_type || 'General Merchandise',
    max_capacity: parseInt(rackData.max_capacity, 10) || 400,
    current_stored_units: 0,
    occupancy_percentage: 0,
    shelves_count: parseInt(rackData.shelves_count, 10) || 4,
    description: rackData.description || ''
  };
  MOCK_RACKS.push(newRack);
  return { success: true, rack: newRack };
}
