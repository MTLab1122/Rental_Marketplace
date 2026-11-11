'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getLandlordProperties,
  updateLandlordPropertyStatus,
  deleteLandlordProperty,
} from '../../../lib/api';

export default function LandlordPropertiesPage() {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Please sign in as a landlord to manage your listings.');
        setLoading(false);
        return;
      }
      const list = await getLandlordProperties(token);
      setProperties(list || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, targetStatus: string) {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      await updateLandlordPropertyStatus(id, targetStatus, token);
      await loadProperties();
    } catch (err: any) {
      alert(`Error updating property status: ${err.message}`);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete the listing "${title}"?`)) return;
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      await deleteLandlordProperty(id, token);
      await loadProperties();
    } catch (err: any) {
      alert(`Error deleting property: ${err.message}`);
    }
  }

  const filtered = properties.filter((p) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'AVAILABLE') return p.status === 'APPROVED' && p.isAvailable === true;
    return p.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/landlord"
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                ← Console Overview
              </Link>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1">My Property Listings</h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage availability, submit for verification, and review performance for all your
              Peshawar units.
            </p>
          </div>
          <Link
            href="/landlord/properties/new"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition"
          >
            + Create New Listing
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['ALL', 'AVAILABLE', 'PENDING_REVIEW', 'RENTED', 'UNAVAILABLE', 'DRAFT', 'REJECTED'].map(
            (st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  filterStatus === st
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ),
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
            <p className="mt-3">Loading properties...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-600 font-medium">No properties found matching this filter.</p>
            <p className="text-xs text-slate-400 mt-1">
              Create your first Peshawar property using the wizard.
            </p>
            <Link
              href="/landlord/properties/new"
              className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition"
            >
              Start Listing Wizard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((property) => (
              <div
                key={property.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow transition flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0].url}
                      alt={property.title}
                      className="h-24 w-32 object-cover rounded-lg border border-slate-100 flex-shrink-0"
                    />
                  ) : (
                    <div className="h-24 w-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs flex-shrink-0">
                      No Image
                    </div>
                  )}

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">{property.title}</h2>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          property.status === 'APPROVED' && property.isAvailable
                            ? 'bg-emerald-100 text-emerald-800'
                            : property.status === 'PENDING_REVIEW'
                              ? 'bg-amber-100 text-amber-800'
                              : property.status === 'RENTED'
                                ? 'bg-blue-100 text-blue-800'
                                : property.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {property.status === 'APPROVED' && property.isAvailable
                          ? 'AVAILABLE'
                          : property.status}
                      </span>
                      <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {property.eligibility === 'STUDENTS_ONLY'
                          ? '🎓 Students Only'
                          : '👨‍👩‍👧 Families Only'}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-emerald-700 mt-1">
                      PKR {Number(property.monthlyRentPkr).toLocaleString()} / month
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span>
                        Locality: <strong>{property.locality?.name || 'Peshawar'}</strong>
                      </span>
                      <span>
                        Type: <strong>{property.propertyType}</strong>
                      </span>
                      <span>
                        Beds: <strong>{property.bedrooms}</strong>
                      </span>
                      <span>
                        Baths: <strong>{property.bathrooms}</strong>
                      </span>
                      <span>
                        Views: <strong>{property.viewCount ?? 0}</strong>
                      </span>
                    </div>

                    {property.isDuplicateWarning && (
                      <p className="mt-2 text-xs font-semibold text-amber-700 bg-amber-50 rounded px-2 py-1 inline-block">
                        ⚠️ Near-duplicate listing warning recorded
                      </p>
                    )}

                    {property.rejectionReason && (
                      <p className="mt-2 text-xs text-red-700 bg-red-50 rounded px-2 py-1">
                        Rejection Note: {property.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Landlord Action Controls */}
                <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                  {/* Availability Toggles */}
                  {property.status === 'APPROVED' && (
                    <>
                      {property.isAvailable ? (
                        <button
                          onClick={() => handleStatusChange(property.id, 'RENTED')}
                          className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                        >
                          Mark as Rented
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(property.id, 'APPROVED')}
                          className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                        >
                          Mark as Available
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleStatusChange(
                            property.id,
                            property.isAvailable ? 'UNAVAILABLE' : 'APPROVED',
                          )
                        }
                        className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        {property.isAvailable ? 'Mark Unavailable' : 'Restore Available'}
                      </button>
                    </>
                  )}

                  {/* Submit for review button when DRAFT */}
                  {property.status === 'DRAFT' && (
                    <button
                      onClick={() => handleStatusChange(property.id, 'PENDING_REVIEW')}
                      className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition"
                    >
                      Submit for Review
                    </button>
                  )}

                  {/* Analytics link */}
                  <Link
                    href={`/landlord/properties/${property.id}/analytics`}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    📊 Analytics
                  </Link>

                  {/* Edit link */}
                  <Link
                    href={`/landlord/properties/${property.id}/edit`}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    Edit
                  </Link>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(property.id, property.title)}
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
