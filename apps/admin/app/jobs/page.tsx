'use client';

import React, { useState, useEffect } from 'react';
import AdminShell from '../../components/AdminShell';
import {
  getQueueMetricsAdmin,
  getDeadLetterJobsAdmin,
  retryDlqJobAdmin,
  resolveDlqJobAdmin,
  processOutboxAdmin,
} from '../../lib/api';

export default function AdminJobsPage() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [dlqJobs, setDlqJobs] = useState<any[]>([]);
  const [queueFilter, setQueueFilter] = useState('');
  const [resolvedFilter, setResolvedFilter] = useState<string>('false');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [queueFilter, resolvedFilter]);

  const loadData = async () => {
    try {
      const [m, dlq] = await Promise.all([
        getQueueMetricsAdmin().catch(() => []),
        getDeadLetterJobsAdmin(
          queueFilter || undefined,
          resolvedFilter === 'all' ? undefined : resolvedFilter === 'true',
        ).catch(() => []),
      ]);
      setMetrics(Array.isArray(m) ? m : []);
      setDlqJobs(Array.isArray(dlq) ? dlq : []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch queue data');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (id: string) => {
    setActionLoading(id);
    setErrorMessage(null);
    try {
      await retryDlqJobAdmin(id);
      setSuccessMessage(`Job ${id} successfully re-enqueued with refreshed retry budget`);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to retry job');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (id: string) => {
    setActionLoading(id);
    setErrorMessage(null);
    try {
      await resolveDlqJobAdmin(id);
      setSuccessMessage(`Job ${id} marked as manually resolved`);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resolve job');
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcessOutbox = async () => {
    setActionLoading('outbox');
    setErrorMessage(null);
    try {
      const res = await processOutboxAdmin(50);
      setSuccessMessage(
        `Outbox processed: ${res.publishedCount || 0} events dispatched to queues.`,
      );
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Outbox processing failed');
    } finally {
      setActionLoading(null);
    }
  };

  const totalWaiting = metrics.reduce((acc, m) => acc + (m.waiting || 0), 0);
  const totalActive = metrics.reduce((acc, m) => acc + (m.active || 0), 0);
  const totalFailed = metrics.reduce((acc, m) => acc + (m.failed || 0), 0);
  const totalCompleted = metrics.reduce((acc, m) => acc + (m.completed || 0), 0);

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>⚡</span> Background Jobs & Dead-Letter Queue
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time monitoring of BullMQ Redis-backed queues, idempotency, retries, and failure
              escalation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleProcessOutbox}
              disabled={actionLoading === 'outbox'}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
            >
              <span>{actionLoading === 'outbox' ? '⏳' : '🚀'}</span>
              <span>Process Outbox</span>
            </button>
            <button
              onClick={() => {
                setLoading(true);
                loadData();
              }}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-sm flex items-center justify-between">
            <span>✅ {successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-500 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
        {errorMessage && (
          <div className="p-4 rounded-lg bg-red-950/60 border border-red-800 text-red-400 text-sm flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Global Metric Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Active Jobs
            </div>
            <div className="text-3xl font-extrabold text-sky-400 mt-2">{totalActive}</div>
            <div className="text-xs text-slate-500 mt-1">Currently processing</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Waiting / Backlog
            </div>
            <div
              className={`text-3xl font-extrabold mt-2 ${totalWaiting > 50 ? 'text-amber-400' : 'text-emerald-400'}`}
            >
              {totalWaiting}
            </div>
            <div className="text-xs text-slate-500 mt-1">Queued for workers</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Completed Today
            </div>
            <div className="text-3xl font-extrabold text-slate-200 mt-2">{totalCompleted}</div>
            <div className="text-xs text-slate-500 mt-1">Successfully handled</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Dead Letter (DLQ)
            </div>
            <div
              className={`text-3xl font-extrabold mt-2 ${totalFailed > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}
            >
              {totalFailed}
            </div>
            <div className="text-xs text-slate-500 mt-1">Exhausted retry budget</div>
          </div>
        </div>

        {/* Queue Metrics Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Redis Queue Partitions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4">Queue Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Waiting</th>
                  <th className="py-3 px-4">Active</th>
                  <th className="py-3 px-4">Delayed</th>
                  <th className="py-3 px-4">Failed (DLQ)</th>
                  <th className="py-3 px-4">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {metrics.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      {loading ? 'Polling queue workers...' : 'No queue metrics reported yet'}
                    </td>
                  </tr>
                ) : (
                  metrics.map((queue) => {
                    const isHealthy = queue.failed === 0 && queue.waiting < 100;
                    return (
                      <tr key={queue.queueName} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-medium text-sky-400">
                          {queue.queueName}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              isHealthy
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {isHealthy ? 'HEALTHY' : 'NEEDS ATTENTION'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">{queue.waiting}</td>
                        <td className="py-3 px-4 font-mono text-sky-400">{queue.active}</td>
                        <td className="py-3 px-4 font-mono text-amber-400">{queue.delayed}</td>
                        <td className="py-3 px-4 font-mono text-rose-400 font-bold">
                          {queue.failed}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">{queue.completed}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dead Letter Queue Inspection */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>☠️</span> Dead-Letter Queue (DLQ) Exceptions
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Jobs that reached maximum exponential backoff attempts without success. Requires
                administrative intervention or manual retry.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={queueFilter}
                onChange={(e) => setQueueFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">All Queues</option>
                {metrics.map((m) => (
                  <option key={m.queueName} value={m.queueName}>
                    {m.queueName}
                  </option>
                ))}
              </select>
              <select
                value={resolvedFilter}
                onChange={(e) => setResolvedFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="false">Unresolved Only</option>
                <option value="true">Resolved Only</option>
                <option value="all">All DLQ Events</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4">Job ID / Queue</th>
                  <th className="py-3 px-4">Job Name</th>
                  <th className="py-3 px-4">Error Reason</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4">Failed At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dlqJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      🎉 No unresolved dead-letter jobs. System is operating normally!
                    </td>
                  </tr>
                ) : (
                  dlqJobs.map((dlq) => (
                    <tr key={dlq.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-mono text-xs">
                        <div className="text-slate-200 font-semibold truncate max-w-[150px]">
                          {dlq.jobId}
                        </div>
                        <div className="text-slate-500">{dlq.queueName}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-sky-400 font-medium text-xs">
                        {dlq.name}
                      </td>
                      <td className="py-3 px-4 max-w-[280px]">
                        <span
                          className="text-xs text-rose-300 font-mono line-clamp-2"
                          title={dlq.failedReason}
                        >
                          {dlq.failedReason || 'Unknown unhandled exception'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">{dlq.attempts}</td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {dlq.failedAt ? new Date(dlq.failedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            dlq.isResolved
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {dlq.isResolved ? 'RESOLVED' : 'FAILED'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedJob(dlq)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                        >
                          Payload
                        </button>
                        {!dlq.isResolved && (
                          <>
                            <button
                              onClick={() => handleRetry(dlq.id)}
                              disabled={actionLoading === dlq.id}
                              className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition disabled:opacity-50"
                            >
                              {actionLoading === dlq.id ? '...' : 'Retry'}
                            </button>
                            <button
                              onClick={() => handleResolve(dlq.id)}
                              disabled={actionLoading === dlq.id}
                              className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium transition disabled:opacity-50"
                            >
                              Resolve
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payload Inspection Modal */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-semibold text-white">
                  Job Payload: <span className="font-mono text-sky-400">{selectedJob.name}</span>
                </h3>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div>
                <div className="text-xs text-slate-400 mb-1 font-semibold uppercase">
                  Stack Trace / Failure Reason
                </div>
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 font-mono text-xs text-rose-300 break-words whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selectedJob.failedReason}
                  {selectedJob.stacktrace && `\n\n${selectedJob.stacktrace}`}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400 mb-1 font-semibold uppercase">
                  Payload JSON
                </div>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-60 overflow-y-auto">
                  {JSON.stringify(selectedJob.payload, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
