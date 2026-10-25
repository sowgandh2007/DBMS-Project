import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { 
  Layers, 
  Warehouse, 
  Plus, 
  Filter, 
  ChevronRight, 
  Boxes, 
  Code2, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getRacks, getRackShelves, createRack } from '../../services/rackService';

export default function RacksShelvesView({ onOpenInspector }) {
  const [racks, setRacks] = useState([]);
  const [selectedRack, setSelectedRack] = useState(null);
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedAisle, setSelectedAisle] = useState('all');
  const [selectedZone, setSelectedZone] = useState('all');

  // Add Rack Modal
  const [isAddRackOpen, setIsAddRackOpen] = useState(false);
  const [newRackData, setNewRackData] = useState({
    rack_code: '',
    aisle_number: 'Aisle 01',
    zone: 'Dry Grocery Zone',
    category_type: 'General Merchandise',
    max_capacity: 400,
    shelves_count: 4,
    description: ''
  });

  const loadRacks = async () => {
    setLoading(true);
    try {
      const res = await getRacks({
        aisle: selectedAisle,
        zone: selectedZone
      });
      setRacks(res || []);
      if (res && res.length > 0 && !selectedRack) {
        handleSelectRack(res[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRacks();
  }, [selectedAisle, selectedZone]);

  const handleSelectRack = async (rack) => {
    setSelectedRack(rack);
    try {
      const sh = await getRackShelves(rack.rack_id);
      setShelves(sh || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRackSubmit = async (e) => {
    e.preventDefault();
    try {
      await createRack(newRackData);
      setIsAddRackOpen(false);
      setNewRackData({
        rack_code: '',
        aisle_number: 'Aisle 01',
        zone: 'Dry Grocery Zone',
        category_type: 'General Merchandise',
        max_capacity: 400,
        shelves_count: 4,
        description: ''
      });
      loadRacks();
    } catch (err) {
      alert("Error adding rack: " + err.message);
    }
  };

  const aisles = ['all', 'Aisle 01', 'Aisle 02', 'Aisle 03', 'Aisle 04'];
  const zones = ['all', 'Dry Grocery Zone', 'Personal Care Zone', 'Cold Storage Zone', 'Household Essentials'];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Racks & Shelves Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">Interactive warehouse floor plan, physical rack tiers, and shelf occupancy.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenInspector('racks')}
            className="bg-dark-700 hover:bg-dark-600 text-slate-300 font-bold text-xs py-2 px-3 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Code2 className="w-3.5 h-3.5 text-brand-400" />
            <span>SQL Query</span>
          </button>
          <button
            onClick={() => setIsAddRackOpen(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-brand-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rack</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Aisle:</span>
          {aisles.map((a) => (
            <button
              key={a}
              onClick={() => setSelectedAisle(a)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                selectedAisle === a
                  ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                  : 'bg-dark-700 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {a === 'all' ? 'All Aisles' : a}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Zone:</span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="form-input text-white bg-dark-700 cursor-pointer w-auto"
          >
            {zones.map((z) => (
              <option key={z} value={z}>{z === 'all' ? 'All Zones' : z}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split Grid: Racks List & Shelf Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Racks Cards (Left 7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-brand-500" />
              Warehouse Storage Racks ({racks.length})
            </span>
            <span className="text-[11px] text-slate-400">Click a rack to view vertical shelves</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {racks.map((rack) => {
              const isSelected = selectedRack?.rack_id === rack.rack_id;
              const occPct = parseFloat(rack.occupancy_percentage || 0);
              const isCritical = occPct >= 90;
              const isOptimal = occPct >= 70 && occPct < 90;

              return (
                <div
                  key={rack.rack_id}
                  onClick={() => handleSelectRack(rack)}
                  className={`cursor-pointer glass-card rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 ${
                    isSelected
                      ? 'border-brand-500/80 bg-dark-800 shadow-lg shadow-brand-500/10'
                      : 'hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white font-mono">{rack.rack_code}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-semibold mt-0.5 block">{rack.aisle_number} • {rack.zone}</span>
                    </div>

                    <StatusBadge
                      status={isCritical ? 'NEAR_FULL' : (isOptimal ? 'OPTIMAL' : 'AVAILABLE')}
                      type="rack"
                    />
                  </div>

                  {/* Capacity Meter */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Occupancy</span>
                      <span className="font-bold text-white font-mono">
                        {rack.current_stored_units} / {rack.max_capacity} <span className="text-[10px] text-slate-500 font-normal">units</span>
                      </span>
                    </div>

                    <div className="w-full bg-dark-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isCritical ? 'bg-rose-500' : (isOptimal ? 'bg-amber-400' : 'bg-brand-500')
                        }`}
                        style={{ width: `${Math.min(100, occPct)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
                    <span>{rack.shelves_count || 4} Shelves Tier</span>
                    <span className="font-mono font-bold text-slate-200">{rack.occupancy_percentage}% Full</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Rack Shelf Breakdown (Right 5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Shelf Tiers for {selectedRack ? selectedRack.rack_code : '...'}
            </span>
          </div>

          {selectedRack ? (
            <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col gap-4">
              <div className="p-3 rounded-xl bg-dark-700/50 border border-slate-700/60 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-sm font-mono">{selectedRack.rack_code}</span>
                  <span className="text-xs text-brand-400 font-bold">{selectedRack.category_type}</span>
                </div>
                <span className="text-xs text-slate-400">{selectedRack.description || 'Standard retail warehouse racking system.'}</span>
              </div>

              {/* Vertical Shelves Visualization (Level 4 on top, Level 1 at bottom) */}
              <div className="flex flex-col gap-3">
                {shelves.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">Loading shelves...</p>
                ) : (
                  [...shelves].reverse().map((shelf) => {
                    const occPct = parseFloat(shelf.shelf_occupancy_pct || 0);

                    return (
                      <div
                        key={shelf.shelf_id}
                        className="p-3.5 rounded-xl bg-dark-700/70 border border-slate-700/80 flex flex-col gap-2.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-dark-900 text-indigo-300 font-mono font-bold text-[11px] border border-slate-800">
                              {shelf.shelf_code}
                            </span>
                            <span className="font-bold text-slate-200">Level {shelf.shelf_level}</span>
                          </div>
                          <span className="font-mono text-slate-300 font-bold text-xs">
                            {shelf.current_quantity} / {shelf.max_capacity} ({shelf.shelf_occupancy_pct}%)
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-dark-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-brand-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, occPct)}%` }}
                          />
                        </div>

                        {/* Stored products list */}
                        {shelf.items && shelf.items.length > 0 ? (
                          <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800/60">
                            {shelf.items.map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-300 truncate max-w-[200px]">{it.product_name}</span>
                                <span className="font-mono font-bold text-brand-400">{it.quantity} units</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Shelf currently empty</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-500 italic text-xs">
              Select a rack from the left to inspect its vertical shelf levels.
            </div>
          )}
        </div>
      </div>

      {/* Add Rack Modal */}
      <Modal
        isOpen={isAddRackOpen}
        onClose={() => setIsAddRackOpen(false)}
        title="Add New Warehouse Storage Rack"
        subtitle="Insert a new rack structure into the database. Parameterized query in queries/racks_shelves.sql."
      >
        <form onSubmit={handleAddRackSubmit} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rack Code</label>
              <input
                type="text"
                required
                value={newRackData.rack_code}
                onChange={(e) => setNewRackData({ ...newRackData, rack_code: e.target.value })}
                placeholder="e.g. RACK-E1"
                className="form-input font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aisle Number</label>
              <input
                type="text"
                required
                value={newRackData.aisle_number}
                onChange={(e) => setNewRackData({ ...newRackData, aisle_number: e.target.value })}
                placeholder="e.g. Aisle 05"
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Zone Assignment</label>
              <input
                type="text"
                required
                value={newRackData.zone}
                onChange={(e) => setNewRackData({ ...newRackData, zone: e.target.value })}
                placeholder="e.g. Bulk Storage Zone"
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category Type</label>
              <input
                type="text"
                value={newRackData.category_type}
                onChange={(e) => setNewRackData({ ...newRackData, category_type: e.target.value })}
                placeholder="e.g. Snacks & Bakery"
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Unit Capacity</label>
              <input
                type="number"
                required
                value={newRackData.max_capacity}
                onChange={(e) => setNewRackData({ ...newRackData, max_capacity: e.target.value })}
                placeholder="400"
                className="form-input font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Initial Shelves Count</label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={newRackData.shelves_count}
                onChange={(e) => setNewRackData({ ...newRackData, shelves_count: e.target.value })}
                placeholder="4"
                className="form-input font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rack Description</label>
            <textarea
              rows="2"
              value={newRackData.description}
              onChange={(e) => setNewRackData({ ...newRackData, description: e.target.value })}
              placeholder="e.g. Heavy-duty pallet racking for boxed shipments..."
              className="form-input resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddRackOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md transition-all"
            >
              Create Rack & Shelves
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
