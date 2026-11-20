'use client';

import React, { useState } from 'react';
import { ShieldCheckIcon, CloseIcon } from './Icons';

export default function TrustSafetyBanner() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-r from-navy-950 to-navy-900 text-white rounded-md p-4 shadow-xs border border-navy-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheckIcon className="w-7 h-7 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="font-bold text-sm text-white">
              Protected by Peshawar Municipal Rental Security & AI Radar
            </div>
            <div className="text-xs text-navy-300 mt-0.5">
              Strict eligibility enforcement, biometric landlord verification, and advance fee fraud
              prevention.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="px-3.5 py-1.5 rounded-md bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold border border-navy-700 transition self-start sm:self-auto focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          Learn Safety Standards
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-md max-w-lg w-full p-6 shadow-2xl space-y-4 border border-navy-200">
            <div className="flex items-center justify-between border-b border-navy-100 pb-3">
              <h3 className="font-bold text-navy-950 text-base flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-emerald-600" />
                <span>Tenant Trust & Safety Guarantees</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-navy-400 hover:text-navy-700 p-1"
                aria-label="Close safety standards dialog"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-navy-800">
              <div className="p-3 bg-navy-50 rounded-md border border-navy-200">
                <span className="font-bold text-navy-950 block mb-0.5">
                  1. Zero Advance Fee Rule
                </span>
                Never transfer deposit or advance rent via JazzCash/EasyPaisa before viewing a
                property. Use official booking requests.
              </div>

              <div className="p-3 bg-navy-50 rounded-md border border-navy-200">
                <span className="font-bold text-navy-950 block mb-0.5">
                  2. PostGIS Peshawar Municipal Boundary Guard
                </span>
                Every property listing must fall within legitimate verified Peshawar coordinate
                bounds (Hayatabad, University Town, Cantt, Gulbahar, etc.).
              </div>

              <div className="p-3 bg-navy-50 rounded-md border border-navy-200">
                <span className="font-bold text-navy-950 block mb-0.5">
                  3. Non-Negotiable Eligibility Enforcement
                </span>
                Student-only properties are reserved strictly for students. Family residential
                portions cannot be rented to single occupants.
              </div>

              <div className="p-3 bg-navy-50 rounded-md border border-navy-200">
                <span className="font-bold text-navy-950 block mb-0.5">
                  4. AI Scam & Image Reuse Detection
                </span>
                Our background AI radar analyzes photo reuse, price outliers, and duplicate listings
                to flag deceptive operators.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-peshawar-600 hover:bg-peshawar-700 text-white rounded-md text-xs font-semibold transition"
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
