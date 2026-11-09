import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Rental Marketplace Peshawar | Verified Properties',
  description:
    'Peshawar’s premier verified rental portal with strict student-only and family-only eligibility filters.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          backgroundColor: '#f8fafc',
        }}
      >
        {children}
      </body>
    </html>
  );
}
