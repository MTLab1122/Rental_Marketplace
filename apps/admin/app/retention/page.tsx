'use client';

import React, { useState } from 'react';
import AdminShell from '../../components/AdminShell';
import {
  exportUserDataAdmin,
  anonymizeUserDataAdmin,
  runRetentionPoliciesAdmin,
  getPartitionDdlAdmin,
} from '../../lib/api';

const RETENTION_TABLES = [
  {
    table: 'notifications',
    retentionPeriod: '90 Days',
    policy: 'Purge read & archived notifications older than 90 days',
  },
  {
    table: 'property_view_events',
    retentionPeriod: '180 Days',
    policy: 'Roll up into daily_analytics_aggregates, drop raw views',
  },
  {
    table: 'property_clicks',
    retentionPeriod: '180 Days',
    policy: 'Roll up into daily_analytics_aggregates, drop raw clicks',
  },
  {
    table: 'search_query_logs',
    retentionPeriod: '30 Days',
    policy: 'Purge raw search queries, retain locality demand counts',
  },
  {
    table: 'domain_event_outbox',
    retentionPeriod: '30 Days',
    policy: 'Delete successfully PUBLISHED outbox rows',
  },
  {
    table: 'audit_logs',
    retentionPeriod: '7 Years',
    policy: 'Retain immutable tamper-evident logs for municipal compliance',
  },
];

