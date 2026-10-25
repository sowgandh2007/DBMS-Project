// =============================================================================
// REALISTIC PREVIEW / MOCK DATASET
// Retail Inventory & Rack Management System
// =============================================================================
// NOTE FOR DEVELOPER:
// This file provides realistic preview data for testing the UI components,
// forms, filters, and layout before your database is hooked up.
// When your backend is ready, toggle off mock mode in `src/services/api/apiClient.js`.
// All data structures here strictly match the database schema and views.
// =============================================================================

export const MOCK_SUPPLIERS = [
  {
    supplier_id: 1,
    supplier_name: "Apex Wholesale Distributors",
    contact_name: "Rajesh Sharma",
    email: "orders@apexdistributors.in",
    phone: "+91 98201 44521",
    address: "Plot 42, Industrial Area Phase 2, Mumbai",
    status: "PREFERRED",
    total_products_supplied: 14,
    total_orders_placed: 28,
    total_procurement_spend: 345000.00
  },
  {
    supplier_id: 2,
    supplier_name: "Heritage FMCG Logistics",
    contact_name: "Pooja Varma",
    email: "pv@heritagefmcg.com",
    phone: "+91 98450 11982",
    address: "Warehouse 12, Outer Ring Road, Bangalore",
    status: "ACTIVE",
    total_products_supplied: 19,
    total_orders_placed: 35,
    total_procurement_spend: 512400.00
  },
  {
    supplier_id: 3,
    supplier_name: "Metro Fresh & Dairy Co.",
    contact_name: "Arun Nair",
    email: "supply@metrofresh.org",
    phone: "+91 94471 88203",
    address: "Cold Chain Park, Kakkanad, Kochi",
    status: "ACTIVE",
    total_products_supplied: 8,
    total_orders_placed: 42,
    total_procurement_spend: 198000.00
  },
  {
    supplier_id: 4,
    supplier_name: "Zenith Care & Hygiene Ltd.",
    contact_name: "Siddharth Sen",
    email: "b2b@zenithcare.co.in",
    phone: "+91 97112 55490",
    address: "Sector 18, Udyog Vihar, Gurugram",
    status: "PREFERRED",
    total_products_supplied: 12,
    total_orders_placed: 19,
    total_procurement_spend: 215600.00
  },
  {
    supplier_id: 5,
    supplier_name: "Global Grain & Spice Mills",
    contact_name: "Harish Patel",
    email: "trade@globalgrain.com",
    phone: "+91 98250 67341",
    address: "APMC Market Yard, Unjha, Gujarat",
    status: "INACTIVE",
    total_products_supplied: 6,
    total_orders_placed: 9,
    total_procurement_spend: 84000.00
  }
];

