'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getRecentlyViewedProperties } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { PropertySummaryDto } from '@rental-peshawar/shared-types';

interface RecentlyViewedSectionProps {
  limit?: number;
}

export default function RecentlyViewedSection({ limit = 6 }: RecentlyViewedSectionProps) {
  const { token } = useAuth();
  const [properties, setProperties] = useState<PropertySummaryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecent() {
      setLoading(true);
      try {
        const sessionId =
          typeof window !== 'undefined'
            ? localStorage.getItem('sessionId') || undefined
            : undefined;
        const res = await getRecentlyViewedProperties(sessionId, limit, token || undefined);
        const list = Array.isArray(res) ? res : res?.items || [];
        setProperties(list);
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }

    loadRecent();
  }, [token, limit]);

  if (loading || properties.length === 0) return null;

  return (
    <section className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-navy-950 text-base flex items-center gap-2">
          Recently Viewed Properties
        </h3>
        <span className="text-xs text-navy-500 font-medium">{properties.length} items</span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {properties.map((prop) => {
          const imageUrl = prop.images?.[0]?.url || '/placeholder-property.jpg';
          const rentFormatted = Number(prop.monthlyRentPkr).toLocaleString('en-PK');

          return (
            <div
              key={prop.id}
              className="w-60 flex-shrink-0 bg-white rounded-m3-md border border-navy-100 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] bg-navy-100">
                  <img src={imageUrl} alt={prop.title} className="w-full h-full object-cover" />
                  <div className="absolute top-1.5 right-1.5 bg-navy-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    {prop.locality?.name || 'Peshawar'}
                  </div>
                </div>

                <div className="p-3 space-y-1">
                  <Link
                    href={`/properties/${prop.slug || prop.id}`}
                    className="block text-xs font-bold text-navy-900 hover:text-peshawar-700 line-clamp-1"
                  >
                    {prop.title}
                  </Link>
                  <div className="text-[11px] text-navy-500">
                    {prop.bedrooms} Bed • {prop.bathrooms} Bath
                  </div>
                </div>
              </div>

              <div className="p-3 pt-0 border-t border-navy-50 flex items-center justify-between mt-2">
                <span className="text-xs font-black text-navy-950">PKR {rentFormatted}</span>
                <Link
                  href={`/properties/${prop.slug || prop.id}`}
                  className="text-[11px] font-bold text-peshawar-700 hover:text-peshawar-800"
                >
                  View →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
