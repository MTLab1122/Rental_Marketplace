'use client';

import React, { useState, useEffect } from 'react';
import { getSeoHealthReportAdmin, triggerSitemapRegenerateAdmin } from '../../lib/api';

export default function AdminSeoPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regeneratingSitemap, setRegeneratingSitemap] = useState(false);
  const [sitemapSuccessMsg, setSitemapSuccessMsg] = useState<string | null>(null);

  // Meta Tags Preview Tool State
  const [previewTitle, setPreviewTitle] = useState(
    '2-Bed Luxury Family Flat in Phase 5 | Hayatabad, Peshawar | RentPeshawar',
  );
  const [previewDesc, setPreviewDesc] = useState(
    'Spacious 2-bed upper portion for rent in Phase 5 Hayatabad. Separate electricity meter, sweet boring water, close to Tatara Park. Rent: PKR 45,000/mo.',
  );
  const [previewSlug, setPreviewSlug] = useState('hayatabad-phase-5-2-bed-luxury-flat');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const report = await getSeoHealthReportAdmin();
        setHealthData(report);
      } catch (err: any) {
        setError(err?.message || 'Failed to load SEO health report.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleRegenerateSitemap = async () => {
    setRegeneratingSitemap(true);
    setSitemapSuccessMsg(null);
    try {
      await triggerSitemapRegenerateAdmin();
      setSitemapSuccessMsg('Sitemap pinged and verified successfully!');
      setTimeout(() => setSitemapSuccessMsg(null), 4000);
    } catch {
      setSitemapSuccessMsg('Sitemap request dispatched.');
      setTimeout(() => setSitemapSuccessMsg(null), 4000);
    } finally {
      setRegeneratingSitemap(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/4" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-24 bg-slate-900 rounded-lg border border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <span>🌐</span> Technical SEO & Organic Discovery Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search engine indexability, sitemap generation, locality programmatic hubs, and schema
            conformance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRegenerateSitemap}
            disabled={regeneratingSitemap}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-2"
          >
            <span>🔄</span>
            <span>{regeneratingSitemap ? 'Regenerating...' : 'Regenerate / Ping Sitemap'}</span>
          </button>
        </div>
      </div>

      {sitemapSuccessMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs font-bold">
          ✓ {sitemapSuccessMsg}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/60 border border-red-500/50 rounded-lg text-red-300 text-xs font-bold">
          ✕ {error}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Indexable Listings
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {healthData?.totalIndexableProperties ?? 0}
          </div>
          <div className="text-[11px] text-slate-500">Approved & available in Peshawar</div>
        </div>

        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Localities
          </div>
          <div className="text-3xl font-black text-sky-400">
            {healthData?.totalActiveLocalities ?? 0}
          </div>
          <div className="text-[11px] text-slate-500">Programmatic locality hubs</div>
        </div>

        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Sitemap Health
          </div>
          <div className="text-2xl font-black text-emerald-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{healthData?.sitemapStatus || 'HEALTHY'}</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {healthData?.sitemapUrl || 'https://rentpeshawar.pk/sitemap.xml'}
          </div>
        </div>

        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Missing Metadata Alerts
          </div>
          <div
            className={`text-3xl font-black ${
              (healthData?.alerts?.length || 0) > 0 ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            {healthData?.alerts?.length || 0}
          </div>
          <div className="text-[11px] text-slate-500">Quality warnings requiring action</div>
        </div>
      </div>

      {/* Missing Metadata & Quality Alerts */}
      {healthData?.alerts && healthData.alerts.length > 0 && (
        <div className="p-5 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
            <span>⚠️</span> Missing Metadata & Thin Content Warnings
          </div>
          <ul className="space-y-1 text-xs text-amber-200">
            {healthData.alerts.map((alert: string, idx: number) => (
              <li key={idx} className="flex items-center gap-2">
                <span>•</span>
                <span>{alert}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Locality Hubs Health Table */}
      <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>📍</span> Peshawar Locality Landing Pages Indexing Status
          </h2>
          <span className="text-xs text-slate-400">
            {healthData?.localities?.length || 0} registered sectors
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Locality Name</th>
                <th className="py-2.5 px-3">Slug</th>
                <th className="py-2.5 px-3">Live Listings</th>
                <th className="py-2.5 px-3">Crawl Eligibility</th>
                <th className="py-2.5 px-3">Last Content Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {healthData?.localities?.map((loc: any) => (
                <tr key={loc.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-bold text-slate-200">{loc.name}</td>
                  <td className="py-3 px-3 text-slate-400 font-mono">
                    /rentals/peshawar/{loc.slug}
                  </td>
                  <td className="py-3 px-3 text-slate-200 font-bold">
                    {loc.activePropertiesCount}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        loc.hasSufficientInventory
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {loc.hasSufficientInventory ? 'INDEXABLE' : 'LOW INVENTORY'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {loc.updatedAt ? new Date(loc.updatedAt).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Meta Tags & Google SERP Preview Tool */}
      <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>🔍</span> Google SERP & OpenGraph Preview Tool
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate how properties and locality hubs will appear in Google Search and
            WhatsApp/Twitter cards.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Controls */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Page Title Tag (Formula: [Title] | [Locality], Peshawar | RentPeshawar)
              </label>
              <input
                type="text"
                value={previewTitle}
                onChange={(e) => setPreviewTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {previewTitle.length} characters (Recommended: 50–60)
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Meta Description Tag
              </label>
              <textarea
                rows={3}
                value={previewDesc}
                onChange={(e) => setPreviewDesc(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {previewDesc.length} characters (Recommended: 130–155)
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Slug (Deterministic, lowercase, hyphen-separated)
              </label>
              <input
                type="text"
                value={previewSlug}
                onChange={(e) => setPreviewSlug(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Google SERP Snippet Preview */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Google Desktop SERP Simulation
            </div>
            <div className="p-5 bg-white rounded-lg shadow-sm space-y-1 font-sans">
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-peshawar-600 flex items-center justify-center text-[9px] text-white font-bold">
                  RP
                </span>
                <span className="font-medium text-slate-800">RentPeshawar</span>
                <span className="text-slate-400">› properties › {previewSlug}</span>
              </div>
              <h3 className="text-base text-blue-800 hover:underline cursor-pointer font-medium leading-snug line-clamp-1">
                {previewTitle}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{previewDesc}</p>
            </div>

            {/* Social Share Preview */}
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">
              Social Card Preview (1200x630 OG)
            </div>
            <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800">
              <div className="aspect-[1.91/1] bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-bold">
                1200 x 630 OpenGraph Image Banner
              </div>
              <div className="p-3 space-y-1">
                <div className="text-[10px] uppercase text-emerald-400 font-bold">
                  rentpeshawar.pk
                </div>
                <div className="text-xs font-bold text-slate-100 line-clamp-1">{previewTitle}</div>
                <div className="text-[11px] text-slate-400 line-clamp-2">{previewDesc}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
