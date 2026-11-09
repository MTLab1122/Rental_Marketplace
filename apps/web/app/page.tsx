import React from 'react';
import { PESHAWAR_LOCALITIES_CONFIG } from '@rental-peshawar/config';
import { colors } from '@rental-peshawar/ui';

export default function HomePage() {
  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: colors.primary[100],
            color: colors.primary[800],
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '1rem',
          }}
        >
          Exclusively for Peshawar, KP, Pakistan
        </div>
        <h1 style={{ fontSize: '2.5rem', color: colors.slate[900], margin: '0.5rem 0' }}>
          Verified Rental Marketplace
        </h1>
        <p
          style={{
            fontSize: '1.125rem',
            color: colors.slate[600],
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          Strictly segregated discovery for Students and Families. Zero mixed listings, fully
          verified properties within the official Peshawar municipal boundary.
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem',
        }}
      >
        {/* Student Hub Card */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '0.75rem',
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.eligibility.studentsOnly.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <span
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '0.375rem',
              backgroundColor: colors.eligibility.studentsOnly.background,
              color: colors.eligibility.studentsOnly.text,
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            STUDENTS ONLY
          </span>
          <h2 style={{ fontSize: '1.25rem', marginTop: '1rem', color: colors.slate[900] }}>
            Student Portals & Hostels
          </h2>
          <p style={{ color: colors.slate[600], fontSize: '0.875rem' }}>
            Curated student accommodations near University of Peshawar, KMC, UET Peshawar, and
            Islamia College.
          </p>
        </div>

        {/* Family Hub Card */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '0.75rem',
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.eligibility.familiesOnly.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <span
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '0.375rem',
              backgroundColor: colors.eligibility.familiesOnly.background,
              color: colors.eligibility.familiesOnly.text,
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            FAMILIES ONLY
          </span>
          <h2 style={{ fontSize: '1.25rem', marginTop: '1rem', color: colors.slate[900] }}>
            Family Homes & Apartments
          </h2>
          <p style={{ color: colors.slate[600], fontSize: '0.875rem' }}>
            Peaceful family residences across Hayatabad, Peshawar Cantt, Warsak Road, and Regi Model
            Town.
          </p>
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: '1.25rem', color: colors.slate[800], marginBottom: '1rem' }}>
          Active Peshawar Localities ({PESHAWAR_LOCALITIES_CONFIG.length})
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {PESHAWAR_LOCALITIES_CONFIG.map((loc) => (
            <span
              key={loc.slug}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '0.375rem',
                backgroundColor: colors.slate[200],
                color: colors.slate[700],
                fontSize: '0.875rem',
              }}
            >
              {loc.name}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
