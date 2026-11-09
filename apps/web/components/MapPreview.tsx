'use client';

import React from 'react';
import { LocalityDto } from '@rental-peshawar/shared-types';

interface MapPreviewProps {
  localities: LocalityDto[];
  selectedLocalityId?: string;
  onLocalitySelect?: (localityId: string) => void;
}

export default function MapPreview({
  localities,
  selectedLocalityId,
  onLocalitySelect,
}: MapPreviewProps) {
  return (
    <div className="bg-white rounded-m3-lg border border-navy-100 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-navy-900 text-sm flex items-center gap-1.5">
          <span>📍</span> Peshawar Municipal Locality Map
        </h3>
        <span className="text-[11px] font-mono text-navy-400 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
          Geo-Fenced: Peshawar, KP
        </span>
      </div>

      {/* Stylized Peshawar Locality Map Grid */}
      <div className="relative w-full h-64 bg-slate-100 rounded-m3-md border border-navy-200 overflow-hidden flex flex-col justify-between p-3">
        {/* Background Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(#059669 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* Top boundary indicator */}
        <div className="relative z-10 flex justify-between text-[10px] font-mono text-navy-500">
          <span>Northern Ring Rd (34.15°N)</span>
          <span>Warsak Enclave</span>
        </div>

        {/* Locality Nodes inside map */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-2 my-auto">
          {localities.slice(0, 9).map((loc) => {
            const isSelected = selectedLocalityId === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => onLocalitySelect?.(loc.id)}
                className={`p-2 rounded-m3-sm text-left transition border ${
                  isSelected
                    ? 'bg-peshawar-600 text-white border-peshawar-700 shadow-md scale-105'
                    : 'bg-white/90 text-navy-800 border-navy-200 hover:border-peshawar-400 hover:bg-white shadow-xs'
                }`}
              >
                <div className="text-xs font-bold truncate">{loc.name}</div>
                <div
                  className={`text-[10px] truncate ${
                    isSelected ? 'text-peshawar-100' : 'text-navy-400'
                  }`}
                >
                  {loc.propertyCount !== undefined
                    ? `${loc.propertyCount} listings`
                    : 'Verified Sector'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom boundary indicator */}
        <div className="relative z-10 flex justify-between text-[10px] font-mono text-navy-500">
          <span>Hayatabad South (33.90°N)</span>
          <span>GT Road & Chamkani (71.70°E)</span>
        </div>
      </div>
    </div>
  );
}
