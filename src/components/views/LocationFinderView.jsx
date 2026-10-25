import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { 
  MapPin, 
  Search, 
  Layers, 
  MoveRight, 
  Calendar, 
  Filter, 
  ArrowRightLeft, 
  Database, 
  Code2, 
  CheckCircle2, 
  Building2,
  AlertTriangle 
} from 'lucide-react';
import { findProductLocations, moveProductToShelf } from '../../services/locationService';
import { MOCK_RACKS, MOCK_SHELVES } from '../../data/mockData';

export default function LocationFinderView({ onOpenInspector, prefilledSearch = '' }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User input states
  const [searchTerm, setSearchTerm] = useState(prefilledSearch);
  const [aisle, setAisle] = useState('all');
  const [rackCode, setRackCode] = useState('all');

  // Move Modal State
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [targetShelfId, setTargetShelfId] = useState('');

  const loadLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await findProductLocations({
        searchTerm,
        aisle,
        rackCode
      });
      setLocations(res || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Database connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, [searchTerm, aisle, rackCode]);

  const handleOpenMove = (placement) => {
    setSelectedPlacement(placement);
    setTargetShelfId(MOCK_SHELVES[0].shelf_id.toString());
    setIsMoveModalOpen(true);
  };

  const handleMoveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlacement) return;
    const targetShelf = MOCK_SHELVES.find(s => s.shelf_id === parseInt(targetShelfId, 10));
    try {
      await moveProductToShelf({
        placement_id: selectedPlacement.placement_id,
        new_shelf_id: parseInt(targetShelfId, 10),
        new_shelf_code: targetShelf ? targetShelf.shelf_code : ''
      });
      setIsMoveModalOpen(false);
      loadLocations();
    } catch (err) {
      alert("Error moving shelf: " + err.message);
    }
  };

  const aisles = ['all', 'Aisle 01', 'Aisle 02', 'Aisle 03', 'Aisle 04'];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Rack Location Finder</h2>
          <p className="text-xs text-slate-400 mt-0.5">Physical warehouse coordinate lookup powered by the canonical view <code className="text-brand-300">product_location</code>.</p>
        </div>
        <button
          onClick={() => onOpenInspector('locations')}
          className="bg-dark-700 hover:bg-dark-600 text-slate-300 font-bold text-xs py-2 px-3 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Code2 className="w-3.5 h-3.5 text-brand-400" />
          <span>SQL Query (product_location)</span>
        </button>
      </div>

      {/* View Architecture Banner */}
      <div className="p-3.5 rounded-2xl bg-dark-800/80 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Canonical Location View Active</span>
            <span className="text-[11px] text-slate-400">
              Querying <code className="text-brand-400">product_location</code> view directly. Avoids duplicate joins across products, racks, and shelves.
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
          VIEW: product_location
        </span>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search product name, SKU, or shelf code (e.g. RACK-A1-S1)..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-slate-700/80 focus:outline-none focus:border-brand-500 rounded-xl text-xs font-semibold text-white placeholder:text-slate-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={aisle}
            onChange={(e) => setAisle(e.target.value)}
            className="form-input text-white bg-dark-700 cursor-pointer w-auto"
          >
            {aisles.map((a) => (
              <option key={a} value={a}>{a === 'all' ? 'All Aisles' : a}</option>
            ))}
          </select>

          <select
            value={rackCode}
            onChange={(e) => setRackCode(e.target.value)}
            className="form-input text-white bg-dark-700 cursor-pointer w-auto"
          >
            <option value="all">All Racks</option>
            {MOCK_RACKS.map((r) => (
              <option key={r.rack_id} value={r.rack_code}>{r.rack_code} ({r.zone})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Locations Results Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Physical Storage Placements</span>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{locations.length} Locations Found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-dark-800 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider select-none">
                <th className="p-4">Product & SKU</th>
                <th className="p-4">Aisle & Zone</th>
                <th className="p-4">Rack & Shelf</th>
                <th className="p-4 text-center">Shelf Level</th>
                <th className="p-4 text-center">Quantity on Shelf</th>
                <th className="p-4">Shelf Occupancy %</th>
                <th className="p-4">Last Audited / Restocked</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-dark-900/30">
              {error ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-rose-400">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <span className="font-bold">{error}</span>
                      <button onClick={loadLocations} className="mt-2 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-xs font-semibold">
                        Retry Connection
                      </button>
                    </div>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Locating products in PostgreSQL warehouse racks...</span>
                    </div>
                  </td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500 italic">
                    No physical placements found for the selected criteria.
                  </td>
                </tr>
              ) : (
                locations.map((loc) => {
                  const occupancy = parseFloat(loc.shelf_occupancy_pct || 0);
                  const isHigh = occupancy >= 80;

                  return (
                    <tr key={loc.placement_id} className="hover:bg-dark-700/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white text-xs">{loc.product_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{loc.sku}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-200 font-semibold">{loc.aisle_number}</div>
                        <div className="text-[10px] text-slate-500">{loc.zone}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono font-bold text-[11px] border border-indigo-500/20">
                            {loc.rack_code}
                          </span>
                          <span className="font-mono text-slate-300 text-xs font-semibold">
                            {loc.shelf_code}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-dark-700 text-slate-300 text-[10px] font-bold border border-slate-700">
                          Level {loc.shelf_level}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-white text-xs">
                        {loc.quantity} <span className="text-[10px] text-slate-500 font-normal">units</span>
                      </td>
                      <td className="p-4 min-w-[140px]">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span>{loc.quantity} / {loc.shelf_capacity}</span>
                          <span className={isHigh ? 'text-amber-400 font-bold' : 'text-slate-300'}>{loc.shelf_occupancy_pct}%</span>
                        </div>
                        <div className="w-full bg-dark-700 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full ${isHigh ? 'bg-amber-400' : 'bg-brand-500'}`}
                            style={{ width: `${Math.min(100, occupancy)}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-4 text-slate-400 text-[11px] font-mono">
                        {loc.last_restocked}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenMove(loc)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-dark-700 hover:bg-dark-600 text-slate-200 hover:text-white transition-colors border border-slate-700 flex items-center gap-1.5 ml-auto"
                        >
                          <ArrowRightLeft className="w-3 h-3 text-brand-400" />
                          <span>Reassign</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Move Product Shelf Modal */}
      <Modal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        title="Reassign Product Shelf Placement"
        subtitle="Transfer product inventory from current shelf to another shelf. Parameterized query in queries/locations.sql."
      >
        {selectedPlacement && (
          <form onSubmit={handleMoveSubmit} className="flex flex-col gap-4 text-xs">
            <div className="p-3 rounded-xl bg-dark-800 border border-slate-700/60 flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Product Selected</span>
              <span className="text-white font-bold">{selectedPlacement.product_name}</span>
              <span className="text-slate-400 font-mono text-[11px]">
                Currently placed at: {selectedPlacement.rack_code} • {selectedPlacement.shelf_code} ({selectedPlacement.quantity} units)
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Select Destination Rack & Shelf
              </label>
              <select
                value={targetShelfId}
                onChange={(e) => setTargetShelfId(e.target.value)}
                className="form-input text-white bg-dark-700 font-semibold cursor-pointer"
              >
                {MOCK_SHELVES.map((sh) => (
                  <option key={sh.shelf_id} value={sh.shelf_id}>
                    {sh.rack_code} - {sh.shelf_code} (Level {sh.shelf_level} - Capacity: {sh.max_capacity} units)
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-xl bg-dark-900 border border-slate-800 text-slate-400 text-[11px]">
              <span className="font-bold text-brand-400 block mb-0.5">DBMS Note:</span>
              Updating this record in <code className="text-slate-200 font-mono">product_rack_placement</code> will automatically reflect in the <code className="text-brand-300 font-mono">product_location</code> view on the next SELECT.
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsMoveModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md transition-all"
              >
                Confirm Reassignment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
