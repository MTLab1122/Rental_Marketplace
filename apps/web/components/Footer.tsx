import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-navy-200 mt-20 border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Brand & Municipal Scope */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-m3-sm bg-peshawar-500 flex items-center justify-center text-white font-bold text-sm">
                PR
              </div>
              <span className="text-white font-bold text-lg">Peshawar Rentals</span>
            </div>
            <p className="text-sm text-navy-400">
              The dedicated, verified rental portal built strictly for the Peshawar metropolitan
              area in Khyber Pakhtunkhwa.
            </p>
            <div className="inline-block px-2.5 py-1 rounded bg-navy-800 text-[11px] text-peshawar-400 font-mono border border-navy-700">
              Boundary: 33.90°N–34.15°N, 71.35°E–71.70°E
            </div>
          </div>

          {/* Column 2: Localities */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
              Popular Localities
            </h4>
            <ul className="space-y-2 text-sm text-navy-300">
              <li>
                <Link href="/properties?locality=hayatabad" className="hover:text-peshawar-400">
                  Hayatabad (Phases 1-7)
                </Link>
              </li>
              <li>
                <Link
                  href="/properties?locality=university-town"
                  className="hover:text-peshawar-400"
                >
                  University Town & Campus
                </Link>
              </li>
              <li>
                <Link href="/properties?locality=gulbahar" className="hover:text-peshawar-400">
                  Gulbahar & City Area
                </Link>
              </li>
              <li>
                <Link href="/properties?locality=warsak-road" className="hover:text-peshawar-400">
                  Warsak Road Enclave
                </Link>
              </li>
              <li>
                <Link
                  href="/properties?locality=peshawar-cantt"
                  className="hover:text-peshawar-400"
                >
                  Peshawar Cantt & Saddar
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Portals */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
              Specialized Hubs
            </h4>
            <ul className="space-y-2 text-sm text-navy-300">
              <li>
                <Link
                  href="/for-landlords"
                  className="hover:text-peshawar-400 font-semibold text-peshawar-300"
                >
                  🏡 For Landlords (0% Brokerage)
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-peshawar-400">
                  💎 Pricing & Boosts
                </Link>
              </li>
              <li>
                <Link href="/students" className="hover:text-student-text">
                  🎓 Student Hostels & Rooms
                </Link>
              </li>
              <li>
                <Link href="/families" className="hover:text-family-text">
                  👨‍👩‍👧‍👦 Family Portions & Houses
                </Link>
              </li>
              <li>
                <Link href="/referrals" className="hover:text-emerald-400">
                  🎁 Referral Rewards (PKR 500)
                </Link>
              </li>
              <li>
                <Link href="/inquiries" className="hover:text-peshawar-400">
                  Track Inquiries
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Safety & Trust */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
              Trust & Verification
            </h4>
            <p className="text-sm text-navy-400 mb-3">
              Every property is audited, locality coordinates are geo-fenced to Peshawar, and
              landlord CNIC documents are verified against NADRA standards.
            </p>
            <div className="flex items-center gap-2 text-xs text-peshawar-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-peshawar-400"></span>
              Zero Unverified Public Listings
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-navy-800 text-center text-xs text-navy-500">
          © {new Date().getFullYear()} Peshawar Rental Marketplace. All rights reserved. Exclusively
          serving Peshawar, KP, Pakistan.
        </div>
      </div>
    </footer>
  );
}
