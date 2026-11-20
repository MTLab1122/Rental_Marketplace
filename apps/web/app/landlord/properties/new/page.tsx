'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getLocalities,
  getAmenities,
  createLandlordProperty,
  checkDuplicateListing,
  updateLandlordPropertyStatus,
} from '../../../../lib/api';

const PESHAWAR_BOUNDS = {
  minLat: 33.9,
  maxLat: 34.15,
  minLng: 71.4,
  maxLng: 71.7,
};

export default function CreatePropertyWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reference data
  const [localities, setLocalities] = useState<any[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    eligibility: 'STUDENTS_ONLY',
    propertyType: 'SINGLE_ROOM',
    localityId: '',
    latitude: 33.9982,
    longitude: 71.4883,
    address: '',
    addressNote: '',
    monthlyRentPkr: 20000,
    securityDepositPkr: 40000,
    availableFromDate: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    bedrooms: 1,
    bathrooms: 1,
    areaSqFt: 450,
    furnishing: 'FURNISHED',
    amenityIds: [] as string[],
    images: [] as { url: string; caption?: string; isPrimary: boolean; sortOrder: number }[],
    allowDuplicateBypass: false,
  });

  // Duplicate Warning State
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [locs, ams] = await Promise.all([
          getLocalities().catch(() => []),
          getAmenities().catch(() => []),
        ]);
        setLocalities(locs || []);
        setAmenitiesList(ams || []);
        if (locs && locs.length > 0 && locs[0]) {
          const firstLoc = locs[0];
          setFormData((prev) => ({
            ...prev,
            localityId: firstLoc.id,
            latitude: Number(firstLoc.latitude) || 33.9982,
            longitude: Number(firstLoc.longitude) || 71.4883,
          }));
        }
      } catch (e: any) {
        console.error(e);
      }
    }
    loadMetadata();
  }, []);

  // Update property type when eligibility switches
  function handleEligibilityChange(eligibility: string) {
    const defaultType = eligibility === 'STUDENTS_ONLY' ? 'SINGLE_ROOM' : 'APARTMENT';
    setFormData((prev) => ({ ...prev, eligibility, propertyType: defaultType }));
  }

  // Locality selection syncs coordinates
  function handleLocalityChange(localityId: string) {
    const loc = localities.find((l) => l.id === localityId);
    setFormData((prev) => ({
      ...prev,
      localityId,
      latitude: loc ? Number(loc.latitude) : prev.latitude,
      longitude: loc ? Number(loc.longitude) : prev.longitude,
    }));
  }

  // Coordinate boundary check
  function isWithinPeshawar(lat: number, lng: number): boolean {
    return (
      lat >= PESHAWAR_BOUNDS.minLat &&
      lat <= PESHAWAR_BOUNDS.maxLat &&
      lng >= PESHAWAR_BOUNDS.minLng &&
      lng <= PESHAWAR_BOUNDS.maxLng
    );
  }

  // Toggle amenities
  function toggleAmenity(id: string) {
    setFormData((prev) => {
      const exists = prev.amenityIds.includes(id);
      return {
        ...prev,
        amenityIds: exists
          ? prev.amenityIds.filter((item) => item !== id)
          : [...prev.amenityIds, id],
      };
    });
  }

  // Image upload simulation / URL input
  function addImageUrl(url: string) {
    if (!url.trim()) return;
    if (formData.images.length >= 12) {
      alert('Maximum 12 images allowed per property.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        {
          url: url.trim(),
          caption: `Photo ${prev.images.length + 1}`,
          isPrimary: prev.images.length === 0,
          sortOrder: prev.images.length,
        },
      ],
    }));
  }

  function removeImage(index: number) {
    setFormData((prev) => {
      const updated = prev.images.filter((_, i) => i !== index);
      // Ensure there is a primary image
      if (updated.length > 0 && !updated.some((img) => img.isPrimary) && updated[0]) {
        updated[0].isPrimary = true;
      }
      return { ...prev, images: updated };
    });
  }

  function setCoverImage(index: number) {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      })),
    }));
  }

  // Step Validation
  function validateCurrentStep(): boolean {
    setError(null);
    if (step === 3) {
      if (!formData.localityId) {
        setError('Please select an active Peshawar locality.');
        return false;
      }
      if (!isWithinPeshawar(formData.latitude, formData.longitude)) {
        setError(
          `Coordinates (${formData.latitude}, ${formData.longitude}) are outside the approved Peshawar boundary. Must be between Lat [33.90, 34.15] and Lng [71.40, 71.70].`,
        );
        return false;
      }
      if (!formData.address.trim()) {
        setError('Please enter a street address.');
        return false;
      }
    }

    if (step === 4) {
      if (formData.monthlyRentPkr < 500) {
        setError('Monthly rent must be at least PKR 500.');
        return false;
      }
    }

    if (step === 5) {
      if (formData.title.trim().length < 5) {
        setError('Title must be at least 5 characters long.');
        return false;
      }
      if (formData.description.trim().length < 20) {
        setError('Description must be at least 20 characters long.');
        return false;
      }
    }

    if (step === 6) {
      if (formData.images.length === 0) {
        setError('At least 1 image is required to submit a property for review.');
        return false;
      }
    }

    return true;
  }

  async function handleNext() {
    if (!validateCurrentStep()) return;

    // Run duplicate check before Step 7 review
    if (step === 6) {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const res = await checkDuplicateListing(
            {
              localityId: formData.localityId,
              propertyType: formData.propertyType,
              monthlyRentPkr: formData.monthlyRentPkr,
              latitude: formData.latitude,
              longitude: formData.longitude,
              title: formData.title,
            },
            token,
          );
          if (res?.isDuplicate) {
            setDuplicateWarning(res.warningMessage || 'Potential near-duplicate listing detected.');
          } else {
            setDuplicateWarning(null);
          }
        }
      } catch (e: any) {
        console.error(e);
      }
    }

    setStep((prev) => Math.min(prev + 1, 7));
  }

  async function handleSubmit() {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication required. Please log in.');
        return;
      }

      // Create property
      const created = await createLandlordProperty(
        {
          ...formData,
          monthlyRentPkr: Number(formData.monthlyRentPkr),
          securityDepositPkr: Number(formData.securityDepositPkr),
          bedrooms: Number(formData.bedrooms),
          bathrooms: Number(formData.bathrooms),
          areaSqFt: Number(formData.areaSqFt),
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
        },
        token,
      );

      // Submit for admin review immediately
      try {
        await updateLandlordPropertyStatus(created.id, 'PENDING_REVIEW', token);
      } catch (submitErr: any) {
        console.warn('Auto-submit review note:', submitErr.message);
      }

      alert('Property created and submitted for review successfully!');
      router.push('/landlord/properties');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit property listing');
    } finally {
      setLoading(false);
    }
  }

  const isSubmitDisabled = Boolean(loading || (duplicateWarning && !formData.allowDuplicateBypass));

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/landlord/properties"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            ← Cancel & Back to Listings
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Step {step} of 7
          </span>
        </div>

        {/* Wizard Progress Bar */}
        <div className="mb-8 overflow-hidden rounded-md bg-slate-200">
          <div
            className="h-2.5 bg-emerald-600 transition-all duration-300"
            style={{ width: `${(step / 7) * 100}%` }}
          ></div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* STEP 1: ELIGIBILITY */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Step 1: Choose Renter Eligibility
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Peshawar rental marketplace strictly isolates student listings from family listings
                to protect privacy and tenant preference.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => handleEligibilityChange('STUDENTS_ONLY')}
                  className={`cursor-pointer rounded-xl border-2 p-6 transition ${
                    formData.eligibility === 'STUDENTS_ONLY'
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-3xl"></div>
                  <h3 className="mt-3 font-bold text-slate-900 text-lg">Students Only</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Hostels, shared rooms, single rooms, or portions near University of Peshawar,
                    UET, Islamia College, etc.
                  </p>
                </div>

                <div
                  onClick={() => handleEligibilityChange('FAMILIES_ONLY')}
                  className={`cursor-pointer rounded-xl border-2 p-6 transition ${
                    formData.eligibility === 'FAMILIES_ONLY'
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-3xl"></div>
                  <h3 className="mt-3 font-bold text-slate-900 text-lg">Families Only</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Independent houses, portions, family apartments, and residential units in
                    Hayatabad, Regi Model Town, etc.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PROPERTY TYPE */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-black text-slate-900">Step 2: Choose Property Type</h2>
              <p className="mt-1 text-sm text-slate-600">
                Options matching{' '}
                {formData.eligibility === 'STUDENTS_ONLY' ? 'Students Only' : 'Families Only'}{' '}
                eligibility:
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(formData.eligibility === 'STUDENTS_ONLY'
                  ? ['SINGLE_ROOM', 'SHARED_ROOM', 'HOSTEL', 'PORTION', 'APARTMENT']
                  : ['HOUSE', 'PORTION', 'APARTMENT', 'RESIDENTIAL_UNIT']
                ).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, propertyType: type })}
                    className={`rounded-xl border p-4 text-left font-bold transition ${
                      formData.propertyType === type
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: LOCATION & GEOGRAPHY */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-black text-slate-900">Step 3: Location in Peshawar</h2>
              <p className="mt-1 text-sm text-slate-600">
                All properties must fall inside the approved Peshawar municipal service boundary.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Peshawar Locality *
                  </label>
                  <select
                    value={formData.localityId}
                    onChange={(e) => handleLocalityChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-medium text-slate-800"
                  >
                    {localities.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.postalCode || 'Peshawar'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Latitude (33.90 to 34.15) *
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.latitude}
                      onChange={(e) =>
                        setFormData({ ...formData, latitude: parseFloat(e.target.value) })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Longitude (71.40 to 71.70) *
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.longitude}
                      onChange={(e) =>
                        setFormData({ ...formData, longitude: parseFloat(e.target.value) })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Street 4, Sector B, University Town"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Public Address Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Near Islamia College Gate 2"
                    value={formData.addressNote}
                    onChange={(e) => setFormData({ ...formData, addressNote: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Visible to verified searchers without leaking exact private house number.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PRICING & AVAILABILITY */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Step 4: Pricing and Availability
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Specify rent in PKR and available move-in date.
              </p>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Monthly Rent (PKR) *
                    </label>
                    <input
                      type="number"
                      min="500"
                      step="500"
                      value={formData.monthlyRentPkr}
                      onChange={(e) =>
                        setFormData({ ...formData, monthlyRentPkr: parseInt(e.target.value) || 0 })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Security Deposit (PKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={formData.securityDepositPkr}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          securityDepositPkr: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Available From Date
                  </label>
                  <input
                    type="date"
                    value={formData.availableFromDate}
                    onChange={(e) =>
                      setFormData({ ...formData, availableFromDate: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: PROPERTY DETAILS & AMENITIES */}
          {step === 5 && (
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Step 5: Property Details & Amenities
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Detailed titles and descriptions achieve higher listing quality scores.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Listing Title * (min 20 chars for top quality score)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Spacious 2 Bed Furnished Portion in Hayatabad Phase 3"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Detailed Description * (min 100 chars for top quality score)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe rooms, nearby university or commercial facilities, water supply, generator backup, security guards, etc."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={formData.bedrooms}
                      onChange={(e) =>
                        setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })
                      }
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
                      max="30"
                      value={formData.bathrooms}
                      onChange={(e) =>
                        setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 0 })
                      }
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
                      value={formData.areaSqFt}
                      onChange={(e) =>
                        setFormData({ ...formData, areaSqFt: parseInt(e.target.value) || 0 })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Furnishing
                    </label>
                    <select
                      value={formData.furnishing}
                      onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                    >
                      <option value="FURNISHED">Furnished</option>
                      <option value="SEMI_FURNISHED">Semi-Furnished</option>
                      <option value="UNFURNISHED">Unfurnished</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-2">
                    Available Amenities (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {amenitiesList.map((am) => (
                      <button
                        key={am.id}
                        type="button"
                        onClick={() => toggleAmenity(am.id)}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                          formData.amenityIds.includes(am.id)
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {am.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: IMAGE MANAGER */}
          {step === 6 && (
            <div>
              <h2 className="text-2xl font-black text-slate-900">Step 6: Listing Images</h2>
              <p className="mt-1 text-sm text-slate-600">
                Upload up to 12 clear property images. Set the primary cover photo for search feeds.
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex gap-2">
                  <input
                    type="url"
                    id="newImgUrl"
                    placeholder="Enter image URL (e.g. https://images.unsplash.com/...)"
                    className="flex-1 rounded-lg border border-slate-300 p-2.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('newImgUrl') as HTMLInputElement;
                      if (input && input.value) {
                        addImageUrl(input.value);
                        input.value = '';
                      }
                    }}
                    className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                  >
                    + Add Image
                  </button>
                </div>

                {formData.images.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                    No images added yet. Minimum 1 photo required for review.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {formData.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2"
                      >
                        <img
                          src={img.url}
                          alt={`Preview ${idx}`}
                          className="h-32 w-full object-cover rounded-lg"
                        />
                        <div className="mt-2 flex items-center justify-between text-xs">
                          {img.isPrimary ? (
                            <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              Cover Photo
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setCoverImage(idx)}
                              className="text-slate-600 hover:text-emerald-600"
                            >
                              Make Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 7: REVIEW & SUBMIT */}
          {step === 7 && (
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Step 7: Review & Final Submission
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Please verify listing accuracy before submitting for admin moderation review.
              </p>

              {duplicateWarning && (
                <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-xl"></span>
                    <div>
                      <h4 className="font-bold text-amber-900">Near-Duplicate Listing Notice</h4>
                      <p className="mt-1 text-sm text-amber-800">{duplicateWarning}</p>
                      <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-900">
                        <input
                          type="checkbox"
                          checked={formData.allowDuplicateBypass}
                          onChange={(e) =>
                            setFormData({ ...formData, allowDuplicateBypass: e.target.checked })
                          }
                          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        I confirm this is an intentional, distinct listing at this location.
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-6 text-sm">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Title:</span>
                  <span className="font-bold text-slate-900">{formData.title}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Eligibility:</span>
                  <span className="font-semibold text-slate-900">
                    {formData.eligibility === 'STUDENTS_ONLY' ? 'Students Only' : 'Families Only'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Property Type:</span>
                  <span className="font-semibold text-slate-900">{formData.propertyType}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Locality:</span>
                  <span className="font-semibold text-slate-900">
                    {localities.find((l) => l.id === formData.localityId)?.name || 'Peshawar'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Rent:</span>
                  <span className="font-bold text-emerald-700">
                    PKR {formData.monthlyRentPkr.toLocaleString()} / month
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Security Deposit:</span>
                  <span className="font-semibold text-slate-900">
                    PKR {formData.securityDepositPkr.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Coordinates:</span>
                  <span className="font-mono text-xs text-slate-700">
                    ({formData.latitude}, {formData.longitude})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Images:</span>
                  <span className="font-bold text-slate-900">{formData.images.length} photos</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => Math.max(prev - 1, 1))}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                ← Back
              </button>
            ) : (
              <div></div>
            )}

            {step < 7 ? (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitDisabled}
                onClick={handleSubmit}
                className={`rounded-lg px-8 py-3 text-sm font-bold text-white shadow transition ${
                  isSubmitDisabled
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {loading ? 'Submitting for Review...' : 'Submit Listing for Review'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
