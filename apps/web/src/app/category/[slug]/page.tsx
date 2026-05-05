'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { CategoryNav } from '@/components/CategoryNav';
import { ListingResults } from '@/components/ListingResults';
import { CardSkeletonGrid } from '@/components/LoadingSkeleton';
import { CATEGORY_SLUG_TO_DB } from '@/lib/constants';

function CategoryContent() {
  const params = useParams();
  const slug = params.slug as string;

  // Translate URL slug → backend category name
  const categoryName = CATEGORY_SLUG_TO_DB[slug] || slug;

  // Friendly display label (e.g. "Shafts, Grips & Heads" → "Shafts & Grips")
  const displayLabel =
    categoryName === 'Shafts, Grips & Heads' ? 'Shafts & Grips' : categoryName;

  return (
    <>
      <CategoryNav />
      <ListingResults
        title={displayLabel}
        breadcrumb={[{ label: displayLabel }]}
        showCategoryFilter={false}
        forcedCategory={categoryName}
        basePath={`/category/${slug}`}
      />
    </>
  );
}

export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <div
          className="px-4 sm:px-6 lg:px-8 py-8"
          style={{ maxWidth: 1400, margin: '0 auto' }}
        >
          <CardSkeletonGrid count={12} />
        </div>
      }
    >
      <CategoryContent />
    </Suspense>
  );
}