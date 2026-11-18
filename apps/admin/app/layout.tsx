import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import AdminShell from '../components/AdminShell';

export const metadata: Metadata = {
  title: 'Peshawar Rental Marketplace | Administrative Control Console',
  description: 'Moderation, boundary verification, and locality governance console.',
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
