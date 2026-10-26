import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { 
  MapPin, 
  Search, 
  Layers, 
  Calendar, 
  Filter, 
  Database, 
  Code2, 
  CheckCircle2, 
  Building2,
  AlertTriangle,
  Edit2
} from 'lucide-react';
import { findProductLocations, moveProductToShelf } from '../../services/locationService';
import { getRacks } from '../../services/rackService';
import { apiRequest } from '../../services/api/apiClient';

export default function LocationFinderView({ onOpenInspector, prefilledSearch = '' }) {
  const [locations, setLocations] = useState([]);
  const [racksList, setRacksList] = useState([]);
  const [shelvesList, setShelvesList] = useState([]);
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
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  const loadReferenceData = async () => {
    try {
      const [racksRes, shelvesRes] = await Promise.all([
        getRacks(),
        apiRequest('/shelves').then(r => r.data || []).catch(() => [])
      ]);
      setRacksList(racksRes || []);
      setShelvesList(shelvesRes || []);
    } catch (err) {
      console.warn("Could not load racks/shelves reference data:", err);
    }
  };

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
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadLocations();
  }, [searchTerm, aisle, rackCode]);

  const handleOpenMove = (placement) => {
    setSelectedPlacement(placement);
    if (shelvesList.length > 0) {
      setTargetShelfId(shelvesList[0].shelf_id.toString());
    }
    setIsMoveModalOpen(true);
  };

  const handleMoveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlacement || !targetShelfId) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await moveProductToShelf({
        placement_id: selectedPlacement.placement_id,
        new_shelf_id: parseInt(targetShelfId, 10)
      });
      setIsMoveModalOpen(false);
      setActionSuccess(`Reassigned "${selectedPlacement.product_name}" to selected shelf successfully.`);
      loadLocations();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError("Error moving shelf: " + err.message);
    }
  };

  const aisles = ['all', '01', '02', '03', 'A1', 'B1'];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

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

      {/* Search & Filter Toolbar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search product name, SKU, or rack code..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-slate-700/80 focus:outline-none focus:border-brand-500 rounded-xl text-xs font-semibold text-white placeholder:text-slate-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={aisle}
            onChange={(e) => setAisle(e.target.value)}
            className="form-input text-white bg-dark-700 cursor-pointer w-auto text-xs"
          >
            {aisles.map((a) => (
              <option key={a} value={a}>{a === 'all' ? 'All Aisles' : `Aisle ${a}`}</option>
            ))}
          </select>

          <select
            value={rackCode}
            onChange={(e) => setRackCode(e.target.value)}
            className="form-input text-white bg-dark-700 cursor-pointer w-auto text-xs"
          >
            <option value="all">All Racks</option>
            {racksList.map((r) => (
              <option key={r.rack_id} value={r.rack_code}>{r.rack_code} (Aisle {r.aisle_number})</option>
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
                <th className="p-4">Aisle & Rack</th>
                <th className="p-4">Shelf Designation</th>
                <th className="p-4 text-center">Quantity on Shelf</th>
                <th className="p-4">Last Restocked</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-dark-900/30">
              {error ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center">
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
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Locating products in PostgreSQL warehouse racks...</span>
                    </div>
                  </td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500 italic">
                    No physical placements found for the selected criteria.
                  </td>
                </tr>
              ) : (
                locations.map((loc) => (
                  <tr key={loc.placement_id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white text-xs">{loc.product_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{loc.sku}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-200 font-semibold">Aisle {loc.aisle_number}</div>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono font-bold text-[11px] border border-indigo-500/20 mt-0.5 inline-block">
                        {loc.rack_code}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-white text-xs">
                      {loc.shelf_number || 'S1'}
                    </td>
                    <td className="p-4 text-center font-bold text-white text-xs">
                      {loc.quantity} <span className="text-[10px] text-slate-500 font-normal">units</span>
                    </td>
                    <td className="p-4 text-slate-400 text-[11px] font-mono">
                      {loc.last_restocked || 'Current'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenMove(loc)}
                        title="Edit Shelf Assignment"
                        className="p-1.5 text-slate-400 hover:text-white bg-dark-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-700 inline-flex items-center"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Move Product Shelf Modal */}
      <Modal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        title="Edit Product Shelf Location"
        subtitle="Reassign product to a target warehouse rack shelf in Supabase PostgreSQL."
      >
        {selectedPlacement && (
          <form onSubmit={handleMoveSubmit} className="flex flex-col gap-4 text-xs">
            <div className="p-3 rounded-xl bg-dark-800 border border-slate-700/60 flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Product Selected</span>
              <span className="text-white font-bold">{selectedPlacement.product_name}</span>
              <span className="text-slate-400 font-mono text-[11px]">
                Current Rack & Shelf: {selectedPlacement.rack_code}-{selectedPlacement.shelf_number || 'S1'} (SKU: {selectedPlacement.sku})
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Select Destination Shelf
              </label>
              <select
                value={targetShelfId}
                onChange={(e) => setTargetShelfId(e.target.value)}
                className="form-input text-white bg-dark-700 font-semibold cursor-pointer w-full text-xs"
              >
                {shelvesList.map((sh) => (
                  <option key={sh.shelf_id} value={sh.shelf_id}>
                    Rack {sh.rack_code} — Shelf {sh.shelf_number} (Shelf #{sh.shelf_id})
                  </option>
                ))}
              </select>
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
                Save Location
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
