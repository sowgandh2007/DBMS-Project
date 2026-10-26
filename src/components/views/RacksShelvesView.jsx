import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { 
  Layers, 
  Warehouse, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  X,
  Boxes
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

export default function RacksShelvesView() {
  const [racks, setRacks] = useState([]);
  const [selectedRack, setSelectedRack] = useState(null);
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Notifications
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const loadRacks = async (preserveSelectedId = null) => {
    setLoading(true);
    try {
      const res = await getRacks();
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
  }, []);

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
      notify(`Rack #${editRackData.rack_id} updated.`);
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
      notify(`Rack '${selectedRack.rack_code}' deleted.`);
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
      notify(`Shelf #${editShelfData.shelf_id} updated.`);
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
      notify(`Shelf ${shelf.shelf_number} deleted.`);
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
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Racks & Shelves</h2>
          <p className="text-xs text-slate-500 mt-0.5">Physical warehouse layout, storage tiers, and shelf assignments.</p>
        </div>
        <button
          onClick={() => setIsAddRackOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Rack</span>
        </button>
      </div>

      {/* Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Racks Cards (Left 7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-teal-600" />
              Warehouse Storage Racks ({racks.length})
            </span>
            <span className="text-[11px] text-slate-400">Select rack to inspect vertical shelves</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {racks.map((rack) => {
              const isSelected = selectedRack?.rack_id === rack.rack_id;

              return (
                <div
                  key={rack.rack_id}
                  onClick={() => handleSelectRack(rack)}
                  className={`cursor-pointer premium-card rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/20 shadow-md ring-2 ring-teal-500/20'
                      : 'hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900 font-mono">{rack.rack_code}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-semibold mt-0.5 block">
                        Aisle: {rack.aisle_number || rack.aisle} • ID #{rack.rack_id}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleOpenEditRack(rack, e)}
                        title="Edit Rack"
                        className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors border border-slate-200"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleOpenDeleteRack(rack, e)}
                        title="Delete Rack"
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                    <span>{rack.shelves_count || 1} Shelves Installed</span>
                    <span className="font-mono text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/80">
                      Active
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shelves Breakdown (Right 5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" />
              Shelf Tiers: {selectedRack ? selectedRack.rack_code : '...'}
            </span>
            {selectedRack && (
              <button
                onClick={() => setIsAddShelfOpen(true)}
                className="btn-secondary text-xs py-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-teal-600" />
                <span>Add Shelf</span>
              </button>
            )}
          </div>

          {selectedRack ? (
            <div className="premium-card rounded-2xl p-5 flex flex-col gap-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-sm font-mono">{selectedRack.rack_code}</span>
                  <span className="text-xs text-slate-500 block">Aisle {selectedRack.aisle_number || selectedRack.aisle}</span>
                </div>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/80">
                  {shelves.length} Shelves
                </span>
              </div>

              {/* Vertical Shelves List */}
              <div className="flex flex-col gap-2.5">
                {shelves.length === 0 ? (
                  <p className="text-slate-400 italic text-xs text-center py-6">No shelves installed in this rack yet.</p>
                ) : (
                  shelves.map((sh) => (
                    <div
                      key={sh.shelf_id}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                          <span className="font-mono text-teal-700 font-extrabold">{sh.shelf_number}</span>
                          <span className="text-[10px] text-slate-400 font-mono">(ID #{sh.shelf_id})</span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          Rack {selectedRack.rack_code}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditShelf(sh)}
                          title="Edit Shelf"
                          className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors border border-slate-200"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteShelf(sh)}
                          title="Delete Shelf"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
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
            <div className="premium-card rounded-2xl p-12 text-center text-slate-400 italic text-xs">
              Select a rack from the left to inspect shelves.
            </div>
          )}
        </div>
      </div>

      {/* --- ADD RACK MODAL --- */}
      <Modal
        isOpen={isAddRackOpen}
        onClose={() => setIsAddRackOpen(false)}
        title="Add Storage Rack"
        subtitle="Create a new physical storage rack in the warehouse."
      >
        <form onSubmit={handleAddRackSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Rack Code</label>
            <input
              type="text"
              required
              value={newRackData.rack_code}
              onChange={(e) => setNewRackData({ ...newRackData, rack_code: e.target.value.toUpperCase() })}
              placeholder="e.g. R-A2"
              className="form-input font-mono font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Aisle Identifier</label>
              <input
                type="text"
                required
                value={newRackData.aisle}
                onChange={(e) => setNewRackData({ ...newRackData, aisle: e.target.value.toUpperCase() })}
                placeholder="e.g. 02"
                className="form-input font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Initial Shelves</label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={newRackData.shelves_count}
                onChange={(e) => setNewRackData({ ...newRackData, shelves_count: e.target.value })}
                className="form-input font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddRackOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
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
        title="Edit Rack Location"
        subtitle="Update rack coordinates in Supabase."
      >
        <form onSubmit={handleEditRackSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Rack Code</label>
            <input
              type="text"
              required
              value={editRackData.rack_code}
              onChange={(e) => setEditRackData({ ...editRackData, rack_code: e.target.value.toUpperCase() })}
              className="form-input font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Aisle</label>
            <input
              type="text"
              required
              value={editRackData.aisle}
              onChange={(e) => setEditRackData({ ...editRackData, aisle: e.target.value.toUpperCase() })}
              className="form-input font-bold"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditRackOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- DELETE RACK MODAL --- */}
      <Modal
        isOpen={isDeleteRackOpen}
        onClose={() => setIsDeleteRackOpen(false)}
        title="Confirm Rack Deletion"
        subtitle="Safely delete rack from storage layout."
      >
        <div className="flex flex-col gap-4 text-xs">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900 text-sm">
                Delete Rack "{selectedRack?.rack_code}"?
              </div>
              <p className="text-slate-600 mt-1">
                Aisle: {selectedRack?.aisle_number || selectedRack?.aisle} | Shelves: {shelves.length}
              </p>
              <p className="text-slate-500 mt-2">
                Cannot delete this rack if any shelf holds active products. Reassign products first.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDeleteRackOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteRackConfirm}
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-2 px-3.5 rounded-xl shadow-sm transition-all disabled:opacity-50"
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
        title={`Add Shelf to ${selectedRack?.rack_code}`}
        subtitle="Create an addressable shelf tier."
      >
        <form onSubmit={handleAddShelfSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Shelf Number / Code</label>
            <input
              type="text"
              required
              value={newShelfNumber}
              onChange={(e) => setNewShelfNumber(e.target.value.toUpperCase())}
              placeholder="e.g. S3"
              className="form-input font-mono font-bold"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddShelfOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
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
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Shelf Number</label>
            <input
              type="text"
              required
              value={editShelfData.shelf_number}
              onChange={(e) => setEditShelfData({ ...editShelfData, shelf_number: e.target.value.toUpperCase() })}
              placeholder="e.g. S1"
              className="form-input font-mono font-bold"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditShelfOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
