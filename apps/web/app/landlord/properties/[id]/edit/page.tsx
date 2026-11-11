'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getLandlordProperty,
  updateLandlordProperty,
  updateLandlordPropertyImages,
} from '../../../../../lib/api';

export default function EditLandlordPropertyPage() {
  const params = useParams();
  const id = params['id'] as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyRentPkr, setMonthlyRentPkr] = useState(0);
  const [securityDepositPkr, setSecurityDepositPkr] = useState(0);
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [areaSqFt, setAreaSqFt] = useState(0);
  const [furnishing, setFurnishing] = useState('UNFURNISHED');
  const [addressNote, setAddressNote] = useState('');
  const [images, setImages] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('Authentication required. Please log in.');
          setLoading(false);
          return;
        }
        const prop = await getLandlordProperty(id, token);
        if (prop) {
          setTitle(prop.title || '');
          setDescription(prop.description || '');
          setMonthlyRentPkr(Number(prop.monthlyRentPkr) || 0);
          setSecurityDepositPkr(Number(prop.securityDepositPkr) || 0);
          setBedrooms(prop.bedrooms || 1);
          setBathrooms(prop.bathrooms || 1);
          setAreaSqFt(Number(prop.areaSqFt) || 0);
          setFurnishing(prop.furnishing || 'UNFURNISHED');
          setAddressNote(prop.addressNote || '');
          setImages(prop.images || []);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load property');
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      loadData();
    }
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      await updateLandlordProperty(
        id,
        {
          title,
          description,
          monthlyRentPkr: Number(monthlyRentPkr),
          securityDepositPkr: Number(securityDepositPkr),
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          areaSqFt: Number(areaSqFt),
          furnishing,
          addressNote,
        },
        token,
      );

      // Save image primary / sort orders
      if (images.length > 0) {
        await updateLandlordPropertyImages(
          id,
          images.map((img, idx) => ({
            id: img.id,
            sortOrder: idx,
            isPrimary: img.isPrimary,
          })),
          token,
        );
      }

      alert('Property updated successfully!');
      router.push('/landlord/properties');
    } catch (err: any) {
      setError(err?.message || 'Failed to update property');
    } finally {
      setSaving(false);
    }
  }

  function handleSetCover(index: number) {
    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        isPrimary: idx === index,
      })),
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-slate-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
        <p className="mt-3">Loading property details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6">
          <Link
            href="/landlord/properties"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            ← Back to Listings
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Edit Listing</h1>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6"
        >
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Monthly Rent (PKR)
              </label>
              <input
                type="number"
                min="500"
                value={monthlyRentPkr}
                onChange={(e) => setMonthlyRentPkr(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Security Deposit (PKR)
              </label>
              <input
                type="number"
                min="0"
                value={securityDepositPkr}
                onChange={(e) => setSecurityDepositPkr(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Bedrooms
              </label>
              <input
                type="number"
                min="0"
                value={bedrooms}
                onChange={(e) => setBedrooms(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Bathrooms
              </label>
              <input
                type="number"
                min="0"
                value={bathrooms}
                onChange={(e) => setBathrooms(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Area (Sq Ft)
              </label>
              <input
                type="number"
                min="0"
                value={areaSqFt}
                onChange={(e) => setAreaSqFt(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Furnishing
              </label>
              <select
                value={furnishing}
                onChange={(e) => setFurnishing(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
              >
                <option value="FURNISHED">Furnished</option>
                <option value="SEMI_FURNISHED">Semi-Furnished</option>
                <option value="UNFURNISHED">Unfurnished</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Public Address Note
            </label>
            <input
              type="text"
              value={addressNote}
              onChange={(e) => setAddressNote(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
            />
          </div>

          {/* Manage Existing Images */}
          {images.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-2">
                Manage Photos & Cover
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-2"
                  >
                    <img
                      src={img.url}
                      alt={`Photo ${idx}`}
                      className="h-28 w-full object-cover rounded"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs">
                      {img.isPrimary ? (
                        <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Cover
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetCover(idx)}
                          className="text-slate-600 hover:text-emerald-600"
                        >
                          Set Cover
                        </button>
                      )}
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          img.moderationStatus === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : img.moderationStatus === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {img.moderationStatus || 'PENDING'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/landlord/properties"
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-emerald-700 transition"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