export const MOCK_RACKS = [
  {
    rack_id: 1,
    rack_code: "RACK-A1",
    aisle_number: "Aisle 01",
    zone: "Dry Grocery Zone",
    category_type: "Grocery & Staples",
    max_capacity: 480,
    current_stored_units: 390,
    occupancy_percentage: 81.3,
    shelves_count: 4,
    description: "Heavy duty racking for rice, flour, pulses, and grain sacks"
  },
  {
    rack_id: 2,
    rack_code: "RACK-A2",
    aisle_number: "Aisle 01",
    zone: "Dry Grocery Zone",
    category_type: "Cooking Essentials",
    max_capacity: 400,
    current_stored_units: 260,
    occupancy_percentage: 65.0,
    shelves_count: 4,
    description: "Edible oils, ghee, packaged spices and condiments"
  },
  {
    rack_id: 3,
    rack_code: "RACK-B1",
    aisle_number: "Aisle 02",
    zone: "Personal Care Zone",
    category_type: "Personal Hygiene",
    max_capacity: 520,
    current_stored_units: 485,
    occupancy_percentage: 93.3,
    shelves_count: 4,
    description: "Soaps, shampoos, skincare, and oral care products"
  },
  {
    rack_id: 4,
    rack_code: "RACK-B2",
    aisle_number: "Aisle 02",
    zone: "Personal Care Zone",
    category_type: "Hair & Grooming",
    max_capacity: 400,
    current_stored_units: 180,
    occupancy_percentage: 45.0,
    shelves_count: 4,
    description: "Deodorants, grooming kits, razors, and creams"
  },
  {
    rack_id: 5,
    rack_code: "RACK-C1",
    aisle_number: "Aisle 03",
    zone: "Cold Storage Zone",
    category_type: "Dairy & Chilled",
    max_capacity: 350,
    current_stored_units: 295,
    occupancy_percentage: 84.3,
    shelves_count: 4,
    description: "Temperature-monitored refrigerated rack (4°C - 8°C)"
  },
  {
    rack_id: 6,
    rack_code: "RACK-C2",
    aisle_number: "Aisle 03",
    zone: "Beverages Zone",
    category_type: "Drinks & Juices",
    max_capacity: 450,
    current_stored_units: 210,
    occupancy_percentage: 46.7,
    shelves_count: 4,
    description: "Bottled water, energy drinks, syrups, and packaged teas"
  },
  {
    rack_id: 7,
    rack_code: "RACK-D1",
    aisle_number: "Aisle 04",
    zone: "Household Essentials",
    category_type: "Cleaning Supplies",
    max_capacity: 400,
    current_stored_units: 310,
    occupancy_percentage: 77.5,
    shelves_count: 4,
    description: "Floor cleaners, detergents, dishwashing bars, and paper rolls"
  }
];

export const MOCK_SHELVES = [
  // RACK-A1
  { shelf_id: 101, rack_id: 1, rack_code: "RACK-A1", shelf_code: "RACK-A1-S1", shelf_level: 1, max_capacity: 120, current_quantity: 110, unique_sku_count: 2 },
  { shelf_id: 102, rack_id: 1, rack_code: "RACK-A1", shelf_code: "RACK-A1-S2", shelf_level: 2, max_capacity: 120, current_quantity: 95,  unique_sku_count: 3 },
  { shelf_id: 103, rack_id: 1, rack_code: "RACK-A1", shelf_code: "RACK-A1-S3", shelf_level: 3, max_capacity: 120, current_quantity: 100, unique_sku_count: 2 },
  { shelf_id: 104, rack_id: 1, rack_code: "RACK-A1", shelf_code: "RACK-A1-S4", shelf_level: 4, max_capacity: 120, current_quantity: 85,  unique_sku_count: 1 },

  // RACK-A2
  { shelf_id: 105, rack_id: 2, rack_code: "RACK-A2", shelf_code: "RACK-A2-S1", shelf_level: 1, max_capacity: 100, current_quantity: 75,  unique_sku_count: 2 },
  { shelf_id: 106, rack_id: 2, rack_code: "RACK-A2", shelf_code: "RACK-A2-S2", shelf_level: 2, max_capacity: 100, current_quantity: 65,  unique_sku_count: 2 },
  { shelf_id: 107, rack_id: 2, rack_code: "RACK-A2", shelf_code: "RACK-A2-S3", shelf_level: 3, max_capacity: 100, current_quantity: 60,  unique_sku_count: 1 },
  { shelf_id: 108, rack_id: 2, rack_code: "RACK-A2", shelf_code: "RACK-A2-S4", shelf_level: 4, max_capacity: 100, current_quantity: 60,  unique_sku_count: 1 },

  // RACK-B1
  { shelf_id: 109, rack_id: 3, rack_code: "RACK-B1", shelf_code: "RACK-B1-S1", shelf_level: 1, max_capacity: 130, current_quantity: 125, unique_sku_count: 3 },
  { shelf_id: 110, rack_id: 3, rack_code: "RACK-B1", shelf_code: "RACK-B1-S2", shelf_level: 2, max_capacity: 130, current_quantity: 128, unique_sku_count: 4 },
  { shelf_id: 111, rack_id: 3, rack_code: "RACK-B1", shelf_code: "RACK-B1-S3", shelf_level: 3, max_capacity: 130, current_quantity: 118, unique_sku_count: 2 },
  { shelf_id: 112, rack_id: 3, rack_code: "RACK-B1", shelf_code: "RACK-B1-S4", shelf_level: 4, max_capacity: 130, current_quantity: 114, unique_sku_count: 2 },

  // RACK-C1 (Cold)
  { shelf_id: 113, rack_id: 5, rack_code: "RACK-C1", shelf_code: "RACK-C1-S1", shelf_level: 1, max_capacity: 90,  current_quantity: 82,  unique_sku_count: 2 },
  { shelf_id: 114, rack_id: 5, rack_code: "RACK-C1", shelf_code: "RACK-C1-S2", shelf_level: 2, max_capacity: 90,  current_quantity: 78,  unique_sku_count: 2 },
  { shelf_id: 115, rack_id: 5, rack_code: "RACK-C1", shelf_code: "RACK-C1-S3", shelf_level: 3, max_capacity: 85,  current_quantity: 70,  unique_sku_count: 1 },
  { shelf_id: 116, rack_id: 5, rack_code: "RACK-C1", shelf_code: "RACK-C1-S4", shelf_level: 4, max_capacity: 85,  current_quantity: 65,  unique_sku_count: 1 },
];

