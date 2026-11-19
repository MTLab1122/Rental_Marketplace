'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { TenantType } from '@rental-peshawar/shared-types';

export default function Navbar() {
  const { user, tenantType, setTenantType, logout, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-navy-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Peshawar Verification Badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-m3-md bg-peshawar-600 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:bg-peshawar-700 transition">
                PR
              </div>
              <div>
                <span className="font-extrabold text-navy-900 text-lg tracking-tight block leading-tight">
                  Peshawar<span className="text-peshawar-600">Rentals</span>
                </span>
                <span className="text-[10px] text-navy-400 font-semibold uppercase tracking-wider block">
                  KP Verified Municipal Portal
                </span>
              </div>
            </Link>

            {/* Tenant Category Switcher Pill */}
            <div className="hidden md:flex items-center bg-navy-100 p-1 rounded-m3-full border border-navy-200 ml-4">
              <button
                type="button"
                onClick={() => setTenantType(TenantType.STUDENT)}
                className={`px-3 py-1 text-xs font-bold rounded-m3-full transition ${
                  tenantType === TenantType.STUDENT
                    ? 'bg-student-bg text-student-text shadow-sm'
                    : 'text-navy-600 hover:text-navy-900'
                }`}
              >
                🎓 Student Mode
              </button>
              <button
                type="button"
                onClick={() => setTenantType(TenantType.FAMILY)}
                className={`px-3 py-1 text-xs font-bold rounded-m3-full transition ${
                  tenantType === TenantType.FAMILY
                    ? 'bg-family-bg text-family-text shadow-sm'
                    : 'text-navy-600 hover:text-navy-900'
                }`}
              >
                👨‍👩‍👧‍👦 Family Mode
              </button>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/properties"
              className="text-sm font-semibold text-navy-700 hover:text-peshawar-600 transition"
            >
              Explore Listings
            </Link>
            <Link
              href="/for-landlords"
              className="text-sm font-semibold text-peshawar-600 hover:text-peshawar-700 transition"
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
              href="/favorites"
              className="text-sm font-semibold text-navy-700 hover:text-peshawar-600 transition"
            >
              Saved
            </Link>
            <Link
              href="/inquiries"
              className="text-sm font-semibold text-navy-700 hover:text-peshawar-600 transition"
            >
              Inquiries
            </Link>
            <Link
              href="/messages"
              className="text-sm font-semibold text-navy-700 hover:text-peshawar-600 transition"
            >
              Messages
            </Link>
            <Link
              href="/notifications"
              className="text-sm font-semibold text-navy-700 hover:text-peshawar-600 transition"
            >
              Alerts
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="text-sm font-semibold text-navy-800 bg-navy-50 px-3 py-1.5 rounded-m3-md border border-navy-200 hover:bg-navy-100 transition"
                >
                  {user?.fullName || 'Profile'}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-navy-700 hover:text-navy-900 px-3 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-bold bg-peshawar-600 text-white px-4 py-2 rounded-m3-md shadow-sm hover:bg-peshawar-700 transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-navy-700 hover:text-navy-900"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b border-navy-200 px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between bg-navy-50 p-2 rounded-m3-md border border-navy-200">
            <span className="text-xs font-bold text-navy-600">Active Tenant View:</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setTenantType(TenantType.STUDENT)}
                className={`px-2.5 py-1 text-xs font-bold rounded-m3-sm ${
                  tenantType === TenantType.STUDENT
                    ? 'bg-student-bg text-student-text'
                    : 'text-navy-600'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setTenantType(TenantType.FAMILY)}
                className={`px-2.5 py-1 text-xs font-bold rounded-m3-sm ${
                  tenantType === TenantType.FAMILY
                    ? 'bg-family-bg text-family-text'
                    : 'text-navy-600'
                }`}
              >
                Family
              </button>
            </div>
          </div>

          <Link
            href="/properties"
            onClick={() => setMenuOpen(false)}
            className="block text-navy-800 font-semibold py-2"
          >
            Explore Properties
          </Link>
          <Link
            href="/favorites"
            onClick={() => setMenuOpen(false)}
            className="block text-navy-800 font-semibold py-2"
          >
            Saved Favorites
          </Link>
          <Link
            href="/inquiries"
            onClick={() => setMenuOpen(false)}
            className="block text-navy-800 font-semibold py-2"
          >
            My Inquiries
          </Link>
          <Link
            href="/messages"
            onClick={() => setMenuOpen(false)}
            className="block text-navy-800 font-semibold py-2"
          >
            Direct Messages
          </Link>
          <Link
            href="/notifications"
            onClick={() => setMenuOpen(false)}
            className="block text-navy-800 font-semibold py-2"
          >
            Alerts & Notifications
          </Link>
          {isAuthenticated ? (
            <div className="pt-2 border-t border-navy-100 flex items-center justify-between">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-semibold text-peshawar-700"
              >
                {user?.fullName} (Account)
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="text-xs text-red-600 font-bold"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-navy-100 flex gap-2">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="w-1/2 text-center text-sm font-bold border border-navy-300 py-2 rounded-m3-md"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="w-1/2 text-center text-sm font-bold bg-peshawar-600 text-white py-2 rounded-m3-md"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
