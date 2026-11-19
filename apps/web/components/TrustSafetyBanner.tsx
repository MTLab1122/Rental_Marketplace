'use client';

import React, { useState } from 'react';

export default function TrustSafetyBanner() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-r from-sky-900 to-indigo-900 text-white rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <div className="font-bold text-sm">
              Protected by Peshawar Municipal Rental Security & AI Radar
            </div>
            <div className="text-xs text-sky-200 mt-0.5">
              Strict eligibility enforcement, biometric landlord verification, and advance fee fraud
              prevention.
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur border border-white/20 transition self-start sm:self-auto"
        >
          Learn Safety Standards
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>🛡️</span> Tenant Trust & Safety Guarantees
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="font-bold text-slate-900 block mb-0.5">
                  1. Zero Advance Fee Rule
                </span>
                Never transfer deposit or advance rent via JazzCash/EasyPaisa before viewing a
                property. Use official booking requests.
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="font-bold text-slate-900 block mb-0.5">
                  2. PostGIS Peshawar Municipal Boundary Guard
                </span>
                Every property listing must fall within legitimate verified Peshawar coordinate
                bounds (Hayatabad, University Town, Cantt, Gulbahar, etc.).
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="font-bold text-slate-900 block mb-0.5">
                  3. Non-Negotiable Eligibility Enforcement
                </span>
                Student-only properties are reserved strictly for students. Family residential
                portions cannot be rented to single occupants.
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="font-bold text-slate-900 block mb-0.5">
                  4. AI Scam & Image Reuse Detection
                </span>
                Our background AI radar analyzes photo reuse, price outliers, and duplicate listings
                to flag deceptive operators.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