// Corresponds directly to the `product_stock` VIEW
export const MOCK_PRODUCT_STOCK = [
  {
    product_id: 1,
    sku: "SKU-GROC-101",
    product_name: "Daawat Basmati Rice (5kg)",
    category: "Grocery & Staples",
    cost_price: 360.00,
    unit_price: 495.00,
    min_stock_level: 30,
    total_stock: 65,
    stock_status: "IN_STOCK",
    stock_deficit: 0,
    supplier_id: 1,
    supplier_name: "Apex Wholesale Distributors"
  },
  {
    product_id: 2,
    sku: "SKU-GROC-102",
    product_name: "Aashirvaad Shudh Chakki Atta (10kg)",
    category: "Grocery & Staples",
    cost_price: 340.00,
    unit_price: 440.00,
    min_stock_level: 25,
    total_stock: 45,
    stock_status: "IN_STOCK",
    stock_deficit: 0,
    supplier_id: 1,
    supplier_name: "Apex Wholesale Distributors"
  },
  {
    product_id: 3,
    sku: "SKU-CARE-201",
    product_name: "Santoor Sandal & Almond Soap (Pack of 4)",
    category: "Personal Hygiene",
    cost_price: 135.00,
    unit_price: 195.00,
    min_stock_level: 40,
    total_stock: 92,
    stock_status: "IN_STOCK",
    stock_deficit: 0,
    supplier_id: 2,
    supplier_name: "Heritage FMCG Logistics"
  },
  {
    product_id: 4,
    sku: "SKU-CARE-202",
    product_name: "Dettol Antiseptic Liquid (500ml)",
    category: "Personal Hygiene",
    cost_price: 165.00,
    unit_price: 230.00,
    min_stock_level: 35,
    total_stock: 12,
    stock_status: "LOW_STOCK",
    stock_deficit: 23,
    supplier_id: 4,
    supplier_name: "Zenith Care & Hygiene Ltd."
  },
  {
    product_id: 5,
    sku: "SKU-CARE-203",
    product_name: "Colgate Total Toothpaste (150g)",
    category: "Personal Hygiene",
    cost_price: 98.00,
    unit_price: 145.00,
    min_stock_level: 50,
    total_stock: 8,
    stock_status: "LOW_STOCK",
    stock_deficit: 42,
    supplier_id: 2,
    supplier_name: "Heritage FMCG Logistics"
  },
  {
    product_id: 6,
    sku: "SKU-DAIRY-301",
    product_name: "Amul Pasteurised Butter (500g)",
    category: "Dairy & Chilled",
    cost_price: 235.00,
    unit_price: 275.00,
    min_stock_level: 30,
    total_stock: 48,
    stock_status: "IN_STOCK",
    stock_deficit: 0,
    supplier_id: 3,
    supplier_name: "Metro Fresh & Dairy Co."
  },
  {
    product_id: 7,
    sku: "SKU-DAIRY-302",
    product_name: "Milky Mist Paneer Fresh (200g)",
    category: "Dairy & Chilled",
    cost_price: 85.00,
    unit_price: 120.00,
    min_stock_level: 20,
    total_stock: 4,
    stock_status: "LOW_STOCK",
    stock_deficit: 16,
    supplier_id: 3,
    supplier_name: "Metro Fresh & Dairy Co."
  },
  {
    product_id: 8,
    sku: "SKU-BEV-401",
    product_name: "Red Bull Energy Drink (250ml Can)",
    category: "Drinks & Juices",
    cost_price: 95.00,
    unit_price: 125.00,
    min_stock_level: 24,
    total_stock: 0,
    stock_status: "OUT_OF_STOCK",
    stock_deficit: 24,
    supplier_id: 2,
    supplier_name: "Heritage FMCG Logistics"
  },
  {
    product_id: 9,
    sku: "SKU-CLEN-501",
    product_name: "Surf Excel Matic Front Load Detergent (2kg)",
    category: "Cleaning Supplies",
    cost_price: 360.00,
    unit_price: 480.00,
    min_stock_level: 20,
    total_stock: 36,
    stock_status: "IN_STOCK",
    stock_deficit: 0,
    supplier_id: 4,
    supplier_name: "Zenith Care & Hygiene Ltd."
  },
  {
    product_id: 10,
    sku: "SKU-CLEN-502",
    product_name: "Lizol Disinfectant Floor Cleaner Citrus (2L)",
    category: "Cleaning Supplies",
    cost_price: 290.00,
    unit_price: 399.00,
    min_stock_level: 25,
    total_stock: 2,
    stock_status: "LOW_STOCK",
    stock_deficit: 23,
    supplier_id: 4,
    supplier_name: "Zenith Care & Hygiene Ltd."
  },
  {
    product_id: 11,
    sku: "SKU-GROC-103",
    product_name: "Fortune Sunlite Refined Sunflower Oil (1L)",
    category: "Cooking Essentials",
    cost_price: 118.00,
    unit_price: 160.00,
    min_stock_level: 40,
    total_stock: 62,
    stock_status: "IN_STOCK",
    stock_deficit: 0,
    supplier_id: 1,
    supplier_name: "Apex Wholesale Distributors"
  },
  {
    product_id: 12,
    sku: "SKU-GROC-104",
    product_name: "Tata Salt Vacuum Evaporated (1kg)",
    category: "Cooking Essentials",
    cost_price: 20.00,
    unit_price: 28.00,
    min_stock_level: 60,
    total_stock: 110,
    stock_status: "IN_STOCK",
    stock_deficit: 0,
    supplier_id: 1,
    supplier_name: "Apex Wholesale Distributors"
  }
];

