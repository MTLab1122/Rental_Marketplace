'use client';

import React from 'react';
import { PropertyFilterParams } from '../lib/api';
import { LocalityDto, PropertyType } from '@rental-peshawar/shared-types';

interface FilterBarProps {
  filters: PropertyFilterParams;
  localities: LocalityDto[];
  onFilterChange: (updated: Partial<PropertyFilterParams>) => void;
  onReset: () => void;
}

export default function PropertyFilterBar({
  filters,
  localities,
  onFilterChange,
  onReset,
}: FilterBarProps) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-m3-lg border border-navy-100 shadow-sm space-y-4">
      {/* Top Search & Locality Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Keyword Search */}
        <div>
          <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
            Search Keywords
          </label>
          <input
            type="text"
            placeholder="e.g. Near UOP, Phase 4, Studio"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full text-sm px-3 py-2 border border-navy-200 rounded-m3-md focus:outline-none focus:ring-2 focus:ring-peshawar-500"
          />
        </div>

        {/* Locality Dropdown */}
        <div>
          <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
            Locality
          </label>
          <select
            value={filters.localityId || ''}
            onChange={(e) => onFilterChange({ localityId: e.target.value || undefined })}
            className="w-full text-sm px-3 py-2 border border-navy-200 rounded-m3-md focus:outline-none focus:ring-2 focus:ring-peshawar-500 bg-white"
          >
            <option value="">All Peshawar Localities</option>
            {localities.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Property Type Dropdown */}
        <div>
          <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
            Property Type
          </label>
          <select
            value={filters.propertyType || ''}
            onChange={(e) =>
              onFilterChange({ propertyType: (e.target.value as PropertyType) || undefined })
            }
            className="w-full text-sm px-3 py-2 border border-navy-200 rounded-m3-md focus:outline-none focus:ring-2 focus:ring-peshawar-500 bg-white capitalize"
          >
            <option value="">All Property Types</option>
            <option value="HOSTEL_ROOM">Hostel Room</option>
            <option value="SINGLE_ROOM">Single Room</option>
            <option value="SHARED_ROOM">Shared Room</option>
            <option value="STUDIO">Studio Flat</option>
            <option value="APARTMENT">Apartment / Flat</option>
            <option value="HOUSE">Independent House</option>
            <option value="UPPER_PORTION">Upper Portion</option>
            <option value="LOWER_PORTION">Lower Portion</option>
          </select>
        </div>

        {/* Sort By Dropdown */}
        <div>
          <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
            Sort Order
          </label>
          <select
            value={filters.sortBy || 'NEWEST'}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
            className="w-full text-sm px-3 py-2 border border-navy-200 rounded-m3-md focus:outline-none focus:ring-2 focus:ring-peshawar-500 bg-white"
          >
            <option value="NEWEST">Newest Listings First</option>
            <option value="PRICE_ASC">Lowest Rent (PKR)</option>
            <option value="PRICE_DESC">Highest Rent (PKR)</option>
            <option value="POPULARITY">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Secondary Quick Filters: Rent Range, Bedrooms, Furnishing */}
      <div className="pt-3 border-t border-navy-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Rent Min-Max Inputs */}
          <div className="flex items-center gap-1.5 text-xs text-navy-700">
            <span className="font-bold">Rent (PKR):</span>
            <input
              type="number"
              placeholder="Min"
              value={filters.minRent || ''}
              onChange={(e) =>
                onFilterChange({ minRent: e.target.value ? Number(e.target.value) : undefined })
              }
              className="w-20 text-xs px-2 py-1.5 border border-navy-200 rounded-m3-sm focus:outline-none focus:ring-1 focus:ring-peshawar-500"
            />
            <span>–</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxRent || ''}
              onChange={(e) =>
                onFilterChange({ maxRent: e.target.value ? Number(e.target.value) : undefined })
              }
              className="w-20 text-xs px-2 py-1.5 border border-navy-200 rounded-m3-sm focus:outline-none focus:ring-1 focus:ring-peshawar-500"
            />
          </div>

          {/* Bedrooms Pills */}
          <div className="flex items-center gap-1.5 text-xs text-navy-700">
            <span className="font-bold">Bedrooms:</span>
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() =>
                  onFilterChange({
                    minBedrooms: filters.minBedrooms === num ? undefined : num,
                  })
                }
                className={`px-2.5 py-1 rounded-m3-sm font-semibold transition ${
                  filters.minBedrooms === num
                    ? 'bg-peshawar-600 text-white shadow-sm'
                    : 'bg-navy-50 text-navy-700 hover:bg-navy-100'
                }`}
              >
                {num === 4 ? '4+' : num}
              </button>
            ))}
          </div>

          {/* Furnishing Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-navy-700">
            <span className="font-bold">Furnishing:</span>
            <select
              value={filters.furnishing || ''}
              onChange={(e) => onFilterChange({ furnishing: e.target.value || undefined })}
              className="text-xs px-2 py-1.5 border border-navy-200 rounded-m3-sm bg-white"
            >
              <option value="">Any</option>
              <option value="FURNISHED">Furnished</option>
              <option value="SEMI_FURNISHED">Semi-Furnished</option>
              <option value="UNFURNISHED">Unfurnished</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline px-2 py-1"
        >
          Reset All Filters
        </button>
      </div>
    </div>
  );
}
