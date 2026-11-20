'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheckIcon, CloseIcon, CheckIcon } from './Icons';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'peshawar_rent_cookie_consent';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    timestamp: '',
  });

  useEffect(() => {
    // Check if consent has already been recorded
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setVisible(true);
      } else {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
      }
    } catch {
      setVisible(true);
    }

    // Allow opening cookie preferences from anywhere (e.g., footer link)
    const handleOpenPreferences = () => {
      setShowManage(true);
      setVisible(true);
    };

    window.addEventListener('open-cookie-preferences', handleOpenPreferences);
    return () => {
      window.removeEventListener('open-cookie-preferences', handleOpenPreferences);
    };
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore storage errors in restricted contexts
    }
    setPreferences(prefs);
    setVisible(false);
    setShowManage(false);
  };

  const handleAcceptAll = () => {
    const prefs: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    savePreferences(prefs);
  };

  const handleRejectNonEssential = () => {
    const prefs: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    savePreferences(prefs);
  };

  const handleSaveCustom = () => {
    const prefs: CookiePreferences = {
      ...preferences,
      necessary: true,
      timestamp: new Date().toISOString(),
    };
    savePreferences(prefs);
  };

  if (!visible) return null;

  return (
    <aside
      role="region"
      aria-label="Cookie and Privacy Consent"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-navy-950/95 backdrop-blur-md text-white border-t border-navy-800 shadow-2xl transition-all"
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {!showManage ? (
          <>
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Your Privacy & Cookie Choices on Peshawar Rentals
                </h2>
              </div>
              <p className="text-xs text-navy-300 leading-relaxed">
                We use strictly necessary cookies to ensure secure municipal authentication and
                fraud prevention. With your permission, we also use analytical cookies to improve
                search accuracy across Peshawar localities. We never sell your personal or rental
                data. Read our{' '}
                <Link
                  href="/cookie-policy"
                  className="text-emerald-400 hover:underline font-semibold"
                >
                  Cookie Policy
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy-policy"
                  className="text-emerald-400 hover:underline font-semibold"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
              <button
                type="button"
                onClick={() => setShowManage(true)}
                className="px-3.5 py-2 text-xs font-semibold rounded-md border border-navy-700 hover:bg-navy-800 text-navy-200 transition focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Manage Preferences
              </button>
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="px-3.5 py-2 text-xs font-semibold rounded-md border border-navy-700 hover:bg-navy-800 text-navy-200 transition focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2 text-xs font-bold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                Accept All
              </button>
            </div>
          </>
        ) : (
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between border-b border-navy-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Custom Cookie Preferences</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowManage(false)}
                className="text-navy-400 hover:text-white transition p-1"
                aria-label="Back to simple consent banner"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-navy-900 rounded-md border border-navy-800 space-y-1">
                <div className="flex items-center justify-between font-bold text-navy-100">
                  <span>1. Strictly Necessary</span>
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider bg-emerald-950 px-1.5 py-0.5 rounded">
                    Always Active
                  </span>
                </div>
                <p className="text-navy-400 text-[11px] leading-relaxed">
                  Required for core platform security, JWT session token management, and fraud
                  protection.
                </p>
              </div>

              <div className="p-3 bg-navy-900 rounded-md border border-navy-800 space-y-1">
                <div className="flex items-center justify-between font-bold text-navy-100">
                  <span>2. Analytics & Performance</span>
                  <input
                    type="checkbox"
                    id="consent_analytics"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences({ ...preferences, analytics: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-navy-700 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-navy-400 text-[11px] leading-relaxed">
                  Aggregated telemetry to measure search speed, locality query trends, and technical
                  errors.
                </p>
              </div>

              <div className="p-3 bg-navy-900 rounded-md border border-navy-800 space-y-1">
                <div className="flex items-center justify-between font-bold text-navy-100">
                  <span>3. Personalized Experience</span>
                  <input
                    type="checkbox"
                    id="consent_marketing"
                    checked={preferences.marketing}
                    onChange={(e) =>
                      setPreferences({ ...preferences, marketing: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-navy-700 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-navy-400 text-[11px] leading-relaxed">
                  Allows saving locality filters, recent search preferences, and eligibility view
                  modes.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowManage(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-md border border-navy-700 hover:bg-navy-800 text-navy-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="px-4 py-2 text-xs font-bold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition flex items-center gap-1.5"
              >
                <CheckIcon className="w-3.5 h-3.5" />
                Save My Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
