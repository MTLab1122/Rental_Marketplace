'use client';

import React, { useEffect, useState } from 'react';
import { getAdminAuditLogs } from '../../lib/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit: 30 };
      if (actionFilter) params.action = actionFilter;
      const res = await getAdminAuditLogs(params);
      setLogs(res?.items || []);
      setTotal(res?.total || 0);
      setTotalPages(res?.totalPages || 1);
    } catch (err: any) {
      alert(`Failed to load audit logs: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>📜</span> Immutable Audit Trail
          </h1>
          <p className="text-sm text-slate-400">
            Cryptographic-quality activity tracking for all administrative overrides, verifications,
            and status changes
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition"
        >
          Refresh
        </button>
      </div>

      {/* Action Filters */}
      <div className="flex flex-wrap gap-2 items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <label className="text-xs font-semibold text-slate-400 uppercase mr-2">
          Filter Action:
        </label>
        {[
          '',
          'PROPERTY_APPROVE',
          'PROPERTY_REJECT',
          'PROPERTY_SUSPEND',
          'USER_SUSPEND',
          'USER_UNSUSPEND',
          'ROLE_UPDATE',
          'VERIFICATION_APPROVE',
          'VERIFICATION_REJECT',
          'REPORT_RESOLVE',
          'SETTING_UPDATE',
        ].map((act) => (
          <button
            key={act}
            onClick={() => {
              setActionFilter(act);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              actionFilter === act
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            {act || 'ALL ACTIONS'}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            No audit logs recorded for this criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Entity Target</th>
                  <th className="px-6 py-4">IP / Agent</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">
                        {log.actor?.fullName || 'System Admin'}
                      </div>
                      <div className="text-xs text-slate-400">{log.actor?.email || 'system'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-sky-950 text-sky-400 border border-sky-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {log.entityType
                        ? `${log.entityType} #${log.entityId?.slice(0, 8)}`
                        : 'System Global'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition"
                      >
                        Inspect Diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <div>
            Showing {logs.length} of {total} events
          </div>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded"
            >
              Previous
            </button>
            <span className="py-1 px-2 font-mono text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">Audit Event Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Action:</span>
                <span className="font-mono text-sky-400 font-bold">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Actor:</span>
                <span className="text-white font-medium">
                  {selectedLog.actor?.fullName} ({selectedLog.actor?.email})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Entity:</span>
                <span className="font-mono text-slate-300">
                  {selectedLog.entityType} ({selectedLog.entityId})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IP Address:</span>
                <span className="font-mono text-slate-400">{selectedLog.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">User Agent:</span>
                <span className="text-slate-400 truncate max-w-xs">{selectedLog.userAgent}</span>
              </div>

              {/* Before & After State */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Previous State
                  </span>
                  <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto max-h-48">
                    {selectedLog.oldValue ? JSON.stringify(selectedLog.oldValue, null, 2) : 'null'}
                  </pre>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400 block mb-1">
                    New State / Diff
                  </span>
                  <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-emerald-400 font-mono overflow-x-auto max-h-48">
                    {selectedLog.newValue ? JSON.stringify(selectedLog.newValue, null, 2) : 'null'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
