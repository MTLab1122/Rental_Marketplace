import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Peshawar Rental Marketplace | Administrative Control Console',
  description: 'Moderation, boundary verification, and locality governance console.',
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
        }}
      >
        {children}
      </body>
    </html>
  );
}