// Corresponds directly to the `product_location` VIEW
export const MOCK_PRODUCT_LOCATIONS = [
  {
    placement_id: 1,
    product_id: 1,
    sku: "SKU-GROC-101",
    product_name: "Daawat Basmati Rice (5kg)",
    category: "Grocery & Staples",
    rack_id: 1,
    rack_code: "RACK-A1",
    aisle_number: "Aisle 01",
    zone: "Dry Grocery Zone",
    shelf_id: 101,
    shelf_code: "RACK-A1-S1",
    shelf_level: 1,
    quantity: 40,
    shelf_capacity: 120,
    shelf_occupancy_pct: 33.3,
    last_restocked: "2026-10-15 14:30"
  },
  {
    placement_id: 2,
    product_id: 1,
    sku: "SKU-GROC-101",
    product_name: "Daawat Basmati Rice (5kg)",
    category: "Grocery & Staples",
    rack_id: 1,
    rack_code: "RACK-A1",
    aisle_number: "Aisle 01",
    zone: "Dry Grocery Zone",
    shelf_id: 104,
    shelf_code: "RACK-A1-S4",
    shelf_level: 4,
    quantity: 25,
    shelf_capacity: 120,
    shelf_occupancy_pct: 20.8,
    last_restocked: "2026-10-12 11:15"
  },
  {
    placement_id: 3,
    product_id: 2,
    sku: "SKU-GROC-102",
    product_name: "Aashirvaad Shudh Chakki Atta (10kg)",
    category: "Grocery & Staples",
    rack_id: 1,
    rack_code: "RACK-A1",
    aisle_number: "Aisle 01",
    zone: "Dry Grocery Zone",
    shelf_id: 101,
    shelf_code: "RACK-A1-S1",
    shelf_level: 1,
    quantity: 45,
    shelf_capacity: 120,
    shelf_occupancy_pct: 37.5,
    last_restocked: "2026-10-16 09:20"
  },
  {
    placement_id: 4,
    product_id: 3,
    sku: "SKU-CARE-201",
    product_name: "Santoor Sandal & Almond Soap (Pack of 4)",
    category: "Personal Hygiene",
    rack_id: 3,
    rack_code: "RACK-B1",
    aisle_number: "Aisle 02",
    zone: "Personal Care Zone",
    shelf_id: 109,
    shelf_code: "RACK-B1-S1",
    shelf_level: 1,
    quantity: 52,
    shelf_capacity: 130,
    shelf_occupancy_pct: 40.0,
    last_restocked: "2026-10-14 16:45"
  },
  {
    placement_id: 5,
    product_id: 3,
    sku: "SKU-CARE-201",
    product_name: "Santoor Sandal & Almond Soap (Pack of 4)",
    category: "Personal Hygiene",
    rack_id: 3,
    rack_code: "RACK-B1",
    aisle_number: "Aisle 02",
    zone: "Personal Care Zone",
    shelf_id: 110,
    shelf_code: "RACK-B1-S2",
    shelf_level: 2,
    quantity: 40,
    shelf_capacity: 130,
    shelf_occupancy_pct: 30.8,
    last_restocked: "2026-10-15 10:00"
  },
  {
    placement_id: 6,
    product_id: 4,
    sku: "SKU-CARE-202",
    product_name: "Dettol Antiseptic Liquid (500ml)",
    category: "Personal Hygiene",
    rack_id: 3,
    rack_code: "RACK-B1",
    aisle_number: "Aisle 02",
    zone: "Personal Care Zone",
    shelf_id: 111,
    shelf_code: "RACK-B1-S3",
    shelf_level: 3,
    quantity: 12,
    shelf_capacity: 130,
    shelf_occupancy_pct: 9.2,
    last_restocked: "2026-10-09 13:30"
  },
  {
    placement_id: 7,
    product_id: 5,
    sku: "SKU-CARE-203",
    product_name: "Colgate Total Toothpaste (150g)",
    category: "Personal Hygiene",
    rack_id: 3,
    rack_code: "RACK-B1",
    aisle_number: "Aisle 02",
    zone: "Personal Care Zone",
    shelf_id: 110,
    shelf_code: "RACK-B1-S2",
    shelf_level: 2,
    quantity: 8,
    shelf_capacity: 130,
    shelf_occupancy_pct: 6.2,
    last_restocked: "2026-10-08 17:10"
  },
  {
    placement_id: 8,
    product_id: 6,
    sku: "SKU-DAIRY-301",
    product_name: "Amul Pasteurised Butter (500g)",
    category: "Dairy & Chilled",
    rack_id: 5,
    rack_code: "RACK-C1",
    aisle_number: "Aisle 03",
    zone: "Cold Storage Zone",
    shelf_id: 113,
    shelf_code: "RACK-C1-S1",
    shelf_level: 1,
    quantity: 48,
    shelf_capacity: 90,
    shelf_occupancy_pct: 53.3,
    last_restocked: "2026-10-17 08:30"
  },
  {
    placement_id: 9,
    product_id: 7,
    sku: "SKU-DAIRY-302",
    product_name: "Milky Mist Paneer Fresh (200g)",
    category: "Dairy & Chilled",
    rack_id: 5,
    rack_code: "RACK-C1",
    aisle_number: "Aisle 03",
    zone: "Cold Storage Zone",
    shelf_id: 114,
    shelf_code: "RACK-C1-S2",
    shelf_level: 2,
    quantity: 4,
    shelf_capacity: 90,
    shelf_occupancy_pct: 4.4,
    last_restocked: "2026-10-16 14:00"
  },
  {
    placement_id: 10,
    product_id: 9,
    sku: "SKU-CLEN-501",
    product_name: "Surf Excel Matic Front Load Detergent (2kg)",
    category: "Cleaning Supplies",
    rack_id: 7,
    rack_code: "RACK-D1",
    aisle_number: "Aisle 04",
    zone: "Household Essentials",
    shelf_id: 101,
    shelf_code: "RACK-D1-S1",
    shelf_level: 1,
    quantity: 36,
    shelf_capacity: 100,
    shelf_occupancy_pct: 36.0,
    last_restocked: "2026-10-14 11:00"
  },
  {
    placement_id: 11,
    product_id: 10,
    sku: "SKU-CLEN-502",
    product_name: "Lizol Disinfectant Floor Cleaner Citrus (2L)",
    category: "Cleaning Supplies",
    rack_id: 7,
    rack_code: "RACK-D1",
    aisle_number: "Aisle 04",
    zone: "Household Essentials",
    shelf_id: 102,
    shelf_code: "RACK-D1-S2",
    shelf_level: 2,
    quantity: 2,
    shelf_capacity: 100,
    shelf_occupancy_pct: 2.0,
    last_restocked: "2026-10-10 16:30"
  },
  {
    placement_id: 12,
    product_id: 11,
    sku: "SKU-GROC-103",
    product_name: "Fortune Sunlite Refined Sunflower Oil (1L)",
    category: "Cooking Essentials",
    rack_id: 2,
    rack_code: "RACK-A2",
    aisle_number: "Aisle 01",
    zone: "Dry Grocery Zone",
    shelf_id: 105,
    shelf_code: "RACK-A2-S1",
    shelf_level: 1,
    quantity: 62,
    shelf_capacity: 100,
    shelf_occupancy_pct: 62.0,
    last_restocked: "2026-10-15 15:45"
  },
  {
    placement_id: 13,
    product_id: 12,
    sku: "SKU-GROC-104",
    product_name: "Tata Salt Vacuum Evaporated (1kg)",
    category: "Cooking Essentials",
    rack_id: 2,
    rack_code: "RACK-A2",
    aisle_number: "Aisle 01",
    zone: "Dry Grocery Zone",
    shelf_id: 106,
    shelf_code: "RACK-A2-S2",
    shelf_level: 2,
    quantity: 110,
    shelf_capacity: 100,
    shelf_occupancy_pct: 110.0,
    last_restocked: "2026-10-13 18:20"
  }
];

