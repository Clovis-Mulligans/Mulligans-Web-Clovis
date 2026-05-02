'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CategoryNav } from '@/components/CategoryNav';
import { ListingResults } from '@/components/ListingResults';
import { CardSkeletonGrid } from '@/components/LoadingSkeleton';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || searchParams.get('query') || '';

  // Build title and breadcrumb based on whether there's a search query
  const title = query
    ? `Results for "${query}"`
    : 'All Listings';

  const breadcrumb = query
    ? [{ label: 'Search' }, { label: query }]
    : [{ label: 'All Listings' }];

  return (
    <>
      <CategoryNav />
      <ListingResults
        query={query || undefined}
        title={title}
        breadcrumb={breadcrumb}
        showCategoryFilter={true}
        basePath="/search"
      />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 sm:px-6 lg:px-8 py-8" style={{ maxWidth: 1600, margin: '0 auto' }}>
          <CardSkeletonGrid count={12} />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
