import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import JsonLd from '../components/JsonLd';
import { constructMetadata } from '../lib/seo';
import { generateOrganizationSchema, generateWebsiteSchema } from '../lib/structured-data';

export const metadata: Metadata = constructMetadata({
  title: 'Rent in Peshawar | Verified Flats, Hostels & Family Portions | RentPeshawar',
  description:
    'Peshawar’s verified rental portal with strict student-only and family-only eligibility filters. Direct landlord contacts, transparent PKR rates, and zero fake listings.',
  canonical: '/',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgSchema = generateOrganizationSchema();
  const websiteSchema = generateWebsiteSchema();

  return (
    <html lang="en">
      <head>
        <JsonLd data={orgSchema} />
        <JsonLd data={websiteSchema} />
      </head>
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