export const MOCK_PURCHASE_ORDERS = [
  {
    po_id: 1,
    po_number: "PO-2026-0045",
    supplier_id: 2,
    supplier_name: "Heritage FMCG Logistics",
    order_date: "2026-10-15",
    expected_date: "2026-10-19",
    status: "ORDERED",
    total_amount: 34200.00,
    total_items: 3,
    total_units_ordered: 250,
    total_units_received: 0,
    notes: "Express replenishment for festive season stock",
    items: [
      { po_item_id: 1, product_id: 3, sku: "SKU-CARE-201", product_name: "Santoor Sandal & Almond Soap (Pack of 4)", quantity_ordered: 100, quantity_received: 0, unit_cost: 135.00 },
      { po_item_id: 2, product_id: 5, sku: "SKU-CARE-203", product_name: "Colgate Total Toothpaste (150g)", quantity_ordered: 100, quantity_received: 0, unit_cost: 98.00 },
      { po_item_id: 3, product_id: 8, sku: "SKU-BEV-401", product_name: "Red Bull Energy Drink (250ml Can)", quantity_ordered: 50, quantity_received: 0, unit_cost: 95.00 }
    ]
  },
  {
    po_id: 2,
    po_number: "PO-2026-0044",
    supplier_id: 4,
    supplier_name: "Zenith Care & Hygiene Ltd.",
    order_date: "2026-10-12",
    expected_date: "2026-10-16",
    status: "RECEIVED",
    total_amount: 22450.00,
    total_items: 2,
    total_units_ordered: 90,
    total_units_received: 90,
    notes: "Delivered directly into Aisle 02 & 04",
    items: [
      { po_item_id: 4, product_id: 4, sku: "SKU-CARE-202", product_name: "Dettol Antiseptic Liquid (500ml)", quantity_ordered: 40, quantity_received: 40, unit_cost: 165.00 },
      { po_item_id: 5, product_id: 10, sku: "SKU-CLEN-502", product_name: "Lizol Disinfectant Floor Cleaner Citrus (2L)", quantity_ordered: 50, quantity_received: 50, unit_cost: 290.00 }
    ]
  },
  {
    po_id: 3,
    po_number: "PO-2026-0043",
    supplier_id: 1,
    supplier_name: "Apex Wholesale Distributors",
    order_date: "2026-10-10",
    expected_date: "2026-10-14",
    status: "RECEIVED",
    total_amount: 51200.00,
    total_items: 2,
    total_units_ordered: 120,
    total_units_received: 120,
    notes: "Bulk grain and flour pallets",
    items: [
      { po_item_id: 6, product_id: 1, sku: "SKU-GROC-101", product_name: "Daawat Basmati Rice (5kg)", quantity_ordered: 60, quantity_received: 60, unit_cost: 360.00 },
      { po_item_id: 7, product_id: 2, sku: "SKU-GROC-102", product_name: "Aashirvaad Shudh Chakki Atta (10kg)", quantity_ordered: 60, quantity_received: 60, unit_cost: 340.00 }
    ]
  },
  {
    po_id: 4,
    po_number: "PO-2026-0046",
    supplier_id: 3,
    supplier_name: "Metro Fresh & Dairy Co.",
    order_date: "2026-10-17",
    expected_date: "2026-10-18",
    status: "PENDING",
    total_amount: 14750.00,
    total_items: 2,
    total_units_ordered: 110,
    total_units_received: 0,
    notes: "Morning dairy delivery batch",
    items: [
      { po_item_id: 8, product_id: 6, sku: "SKU-DAIRY-301", product_name: "Amul Pasteurised Butter (500g)", quantity_ordered: 50, quantity_received: 0, unit_cost: 235.00 },
      { po_item_id: 9, product_id: 7, sku: "SKU-DAIRY-302", product_name: "Milky Mist Paneer Fresh (200g)", quantity_ordered: 60, quantity_received: 0, unit_cost: 85.00 }
    ]
  }
];

