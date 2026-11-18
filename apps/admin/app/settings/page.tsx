'use client';

import React, { useEffect, useState } from 'react';
import { getAdminSettings, updateAdminSetting } from '../../lib/api';

export default function SettingsManagementPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await getAdminSettings();
      setSettings(res || []);
    } catch (err: any) {
      alert(`Failed to load system settings: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleStartEdit = (s: any) => {
    setEditingKey(s.key);
    setEditValue(typeof s.value === 'object' ? JSON.stringify(s.value, null, 2) : String(s.value));
    setEditDesc(s.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingKey) return;
    try {
      setSaving(true);
      let parsedValue: any = editValue;
      try {
        parsedValue = JSON.parse(editValue);
      } catch {
        // Leave as string/primitive
      }
      await updateAdminSetting(editingKey, parsedValue, editDesc);
      setEditingKey(null);
      loadSettings();
    } catch (err: any) {
      alert(`Failed to update setting: ${err?.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>⚙️</span> Platform Runtime Configuration
          </h1>
          <p className="text-sm text-slate-400">
            System thresholds, Peshawar boundary parameters, rate limits, and verification
            requirements
          </p>
        </div>
        <button
          onClick={loadSettings}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition"
        >
          Refresh Settings
        </button>
      </div>

      {/* Settings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading settings...</div>
        ) : settings.length === 0 ? (
          <div className="py-20 text-center text-slate-400">No runtime settings configured.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Configuration Key</th>
                  <th className="px-6 py-4">Current Value</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Last Updated</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {settings.map((s) => (
                  <tr key={s.id || s.key} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-sky-400 bg-sky-950/60 px-2.5 py-1 rounded border border-sky-800">
                        {s.key}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-emerald-400">
                      {typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 max-w-sm">
                      {s.description || 'System configuration parameter'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : 'Initial'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleStartEdit(s)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition"
                      >
                        Modify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Setting Modal */}
      {editingKey && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-white">Modify Configuration</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                  Key
                </label>
                <input
                  type="text"
                  disabled
                  value={editingKey}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-sky-400 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                  Value (JSON or Primitive)
                </label>
                <textarea
                  rows={4}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingKey(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-semibold transition"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
