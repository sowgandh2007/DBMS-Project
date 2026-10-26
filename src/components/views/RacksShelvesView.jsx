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
  AlertCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { 
  getRacks, 
  getRackShelves, 
  createRack,
  updateRack,
  deleteRack,
  createShelf,
  updateShelf,
  deleteShelf 
} from '../../services/rackService';

export default function RacksShelvesView({ onOpenInspector }) {
  const [racks, setRacks] = useState([]);
  const [selectedRack, setSelectedRack] = useState(null);
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Notifications
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [selectedAisle, setSelectedAisle] = useState('all');

  // Modals
  const [isAddRackOpen, setIsAddRackOpen] = useState(false);
  const [isEditRackOpen, setIsEditRackOpen] = useState(false);
  const [isDeleteRackOpen, setIsDeleteRackOpen] = useState(false);
  const [isAddShelfOpen, setIsAddShelfOpen] = useState(false);
  const [isEditShelfOpen, setIsEditShelfOpen] = useState(false);

  // Forms
  const [newRackData, setNewRackData] = useState({
    rack_code: '',
    aisle: 'A',
    shelves_count: 2
  });

  const [editRackData, setEditRackData] = useState({
    rack_id: null,
    rack_code: '',
    aisle: ''
  });

  const [newShelfNumber, setNewShelfNumber] = useState('');
  const [editShelfData, setEditShelfData] = useState({
    shelf_id: null,
    shelf_number: ''
  });

  const notify = (msg, isErr = false) => {
    if (isErr) {
      setActionError(msg);
      setActionSuccess(null);
    } else {
      setActionSuccess(msg);
      setActionError(null);
    }
    setTimeout(() => {
      setActionSuccess(null);
      setActionError(null);
    }, 4500);
  };

  const loadRacks = async (preserveSelectedId = null) => {
    setLoading(true);
    try {
      const res = await getRacks({ aisle: selectedAisle });
      setRacks(res || []);
      
      const targetId = preserveSelectedId || selectedRack?.rack_id;
      const matched = (res || []).find(r => r.rack_id === targetId);
      if (matched) {
        handleSelectRack(matched);
      } else if (res && res.length > 0) {
        handleSelectRack(res[0]);
      } else {
        setSelectedRack(null);
        setShelves([]);
      }
    } catch (err) {
      console.error(err);
      notify("Failed to load racks from database.", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRacks();
  }, [selectedAisle]);

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
    setIsSubmitting(true);
    try {
      const created = await createRack({
        rack_code: newRackData.rack_code.toUpperCase(),
        aisle: newRackData.aisle.toUpperCase(),
        shelves_count: parseInt(newRackData.shelves_count, 10) || 2
      });
      setIsAddRackOpen(false);
      setNewRackData({ rack_code: '', aisle: 'A', shelves_count: 2 });
      notify("New storage rack created successfully!");
      loadRacks(created?.data?.rack_id);
    } catch (err) {
      notify("Error adding rack: " + err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditRack = (rack, e) => {
    e.stopPropagation();
    setEditRackData({
      rack_id: rack.rack_id,
      rack_code: rack.rack_code,
      aisle: rack.aisle_number || rack.aisle || 'A'
    });
    setIsEditRackOpen(true);
  };

  const handleEditRackSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateRack(editRackData.rack_id, {
        rack_code: editRackData.rack_code.toUpperCase(),
        aisle: editRackData.aisle.toUpperCase()
      });
      setIsEditRackOpen(false);
      notify(`Rack #${editRackData.rack_id} updated successfully!`);
      loadRacks(editRackData.rack_id);
    } catch (err) {
      notify("Error updating rack: " + err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteRack = (rack, e) => {
    e.stopPropagation();
    setSelectedRack(rack);
    setIsDeleteRackOpen(true);
  };

  const handleDeleteRackConfirm = async () => {
    if (!selectedRack) return;
    setIsSubmitting(true);
    try {
      await deleteRack(selectedRack.rack_id);
      setIsDeleteRackOpen(false);
      notify(`Rack '${selectedRack.rack_code}' removed successfully.`);
      loadRacks();
    } catch (err) {
      notify(err.message || "Cannot delete rack with assigned products.", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddShelfSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRack || !newShelfNumber.trim()) return;
    setIsSubmitting(true);
    try {
      await createShelf({
        rack_id: selectedRack.rack_id,
        shelf_number: newShelfNumber.trim().toUpperCase()
      });
      setIsAddShelfOpen(false);
      setNewShelfNumber('');
      notify("Shelf created successfully!");
      handleSelectRack(selectedRack);
    } catch (err) {
      notify("Error adding shelf: " + err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditShelf = (shelf) => {
    setEditShelfData({
      shelf_id: shelf.shelf_id,
      shelf_number: shelf.shelf_number
    });
    setIsEditShelfOpen(true);
  };

  const handleEditShelfSubmit = async (e) => {
    e.preventDefault();
    if (!editShelfData.shelf_id || !editShelfData.shelf_number.trim()) return;
    setIsSubmitting(true);
    try {
      await updateShelf(editShelfData.shelf_id, {
        shelf_number: editShelfData.shelf_number.trim().toUpperCase()
      });
      setIsEditShelfOpen(false);
      notify(`Shelf #${editShelfData.shelf_id} updated successfully!`);
      handleSelectRack(selectedRack);
    } catch (err) {
      notify("Error updating shelf: " + err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteShelf = async (shelf) => {
    if (!window.confirm(`Delete shelf ${shelf.shelf_number} from Rack ${selectedRack.rack_code}?`)) return;
    setIsSubmitting(true);
    try {
      await deleteShelf(shelf.shelf_id);
      notify(`Shelf ${shelf.shelf_number} deleted successfully.`);
      handleSelectRack(selectedRack);
    } catch (err) {
      notify(err.message || "Cannot delete shelf with stored products.", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Alert Banners */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Racks & Shelves Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">Physical warehouse layout, storage tiers, and shelf assignments.</p>
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
                      <span className="text-xs text-slate-400 font-semibold mt-0.5 block">
                        Aisle: {rack.aisle_number || rack.aisle} • ID #{rack.rack_id}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleOpenEditRack(rack, e)}
                        title="Edit Rack"
                        className="p-1.5 text-slate-400 hover:text-white bg-dark-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-700"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleOpenDeleteRack(rack, e)}
                        title="Delete Rack"
                        className="p-1.5 text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
                    <span>{rack.shelves_count || 1} Shelves in Rack</span>
                    <span className="font-mono text-brand-400 font-bold">Active Rack</span>
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
            {selectedRack && (
              <button
                onClick={() => setIsAddShelfOpen(true)}
                className="px-2.5 py-1 text-xs font-bold bg-dark-700 hover:bg-dark-600 text-brand-400 rounded-lg border border-slate-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Shelf</span>
              </button>
            )}
          </div>

          {selectedRack ? (
            <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col gap-4">
              <div className="p-3 rounded-xl bg-dark-700/50 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="font-black text-white text-sm font-mono">{selectedRack.rack_code}</span>
                  <span className="text-xs text-slate-400 block">Aisle {selectedRack.aisle_number || selectedRack.aisle}</span>
                </div>
                <span className="text-xs font-bold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-lg">
                  {shelves.length} Shelves
                </span>
              </div>

              {/* Vertical Shelves Visualization */}
              <div className="flex flex-col gap-3">
                {shelves.length === 0 ? (
                  <p className="text-slate-500 italic text-xs text-center py-6">No shelves installed in this rack yet.</p>
                ) : (
                  shelves.map((sh) => (
                    <div
                      key={sh.shelf_id}
                      className="p-3.5 rounded-xl border border-slate-700/70 bg-dark-700/40 hover:bg-dark-700/60 transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white text-xs flex items-center gap-2">
                          <span className="font-mono text-brand-400 font-extrabold">{sh.shelf_number}</span>
                          <span className="text-[10px] text-slate-500 font-mono">(ID #{sh.shelf_id})</span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                          Assigned to Rack {selectedRack.rack_code}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditShelf(sh)}
                          title="Edit Shelf"
                          className="p-1.5 text-slate-400 hover:text-white bg-dark-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteShelf(sh)}
                          title="Delete Shelf"
                          className="p-1.5 text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 text-center text-slate-500 italic text-xs">
              Select a rack from the left to inspect shelves.
            </div>
          )}
        </div>
      </div>

      {/* --- ADD RACK MODAL --- */}
      <Modal
        isOpen={isAddRackOpen}
        onClose={() => setIsAddRackOpen(false)}
        title="Add Physical Storage Rack"
        subtitle="Insert a new rack record into PostgreSQL warehouse layout."
      >
        <form onSubmit={handleAddRackSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rack Code</label>
            <input
              type="text"
              required
              value={newRackData.rack_code}
              onChange={(e) => setNewRackData({ ...newRackData, rack_code: e.target.value.toUpperCase() })}
              placeholder="e.g. R-C1"
              className="form-input font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aisle</label>
            <input
              type="text"
              required
              value={newRackData.aisle}
              onChange={(e) => setNewRackData({ ...newRackData, aisle: e.target.value.toUpperCase() })}
              placeholder="e.g. C"
              className="form-input font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Initial Shelves Count</label>
            <input
              type="number"
              min="1"
              max="10"
              value={newRackData.shelves_count}
              onChange={(e) => setNewRackData({ ...newRackData, shelves_count: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddRackOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Rack'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- EDIT RACK MODAL --- */}
      <Modal
        isOpen={isEditRackOpen}
        onClose={() => setIsEditRackOpen(false)}
        title={`Edit Rack #${editRackData.rack_id}`}
        subtitle="Update rack identifier and aisle in PostgreSQL."
      >
        <form onSubmit={handleEditRackSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rack Code</label>
            <input
              type="text"
              required
              value={editRackData.rack_code}
              onChange={(e) => setEditRackData({ ...editRackData, rack_code: e.target.value.toUpperCase() })}
              className="form-input font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aisle</label>
            <input
              type="text"
              required
              value={editRackData.aisle}
              onChange={(e) => setEditRackData({ ...editRackData, aisle: e.target.value.toUpperCase() })}
              className="form-input font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditRackOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- DELETE RACK MODAL --- */}
      <Modal
        isOpen={isDeleteRackOpen}
        onClose={() => setIsDeleteRackOpen(false)}
        title="Confirm Rack Deletion"
        subtitle="Safely check product assignment dependencies before removing rack."
      >
        <div className="flex flex-col gap-4 text-xs">
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white text-sm">
                Delete Rack "{selectedRack?.rack_code}"?
              </div>
              <p className="text-slate-400 mt-1">
                Aisle: {selectedRack?.aisle_number || selectedRack?.aisle} | Rack ID: #{selectedRack?.rack_id}
              </p>
              <p className="text-slate-400 mt-2">
                Racks containing shelves with currently assigned products cannot be deleted unless those products are first reassigned.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsDeleteRackOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDeleteRackConfirm}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* --- ADD SHELF MODAL --- */}
      <Modal
        isOpen={isAddShelfOpen}
        onClose={() => setIsAddShelfOpen(false)}
        title={`Add Shelf to Rack ${selectedRack?.rack_code}`}
        subtitle="Create an addressable shelf tier for product placement."
      >
        <form onSubmit={handleAddShelfSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Shelf Number</label>
            <input
              type="text"
              required
              value={newShelfNumber}
              onChange={(e) => setNewShelfNumber(e.target.value.toUpperCase())}
              placeholder="e.g. S3"
              className="form-input font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddShelfOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Shelf'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- EDIT SHELF MODAL --- */}
      <Modal
        isOpen={isEditShelfOpen}
        onClose={() => setIsEditShelfOpen(false)}
        title="Edit Shelf Tier"
        subtitle="Update shelf identifier in Supabase PostgreSQL."
      >
        <form onSubmit={handleEditShelfSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Shelf Number / Code</label>
            <input
              type="text"
              required
              value={editShelfData.shelf_number}
              onChange={(e) => setEditShelfData({ ...editShelfData, shelf_number: e.target.value.toUpperCase() })}
              placeholder="e.g. S1"
              className="form-input font-mono font-bold"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditShelfOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
