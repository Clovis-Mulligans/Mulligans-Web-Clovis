'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchListings } from '@mulligans/api-client';
import type { ListingWithSeller } from '@mulligans/api-client';
import { ListingCard } from '@/components/ListingCard';
import { CardSkeletonGrid } from '@/components/LoadingSkeleton';
import { FilterSidebar } from '@/components/FilterSidebar';
import { ChipFitterBanner } from '@/components/ChipFitterBanner';

// ─── v2.0 Design Tokens ──────────────────────────────────────

const TEXT_PRIMARY = '#06070A';
const TEXT_BODY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';
const BORDER = '#E5E7EB';
const BRAND_GREEN = '#1DC690';
const DARK_BLUE = '#1C4670';

// ─── Types ───────────────────────────────────────────────────

export interface ListingResultsProps {
  /** Free text search query — passed through to API as `query` */
  query?: string;
  /** Page title shown above results (e.g. "Search results", "Drivers") */
  title?: string;
  /** Optional breadcrumb prop — supplied by the route, e.g. [{label:'Clubs',href:'/category/clubs'}] */
  breadcrumb?: { label: string; href?: string }[];
  /** Show the category filter pill row in sidebar (default: true on /search, false on /category) */
  showCategoryFilter?: boolean;
  /** Pre-applied category filter (used by /category route) */
  forcedCategory?: string;
  /** Where filter changes route to — '/search' or '/category/{slug}' etc. */
  basePath: string;
}

// ─── Sort options ────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Most Recent' },
  { value: 'price:asc', label: 'Price: Low to High' },
  { value: 'price:desc', label: 'Price: High to Low' },
  { value: 'views:desc', label: 'Most Popular' },
];

// ─── Helpers ─────────────────────────────────────────────────

/** Numeric filter keys — sent as numbers to the API */
const NUMERIC_FILTER_KEYS = new Set([
  'minPrice',
  'maxPrice',
  'condition',
  'loft',
  'lieAngle',
  'length',
]);

/** All filter keys that get passed through to the API */
const FILTER_KEYS = [
  'category',
  'subcategory',
  'minPrice',
  'maxPrice',
  'condition',
  'brand',
  'gender',
  'dexterity',
  'shaftFlex',
  'shaftMaterial',
  'size',
  'gripSize',
  'setMakeup',
  'loft',
  'lieAngle',
  'length',
  'color',
  'location',
  'waist',
  'gloveSize',
  'headType',
] as const;

/** Build search params object from URLSearchParams */
function buildFilterParams(
  searchParams: URLSearchParams,
  forcedCategory?: string
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  if (forcedCategory) out.category = forcedCategory;

  for (const k of FILTER_KEYS) {
    if (k === 'category' && forcedCategory) continue;
    const v = searchParams.get(k);
    if (v) out[k] = v;
  }
  return out;
}

/** Convert filter params into the typed shape the API client expects */
function toApiParams(filters: Record<string, string | undefined>, query: string | undefined, sortBy: string, sortOrder: 'asc' | 'desc', page: number, limit: number) {
  const apiParams: Record<string, any> = {
    sortBy,
    sortOrder,
    page,
    limit,
  };
  if (query) apiParams.query = query;

  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === '') continue;
    if (NUMERIC_FILTER_KEYS.has(k)) {
      const num = Number(v);
      if (!isNaN(num)) apiParams[k] = num;
    } else {
      apiParams[k] = v;
    }
  }
  return apiParams;
}

// ─── Component ───────────────────────────────────────────────

