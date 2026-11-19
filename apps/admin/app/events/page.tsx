'use client';

import React, { useState } from 'react';
import AdminShell from '../../components/AdminShell';
import { replayEventsAdmin, processOutboxAdmin } from '../../lib/api';

const EVENT_TYPE_OPTIONS = [
  'user_registered',
  'user_verified',
  'landlord_verified',
  'property_created',
  'property_submitted',
  'property_approved',
  'property_rejected',
  'property_marked_rented',
  'inquiry_created',
  'inquiry_accepted',
  'booking_requested',
  'booking_accepted',
  'booking_paid',
  'booking_cancelled',
  'payment_succeeded',
  'payment_failed',
  'review_submitted',
  'report_submitted',
];

export default function AdminEventsPage() {
  const [replayTimestamp, setReplayTimestamp] = useState(() => {
    const d = new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to past 24h
    return d.toISOString().slice(0, 16);
  });
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [replayResult, setReplayResult] = useState<any | null>(null);
  const [outboxResult, setOutboxResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleEventType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleReplay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReplayResult(null);

    try {
      const res = await replayEventsAdmin({
        fromTimestamp: new Date(replayTimestamp).toISOString(),
        eventTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
      });
      setReplayResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger event replay');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessOutbox = async () => {
    setLoading(true);
    setError(null);
    setOutboxResult(null);
    try {
      const res = await processOutboxAdmin(100);
      setOutboxResult(res);
    } catch (err: any) {
      setError(err.message || 'Outbox batch processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>🔄</span> Event Store & Outbox Replay Console
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Replay historical domain events from immutable append-only storage into queues for
            disaster recovery, cache warm-up, and projection rebuilding.
          </p>
        </div>

        {/* Informational Architecture Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-sky-400 uppercase tracking-wider mb-2">
            Transactional Outbox Pattern & Replay Guarantees
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <span className="font-bold text-white block mb-1">1. Atomic Persistence</span>
              Domain events are staged in PostgreSQL table{' '}
              <code className="text-sky-400">domain_event_outbox</code> within the same ACID
              transaction as the business entity update.
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <span className="font-bold text-white block mb-1">2. Append-Only Store</span>
              Published events are archived immutably in{' '}
              <code className="text-emerald-400">event_store</code> with schema versioning (
              <code className="text-slate-400">v1.0</code>) and SHA-256 idempotency keys.
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <span className="font-bold text-white block mb-1">3. Consumer Idempotency</span>
              Replaying events marks them with a fresh{' '}
              <code className="text-amber-400">replay_</code> idempotency signature to allow
              projection consumers to safely re-materialize views.
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-4 rounded-lg bg-red-950/60 border border-red-800 text-red-400 text-sm flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {replayResult && (
          <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-sm">
            <div className="font-semibold text-emerald-400 mb-1">
              ✅ Replay Completed Successfully
            </div>
            <div>
              Total events evaluated:{' '}
              <strong className="font-mono text-white">{replayResult.replayedCount}</strong>. All
              matching events have been re-injected into the transactional outbox pipeline with
              updated trace headers.
            </div>
          </div>
        )}

        {outboxResult && (
          <div className="p-4 rounded-lg bg-sky-950/60 border border-sky-800 text-sky-300 text-sm">
            <div className="font-semibold text-sky-400 mb-1">🚀 Outbox Flush Executed</div>
            <div>
              Processed:{' '}
              <strong className="font-mono text-white">{outboxResult.processedCount}</strong>,
              Published:{' '}
              <strong className="font-mono text-white">{outboxResult.publishedCount}</strong>,
              Failed: <strong className="font-mono text-white">{outboxResult.failedCount}</strong>.
            </div>
          </div>
        )}

        {/* Event Replay Trigger Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Trigger Historical Event Replay</h2>
          <form onSubmit={handleReplay} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Replay Start Time (UTC)
              </label>
              <input
                type="datetime-local"
                value={replayTimestamp}
                onChange={(e) => setReplayTimestamp(e.target.value)}
                required
                className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">
                Events recorded in the event store from this timestamp onwards will be queried and
                scheduled.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Target Event Types Filter (Optional - leave empty for all)
                </label>
                <div className="space-x-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedTypes([...EVENT_TYPE_OPTIONS])}
                    className="text-sky-400 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTypes([])}
                    className="text-slate-400 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
                {EVENT_TYPE_OPTIONS.map((type) => {
                  const isChecked = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleEventType(type)}
                      className={`text-left p-2 rounded-lg border text-xs font-mono transition flex items-center justify-between ${
                        isChecked
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                          : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="truncate">{type}</span>
                      <span>{isChecked ? '✓' : '+'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition disabled:opacity-50 flex items-center gap-2"
              >
                <span>{loading ? '⏳' : '⚡'}</span>
                <span>Initiate Event Replay</span>
              </button>
              <button
                type="button"
                onClick={handleProcessOutbox}
                disabled={loading}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
              >
                Trigger Outbox Worker Now
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
