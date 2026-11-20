'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSimilarProperties, recordPropertyImpression, recordPropertyClick } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { RecommendationItemDto } from '@rental-peshawar/shared-types';

interface SimilarPropertiesCarouselProps {
  propertyId: string;
  limit?: number;
}

export default function SimilarPropertiesCarousel({
  propertyId,
  limit = 6,
}: SimilarPropertiesCarouselProps) {
  const { token } = useAuth();
  const [items, setItems] = useState<RecommendationItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSimilar() {
      if (!propertyId) return;
      setLoading(true);
      try {
        const res = await getSimilarProperties(propertyId, limit, token || undefined);
        const data = Array.isArray(res) ? res : res?.items || [];
        setItems(data);

        // Record impressions
        data.forEach((item: RecommendationItemDto, idx: number) => {
          recordPropertyImpression(
            {
              propertyId: item.property.id,
              surface: 'SIMILAR_CAROUSEL',
              position: idx + 1,
              metadata: { basePropertyId: propertyId },
            },
            token || undefined,
          ).catch(() => {});
        });
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }

    loadSimilar();
  }, [propertyId, limit, token]);

  if (loading) {
    return (
      <div className="py-6 space-y-3">
        <div className="h-5 bg-navy-100 rounded w-40 animate-pulse" />
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="w-64 h-48 bg-navy-50 rounded-m3-md border border-navy-100 animate-pulse flex-shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-navy-950 text-base flex items-center gap-2">
          Similar Properties You Might Like
        </h3>
        <span className="text-xs text-navy-500 font-medium">Scroll to explore</span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {items.map((item, idx) => {
          const prop = item.property;
          const imageUrl = prop.images?.[0]?.url || '/placeholder-property.jpg';
          const rentFormatted = Number(prop.monthlyRentPkr).toLocaleString('en-PK');

          return (
            <div
              key={prop.id}
              className="w-64 flex-shrink-0 bg-white rounded-m3-md border border-navy-100 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] bg-navy-100">
                  <img src={imageUrl} alt={prop.title} className="w-full h-full object-cover" />
                  <div className="absolute top-1.5 left-1.5 bg-navy-950/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    {item.reasonLabel}
                  </div>
                </div>

                <div className="p-3 space-y-1.5">
                  <div className="text-[11px] text-navy-500 font-medium">
                    {prop.locality?.name || 'Peshawar'}
                  </div>

                  <Link
                    href={`/properties/${prop.slug || prop.id}`}
                    onClick={() => {
                      recordPropertyClick(
                        {
                          propertyId: prop.id,
                          surface: 'SIMILAR_CAROUSEL',
                          position: idx + 1,
                          metadata: { basePropertyId: propertyId },
                        },
                        token || undefined,
                      ).catch(() => {});
                    }}
                    className="block text-xs font-bold text-navy-900 hover:text-peshawar-700 line-clamp-1"
                  >
                    {prop.title}
                  </Link>

                  <div className="text-[11px] text-navy-600">
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
    </div>
  );
}
