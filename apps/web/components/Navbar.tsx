'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { TenantType } from '@rental-peshawar/shared-types';
import { StudentIcon, FamilyIcon, CloseIcon } from './Icons';

export default function Navbar() {
  const { user, tenantType, setTenantType, logout, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-navy-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Peshawar Verification Badge */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-peshawar-600 to-navy-900 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <svg
                  className="w-6 h-6 text-emerald-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2zm0 2.84L18.5 11H17v7h-2v-6H9v6H7v-7H5.5L12 4.84z" />
                </svg>
              </div>
              <div>
                <span className="font-black text-navy-950 text-xl tracking-tight block leading-tight">
                  Peshawar<span className="text-peshawar-600">Rentals</span>
                </span>
                <span className="text-[10px] text-peshawar-700 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  KP Municipal Verified Portal
                </span>
              </div>
            </Link>

            {/* Tenant Category Switcher */}
            <div className="hidden lg:flex items-center bg-navy-100/80 p-1 rounded-lg border border-navy-200 ml-2">
              <button
                type="button"
                onClick={() => setTenantType(TenantType.STUDENT)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1.5 ${
                  tenantType === TenantType.STUDENT
                    ? 'bg-student-bg text-student-text border border-student-border shadow-xs'
                    : 'text-navy-600 hover:text-navy-900'
                }`}
                title="View Student Hostels & Bachelor Accommodations"
              >
                <StudentIcon className="w-3.5 h-3.5" />
                <span>Student Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setTenantType(TenantType.FAMILY)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1.5 ${
                  tenantType === TenantType.FAMILY
                    ? 'bg-family-bg text-family-text border border-family-border shadow-xs'
                    : 'text-navy-600 hover:text-navy-900'
                }`}
                title="View Family Houses, Portions & Residential Apartments"
              >
                <FamilyIcon className="w-3.5 h-3.5" />
                <span>Family Mode</span>
              </button>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-5">
            <Link
              href="/"
              className="text-sm font-semibold text-navy-700 hover:text-peshawar-600 transition"
            >
              Home
            </Link>
            <Link
              href="/properties"
              className="text-sm font-semibold text-navy-700 hover:text-peshawar-600 transition"
            >
              Properties
            </Link>
            <Link
              href="/services"
              className="text-sm font-semibold text-navy-700 hover:text-peshawar-600 transition"
            >
              Services
            </Link>
            <Link
              href="/for-landlords"
              className="text-sm font-semibold text-navy-700 hover:text-peshawar-600 transition"
            >
              For Landlords
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-semibold text-navy-700 hover:text-peshawar-600 transition"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="text-sm font-semibold text-navy-700 hover:text-peshawar-600 transition"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="text-sm font-semibold text-navy-700 hover:text-peshawar-600 transition"
            >
              Contact
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-2 border-l border-navy-200">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-sm font-bold text-navy-900 bg-navy-50 px-3 py-1.5 rounded-lg border border-navy-200 hover:bg-navy-100 transition shadow-2xs"
                >
                  <span className="w-6 h-6 rounded-full bg-peshawar-600 text-white text-xs flex items-center justify-center font-black">
                    {user?.fullName ? user.fullName[0]?.toUpperCase() : 'U'}
                  </span>
                  <span className="truncate max-w-[120px]">{user?.fullName || 'Profile'}</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-navy-200">
                <Link
                  href="/login"
                  className="text-sm font-bold text-navy-800 hover:text-navy-950 px-3 py-2 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-bold bg-navy-900 hover:bg-navy-950 text-white px-3.5 py-2 rounded-lg transition shadow-2xs"
                >
                  Register
                </Link>
                <Link
                  href="/for-landlords"
                  className="text-sm font-bold bg-peshawar-600 hover:bg-peshawar-700 text-white px-3.5 py-2 rounded-lg transition shadow-xs flex items-center gap-1.5"
                >
                  <span>Post Property</span>
                  <span className="text-[11px] bg-peshawar-800 px-1.5 py-0.2 rounded font-extrabold text-emerald-200">
                    Free
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-navy-700 hover:text-navy-900 min-w-[48px] min-h-[48px] flex items-center justify-center"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <CloseIcon className="w-6 h-6" />
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b border-navy-200 px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <div className="flex items-center justify-between bg-navy-50 p-2.5 rounded-lg border border-navy-200">
            <span className="text-xs font-bold text-navy-700">Active Tenant Mode:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setTenantType(TenantType.STUDENT)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1 ${
                  tenantType === TenantType.STUDENT
                    ? 'bg-student-bg text-student-text border border-student-border'
                    : 'text-navy-600'
                }`}
              >
                <StudentIcon className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => setTenantType(TenantType.FAMILY)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1 ${
                  tenantType === TenantType.FAMILY
                    ? 'bg-family-bg text-family-text border border-family-border'
                    : 'text-navy-600'
                }`}
              >
                <FamilyIcon className="w-3.5 h-3.5" />
                <span>Family</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm font-semibold pt-1">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="p-2.5 rounded-md hover:bg-navy-50 text-navy-800"
            >
              🏠 Home
            </Link>
            <Link
              href="/properties"
              onClick={() => setMenuOpen(false)}
              className="p-2.5 rounded-md hover:bg-navy-50 text-navy-800"
            >
              🔍 Properties
            </Link>
            <Link
              href="/services"
              onClick={() => setMenuOpen(false)}
              className="p-2.5 rounded-md hover:bg-navy-50 text-navy-800"
            >
              🛠️ Services
            </Link>
            <Link
              href="/for-landlords"
              onClick={() => setMenuOpen(false)}
              className="p-2.5 rounded-md hover:bg-navy-50 text-peshawar-700 font-bold"
            >
              🏢 For Landlords
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMenuOpen(false)}
              className="p-2.5 rounded-md hover:bg-navy-50 text-navy-800"
            >
              🏷️ Pricing
            </Link>
            <Link
              href="/about"
              onClick={() => setMenuOpen(false)}
              className="p-2.5 rounded-md hover:bg-navy-50 text-navy-800"
            >
              📖 About Us
            </Link>
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="p-2.5 rounded-md hover:bg-navy-50 text-navy-800"
            >
              📞 Contact Us
            </Link>
            <Link
              href="/inquiries"
              onClick={() => setMenuOpen(false)}
              className="p-2.5 rounded-md hover:bg-navy-50 text-navy-800"
            >
              📨 Inquiries
            </Link>
          </div>

          {isAuthenticated ? (
            <div className="pt-3 border-t border-navy-100 flex items-center justify-between">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-bold text-peshawar-700 flex items-center gap-1.5"
              >
                <span>👤</span>
                <span>{user?.fullName} (My Profile)</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="text-xs text-red-600 font-bold px-3 py-1.5 rounded-md bg-red-50"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-navy-100 space-y-2">
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="w-1/2 text-center text-sm font-bold border border-navy-300 py-2.5 rounded-lg text-navy-800 bg-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="w-1/2 text-center text-sm font-bold bg-navy-900 text-white py-2.5 rounded-lg"
                >
                  Register
                </Link>
              </div>
              <Link
                href="/for-landlords"
                onClick={() => setMenuOpen(false)}
                className="block w-full text-center text-sm font-bold bg-peshawar-600 text-white py-2.5 rounded-lg shadow-xs"
              >
                Post Property Free
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
