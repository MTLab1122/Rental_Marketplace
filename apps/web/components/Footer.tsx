'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheckIcon } from './Icons';

export default function Footer() {
  const handleOpenCookiePreferences = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-cookie-preferences'));
    }
  };

  return (
    <footer className="bg-navy-900 text-navy-200 mt-20 border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Brand & Municipal Scope */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-peshawar-600 flex items-center justify-center text-white font-bold text-sm">
                PR
              </div>
              <span className="text-white font-bold text-lg">Peshawar Rentals</span>
            </div>
            <p className="text-sm text-navy-400">
              The dedicated, verified rental portal built strictly for the Peshawar metropolitan
              area in Khyber Pakhtunkhwa.
            </p>
            <div className="inline-block px-2.5 py-1 rounded-md bg-navy-800 text-[11px] text-peshawar-400 font-mono border border-navy-700">
              Boundary: 33.90°N–34.15°N, 71.35°E–71.70°E
            </div>
          </div>

          {/* Column 2: Localities */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
              Popular Localities
            </h3>
            <ul className="space-y-2 text-sm text-navy-300">
              <li>
                <Link
                  href="/properties?locality=hayatabad"
                  className="hover:text-peshawar-400 transition"
                >
                  Hayatabad (Phases 1-7)
                </Link>
              </li>
              <li>
                <Link
                  href="/properties?locality=university-town"
                  className="hover:text-peshawar-400 transition"
                >
                  University Town & Campus
                </Link>
              </li>
              <li>
                <Link
                  href="/properties?locality=gulbahar"
                  className="hover:text-peshawar-400 transition"
                >
                  Gulbahar & City Area
                </Link>
              </li>
              <li>
                <Link
                  href="/properties?locality=warsak-road"
                  className="hover:text-peshawar-400 transition"
                >
                  Warsak Road Enclave
                </Link>
              </li>
              <li>
                <Link
                  href="/properties?locality=peshawar-cantt"
                  className="hover:text-peshawar-400 transition"
                >
                  Peshawar Cantt & Saddar
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Portals */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
              Specialized Hubs
            </h3>
            <ul className="space-y-2 text-sm text-navy-300">
              <li>
                <Link
                  href="/for-landlords"
                  className="hover:text-peshawar-400 font-semibold text-peshawar-300 transition"
                >
                  For Landlords (0% Brokerage)
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-peshawar-400 transition">
                  Platform Services
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-peshawar-400 transition">
                  Pricing & Listing Boosts
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-peshawar-400 transition">
                  About Peshawar Rentals
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-peshawar-400 transition">
                  Contact Support Desk
                </Link>
              </li>
              <li>
                <Link href="/students" className="hover:text-student-text transition">
                  Student Hostels & Rooms
                </Link>
              </li>
              <li>
                <Link href="/families" className="hover:text-family-text transition">
                  Family Portions & Houses
                </Link>
              </li>
              <li>
                <Link href="/referrals" className="hover:text-emerald-400 transition">
                  Referral Rewards (PKR 500)
                </Link>
              </li>
              <li>
                <Link href="/inquiries" className="hover:text-peshawar-400 transition">
                  Track Inquiries
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Trust, Safety & Legal */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
              Trust & Legal Compliance
            </h3>
            <p className="text-sm text-navy-400 mb-3">
              Every property is audited, locality coordinates are geo-fenced to Peshawar, and
              landlord CNIC documents are verified against NADRA standards.
            </p>
            <div className="flex items-center gap-2 text-xs text-peshawar-400 font-semibold mb-4">
              <ShieldCheckIcon className="w-4 h-4 text-peshawar-400" />
              <span>Zero Unverified Public Listings</span>
            </div>

            <ul className="space-y-1.5 text-xs text-navy-400">
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="hover:text-white transition">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="hover:text-white transition">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenCookiePreferences}
                  className="text-left hover:text-white text-navy-400 transition underline"
                >
                  Cookie Preferences
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between text-xs text-navy-400 gap-2">
          <div>
            © {new Date().getFullYear()} Peshawar Rental Marketplace. All rights reserved.
            Exclusively serving Peshawar, KP, Pakistan.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-white">
              Terms
            </Link>
            <Link href="/cookie-policy" className="hover:text-white">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
