'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { removeAuthToken } from '../lib/api';

const NAV_ITEMS = [
  { label: 'Overview', href: '/', icon: '📊' },
  { label: 'Moderation Queue', href: '/moderation', icon: '🛡️' },
  { label: 'Verification Queue', href: '/verifications', icon: '🪪' },
  { label: 'Properties', href: '/properties', icon: '🏠' },
  { label: 'All Users', href: '/users', icon: '👥' },
  { label: 'Tenants', href: '/tenants', icon: '🎓' },
  { label: 'Landlords', href: '/landlords', icon: '🔑' },
  { label: 'Reports', href: '/reports', icon: '⚠️' },
  { label: 'Localities', href: '/localities', icon: '📍' },
  { label: 'Audit Logs', href: '/audit-logs', icon: '📜' },
  { label: 'Analytics', href: '/analytics', icon: '📈' },
  { label: 'SEO & Discovery', href: '/seo', icon: '🌐' },
  { label: 'Discovery & Alerts', href: '/discovery', icon: '🔔' },
  { label: 'Bookings & Leases', href: '/bookings', icon: '📝' },
  { label: 'Escrow Ledger', href: '/ledger', icon: '💰' },
  { label: 'Disputes Console', href: '/disputes', icon: '⚖️' },
  { label: 'Fraud & Risk Radar', href: '/risk', icon: '🛡️' },
  { label: 'Market Intelligence', href: '/intelligence', icon: '🧠' },
  { label: 'Background Jobs & DLQ', href: '/jobs', icon: '⚡' },
  { label: 'Event Replay & Outbox', href: '/events', icon: '🔄' },
  { label: 'Cache & Performance', href: '/cache', icon: '💾' },
  { label: 'Data Retention & GDPR', href: '/retention', icon: '🗄️' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
  { label: 'Feature Flags', href: '/feature-flags', icon: '🚩' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';
  const [adminUser, setAdminUser] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('adminUser');
      if (stored) {
        try {
          setAdminUser(JSON.parse(stored));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminUser');
    }
    router.push('/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col fixed inset-y-0 z-30">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl">🏔️</span>
              <h1 className="font-bold text-base text-sky-400 tracking-tight">Rental Peshawar</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Admin Operations Console</p>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
            PROD
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-3">
            <div className="truncate mr-2">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {adminUser?.email || 'admin@peshawar.pk'}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono uppercase">
                {adminUser?.role || 'SUPER_ADMIN'} • MFA Active
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-800/60 text-xs font-medium transition"
          >
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">{children}</main>
        <footer className="py-4 px-8 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
          <span>Peshawar Municipal Rental Operations • PostGIS Spatial Guard</span>
          <span>Security Level 2 (OWASP ASVS) • RBAC Enforced</span>
        </footer>
      </div>
    </div>
  );
}
