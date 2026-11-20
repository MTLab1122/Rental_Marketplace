'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getMyDisputes, createDispute, sendDisputeMessage, getDisputeById } from '../../lib/api';

function DisputesContent() {
  const searchParams = useSearchParams();
  const initialBookingId = searchParams.get('bookingId') || '';

  const [disputes, setDisputes] = useState<any[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [bookingId, setBookingId] = useState(initialBookingId);
  const [category, setCategory] = useState('PROPERTY_NOT_AS_DESCRIBED');
  const [description, setDescription] = useState('');
  const [amountDisputed, setAmountDisputed] = useState<number | ''>('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const list = await getMyDisputes(token);
      setDisputes(list || []);
      if (list && list.length > 0 && !selectedDispute) {
        loadSelected(list[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const loadSelected = async (id: string) => {
    try {
      const token = localStorage.getItem('token') || '';
      const data = await getDisputeById(id, token);
      setSelectedDispute(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !description.trim()) {
      setError('Please provide a booking ID and describe the dispute issue.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const created = await createDispute(
        {
          bookingId,
          category,
          description: description.trim(),
          amountDisputedPkr: amountDisputed !== '' ? Number(amountDisputed) : undefined,
          evidenceUrls: evidenceUrl ? [evidenceUrl] : undefined,
        },
        token,
      );

      setDescription('');
      setAmountDisputed('');
      setEvidenceUrl('');
      alert('Dispute raised successfully. Escrow hold applied.');
      await loadDisputes();
      if (created?.id) {
        await loadSelected(created.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open dispute');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute || !newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token') || '';
      await sendDisputeMessage(selectedDispute.id, { message: newMessage.trim() }, token);
      setNewMessage('');
      await loadSelected(selectedDispute.id);
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Rental Dispute & Mediation Center</h1>
        <p className="text-slate-600 mt-1">
          Compliant dispute resolution and escrow hold mediation under Peshawar Rental Regulations.
        </p>
      </div>

      {error && (
        <div className="my-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-500">Loading disputes...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left: Raise Dispute Form */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Raise a Rental Dispute</h2>
            <form onSubmit={handleCreateDispute} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Booking ID</label>
                <input
                  type="text"
                  required
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  placeholder="Booking UUID"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Issue Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="PAYMENT_ISSUE">Payment / Transfer Issue</option>
                  <option value="PROPERTY_NOT_AS_DESCRIBED">Property Not As Described</option>
                  <option value="DEPOSIT_ISSUE">Security Deposit Return Issue</option>
                  <option value="EARLY_TERMINATION">Early Termination Disagreement</option>
                  <option value="SAFETY_ISSUE">Safety / Habitability Issue</option>
                  <option value="OTHER">Other Tenancy Dispute</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Amount Disputed (PKR, Optional)
                </label>
                <input
                  type="number"
                  value={amountDisputed}
                  onChange={(e) =>
                    setAmountDisputed(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="e.g. 45000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Evidence URL (Optional)
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://storage.example.com/photo.jpg"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Description & Circumstances
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what occurred and the expected remedy..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow disabled:opacity-50"
              >
                {submitting ? 'Submitting Dispute...' : 'Open Dispute & Apply Escrow Hold'}
              </button>
            </form>
          </div>

          {/* Center/Right: Dispute List & Active Thread */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dispute Selector Tabs */}
            {disputes.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {disputes.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => loadSelected(d.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap border ${
                      selectedDispute?.id === d.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    #{d.id.substring(0, 8)} • {d.category} ({d.status})
                  </button>
                ))}
              </div>
            )}

            {selectedDispute ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Dispute: {selectedDispute.category}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Booking:{' '}
                      {selectedDispute.booking?.property?.title || selectedDispute.bookingId}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-md">
                    {selectedDispute.status}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700">
                  <span className="text-xs text-slate-400 block font-semibold">
                    Initiator's Claim:
                  </span>
                  <p className="mt-1">{selectedDispute.description}</p>
                  {selectedDispute.amountDisputedPkr && (
                    <p className="mt-2 text-xs font-semibold text-rose-700">
                      Disputed Amount on Escrow Hold: PKR{' '}
                      {Number(selectedDispute.amountDisputedPkr).toLocaleString()}
                    </p>
                  )}
                </div>

                {selectedDispute.resolution && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                    <span className="text-xs text-emerald-800 font-bold block uppercase tracking-wider">
                      Official Admin Resolution
                    </span>
                    <p className="mt-1 text-emerald-900">{selectedDispute.resolution}</p>
                  </div>
                )}

                {/* Message thread */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Mediation Messages</h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {selectedDispute.messages && selectedDispute.messages.length > 0 ? (
                      selectedDispute.messages.map((m: any) => (
                        <div
                          key={m.id}
                          className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm"
                        >
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span className="font-semibold text-slate-700">
                              {m.sender?.fullName} ({m.senderRole})
                            </span>
                            <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-slate-800">{m.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">
                        No messages in this dispute thread yet.
                      </p>
                    )}
                  </div>

                  {selectedDispute.status !== 'RESOLVED' && (
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message to landlord, tenant, or admin mediator..."
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-sm"
                      >
                        Send
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center text-slate-500">
                No dispute selected. Select an existing dispute or submit a new claim.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DisputesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto p-8 text-center text-slate-500">Loading disputes...</div>
      }
    >
      <DisputesContent />
    </Suspense>
  );
}
