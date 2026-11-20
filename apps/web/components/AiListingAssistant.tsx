'use client';

import React, { useState } from 'react';
import {
  getPropertyQualitySuggestions,
  updateQualitySuggestion,
  getPropertyPriceInsights,
} from '../lib/api';

interface Props {
  propertyId: string;
  token: string;
}

export default function AiListingAssistant({ propertyId, token }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [priceInsights, setPriceInsights] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [evaluated, setEvaluated] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const [suggRes, priceRes] = await Promise.all([
        getPropertyQualitySuggestions(propertyId, token),
        getPropertyPriceInsights(propertyId, token).catch(() => null),
      ]);
      setSuggestions(suggRes?.data?.suggestions || []);
      setPriceInsights(priceRes?.data || null);
      setEvaluated(true);
    } catch (err: any) {
      setError(err.message || 'Failed to run AI listing analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (suggestionId: string, status: 'ACCEPTED' | 'DISMISSED') => {
    try {
      await updateQualitySuggestion(propertyId, suggestionId, status, token);
      setSuggestions((prev) => prev.map((s) => (s.id === suggestionId ? { ...s, status } : s)));
    } catch (err: any) {
      alert(err.message || 'Failed to update suggestion');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl"></span>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">AI Listing Quality Assistant</h3>
            <p className="text-xs text-slate-500">
              Get automated recommendations to maximize verified inquiries and optimize rent.
            </p>
          </div>
        </div>

        <button
          onClick={runAnalysis}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : evaluated ? 'Re-Analyze' : 'Run Quality Audit'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Pricing Insights Card */}
      {priceInsights && (
        <div className="p-4 bg-sky-50/60 border border-sky-100 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-900 uppercase tracking-wide">
              Locality Pricing Benchmark
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                priceInsights.priceContext === 'AROUND_MARKET'
                  ? 'bg-emerald-100 text-emerald-800'
                  : priceInsights.priceContext === 'BELOW_MARKET'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
              }`}
            >
              {priceInsights.priceContext?.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-white rounded border border-sky-100">
              <span className="text-slate-400 block text-[10px]">Locality Median</span>
              <strong className="text-slate-800 font-mono">
                PKR {priceInsights.medianRentPkr?.toLocaleString()}
              </strong>
            </div>
            <div className="p-2 bg-white rounded border border-sky-100">
              <span className="text-slate-400 block text-[10px]">Competitive Min</span>
              <strong className="text-slate-800 font-mono">
                PKR {priceInsights.recommendedMinRentPkr?.toLocaleString()}
              </strong>
            </div>
            <div className="p-2 bg-white rounded border border-sky-100">
              <span className="text-slate-400 block text-[10px]">Competitive Max</span>
              <strong className="text-slate-800 font-mono">
                PKR {priceInsights.recommendedMaxRentPkr?.toLocaleString()}
              </strong>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic mt-1 leading-tight">
            {priceInsights.disclaimer}
          </p>
        </div>
      )}

      {/* Suggestions List */}
      {evaluated && suggestions.length === 0 && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-xs text-center font-medium">
          Excellent! Your listing meets all quality, amenity, and pricing standards for Peshawar.
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Recommendations ({suggestions.filter((s) => s.status === 'PENDING').length} Pending)
          </h4>

          <div className="space-y-2">
            {suggestions.map((s) => {
              const isResolved = s.status !== 'PENDING';
              return (
                <div
                  key={s.id}
                  className={`p-3 rounded-lg border text-xs transition ${
                    isResolved
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900">{s.title}</div>
                      <div className="text-slate-600 mt-0.5">{s.message}</div>
                      {s.actionableStep && (
                        <div className="text-sky-700 font-medium mt-1">
                          Action: {s.actionableStep}
                        </div>
                      )}
                    </div>

                    {!isResolved ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleUpdateStatus(s.id, 'ACCEPTED')}
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px]"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(s.id, 'DISMISSED')}
                          className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px]"
                        >
                          Dismiss
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                        {s.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
