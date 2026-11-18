'use client';

import React, { useEffect, useState } from 'react';
import {
  getAdminLocalities,
  createLocality,
  updateLocality,
  updateLocalityStatus,
  deleteLocality,
} from '../../lib/api';

export default function LocalitiesManagementPage() {
  const [localities, setLocalities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingLocality, setEditingLocality] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    postalCode: '',
    latitude: 34.0151,
    longitude: 71.5249,
    description: '',
  });
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadLocalities = async () => {
    try {
      setLoading(true);
      const res = await getAdminLocalities();
      setLocalities(res || []);
    } catch (err: any) {
      alert(`Failed to load localities: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocalities();
  }, []);

  const handleOpenCreate = () => {
    setEditingLocality(null);
    setFormData({
      name: '',
      postalCode: '',
      latitude: 34.0151,
      longitude: 71.5249,
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loc: any) => {
    setEditingLocality(loc);
    setFormData({
      name: loc.name,
      postalCode: loc.postalCode || '',
      latitude: loc.latitude,
      longitude: loc.longitude,
      description: loc.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Locality name is required.');
      return;
    }

    try {
      setActionLoading(true);
      if (editingLocality) {
        await updateLocality(editingLocality.id, {
          name: formData.name.trim(),
          postalCode: formData.postalCode.trim(),
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          description: formData.description.trim(),
        });
      } else {
        await createLocality({
          name: formData.name.trim(),
          postalCode: formData.postalCode.trim(),
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          description: formData.description.trim(),
        });
      }
      setIsModalOpen(false);
      loadLocalities();
    } catch (err: any) {
      alert(`Failed to save locality: ${err?.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (loc: any) => {
    try {
      await updateLocalityStatus(loc.id, !loc.isActive);
      loadLocalities();
    } catch (err: any) {
      alert(`Status toggle failed: ${err?.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to deactivate or remove this locality? Properties assigned to it will be affected.',
      )
    ) {
      return;
    }
    try {
      await deleteLocality(id);
      loadLocalities();
    } catch (err: any) {
      alert(`Delete failed: ${err?.message}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>📍</span> Peshawar Locality Governance
          </h1>
          <p className="text-sm text-slate-400">
            Define and manage official Peshawar municipal zones, coordinates, and geo-fenced
            boundaries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg shadow transition"
          >
            + Add Locality
          </button>
          <button
            onClick={loadLocalities}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Localities Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading localities...</div>
        ) : localities.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            No Peshawar localities defined yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Locality Name</th>
                  <th className="px-6 py-4">Postal Code</th>
                  <th className="px-6 py-4">Center Coordinates</th>
                  <th className="px-6 py-4">Boundary Fence</th>
                  <th className="px-6 py-4">Active State</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {localities.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{loc.name}</div>
                      {loc.description && (
                        <div className="text-xs text-slate-400 truncate max-w-xs">
                          {loc.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {loc.postalCode || '—'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}
                    </td>
                    <td className="px-6 py-4">
                      {loc.boundaryGeoJson ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-sky-950 text-sky-400 border border-sky-800">
                          GeoJSON Defined
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-800 text-slate-400">
                          Radial Default
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(loc)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-full transition ${
                          loc.isActive
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                            : 'bg-red-950 text-red-400 border border-red-800 hover:bg-red-900'
                        }`}
                      >
                        {loc.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(loc)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(loc.id)}
                        className="px-3 py-1 bg-red-950 hover:bg-red-900 text-red-400 border border-red-800 text-xs rounded transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create or Edit Locality */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-white">
              {editingLocality ? 'Edit Locality' : 'Add New Peshawar Locality'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Locality Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. University Town, Hayatabad Phase 3"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 25000"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Description / Landmarks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Near University of Peshawar, main Jamrud Road access"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-semibold transition"
                >
                  {actionLoading
                    ? 'Saving...'
                    : editingLocality
                      ? 'Update Locality'
                      : 'Create Locality'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
