'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getForYouRecommendations,
  recordPropertyImpression,
  recordPropertyClick,
} from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { RecommendationItemDto } from '@rental-peshawar/shared-types';

interface RecommendationFeedProps {
  title?: string;
  limit?: number;
}

export default function RecommendationFeed({
  title = 'Recommended For You',
  limit = 6,
}: RecommendationFeedProps) {
  const { token, user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeed() {
      setLoading(true);
      try {
        const query: Record<string, any> = { limit };
        if (user?.tenantType) query['tenantType'] = user.tenantType;

        const res = await getForYouRecommendations(query, token || undefined);
        const items = Array.isArray(res) ? res : res?.items || [];
        setRecommendations(items);

        // Record impression events asynchronously
        items.forEach((item: RecommendationItemDto, idx: number) => {
          recordPropertyImpression(
            {
              propertyId: item.property.id,
              surface: 'FOR_YOU',
              position: idx + 1,
              metadata: { score: item.score, reason: item.reason },
            },
            token || undefined,
          ).catch(() => {});
        });
      } catch {
        // Silent fail for recommendations feed
      } finally {
        setLoading(false);
      }
    }

    loadFeed();
  }, [token, user?.tenantType, limit]);

  if (loading) {
    return (
      <div className="py-6 space-y-4">
        <div className="h-6 bg-navy-100 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-64 bg-navy-50 rounded-m3-md border border-navy-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  const handleCardClick = (item: RecommendationItemDto, position: number) => {
    recordPropertyClick(
      {
        propertyId: item.property.id,
        surface: 'FOR_YOU',
        position,
        metadata: { score: item.score, reason: item.reason },
      },
      token || undefined,
    ).catch(() => {});
  };

  return (
    <section className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-navy-950 flex items-center gap-2">{title}</h2>
          <p className="text-xs text-navy-500">
            Personalized matching algorithms based on your searches, favorites, and target budget.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {recommendations.map((item, idx) => {
          const prop = item.property;
          const imageUrl = prop.images?.[0]?.url || '/placeholder-property.jpg';
          const rentFormatted = Number(prop.monthlyRentPkr).toLocaleString('en-PK');

          return (
            <div
              key={prop.id}
              className="bg-white rounded-m3-lg border border-navy-100 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Image & Reason Pill */}
                <div className="relative aspect-[16/10] bg-navy-100 overflow-hidden">
                  <img src={imageUrl} alt={prop.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-navy-950/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/20">
                    {item.reasonLabel}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-peshawar-700 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                    {item.score}% Match
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-navy-500">
                    <span>{prop.locality?.name || 'Peshawar'}</span>
                    <span className="font-semibold text-navy-700">{prop.propertyType}</span>
                  </div>

                  <Link
                    href={`/properties/${prop.slug || prop.id}`}
                    onClick={() => handleCardClick(item, idx + 1)}
                    className="block text-sm font-extrabold text-navy-950 hover:text-peshawar-700 line-clamp-1"
                  >
                    {prop.title}
                  </Link>

                  <div className="text-xs text-navy-600 flex items-center gap-2">
                    <span>{prop.bedrooms} Bed</span>
                    <span>•</span>
                    <span>{prop.bathrooms} Bath</span>
                    {prop.furnishing && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{prop.furnishing}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-navy-50 flex items-center justify-between mt-2">
                <div>
                  <span className="text-base font-black text-navy-950">PKR {rentFormatted}</span>
                  <span className="text-[11px] text-navy-500"> /mo</span>
                </div>
                <Link
                  href={`/properties/${prop.slug || prop.id}`}
                  onClick={() => handleCardClick(item, idx + 1)}
                  className="px-3 py-1.5 bg-peshawar-50 hover:bg-peshawar-100 text-peshawar-700 font-bold text-xs rounded-m3-sm border border-peshawar-200 transition"
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