export default function AdminRetentionPage() {
  // PII Section
  const [targetUserId, setTargetUserId] = useState('');
  const [exportData, setExportData] = useState<any | null>(null);
  const [piiLoading, setPiiLoading] = useState(false);

  // Retention Section
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [retentionResult, setRetentionResult] = useState<any | null>(null);

  // Partition Section
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);
  const [partitionDdl, setPartitionDdl] = useState<string[]>([]);
  const [ddlLoading, setDdlLoading] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = async () => {
    if (!targetUserId.trim()) return;
    setPiiLoading(true);
    setMessage(null);
    try {
      const data = await exportUserDataAdmin(targetUserId.trim());
      setExportData(data);
      setMessage({
        type: 'success',
        text: `Exported user data payload for ${targetUserId.trim()}`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Export failed' });
    } finally {
      setPiiLoading(false);
    }
  };

  const handleAnonymize = async () => {
    if (!targetUserId.trim()) return;
    const confirmed = window.confirm(
      `⚠️ CAUTION: Are you sure you want to permanently anonymize user "${targetUserId.trim()}"?\n\n` +
        `This will:\n` +
        `• Strip and hash email and phone\n` +
        `• Redact full name to "Anonymized User"\n` +
        `• Purge CNIC documents and selfies\n` +
        `• Maintain financial transaction integrity and municipal audit trails`,
    );
    if (!confirmed) return;

    setPiiLoading(true);
    setMessage(null);
    try {
      const res = await anonymizeUserDataAdmin(targetUserId.trim());
      setMessage({
        type: 'success',
        text: `User ${targetUserId.trim()} anonymized successfully. Anonymized ID: ${res.anonymizedId}`,
      });
      setExportData(null);
      setTargetUserId('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Anonymization failed' });
    } finally {
      setPiiLoading(false);
    }
  };

  const handleRunRetention = async () => {
    const confirmed = window.confirm('Run automated retention sweep across partitioned tables?');
    if (!confirmed) return;

    setRetentionLoading(true);
    setMessage(null);
    try {
      const res = await runRetentionPoliciesAdmin();
      setRetentionResult(res);
      setMessage({
        type: 'success',
        text: `Retention sweep finished: ${res.deletedCount} records safely purged.`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Retention run failed' });
    } finally {
      setRetentionLoading(false);
    }
  };

  const handleFetchPartitionDdl = async () => {
    setDdlLoading(true);
    setMessage(null);
    try {
      const res = await getPartitionDdlAdmin(targetYear, targetMonth);
      setPartitionDdl(res.ddl || []);
      setMessage({
        type: 'success',
        text: `Generated partition DDL for ${targetYear}-${String(targetMonth).padStart(2, '0')}`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to generate DDL' });
    } finally {
      setDdlLoading(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>🗄️</span> Data Platform, Retention & Privacy Console
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Declarative table partitioning, automated storage retention, GDPR data portability, and
            PII anonymization.
          </p>
        </div>

        {/* Global Feedback Banner */}
        {message && (
          <div
            className={`p-4 rounded-lg border text-sm flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                : 'bg-red-950/60 border-red-800 text-red-400'
            }`}
          >
            <span>
              {message.type === 'success' ? '✅' : '⚠️'} {message.text}
            </span>
            <button onClick={() => setMessage(null)} className="hover:opacity-75">
              ✕
            </button>
          </div>
        )}

        {/* SECTION 1: User Privacy & GDPR Anonymization */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <span>🛡️</span> Right to Erasure & Data Export (GDPR / Data Protection)
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Export a portable copy of tenant or landlord records, or execute an irreversible PII
            redaction whilst preserving required tax and municipal escrow ledger history.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Enter User UUID..."
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={handleExport}
              disabled={piiLoading || !targetUserId.trim()}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-medium text-xs transition border border-sky-500/30 disabled:opacity-50"
            >
              Export JSON
            </button>
            <button
              onClick={handleAnonymize}
              disabled={piiLoading || !targetUserId.trim()}
              className="px-4 py-2 rounded-lg bg-red-900/80 hover:bg-red-800 text-red-200 font-medium text-xs transition border border-red-700 disabled:opacity-50"
            >
              Anonymize & Purge PII
            </button>
          </div>

          {exportData && (
            <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase font-semibold">
                  User Data Export Payload
                </span>
                <span className="text-xs text-emerald-400 font-mono">Status: Ready</span>
              </div>
              <pre className="font-mono text-xs text-slate-300 max-h-60 overflow-y-auto whitespace-pre-wrap">
                {JSON.stringify(exportData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* SECTION 2: Automated Retention Policies */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                <span>⏱️</span> Automated Table Retention Policies
              </h2>
              <p className="text-xs text-slate-400">
                Continuous housekeeping policies that prevent database bloat and prune expired
                high-volume records.
              </p>
            </div>

            <button
              onClick={handleRunRetention}
              disabled={retentionLoading}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition disabled:opacity-50"
            >
              {retentionLoading ? 'Running...' : 'Execute Retention Sweep'}
            </button>
          </div>

          {retentionResult && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-xs text-emerald-300">
              Sweep complete at {retentionResult.timestamp}. Safely removed:{' '}
              {retentionResult.deletedCount} rows.
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4">Database Table</th>
                  <th className="py-3 px-4">Retention Window</th>
                  <th className="py-3 px-4">Execution Strategy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {RETENTION_TABLES.map((item) => (
                  <tr key={item.table} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono text-sky-400 font-medium text-xs">
                      {item.table}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-200">
                      {item.retentionPeriod}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">{item.policy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: Declarative Monthly Partition DDL */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <span>📐</span> PostgreSQL Monthly Declarative Partition DDL
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Generates zero-downtime range partition DDL statements for{' '}
            <code className="text-sky-400">property_impressions</code>,{' '}
            <code className="text-sky-400">property_clicks</code>,{' '}
            <code className="text-sky-400">search_query_logs</code>, and{' '}
            <code className="text-sky-400">notifications</code>.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Year:</label>
              <input
                type="number"
                value={targetYear}
                onChange={(e) => setTargetYear(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs w-24 font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Month:</label>
              <select
                value={targetMonth}
                onChange={(e) => setTargetMonth(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-mono"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m.toString().padStart(2, '0')} -{' '}
                    {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleFetchPartitionDdl}
              disabled={ddlLoading}
              className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition disabled:opacity-50"
            >
              {ddlLoading ? 'Generating...' : 'Generate DDL'}
            </button>
          </div>

          {partitionDdl.length > 0 && (
            <div className="relative">
              <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-72 overflow-y-auto">
                {partitionDdl.join('\n\n')}
              </pre>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
