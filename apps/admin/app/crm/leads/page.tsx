'use client';

import React, { useState, useEffect } from 'react';
import {
  getLeadsAdmin,
  updateLeadStatusAdmin,
  logContactAttemptAdmin,
  addLeadNoteAdmin,
} from '../../../lib/api';

export default function CrmLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Selected lead for detail/action modal
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [modalAction, setModalAction] = useState<'STATUS' | 'CONTACT' | 'NOTE' | null>(null);

  // Form states
  const [newStatus, setNewStatus] = useState<string>('CONTACTED');
  const [statusReason, setStatusReason] = useState<string>('');
  const [contactChannel, setContactChannel] = useState<string>('WHATSAPP');
  const [contactSuccess, setContactSuccess] = useState<boolean>(true);
  const [contactNotes, setContactNotes] = useState<string>('');
  const [leadNote, setLeadNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLeadsAdmin({
        status: statusFilter || undefined,
        leadType: typeFilter || undefined,
      });
      setLeads(data?.items || data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load CRM leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, typeFilter]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setSubmitting(true);
    try {
      await updateLeadStatusAdmin(selectedLead.id, {
        status: newStatus,
        reason: statusReason || undefined,
      });
      setModalAction(null);
      fetchLeads();
    } catch (err: any) {
      alert(err?.message || 'Error updating lead status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setSubmitting(true);
    try {
      await logContactAttemptAdmin(selectedLead.id, {
        channel: contactChannel,
        successful: contactSuccess,
        notes: contactNotes || undefined,
      });
      setModalAction(null);
      fetchLeads();
    } catch (err: any) {
      alert(err?.message || 'Error logging contact attempt.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !leadNote.trim()) return;
    setSubmitting(true);
    try {
      await addLeadNoteAdmin(selectedLead.id, { note: leadNote.trim() });
      setLeadNote('');
      setModalAction(null);
      fetchLeads();
    } catch (err: any) {
      alert(err?.message || 'Error saving note.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-900/60 text-blue-300 border-blue-700';
      case 'CONTACTED':
        return 'bg-indigo-900/60 text-indigo-300 border-indigo-700';
      case 'QUALIFIED':
        return 'bg-emerald-900/60 text-emerald-300 border-emerald-700';
      case 'CONVERTED':
        return 'bg-green-900/80 text-green-200 border-green-600';
      case 'LOST':
      case 'DISQUALIFIED':
        return 'bg-red-900/60 text-red-300 border-red-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💼</span>
            <h1 className="text-2xl font-bold tracking-tight text-white">CRM Lead Management</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Track landlord and tenant acquisition pipeline, SLA response times, and conversion
            lifecycle.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Lead Types</option>
            <option value="LANDLORD">Landlords</option>
            <option value="TENANT">Tenants</option>
            <option value="HOSTEL_OPERATOR">Hostel Operators</option>
            <option value="AGENCY">Agencies</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="NURTURING">Nurturing</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
            <option value="DISQUALIFIED">Disqualified</option>
          </select>

          <button
            onClick={fetchLeads}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg text-xs font-semibold"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Contact & Type</th>
                <th className="py-3 px-4">Phone / WhatsApp</th>
                <th className="py-3 px-4">Locality & Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4">Received</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 animate-pulse">
                    Loading CRM leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No leads found matching current filters.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">
                        {lead.fullName || 'Anonymous'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {lead.leadType} • {lead.email || 'No email'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <a
                        href={`https://wa.me/${lead.phoneNumber?.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <span>💬</span> {lead.phoneNumber}
                      </a>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">
                        {lead.localityInterest || 'Peshawar General'}
                      </div>
                      <div className="text-[10px] text-slate-400">{lead.source}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(lead.status)}`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {lead.contactAttempts?.length || 0}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setModalAction('CONTACT');
                        }}
                        className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg text-[11px] font-semibold hover:bg-emerald-900 transition"
                      >
                        Log Call/WA
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setNewStatus(lead.status);
                          setModalAction('STATUS');
                        }}
                        className="px-2.5 py-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-semibold hover:bg-slate-700 transition"
                      >
                        Status
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setModalAction('NOTE');
                        }}
                        className="px-2.5 py-1 bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg text-[11px] font-semibold"
                      >
                        Note
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modals */}
      {modalAction && selectedLead && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {modalAction === 'STATUS' && 'Update Lead Status'}
                {modalAction === 'CONTACT' && 'Log Contact Attempt'}
                {modalAction === 'NOTE' && 'Add Internal Note'}
              </h3>
              <button
                onClick={() => setModalAction(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Lead: <strong className="text-white">{selectedLead.fullName}</strong> (
              {selectedLead.phoneNumber})
            </p>

            {modalAction === 'STATUS' && (
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    New Pipeline Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="NURTURING">NURTURING</option>
                    <option value="CONVERTED">CONVERTED</option>
                    <option value="LOST">LOST</option>
                    <option value="DISQUALIFIED">DISQUALIFIED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Reason / Context
                  </label>
                  <input
                    type="text"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="e.g. Verified CNIC, onboarding completed"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalAction(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    {submitting ? 'Updating...' : 'Save Status'}
                  </button>
                </div>
              </form>
            )}

            {modalAction === 'CONTACT' && (
              <form onSubmit={handleLogContact} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Channel</label>
                  <select
                    value={contactChannel}
                    onChange={(e) => setContactChannel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="CALL">Phone Call</option>
                    <option value="EMAIL">Email</option>
                    <option value="IN_PERSON">In-Person Meeting</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="success"
                    checked={contactSuccess}
                    onChange={(e) => setContactSuccess(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-emerald-600"
                  />
                  <label htmlFor="success" className="text-xs text-slate-300 font-medium">
                    Contact was successful (lead answered/replied)
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Attempt Summary & Notes
                  </label>
                  <textarea
                    rows={3}
                    value={contactNotes}
                    onChange={(e) => setContactNotes(e.target.value)}
                    placeholder="e.g. Landlord confirmed 2 portions in Phase 4. Needs help uploading photos."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalAction(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    {submitting ? 'Logging...' : 'Log Attempt'}
                  </button>
                </div>
              </form>
            )}

            {modalAction === 'NOTE' && (
              <form onSubmit={handleAddNote} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Internal Note
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={leadNote}
                    onChange={(e) => setLeadNote(e.target.value)}
                    placeholder="Enter confidential notes regarding landlord preferences or verification status..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalAction(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Add Note'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