export const MOCK_SALES_LOG = [
  {
    sale_id: 101,
    receipt_number: "REC-2026-1089",
    sale_date: "2026-10-17 12:45",
    customer_name: "Walk-in Customer",
    payment_method: "UPI",
    subtotal: 1230.00,
    tax_amount: 61.50,
    discount_amount: 50.00,
    total_amount: 1241.50,
    cashier_name: "Avadhut K.",
    total_units_sold: 4,
    total_cost_basis: 900.00,
    realized_profit: 341.50,
    items: [
      { product_name: "Daawat Basmati Rice (5kg)", quantity: 1, unit_price: 495.00, buy_price: 360.00, shelf_code: "RACK-A1-S1" },
      { product_name: "Santoor Sandal & Almond Soap (Pack of 4)", quantity: 2, unit_price: 195.00, buy_price: 135.00, shelf_code: "RACK-B1-S1" },
      { product_name: "Amul Pasteurised Butter (500g)", quantity: 1, unit_price: 275.00, buy_price: 235.00, shelf_code: "RACK-C1-S1" }
    ]
  },
  {
    sale_id: 102,
    receipt_number: "REC-2026-1088",
    sale_date: "2026-10-17 11:20",
    customer_name: "Dr. Meera Nambiar",
    payment_method: "CARD",
    subtotal: 920.00,
    tax_amount: 46.00,
    discount_amount: 0.00,
    total_amount: 966.00,
    cashier_name: "Avadhut K.",
    total_units_sold: 3,
    total_cost_basis: 690.00,
    realized_profit: 276.00,
    items: [
      { product_name: "Aashirvaad Shudh Chakki Atta (10kg)", quantity: 1, unit_price: 440.00, buy_price: 340.00, shelf_code: "RACK-A1-S1" },
      { product_name: "Surf Excel Matic Front Load Detergent (2kg)", quantity: 1, unit_price: 480.00, buy_price: 360.00, shelf_code: "RACK-D1-S1" }
    ]
  },
  {
    sale_id: 103,
    receipt_number: "REC-2026-1087",
    sale_date: "2026-10-16 18:30",
    customer_name: "Rohan Kapoor",
    payment_method: "UPI",
    subtotal: 485.00,
    tax_amount: 24.25,
    discount_amount: 10.00,
    total_amount: 499.25,
    cashier_name: "Praveen S.",
    total_units_sold: 3,
    total_cost_basis: 350.00,
    realized_profit: 149.25,
    items: [
      { product_name: "Dettol Antiseptic Liquid (500ml)", quantity: 1, unit_price: 230.00, buy_price: 165.00, shelf_code: "RACK-B1-S3" },
      { product_name: "Colgate Total Toothpaste (150g)", quantity: 1, unit_price: 145.00, buy_price: 98.00, shelf_code: "RACK-B1-S2" },
      { product_name: "Milky Mist Paneer Fresh (200g)", quantity: 1, unit_price: 120.00, buy_price: 85.00, shelf_code: "RACK-C1-S2" }
    ]
  },
  {
    sale_id: 104,
    receipt_number: "REC-2026-1086",
    sale_date: "2026-10-16 15:10",
    customer_name: "Walk-in Customer",
    payment_method: "CASH",
    subtotal: 348.00,
    tax_amount: 17.40,
    discount_amount: 0.00,
    total_amount: 365.40,
    cashier_name: "Praveen S.",
    total_units_sold: 3,
    total_cost_basis: 256.00,
    realized_profit: 109.40,
    items: [
      { product_name: "Fortune Sunlite Refined Sunflower Oil (1L)", quantity: 2, unit_price: 160.00, buy_price: 118.00, shelf_code: "RACK-A2-S1" },
      { product_name: "Tata Salt Vacuum Evaporated (1kg)", quantity: 1, unit_price: 28.00, buy_price: 20.00, shelf_code: "RACK-A2-S2" }
    ]
  }
];

export const MOCK_RECENT_ACTIVITIES = [
  { id: 1, type: "SALE", text: "Sale REC-2026-1089 completed", amount: "₹1,241.50", time: "10 mins ago", color: "emerald" },
  { id: 2, type: "RESTOCK", text: "Restocked Daawat Basmati Rice on RACK-A1", amount: "+40 units", time: "2 hours ago", color: "indigo" },
  { id: 3, type: "PO_RECEIVED", text: "Shipment PO-2026-0044 received into warehouse", amount: "90 units", time: "5 hours ago", color: "brand" },
  { id: 4, type: "ALERT", text: "Low stock alert: Colgate Total Toothpaste (8 units left)", amount: "Deficit: 42", time: "Yesterday", color: "amber" },
  { id: 5, type: "TRANSFER", text: "Transferred 15 units of Rice to Shelf RACK-A1-S4", amount: "Aisle 01", time: "Yesterday", color: "teal" }
];
