'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTrendingProperties, recordPropertyImpression, recordPropertyClick } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { RecommendationItemDto } from '@rental-peshawar/shared-types';

interface TrendingSectionProps {
  limit?: number;
}

export default function TrendingSection({ limit = 4 }: TrendingSectionProps) {
  const { token, user } = useAuth();
  const [trending, setTrending] = useState<RecommendationItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrending() {
      setLoading(true);
      try {
        const query: Record<string, any> = { limit };
        if (user?.tenantType) query['tenantType'] = user.tenantType;

        const res = await getTrendingProperties(query, token || undefined);
        const items = Array.isArray(res) ? res : res?.items || [];
        setTrending(items);

        items.forEach((item: RecommendationItemDto, idx: number) => {
          recordPropertyImpression(
            {
              propertyId: item.property.id,
              surface: 'HOME_TRENDING',
              position: idx + 1,
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

    loadTrending();
  }, [token, user?.tenantType, limit]);

  if (loading || trending.length === 0) return null;

  return (
    <section className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-navy-950 flex items-center gap-2">
            <span></span> Trending in Peshawar
          </h2>
          <p className="text-xs text-navy-500">
            Listings with the highest tenant interest, inquiries, and view velocity.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {trending.map((item, idx) => {
          const prop = item.property;
          const imageUrl = prop.images?.[0]?.url || '/placeholder-property.jpg';
          const rentFormatted = Number(prop.monthlyRentPkr).toLocaleString('en-PK');

          return (
            <div
              key={prop.id}
              className="bg-white rounded-m3-md border border-navy-100 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] bg-navy-100">
                  <img src={imageUrl} alt={prop.title} className="w-full h-full object-cover" />
                  <div className="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                    HOT
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 bg-navy-950/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    {prop.locality?.name || 'Peshawar'}
                  </div>
                </div>

                <div className="p-3 space-y-1.5">
                  <Link
                    href={`/properties/${prop.slug || prop.id}`}
                    onClick={() => {
                      recordPropertyClick(
                        {
                          propertyId: prop.id,
                          surface: 'HOME_TRENDING',
                          position: idx + 1,
                        },
                        token || undefined,
                      ).catch(() => {});
                    }}
                    className="block text-xs font-bold text-navy-900 hover:text-peshawar-700 line-clamp-1"
                  >
                    {prop.title}
                  </Link>

                  <div className="text-[11px] text-navy-600">
                    {prop.bedrooms} Bed • {prop.bathrooms} Bath • {prop.propertyType}
                  </div>
                </div>
              </div>

              <div className="p-3 pt-0 border-t border-navy-50 flex items-center justify-between mt-2">
                <span className="text-xs font-black text-navy-950">PKR {rentFormatted}/mo</span>
                <Link
                  href={`/properties/${prop.slug || prop.id}`}
                  className="text-[11px] font-bold text-peshawar-700 hover:text-peshawar-800"
                >
                  View Details →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
