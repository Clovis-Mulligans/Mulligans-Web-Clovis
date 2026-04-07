'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { searchListings, ApiError } from '@mulligans/api-client';
import type { ListingWithSeller } from '@mulligans/api-client';
import { ListingCard } from '@/components/ListingCard';
import { CardSkeletonGrid } from '@/components/LoadingSkeleton';
import { Breadcrumb } from '@/components/Breadcrumb';
import { FilterSidebar } from '@/components/FilterSidebar';
import { CategoryNav } from '@/components/CategoryNav';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const query = searchParams.get('q') || '';
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

  const getFilterParams = useCallback(() => {
    const p: Record<string, string | undefined> = {};
    ['category', 'subcategory', 'minPrice', 'maxPrice', 'condition', 'brand', 'gender', 'dexterity', 'shaftFlex', 'shaftMaterial', 'size'].forEach((k) => {
      const v = searchParams.get(k);
      if (v) p[k] = v;
    });
    return p;
  }, [searchParams]);

  const fetchListings = useCallback(async (pageNum: number, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const filterParams = getFilterParams();
      const res = await searchListings({
        query: query || undefined,
        ...filterParams,
        minPrice: filterParams.minPrice ? Number(filterParams.minPrice) : undefined,
        maxPrice: filterParams.maxPrice ? Number(filterParams.maxPrice) : undefined,
        condition: filterParams.condition ? Number(filterParams.condition) : undefined,
        sortBy, sortOrder,
        page: pageNum, limit: 20,
      });
      const newListings = res.listings || [];
      setListings(append ? (prev) => [...prev, ...newListings] : newListings);
      setTotal(res.total || 0);
setHasMore(pageNum < (res.totalPages || 0));
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query, sortBy, sortOrder, getFilterParams]);

  useEffect(() => {
    setPage(1);
    fetchListings(1);
  }, [fetchListings]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchListings(nextPage, true);
  };

  const handleFilterChange = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    router.push(`/search?${params.toString()}`);
  };

  const handleClearAll = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    router.push(`/search?${params.toString()}`);
  };

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const [by, order] = newSort.split(':');
    params.set('sortBy', by);
    params.set('sortOrder', order);
    router.push(`/search?${params.toString()}`);
  };

  const filterParams = getFilterParams();
  const activeFilterCount = Object.values(filterParams).filter(Boolean).length;
  const breadcrumbs = [{ label: query ? `"${query}"` : 'Search Results' }];

  return (
    <>
      <CategoryNav />
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={breadcrumbs} />

        <div className="flex gap-6">
          {/* Filter sidebar — desktop */}
          <div className="hidden lg:block w-60 flex-shrink-0 sticky top-[128px] self-start max-h-[calc(100vh-144px)] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
            <FilterSidebar params={filterParams} onFilterChange={handleFilterChange} onClearAll={handleClearAll} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 pb-12">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm" style={{ fontFamily: 'var(--font-sans)', color: '#6B6B6B' }}>
                {loading ? 'Searching...' : `${total} result${total !== 1 ? 's' : ''}`}
                {query && !loading && ` for "${query}"`}
              </p>
              <div className="flex items-center gap-2">
                {/* Mobile filter button */}
                <button onClick={() => setShowMobileFilters(true)} className="lg:hidden flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, border: '1px solid #E0E0D8', color: '#0D0D0D' }}>
                  Filters
                  {activeFilterCount > 0 && <span className="flex items-center justify-center rounded-full text-white text-xs" style={{ backgroundColor: '#1DC690', width: '18px', height: '18px', fontWeight: 700 }}>{activeFilterCount}</span>}
                </button>
                <select value={`${sortBy}:${sortOrder}`} onChange={(e) => handleSortChange(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" style={{ fontFamily: 'var(--font-sans)', borderColor: '#E0E0D8', color: '#0D0D0D' }}>
                  <option value="created_at:desc">Most Recent</option>
                  <option value="price:asc">Price: Low to High</option>
                  <option value="price:desc">Price: High to Low</option>
                  <option value="views:desc">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <CardSkeletonGrid count={8} />
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <p className="mt-4 font-semibold text-[#0D0D0D]" style={{ fontFamily: 'var(--font-sans)' }}>No results found</p>
                <p className="mt-1 text-sm text-[#6B6B6B]" style={{ fontFamily: 'var(--font-sans)' }}>Try adjusting your filters or search term</p>
                {activeFilterCount > 0 && (
                  <button onClick={handleClearAll} className="mt-4 rounded-[10px] px-5 py-2 text-sm font-bold text-white" style={{ backgroundColor: '#1DC690', fontFamily: 'var(--font-sans)' }}>Clear Filters</button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4">
                  {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
                </div>
                {hasMore && (
                  <div className="mt-8 text-center">
                    <button onClick={handleLoadMore} disabled={loadingMore} className="rounded-[10px] px-8 py-3 text-sm font-bold transition-colors hover:opacity-90 disabled:opacity-50" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, border: '1.5px solid #1C4670', color: '#1C4670' }}>
                      {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0D0D0D]" style={{ fontFamily: 'var(--font-sans)' }}>Filters</h3>
              <button onClick={() => setShowMobileFilters(false)} aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="1.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <FilterSidebar params={filterParams} onFilterChange={handleFilterChange} onClearAll={handleClearAll} />
            <button onClick={() => setShowMobileFilters(false)} className="mt-6 w-full rounded-[10px] py-3 text-sm font-bold text-white" style={{ backgroundColor: '#1DC690', fontFamily: 'var(--font-sans)', fontWeight: 700 }}>Apply Filters</button>
          </div>
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1280px] px-4 py-8"><CardSkeletonGrid count={8} /></div>}>
      <SearchContent />
    </Suspense>
  );
}
