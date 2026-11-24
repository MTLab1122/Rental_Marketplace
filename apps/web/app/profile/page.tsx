'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { TenantType } from '@rental-peshawar/shared-types';
import EmptyState from '../../components/EmptyState';
import {
  MailIcon,
  ChatIcon,
  StarIcon,
  DocumentIcon,
  CalendarIcon,
  HouseIcon,
  ShieldCheckIcon,
} from '../../components/Icons';

export default function ProfilePage() {
  const router = useRouter();
  const { user, tenantType, setTenantType, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon=""
          title="Sign in to View Your Profile"
          description="Access your account details, discovery preferences, and verification status."
          actionText="Sign In"
          actionHref="/login"
        />
      </main>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-navy-100 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
          Tenant Account & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-navy-500 mt-1">
          Manage your personal details and Peshawar rental discovery settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="bg-white p-6 rounded-m3-lg border border-navy-100 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-md bg-peshawar-600 text-white font-black text-2xl flex items-center justify-center">
            {user.fullName ? user.fullName[0]?.toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-black text-navy-900">{user.fullName}</h2>
            <p className="text-xs text-navy-500">{user.email}</p>
            {user.phoneNumber && <p className="text-xs text-navy-400 mt-0.5">{user.phoneNumber}</p>}
          </div>
          <div className="pt-2 border-t border-navy-50">
            <span className="inline-block px-2.5 py-0.5 bg-navy-100 text-navy-800 text-[11px] font-bold rounded-m3-sm uppercase">
              Role: {user.roles?.[0] || 'Tenant'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-m3-md transition"
          >
            Sign Out of Account
          </button>
        </div>

        {/* Discovery Feed Preference Selection */}
        <div className="md:col-span-2 bg-white p-6 rounded-m3-lg border border-navy-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-navy-900 mb-1">Active Discovery Feed Mode</h3>
            <p className="text-xs text-navy-500 leading-relaxed">
              Peshawar Rentals operates strictly under non-overlapping categories. Choose your
              primary tenant identity below to curate all listings, search results, and
              recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Mode Option */}
            <div
              onClick={() => setTenantType(TenantType.STUDENT)}
              className={`p-4 rounded-m3-md border-2 cursor-pointer transition ${
                tenantType === TenantType.STUDENT
                  ? 'bg-student-bg/30 border-student-border shadow-xs'
                  : 'bg-white border-navy-200 hover:border-navy-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-navy-900">Student Portal</span>
                {tenantType === TenantType.STUDENT && (
                  <span className="text-student-text text-xs font-black">✓ Active</span>
                )}
              </div>
              <p className="text-xs text-navy-600 leading-relaxed">
                Hostels, bachelor studio apartments, single and shared rooms near universities.
              </p>
            </div>

            {/* Family Mode Option */}
            <div
              onClick={() => setTenantType(TenantType.FAMILY)}
              className={`p-4 rounded-m3-md border-2 cursor-pointer transition ${
                tenantType === TenantType.FAMILY
                  ? 'bg-family-bg/30 border-family-border shadow-xs'
                  : 'bg-white border-navy-200 hover:border-navy-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-navy-900">Family Portal</span>
                {tenantType === TenantType.FAMILY && (
                  <span className="text-family-text text-xs font-black">✓ Active</span>
                )}
              </div>
              <p className="text-xs text-navy-600 leading-relaxed">
                Houses, upper & lower portions, independent residential flats strictly for families.
              </p>
            </div>
          </div>

          {/* Quick Links & System Modules */}
          <div className="pt-4 border-t border-navy-100 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-navy-800">
              Active Rental Management Modules
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/inquiries"
                className="p-3 bg-navy-50 hover:bg-peshawar-50 rounded-lg border border-navy-200 hover:border-peshawar-400 transition block text-left"
              >
                <div className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                  <MailIcon className="w-4 h-4 text-peshawar-600" />
                  <span>My Inquiries</span>
                </div>
                <div className="text-[11px] text-navy-500 mt-1">
                  Track landlord replies & unlock WhatsApp contacts upon approval
                </div>
              </Link>

              <Link
                href="/messages"
                className="p-3 bg-navy-50 hover:bg-peshawar-50 rounded-lg border border-navy-200 hover:border-peshawar-400 transition block text-left"
              >
                <div className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                  <ChatIcon className="w-4 h-4 text-peshawar-600" />
                  <span>Direct Messages</span>
                </div>
                <div className="text-[11px] text-navy-500 mt-1">
                  Chat directly with landlords and hostel wardens
                </div>
              </Link>

              <Link
                href="/favorites"
                className="p-3 bg-navy-50 hover:bg-peshawar-50 rounded-lg border border-navy-200 hover:border-peshawar-400 transition block text-left"
              >
                <div className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                  <StarIcon className="w-4 h-4 text-peshawar-600" />
                  <span>Saved Properties</span>
                </div>
                <div className="text-[11px] text-navy-500 mt-1">
                  Review and compare your bookmarked Peshawar listings
                </div>
              </Link>

              <Link
                href="/agreements"
                className="p-3 bg-navy-50 hover:bg-peshawar-50 rounded-lg border border-navy-200 hover:border-peshawar-400 transition block text-left"
              >
                <div className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                  <DocumentIcon className="w-4 h-4 text-peshawar-600" />
                  <span>Lease Agreements</span>
                </div>
                <div className="text-[11px] text-navy-500 mt-1">
                  Sign & download enforceable KP Tenancy Act contracts
                </div>
              </Link>

              <Link
                href="/bookings"
                className="p-3 bg-navy-50 hover:bg-peshawar-50 rounded-lg border border-navy-200 hover:border-peshawar-400 transition block text-left"
              >
                <div className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-peshawar-600" />
                  <span>Bookings & Escrow</span>
                </div>
                <div className="text-[11px] text-navy-500 mt-1">
                  Track security deposit holds and official rent receipts
                </div>
              </Link>

              <Link
                href="/for-landlords"
                className="p-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition block text-left"
              >
                <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <HouseIcon className="w-4 h-4 text-emerald-700" />
                  <span>Landlord Center</span>
                </div>
                <div className="text-[11px] text-emerald-700 mt-1">
                  List a property for free & get verified NADRA badge
                </div>
              </Link>
            </div>
          </div>

          {/* Privacy & Legal Rights Section */}
          <div className="pt-4 border-t border-navy-100 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-navy-800">
              Privacy & Legal Governance
            </h4>
            <div className="p-4 bg-slate-50 border border-navy-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-navy-950 flex items-center gap-1.5">
                  <ShieldCheckIcon className="w-4 h-4 text-peshawar-600" />
                  <span>Data Protection & Deletion Rights</span>
                </div>
                <div className="text-[11px] text-navy-600 mt-0.5">
                  Request permanent deletion of your account, CNIC identity records, and inquiry
                  logs.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/data-deletion"
                  className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 rounded-md transition"
                >
                  Delete Account Data
                </Link>
                <Link
                  href="/refund-policy"
                  className="px-3.5 py-1.5 bg-white hover:bg-navy-50 text-navy-700 font-bold border border-navy-200 rounded-md transition"
                >
                  Refund Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
