import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Peshawar Rentals | Verified Property Discovery',
  description:
    'Peshawar’s premier verified rental portal with strict student-only and family-only eligibility filters.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-navy-900 antialiased">
        <AuthProvider>
          <Navbar />
          <div className="flex-grow">{children}</div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
