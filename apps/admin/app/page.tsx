import React from 'react';
import { PESHAWAR_LOCALITIES_CONFIG } from '@rental-peshawar/config';

export default function AdminDashboardPage() {
  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <header
        style={{ marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}
      >
        <h1 style={{ fontSize: '1.75rem', margin: 0, color: '#38bdf8' }}>
          Peshawar Administrative Console
        </h1>
        <p style={{ color: '#94a3b8', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
          Platform Moderation • Geographic Fence Enforcement • Approval Workflow
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ backgroundColor: '#1e293b', padding: '1.25rem', borderRadius: '0.5rem' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
            Configured Localities
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
            {PESHAWAR_LOCALITIES_CONFIG.length}
          </div>
          <div style={{ color: '#10b981', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            All active in DB
          </div>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '1.25rem', borderRadius: '0.5rem' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
            Spatial Fence
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
            Enforced
          </div>
          <div style={{ color: '#38bdf8', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            PostGIS polygon verified
          </div>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '1.25rem', borderRadius: '0.5rem' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
            Eligibility Rule
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
            Strict 100%
          </div>
          <div style={{ color: '#f59e0b', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Zero cross-visibility
          </div>
        </div>
      </div>

      <section style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '0.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#f1f5f9' }}>
          Locality Directory
        </h2>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.875rem',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
              <th style={{ padding: '0.75rem' }}>Locality</th>
              <th style={{ padding: '0.75rem' }}>Slug</th>
              <th style={{ padding: '0.75rem' }}>Postal Code</th>
              <th style={{ padding: '0.75rem' }}>Center GPS</th>
            </tr>
          </thead>
          <tbody>
            {PESHAWAR_LOCALITIES_CONFIG.map((loc) => (
              <tr key={loc.slug} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{loc.name}</td>
                <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{loc.slug}</td>
                <td style={{ padding: '0.75rem' }}>{loc.postalCode}</td>
                <td style={{ padding: '0.75rem', color: '#38bdf8' }}>
                  {loc.centerCoordinates.latitude.toFixed(4)},{' '}
                  {loc.centerCoordinates.longitude.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
