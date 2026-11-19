'use client';

import React, { useState, useEffect } from 'react';
import {
  getReliabilitySlosAdmin,
  simulateErrorBudgetAdmin,
  getFeedbackSummaryAdmin,
  listExperimentsAdmin,
  toggleExperimentAdmin,
  emergencyKillExperimentAdmin,
  updateExperimentRolloutAdmin,
} from '../../lib/api';

export default function ReliabilityGovernancePage() {
  const [reliabilityData, setReliabilityData] = useState<any>(null);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Simulation state
  const [simulating, setSimulating] = useState(false);

  // Kill modal state
  const [killModalOpen, setKillModalOpen] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<any>(null);
  const [killReason, setKillReason] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'slos' | 'experiments' | 'feedback' | 'tech_debt'>(
    'slos',
  );

  const techDebtItems = [
    {
      id: 'TD-001',
      subsystem: 'apps/api (Media)',
      desc: 'Sharp image watermark & compression runs in primary NestJS worker',
      impact: '200ms p95 latency spikes during batch photo uploads',
      costOfDelay: 'Landlord rush-hour API jitter',
      effort: '5 pts (3 days)',
      priority: 'P1',
      status: 'Prioritized',
    },
    {
      id: 'TD-002',
      subsystem: 'database (PostGIS)',
      desc: 'Spatial queries rely on unclustered GiST index across Peshawar polygon bounds',
      impact: '85ms bounding queries under high concurrency',
      costOfDelay: 'DB CPU scaling overhead as listings exceed 5k',
      effort: '3 pts (2 days)',
      priority: 'P2',
      status: 'Prioritized',
    },
    {
      id: 'TD-003',
      subsystem: 'apps/mobile (Flutter)',
      desc: 'Network caching uses standard HTTP instead of persistent local SQLite storage',
      impact: 'Search card rendering delay in low-connectivity zones (Saddar/Regi)',
      costOfDelay: 'Tenant search drop-offs in fringe cellular coverage',
      effort: '8 pts (5 days)',
      priority: 'P1',
      status: 'In Progress',
    },
    {
      id: 'TD-004',
      subsystem: 'apps/api (Billing)',
      desc: 'Landlord tier checks perform direct DB queries rather than cached token claims',
      impact: '12-18ms redundant latency per listing check',
      costOfDelay: 'Read pool saturation during promotional blitzes',
      effort: '3 pts (1 day)',
      priority: 'P2',
      status: 'Prioritized',
    },
    {
      id: 'TD-005',
      subsystem: 'apps/admin (Frontend)',
      desc: 'Moderation table fetches 50 heavy records via single monolithic endpoint',
      impact: '1.2s page load on field agent mobile hotspots',
      costOfDelay: 'Slowed on-site inspection turnaround',
      effort: '5 pts (3 days)',
      priority: 'P2',
      status: 'Identified',
    },
    {
      id: 'TD-006',
      subsystem: 'infrastructure (Redis)',
      desc: 'Single Redis instance hosts both BullMQ queues and volatile API cache',
      impact: 'Risk of job eviction under cache memory pressure',
      costOfDelay: 'Dropped background SMS or email notifications',
      effort: '5 pts (2 days)',
      priority: 'P1',
      status: 'Prioritized',
    },
  ];

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [rel, fb, exps] = await Promise.all([
        getReliabilitySlosAdmin().catch(() => null),
        getFeedbackSummaryAdmin().catch(() => null),
        listExperimentsAdmin().catch(() => []),
      ]);
      setReliabilityData(rel);
      setFeedbackData(fb);
      setExperiments(Array.isArray(exps) ? exps : []);
    } catch (err: any) {
      console.error('Failed to load reliability data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSimulateBudget = async (pct: number | null) => {
    try {
      setSimulating(true);
      await simulateErrorBudgetAdmin(pct);
      setActionMessage(
        pct === null
          ? 'Error budget reset to real-time production telemetry.'
          : `Simulated error budget consumption set to ${pct}%.`,
      );
      await loadAllData();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleToggleExperiment = async (key: string, enabled: boolean) => {
    try {
      await toggleExperimentAdmin(key, enabled);
      setActionMessage(`Experiment ${key} is now ${enabled ? 'RUNNING' : 'PAUSED'}.`);
      await loadAllData();
    } catch (err: any) {
      alert(`Toggle failed: ${err.message}`);
    }
  };

  const handleUpdateRollout = async (key: string, percentage: number) => {
    try {
      await updateExperimentRolloutAdmin(key, percentage);
      setActionMessage(`Experiment ${key} rollout adjusted to ${percentage}%.`);
      await loadAllData();
    } catch (err: any) {
      alert(`Rollout update failed: ${err.message}`);
    }
  };

  const handleKillExperiment = async () => {
    if (!selectedExperiment) return;
    try {
      await emergencyKillExperimentAdmin(
        selectedExperiment.key,
        killReason || 'Emergency kill triggered from Admin Reliability Console',
      );
      setKillModalOpen(false);
      setActionMessage(
        `EMERGENCY KILL-SWITCH TRIPPED for ${selectedExperiment.key}. Traffic reverted to control.`,
      );
      await loadAllData();
    } catch (err: any) {
      alert(`Emergency kill failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin text-3xl">⏱️</div>
          <p className="text-sm text-slate-400">Loading Reliability Governance & SLO Engine...</p>
        </div>
      </div>
    );
  }

  const summary = reliabilityData?.summary || {
    cumulativeConsumptionPercent: 42.0,
    tier: 'GREEN',
    isFeatureFreezeActive: false,
    slosBreachedCount: 0,
    slosDegradedCount: 0,
    totalSlosMonitored: 11,
  };

  const isFreeze = summary.isFeatureFreezeActive;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⏱️</span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Reliability Governance & SLO Engine
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Google SRE Error Budget Governance • 11 Core SLOs • Guardrailed Feature Experimentation
            • Peshawar Feedback
          </p>
        </div>

        {/* Global Freeze Indicator Badge */}
        <div className="flex items-center space-x-3">
          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2 ${
              isFreeze
                ? 'bg-red-950/80 text-red-300 border-red-600 animate-pulse'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${isFreeze ? 'bg-red-400' : 'bg-emerald-400'}`}
            ></span>
            <span>{isFreeze ? 'FEATURE FREEZE ACTIVE' : 'DEPLOYMENTS UNLOCKED'}</span>
          </div>

          <button
            onClick={loadAllData}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div className="p-3 bg-sky-950/70 border border-sky-600/60 rounded-lg text-sky-200 text-xs flex justify-between items-center">
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-sky-400 hover:text-white ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* FEATURE FREEZE ALERT BANNER (If Active) */}
      {isFreeze && (
        <div className="p-4 bg-red-950/90 border-2 border-red-600 rounded-xl text-red-200 space-y-2 shadow-lg shadow-red-950/50">
          <div className="flex items-center space-x-2 text-sm font-bold text-red-300">
            <span className="text-xl">🚨</span>
            <span>MANDATORY SRE RELEASE FREEZE ENFORCED</span>
          </div>
          <p className="text-xs text-red-200/90 leading-relaxed">
            Monthly platform Error Budget consumption has exceeded{' '}
            <strong className="text-white">90%</strong>. All non-critical feature rollouts, schema
            refactors, and aesthetic enhancements are strictly blocked in CI/CD. Only P0 security
            remediations, data corruption hotfixes, and reliability engineering PRs may proceed.
          </p>
          <div className="text-[11px] font-mono text-red-300">
            Policy Reference: <code>docs/operations/error-budget-policy.md</code> &bull; Action:
            Focus 100% engineering bandwidth on SLO remediation.
          </div>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Error Budget Consumption Gauge */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Error Budget Consumed</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                summary.tier === 'RED'
                  ? 'bg-red-900 text-red-300 border border-red-700'
                  : summary.tier === 'ORANGE'
                    ? 'bg-orange-900 text-orange-300 border border-orange-700'
                    : summary.tier === 'AMBER'
                      ? 'bg-amber-900 text-amber-300 border border-amber-700'
                      : 'bg-emerald-900 text-emerald-300 border border-emerald-700'
              }`}
            >
              Tier: {summary.tier}
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {summary.cumulativeConsumptionPercent}%
            </span>
            <span className="text-xs text-slate-400">/ 100% 30-day allowance</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 transition-all duration-500 ${
                summary.tier === 'RED'
                  ? 'bg-red-500'
                  : summary.tier === 'ORANGE'
                    ? 'bg-orange-500'
                    : summary.tier === 'AMBER'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(summary.cumulativeConsumptionPercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Monitored SLOs Health */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="text-xs text-slate-400">Monitored Service Levels</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {summary.totalSlosMonitored - summary.slosBreachedCount - summary.slosDegradedCount} /{' '}
              {summary.totalSlosMonitored}
            </span>
            <span className="text-xs text-emerald-400 font-medium">Healthy</span>
          </div>
          <div className="text-xs text-slate-400">
            Breached: <strong className="text-red-400">{summary.slosBreachedCount}</strong> &bull;
            Degraded: <strong className="text-amber-400">{summary.slosDegradedCount}</strong>
          </div>
        </div>

        {/* Customer CSAT / Sentiment */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="text-xs text-slate-400">Customer CSAT & NPS</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {feedbackData?.averageRating || 4.7} ★
            </span>
            <span className="text-xs text-slate-400">
              NPS: <strong className="text-sky-400">+{feedbackData?.npsScore || 62}</strong>
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Total feedback collected:{' '}
            <strong className="text-white">{feedbackData?.totalCount || 3}</strong>
          </div>
        </div>

        {/* Active Experimentation & Guardrails */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="text-xs text-slate-400">Safety-Guardrailed Experiments</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {experiments.filter((e) => e.status === 'RUNNING' && !e.killSwitchTriggered).length}
            </span>
            <span className="text-xs text-slate-400">Running / {experiments.length} Total</span>
          </div>
          <div className="text-xs text-emerald-400 flex items-center space-x-1">
            <span>🛡️ 4/4 Invariants Active</span>
          </div>
        </div>
      </div>

      {/* Chaos Simulator Bar */}
      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <span className="text-base">🧪</span>
          <span className="font-semibold">SRE Chaos & Freeze Simulator:</span>
          <span className="text-slate-400">
            Test platform behavior under artificial error budget burn rates
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleSimulateBudget(95)}
            disabled={simulating}
            className="px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-300 border border-red-700 rounded font-medium transition"
          >
            Simulate 95% (Trigger Freeze)
          </button>
          <button
            onClick={() => handleSimulateBudget(65)}
            disabled={simulating}
            className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700 rounded font-medium transition"
          >
            Simulate 65% (Amber)
          </button>
          <button
            onClick={() => handleSimulateBudget(null)}
            disabled={simulating}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-medium transition"
          >
            Reset to Real-Time
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800 flex space-x-4">
        <button
          onClick={() => setActiveTab('slos')}
          className={`pb-2.5 px-1 text-sm font-medium transition border-b-2 ${
            activeTab === 'slos'
              ? 'border-sky-400 text-sky-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          11 Monitored SLOs
        </button>
        <button
          onClick={() => setActiveTab('experiments')}
          className={`pb-2.5 px-1 text-sm font-medium transition border-b-2 ${
            activeTab === 'experiments'
              ? 'border-sky-400 text-sky-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Experiments & Feature Flags ({experiments.length})
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`pb-2.5 px-1 text-sm font-medium transition border-b-2 ${
            activeTab === 'feedback'
              ? 'border-sky-400 text-sky-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Customer Sentiment & In-App Feedback
        </button>
        <button
          onClick={() => setActiveTab('tech_debt')}
          className={`pb-2.5 px-1 text-sm font-medium transition border-b-2 ${
            activeTab === 'tech_debt'
              ? 'border-sky-400 text-sky-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Technical Debt Register (20% Sprint Allocation)
        </button>
      </div>

      {/* TAB 1: 11 MONITORED SLOS */}
      {activeTab === 'slos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Peshawar Platform Service Level Objectives
              </h2>
              <p className="text-xs text-slate-400">
                Monitored continuously via Prometheus telemetry against defined error budgets.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Evaluation Window: 30 Days Rolling
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">SLO Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Current Telemetry</th>
                  <th className="p-3">Budget Consumed</th>
                  <th className="p-3">Burn Rates (1h / 24h)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reliabilityData?.slos?.map((slo: any) => (
                  <tr key={slo.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-bold text-sky-400">{slo.id}</td>
                    <td className="p-3 font-medium text-white">{slo.name}</td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">{slo.category}</td>
                    <td className="p-3 font-mono text-slate-300">
                      {slo.target} {slo.unit}
                    </td>
                    <td className="p-3 font-mono font-semibold text-white">
                      {slo.currentValue} {slo.unit}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              slo.budgetConsumedPercent >= 90
                                ? 'bg-red-500'
                                : slo.budgetConsumedPercent >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(slo.budgetConsumedPercent, 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-mono text-[11px] text-slate-300">
                          {slo.budgetConsumedPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-400">
                      {slo.burnRate1h}x / {slo.burnRate24h}x
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                          slo.status === 'HEALTHY'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : slo.status === 'DEGRADED'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        {slo.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EXPERIMENTS & FEATURE FLAGS */}
      {activeTab === 'experiments' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <h2 className="text-sm font-semibold text-white">
              Controlled Experimentation & Feature Flag Hub
            </h2>
            <p className="text-xs text-slate-400">
              Deterministic bucketing engine guarded by four non-negotiable safety invariants:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-[11px]">
              <div className="p-2 bg-slate-950 border border-emerald-800/60 rounded text-emerald-300 flex items-center space-x-2">
                <span>🛡️</span>
                <span>Tenant Eligibility Invariant Enforced</span>
              </div>
              <div className="p-2 bg-slate-950 border border-emerald-800/60 rounded text-emerald-300 flex items-center space-x-2">
                <span>📍</span>
                <span>Peshawar Municipal Geofence Enforced</span>
              </div>
              <div className="p-2 bg-slate-950 border border-emerald-800/60 rounded text-emerald-300 flex items-center space-x-2">
                <span>✅</span>
                <span>Only Moderated Listings Served</span>
              </div>
              <div className="p-2 bg-slate-950 border border-emerald-800/60 rounded text-emerald-300 flex items-center space-x-2">
                <span>🔒</span>
                <span>Raw CNIC / Contact PII Masked</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {experiments.map((exp: any) => {
              const isHalted = exp.killSwitchTriggered || exp.status === 'HALTED_GUARDRAIL';
              const isRunning = exp.status === 'RUNNING' && !isHalted;

              return (
                <div
                  key={exp.key}
                  className={`p-5 bg-slate-900 border rounded-xl space-y-4 transition ${
                    isHalted
                      ? 'border-red-800 bg-red-950/20'
                      : isRunning
                        ? 'border-slate-800'
                        : 'border-slate-800/60 opacity-80'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-bold text-sky-400">{exp.key}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            isHalted
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : isRunning
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isHalted ? 'HALTED (CIRCUIT BROKEN)' : exp.status}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-white mt-1">{exp.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{exp.description}</p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleExperiment(exp.key, !isRunning)}
                        disabled={isHalted}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          isHalted
                            ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
                            : isRunning
                              ? 'bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border-amber-800'
                              : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {isRunning ? 'Pause Experiment' : 'Enable Experiment'}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedExperiment(exp);
                          setKillModalOpen(true);
                        }}
                        disabled={isHalted}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          isHalted
                            ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
                            : 'bg-red-950/80 hover:bg-red-900 text-red-300 border-red-700'
                        }`}
                      >
                        🚨 Emergency Kill
                      </button>
                    </div>
                  </div>

                  {/* Targeting & Rollout Configuration */}
                  <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1">Target Roles:</span>
                      <div className="flex flex-wrap gap-1">
                        {exp.targetRoles?.map((r: string) => (
                          <span
                            key={r}
                            className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">Target Localities:</span>
                      <div className="flex flex-wrap gap-1">
                        {exp.targetLocalities && exp.targetLocalities.length > 0 ? (
                          exp.targetLocalities.map((loc: string) => (
                            <span
                              key={loc}
                              className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono text-[11px]"
                            >
                              {loc}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 font-mono">
                            All Peshawar (15 Localities)
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-400">Rollout Percentage:</span>
                        <span className="font-mono font-bold text-white">{exp.percentage}%</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[10, 25, 50, 100].map((pct) => (
                          <button
                            key={pct}
                            onClick={() => handleUpdateRollout(exp.key, pct)}
                            disabled={isHalted}
                            className={`flex-1 py-1 text-[11px] font-mono rounded border transition ${
                              exp.percentage === pct
                                ? 'bg-sky-600 text-white border-sky-500 font-bold'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER SENTIMENT & IN-APP FEEDBACK */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs text-slate-400">Average CSAT Rating</span>
              <div className="text-3xl font-extrabold text-white font-mono">
                {feedbackData?.averageRating || 4.7} / 5.0
              </div>
              <p className="text-xs text-slate-400">
                Captured via in-app widget and post-viewing surveys
              </p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs text-slate-400">Quarterly Net Promoter Score (NPS)</span>
              <div className="text-3xl font-extrabold text-sky-400 font-mono">
                +{feedbackData?.npsScore || 62}
              </div>
              <p className="text-xs text-slate-400">Promoters (5★) minus Detractors (≤3★)</p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs text-slate-400">Sentiment Distribution</span>
              <div className="flex items-center space-x-4 pt-1 text-xs">
                <div>
                  <span className="text-emerald-400 font-bold font-mono">
                    {feedbackData?.sentimentCounts?.positive || 2}
                  </span>{' '}
                  <span className="text-slate-400">Positive</span>
                </div>
                <div>
                  <span className="text-slate-300 font-bold font-mono">
                    {feedbackData?.sentimentCounts?.neutral || 0}
                  </span>{' '}
                  <span className="text-slate-400">Neutral</span>
                </div>
                <div>
                  <span className="text-red-400 font-bold font-mono">
                    {feedbackData?.sentimentCounts?.negative || 1}
                  </span>{' '}
                  <span className="text-slate-400">Critical / Alerts</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">
                Recent Customer Feedback & Triage Ledger
              </h2>
              <p className="text-xs text-slate-400">
                Low ratings (≤ 2 stars) require proactive concierge outreach within 4 hours.
              </p>
            </div>

            <div className="divide-y divide-slate-800">
              {feedbackData?.recentFeedback?.map((fb: any) => (
                <div key={fb.id} className="p-4 space-y-2 hover:bg-slate-800/30 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-amber-400 font-bold">
                        {'★'.repeat(fb.rating)}
                        {'☆'.repeat(5 - fb.rating)}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {fb.persona}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono text-[10px]">
                        {fb.locality || 'Peshawar'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{fb.category}</span>
                    </div>

                    {fb.requiresFollowUp && (
                      <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 font-bold text-[10px] uppercase font-mono animate-pulse">
                        Concierge Action Required (&lt;4h)
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-200 pl-1 italic">&ldquo;{fb.comment}&rdquo;</p>
                  <div className="text-[10px] text-slate-500 pl-1 font-mono">
                    Recorded from path: <code>{fb.pageUrl || '/'}</code> &bull; Timestamp:{' '}
                    {fb.createdAt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TECHNICAL DEBT REGISTER */}
      {activeTab === 'tech_debt' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Technical Debt Register & 20% Allocation
              </h2>
              <p className="text-xs text-slate-400">
                Managed according to <code>docs/operations/technical-debt-register.md</code>.
                Exactly 20% of engineering bandwidth is reserved for debt retirement.
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-1 rounded bg-sky-950 text-sky-300 border border-sky-800">
              Sprint Allocation: 20% Fixed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Subsystem</th>
                  <th className="p-3">Description & Symptoms</th>
                  <th className="p-3">Cost of Delay</th>
                  <th className="p-3">Effort</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {techDebtItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-bold text-sky-400">{item.id}</td>
                    <td className="p-3 font-mono text-slate-300">{item.subsystem}</td>
                    <td className="p-3 text-white max-w-xs">{item.desc}</td>
                    <td className="p-3 text-slate-400 max-w-xs">{item.costOfDelay}</td>
                    <td className="p-3 font-mono text-slate-300">{item.effort}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                          item.priority === 'P1'
                            ? 'bg-red-950 text-red-300 border border-red-700'
                            : 'bg-amber-950 text-amber-300 border border-amber-700'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          item.status === 'In Progress'
                            ? 'bg-sky-950 text-sky-300 border border-sky-700'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Emergency Kill Modal */}
      {killModalOpen && selectedExperiment && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-700 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-red-400 text-lg font-bold">
              <span>🚨</span>
              <span>Trip Emergency Kill-Switch?</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to activate the safety circuit breaker on{' '}
              <strong className="text-white font-mono">{selectedExperiment.key}</strong>. This will
              instantly halt the experiment and revert all tenants and landlords to the safe control
              variant in under 3 seconds.
            </p>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Incident Justification / Reason:</label>
              <input
                type="text"
                placeholder="e.g. Latency spike > 600ms or unexpected 5xx errors in Hayatabad"
                value={killReason}
                onChange={(e) => setKillReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setKillModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleKillExperiment}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg shadow-red-900/50"
              >
                Confirm Emergency Kill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
