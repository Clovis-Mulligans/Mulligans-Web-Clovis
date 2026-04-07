'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ListingCard, type ListingCardData } from '@/components/ListingCard';
import { CardSkeletonGrid } from '@/components/LoadingSkeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function FeaturedListings() {
  const [listings, setListings] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAndFilter = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/listings/featured`);
      if (!res.ok) { setListings([]); return; }
      const data = await res.json();
      const all: ListingCardData[] = data.listings || [];

      // FIX 3A: Filter to pro stores only
      const proStoreListings = all.filter((l) => (l as any).users?.is_pro_store === true);

      // Shuffle and limit to 8
      setListings(shuffleArray(proStoreListings).slice(0, 15));
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndFilter();
  }, [fetchAndFilter]);

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.4rem', color: '#0D0D0D' }}>
          Featured Listings
        </h2>
        <div className="flex items-center gap-3">
          {/* FIX 3B: Refresh button */}
          <button
            onClick={fetchAndFilter}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors hover:bg-[#F4F4F0] disabled:opacity-50"
            style={{ border: '1px solid #E0E0D8', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.78rem', color: '#6B6B6B' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <Link href="/search" className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition-colors hover:opacity-80" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: '#1DC690', border: '1px solid #1DC690' }}>
            View All
          </Link>
        </div>
      </div>

      {loading ? (
        <CardSkeletonGrid count={8} />
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl mb-3">🏌️</span>
          <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: '#6B6B6B' }}>No featured listings yet</p>
          <p className="mt-1 text-sm" style={{ color: '#ADADAD', fontFamily: 'var(--font-sans)' }}>Check back soon for featured pro store listings.</p>
        </div>
      )}
    </section>
  );
}
