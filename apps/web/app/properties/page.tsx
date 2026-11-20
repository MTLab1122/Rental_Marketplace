'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import {
  getProperties,
  getLocalities,
  getFavoriteIds,
  PropertyFilterParams,
  recordSearchQueryEvent,
  searchSemantic,
} from '../../lib/api';
import PropertyCard from '../../components/PropertyCard';
import PropertyFilterBar from '../../components/PropertyFilterBar';
import EmptyState from '../../components/EmptyState';
import { PropertyGridSkeleton } from '../../components/SkeletonLoader';
import SaveSearchModal from '../../components/SaveSearchModal';
import RecommendationFeed from '../../components/RecommendationFeed';
import TrendingSection from '../../components/TrendingSection';
import TrustSafetyBanner from '../../components/TrustSafetyBanner';
import { PropertySummaryDto, LocalityDto, TenantType } from '@rental-peshawar/shared-types';

function PropertiesContent() {
  const searchParams = useSearchParams();
  const { tenantType, token } = useAuth();

  const [localities, setLocalities] = useState<LocalityDto[]>([]);
  const [properties, setProperties] = useState<PropertySummaryDto[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [isAiMode, setIsAiMode] = useState(false);
  const [semanticExplanations, setSemanticExplanations] = useState<Record<string, string>>({});

  // Initialize filters from URL parameters or defaults
  const [filters, setFilters] = useState<PropertyFilterParams>({
    tenantType: (searchParams.get('tenantType') as TenantType) || tenantType,
    localityId: searchParams.get('localityId') || undefined,
    search: searchParams.get('search') || undefined,
    minRent: searchParams.get('minRent') ? Number(searchParams.get('minRent')) : undefined,
    maxRent: searchParams.get('maxRent') ? Number(searchParams.get('maxRent')) : undefined,
    minBedrooms: searchParams.get('minBedrooms')
      ? Number(searchParams.get('minBedrooms'))
      : undefined,
    propertyType: (searchParams.get('propertyType') as any) || undefined,
    furnishing: searchParams.get('furnishing') || undefined,
    sortBy: (searchParams.get('sortBy') as any) || 'NEWEST',
  });

  // Load localities
  useEffect(() => {
    getLocalities().then((data) => setLocalities(data || []));
  }, []);

  // Sync tenantType if changed globally in Navbar
  useEffect(() => {
    if (tenantType) {
      setFilters((prev) => ({ ...prev, tenantType }));
    }
  }, [tenantType]);

  // Fetch properties whenever filters change
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const [res, favs] = await Promise.all([
        getProperties({ ...filters, limit: 12 }, token),
        token ? getFavoriteIds(token).catch(() => []) : Promise.resolve([]),
      ]);

      setProperties(res?.items || []);
      setNextCursor(res?.nextCursor || null);
      setHasMore(res?.hasMore || false);
      setFavoriteIds(favs || []);

      // Log search query event asynchronously
      recordSearchQueryEvent(
        {
          queryText: filters.search,
          filters: filters as any,
          localityId: filters.localityId,
          resultsCount: res?.items?.length || 0,
        },
        token || undefined,
      ).catch(() => {});
    } catch (err) {
      console.error('Failed to fetch properties', err);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleFilterChange = (updated: Partial<PropertyFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setIsAiMode(false);
    setAiQuery('');
    setSemanticExplanations({});
    setFilters({
      tenantType,
      sortBy: 'NEWEST',
    });
  };

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setLoading(true);
    try {
      const eligibility = isStudent ? 'STUDENTS_ONLY' : 'FAMILIES_ONLY';
      const res = await searchSemantic(aiQuery.trim(), {
        eligibility,
        localityId: filters.localityId,
        minPrice: filters.minRent,
        maxPrice: filters.maxRent,
        bedrooms: filters.minBedrooms,
      });
      const results = res?.data?.results || [];
      const props = results.map((r: any) => r.property);
      const explanations: Record<string, string> = {};
      results.forEach((r: any) => {
        if (r.property?.id && r.matchExplanation?.explanationText) {
          explanations[r.property.id] = r.matchExplanation.explanationText;
        }
      });
      setProperties(props);
      setSemanticExplanations(explanations);
      setIsAiMode(true);
    } catch (err) {
      console.error('Semantic search failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAiSearch = () => {
    setIsAiMode(false);
    setAiQuery('');
    setSemanticExplanations({});
    fetchProperties();
  };

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getProperties({ ...filters, cursor: nextCursor, limit: 12 }, token);
      setProperties((prev) => [...prev, ...(res?.items || [])]);
      setNextCursor(res?.nextCursor || null);
      setHasMore(res?.hasMore || false);
    } catch (err) {
      console.error('Failed to load more properties', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const isStudent = filters.tenantType === TenantType.STUDENT;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header with Title and Category Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-navy-100 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
            Discover Verified Rental Properties
          </h1>
          <p className="text-xs sm:text-sm text-navy-500 mt-1">
            Showing properties exclusively verified within Peshawar municipal limits.
          </p>
        </div>

        {/* Current Active Category Pill */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded-m3-sm text-xs font-bold border uppercase tracking-wider ${
              isStudent
                ? 'bg-student-bg text-student-text border-student-border'
                : 'bg-family-bg text-family-text border-family-border'
            }`}
          >
            {isStudent ? 'Students Only Feed' : 'Families Only Feed'}
          </span>
        </div>
      </div>

      {/* Trust & Safety Banner */}
      <TrustSafetyBanner />

      {/* AI Semantic Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-navy-100 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-navy-800">
            <span>AI Semantic Property Search</span>
          </div>
          {isAiMode && (
            <button
              onClick={handleClearAiSearch}
              className="text-xs text-peshawar-600 hover:underline font-semibold"
            >
              Clear AI Search (Back to Standard Feed)
            </button>
          )}
        </div>

        <form onSubmit={handleAiSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search naturally: e.g., '2 bed furnished portion in Hayatabad with backup power and parking'"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <button
            type="submit"
            disabled={loading || !aiQuery.trim()}
            className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>Search with AI</span>
          </button>
        </form>
      </div>

      {/* Filter Component */}
      <PropertyFilterBar
        filters={filters}
        localities={localities}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Results Count & Save Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-navy-600 font-semibold bg-white p-3 rounded-m3-sm border border-navy-100">
        <div className="flex items-center gap-2">
          <span>
            {loading
              ? 'Searching verified listings...'
              : `Found ${properties.length} available listing${properties.length === 1 ? '' : 's'}`}
          </span>
          {filters.localityId && (
            <span className="text-peshawar-700 bg-peshawar-50 px-2.5 py-0.5 rounded-m3-sm border border-peshawar-200">
              Sector Filter Applied
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setSaveModalOpen(true)}
          className="px-3 py-1.5 bg-peshawar-600 hover:bg-peshawar-700 text-white font-bold text-xs rounded-m3-sm transition shadow-2xs flex items-center gap-1.5"
        >
          Save Search & Get Alerts
        </button>
      </div>

      {/* Personalized Recommendation Feed */}
      <RecommendationFeed />

      {/* Listing Cards Grid */}
      {loading ? (
        <PropertyGridSkeleton count={6} />
      ) : properties.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop) => (
              <div key={prop.id} className="flex flex-col">
                <PropertyCard
                  property={prop}
                  isFavoritedInitially={favoriteIds.includes(prop.id)}
                />
                {isAiMode && semanticExplanations[prop.id] && (
                  <div className="mt-1 px-3 py-1.5 bg-sky-50 border border-sky-100 rounded-lg text-[11px] text-sky-800 flex items-center gap-1.5">
                    <span>{semanticExplanations[prop.id]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-m3-md transition shadow-sm disabled:opacity-50"
              >
                {loadingMore ? 'Loading Properties...' : 'Load More Listings'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon=""
          title={`No ${isStudent ? 'Student' : 'Family'} Properties Found`}
          description="We couldn't find any listings matching your specific filter criteria in Peshawar. Try loosening price bounds or selecting all localities."
          actionText="Reset All Filters"
          actionHref="/properties"
        />
      )}

      {/* Trending in Peshawar */}
      <TrendingSection />

      {/* Save Search Modal */}
      <SaveSearchModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        filters={filters as any}
      />
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-8">
          <PropertyGridSkeleton count={6} />
        </div>
      }
    >
      <PropertiesContent />
    </Suspense>
  );
}
