'use client';

import React, { useEffect, useState } from 'react';
import { getAdminProperties, deleteProperty } from '../../lib/api';

export default function AllPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [eligibilityFilter, setEligibilityFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { limit: 50 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (eligibilityFilter) params.eligibility = eligibilityFilter;
      const res = await getAdminProperties(params);
      setProperties(res?.items || []);
      setTotal(res?.total || 0);
    } catch (err: any) {
      alert(`Error loading properties: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [statusFilter, eligibilityFilter]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      await deleteProperty(id);
      loadProperties();
    } catch (err: any) {
      alert(`Delete failed: ${err?.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            All Properties Inventory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global repository of all student and family rental listings in Peshawar ({total} total)
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadProperties()}
          placeholder="Search by title, address, or landlord..."
          className="flex-1 min-w-[240px] px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
        />

        <select
          value={eligibilityFilter}
          onChange={(e) => setEligibilityFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none"
        >
          <option value="">All Eligibilities</option>
          <option value="STUDENTS_ONLY">Students Only</option>
          <option value="FAMILIES_ONLY">Families Only</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="APPROVED">Approved (Live)</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="RENTED">Rented</option>
          <option value="UNAVAILABLE">Unavailable</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        <button
          onClick={loadProperties}
          className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">Loading listings...</div>
        ) : properties.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            No properties matched filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 uppercase text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">Eligibility</th>
                  <th className="py-3.5 px-4">Locality</th>
                  <th className="py-3.5 px-4">Rent</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {properties.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-100 truncate max-w-xs">
                      {p.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.eligibility === 'STUDENTS_ONLY'
                            ? 'bg-sky-950 text-sky-400 border border-sky-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {p.eligibility === 'STUDENTS_ONLY' ? 'Students' : 'Families'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {p.locality?.name || p.localityName}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 font-semibold">
                      PKR {p.monthlyRentPkr?.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleDelete(p.id, p.title)}
                        className="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800 text-xs font-semibold transition"
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
    </div>
  );
}