export function ListingResults({
  query,
  title,
  breadcrumb,
  showCategoryFilter = true,
  forcedCategory,
  basePath,
}: ListingResultsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

  const filters = buildFilterParams(searchParams, forcedCategory);
  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== 'category' && v
  ).length;

  // Fetch listings
  const fetchListings = useCallback(
    async (pageNum: number, append = false) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      try {
        const apiParams = toApiParams(filters, query, sortBy, sortOrder, pageNum, 24);
        const res = await searchListings(apiParams);
        const fetched = res.listings || [];
        setListings(append ? (prev) => [...prev, ...fetched] : fetched);
        const t = res.pagination?.total ?? (res as any).total ?? 0;
        const pages = res.pagination?.pages ?? (res as any).totalPages ?? 0;
        setTotal(t);
        setHasMore(pageNum < pages);
      } catch (err) {
        console.error('Search error:', err);
        if (!append) {
          setListings([]);
          setTotal(0);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, sortBy, sortOrder, JSON.stringify(filters)]
  );

  // Refetch on dependency change
  useEffect(() => {
    setPage(1);
    fetchListings(1);
  }, [fetchListings]);

  // ─── Handlers ─────────────────────────────────────────────

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchListings(next, true);
  };

  const handleFilterChange = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page'); // reset page on filter change
    router.push(`${basePath}?${next.toString()}`);
  };

  const handleClearAll = () => {
    // Preserve only the query if one was set
    const next = new URLSearchParams();
    if (query) next.set('q', query);
    router.push(next.toString() ? `${basePath}?${next.toString()}` : basePath);
  };

  const handleSortChange = (newSort: string) => {
    const [by, order] = newSort.split(':');
    const next = new URLSearchParams(searchParams.toString());
    next.set('sortBy', by);
    next.set('sortOrder', order);
    router.push(`${basePath}?${next.toString()}`);
  };

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-12" style={{ maxWidth: 1600, margin: '0 auto' }}>
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav
          className="flex items-center gap-1.5 py-3 flex-wrap"
          aria-label="Breadcrumb"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: TEXT_BODY }}
        >
          <a
            href="/"
            style={{ color: TEXT_BODY, fontWeight: 500 }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = TEXT_PRIMARY;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = TEXT_BODY;
            }}
          >
            Home
          </a>
          {breadcrumb.map((item, i) => (
            <React.Fragment key={i}>
              <span style={{ color: TEXT_MUTED }}>›</span>
              {item.href ? (
                <a
                  href={item.href}
                  style={{ color: TEXT_BODY, fontWeight: 500 }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = TEXT_PRIMARY;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = TEXT_BODY;
                  }}
                >
                  {item.label}
                </a>
              ) : (
                <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Page title + total */}
      {title && (
        <div className="mb-4 flex items-baseline gap-3 flex-wrap">
          <h1
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)',
              color: TEXT_PRIMARY,
              letterSpacing: '-0.015em',
            }}
          >
            {title}
          </h1>
          {!loading && (
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                fontSize: '0.95rem',
                color: TEXT_BODY,
              }}
            >
              ({total.toLocaleString()} {total === 1 ? 'result' : 'results'})
            </span>
          )}
        </div>
      )}

      {/* Chip fitter banner — shown above results, hides if user is in a non-clubs category */}
      {(!filters.category || filters.category === 'Clubs') && (
        <div className="mb-5">
          <ChipFitterBanner />
        </div>
      )}

      {/* Main two-column layout */}
      <div className="flex gap-6">
        {/* Sidebar (desktop only) */}
        <div
          className="hidden lg:block flex-shrink-0 sticky self-start"
          style={{
            width: 260,
            top: 128,
            maxHeight: 'calc(100vh - 144px)',
            overflowY: 'auto',
            paddingRight: 4,
            scrollbarWidth: 'thin',
          }}
        >
          <FilterSidebar
            params={filters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
            showCategoryFilter={showCategoryFilter}
          />
        </div>

        {/* Main column */}
        <div className="flex-1 min-w-0">
          {/* Toolbar — sort + mobile filters button */}
          <div
            className="flex items-center justify-between mb-4 gap-3"
            style={{ paddingTop: 2 }}
          >
            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-1.5 rounded-lg transition-colors"
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '0.85rem',
                padding: '8px 14px',
                border: `1px solid ${BORDER}`,
                color: TEXT_PRIMARY,
                backgroundColor: '#FFFFFF',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="14" y2="18" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span
                  className="flex items-center justify-center rounded-full text-white"
                  style={{
                    backgroundColor: BRAND_GREEN,
                    width: 20,
                    height: 20,
                    fontWeight: 700,
                    fontSize: '0.72rem',
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
            <div className="hidden lg:block flex-1" />
            <div className="flex items-center gap-2">
              <label
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.82rem',
                  color: TEXT_BODY,
                  fontWeight: 500,
                }}
                className="hidden sm:inline"
              >
                Sort:
              </label>
              <select
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => handleSortChange(e.target.value)}
                className="rounded-lg text-sm cursor-pointer"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  border: `1px solid ${BORDER}`,
                  padding: '8px 12px',
                  paddingRight: 32,
                  color: TEXT_PRIMARY,
                  backgroundColor: '#FFFFFF',
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <CardSkeletonGrid count={12} />
          ) : listings.length === 0 ? (
            <EmptyState query={query} forcedCategory={forcedCategory} onClearAll={handleClearAll} />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="rounded-[10px] transition-opacity"
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      padding: '12px 28px',
                      border: `1.5px solid ${DARK_BLUE}`,
                      color: DARK_BLUE,
                      backgroundColor: '#FFFFFF',
                      opacity: loadingMore ? 0.5 : 1,
                      cursor: loadingMore ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loadingMore ? 'Loading...' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0"
            style={{ backgroundColor: 'rgba(6,7,10,0.5)' }}
            onClick={() => setShowMobileFilters(false)}
          />
          <div
            className="fixed right-0 top-0 bottom-0 bg-white overflow-y-auto"
            style={{
              width: 320,
              padding: '20px 22px',
              boxShadow: '-8px 0 32px rgba(6,7,10,0.15)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: TEXT_PRIMARY,
                }}
              >
                Filters
              </h3>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                aria-label="Close"
                style={{ color: TEXT_MUTED, padding: 4 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <FilterSidebar
              params={filters}
              onFilterChange={handleFilterChange}
              onClearAll={handleClearAll}
              showCategoryFilter={showCategoryFilter}
            />
            <button
              type="button"
              onClick={() => setShowMobileFilters(false)}
              className="mt-6 w-full rounded-[10px]"
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: '0.92rem',
                padding: '12px',
                backgroundColor: BRAND_GREEN,
                color: '#FFFFFF',
                letterSpacing: '0.01em',
              }}
            >
              View {total.toLocaleString()} {total === 1 ? 'result' : 'results'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────

function EmptyState({
  query,
  forcedCategory,
  onClearAll,
}: {
  query?: string;
  forcedCategory?: string;
  onClearAll: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="flex items-center justify-center rounded-full mb-4"
        style={{
          width: 56,
          height: 56,
          backgroundColor: '#FAFAF8',
          border: `1px solid ${BORDER}`,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={TEXT_MUTED}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: '1.05rem',
          color: TEXT_PRIMARY,
          letterSpacing: '-0.005em',
        }}
      >
        {query ? `No matches for "${query}"` : 'No listings match your filters'}
      </p>
      <p
        className="mt-2"
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 500,
          fontSize: '0.88rem',
          color: TEXT_BODY,
          maxWidth: 380,
        }}
      >
        {query
          ? 'Try a broader search or adjust your filters to see more.'
          : 'Try removing some filters or browsing a different category.'}
      </p>
      <button
        type="button"
        onClick={onClearAll}
        className="mt-5 rounded-[10px]"
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: '0.85rem',
          padding: '10px 22px',
          backgroundColor: BRAND_GREEN,
          color: '#FFFFFF',
          letterSpacing: '0.01em',
        }}
      >
        Clear all filters
      </button>
    </div>
  );
}
