'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { getFavorites } from '../../lib/api';
import PropertyCard from '../../components/PropertyCard';
import EmptyState from '../../components/EmptyState';
import { PropertyGridSkeleton } from '../../components/SkeletonLoader';
import { PropertySummaryDto } from '@rental-peshawar/shared-types';

export default function FavoritesPage() {
  const { token, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<PropertySummaryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFavorites() {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getFavorites(token);
        const properties = data.map((item) => item.property).filter(Boolean);
        setFavorites(properties as PropertySummaryDto[]);
      } catch (err) {
        console.error('Failed to load favorites', err);
      } finally {
        setLoading(false);
      }
    }

    loadFavorites();
  }, [token]);

  const handleFavoriteToggle = (propertyId: string, isFavorited: boolean) => {
    if (!isFavorited) {
      // Optimistically remove from list
      setFavorites((prev) => prev.filter((p) => p.id !== propertyId));
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon=""
          title="Sign in to View Saved Properties"
          description="Log in with your tenant account to access your saved Peshawar rental accommodations."
          actionText="Sign In"
          actionHref="/login"
        />
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-navy-100 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
            Saved Properties
          </h1>
          <p className="text-xs sm:text-sm text-navy-500 mt-1">
            Your saved shortlist of verified Peshawar accommodations.
          </p>
        </div>
        <Link href="/properties" className="text-xs font-bold text-peshawar-600 hover:underline">
          Discover More →
        </Link>
      </div>

      {loading ? (
        <PropertyGridSkeleton count={3} />
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              isFavoritedInitially={true}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="heart"
          title="No Saved Properties Yet"
          description="Click the heart icon on any Peshawar property card to save it for quick review and comparison."
          actionText="Browse Properties"
          actionHref="/properties"
        />
      )}
    </main>
  );
}
