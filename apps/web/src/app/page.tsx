import React from 'react';
import Link from 'next/link';
import { ListingCard, type ListingCardData } from '@/components/ListingCard';
import { CategoryNav } from '@/components/CategoryNav';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com';

const CATEGORIES = [
  { label: 'Clubs', slug: 'clubs', icon: '🏌️' },
  { label: 'Clothing', slug: 'clothing', icon: '👕' },
  { label: 'Shoes', slug: 'shoes', icon: '👟' },
  { label: 'Accessories', slug: 'accessories', icon: '🎒' },
  { label: 'Balls', slug: 'balls', icon: '⛳' },
  { label: 'Training Aids', slug: 'training-aids', icon: '🏋️' },
  { label: 'Shafts & Grips', slug: 'shafts-grips', icon: '🔧' },
  { label: 'Everything Else', slug: 'everything-else', icon: '📦' },
];

async function getFeaturedListings(): Promise<ListingCardData[]> {
  try {
    const res = await fetch(`${API_URL}/api/listings/featured`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.listings || [];
  } catch {
    return [];
  }
}

async function getRecentListings(): Promise<ListingCardData[]> {
  try {
    const res = await fetch(`${API_URL}/api/search/?sortBy=created_at&sortOrder=desc&limit=10`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.listings || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [featured, recent] = await Promise.all([
    getFeaturedListings(),
    getRecentListings(),
  ]);

  return (
    <>
      <CategoryNav />

      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1C4670 0%, #1DC690 100%)' }}
      >
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="max-w-xl">
            <p
              className="text-white uppercase"
              style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.1em', opacity: 0.9 }}
            >
              The UK&apos;s Golf Marketplace
            </p>
            <h1
              className="mt-3 text-white"
              style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 2.8rem)', lineHeight: 1.2 }}
            >
              Buy Smart. Sell Easy. Play Better.
            </h1>
            <p
              className="mt-4 text-white"
              style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', opacity: 0.85, lineHeight: 1.6 }}
            >
              Find golf clubs, clothing, and accessories from verified sellers across the UK. Every purchase protected.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="inline-flex items-center rounded-[10px] px-6 py-3 text-sm font-bold transition-colors hover:opacity-90"
                style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, backgroundColor: '#FFFFFF', color: '#1DC690' }}
              >
                Browse Listings
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center rounded-[10px] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
                style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, border: '1.5px solid rgba(255,255,255,0.6)' }}
              >
                Start Selling
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white" style={{ borderBottom: '1px solid #E0E0D8' }}>
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-6 px-4 py-4 sm:gap-10 sm:px-6 lg:px-8">
          {[
            { icon: '🛡️', text: 'Buyer Protection on every purchase' },
            { icon: '🚚', text: 'Insured Shipping on all orders' },
            { icon: '✅', text: 'Verified Sellers' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2">
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.82rem', color: '#6B6B6B' }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.4rem', color: '#0D0D0D' }}>
            Featured Listings
          </h2>
          <Link
            href="/search"
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition-colors hover:opacity-80"
            style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: '#1DC690', border: '1px solid #1DC690' }}
          >
            View All
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4">
            {featured.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl mb-3">🏌️</span>
            <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: '#6B6B6B' }}>No listings yet</p>
            <p className="mt-1 text-sm" style={{ color: '#ADADAD', fontFamily: 'var(--font-sans)' }}>Check back soon for new golf equipment.</p>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="mb-6" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.4rem', color: '#0D0D0D' }}>
          Shop by Category
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="group flex flex-col items-center justify-center rounded-xl bg-white p-6 transition-all duration-150 hover:border-[#1DC690]"
              style={{ border: '1px solid #E0E0D8', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
            >
              <span className="text-3xl mb-2 transition-transform duration-150 group-hover:scale-110">{cat.icon}</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.9rem', color: '#0D0D0D' }}>
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.4rem', color: '#0D0D0D' }}>
              Recently Listed
            </h2>
            <Link
              href="/search?sortBy=created_at&sortOrder=desc"
              className="text-sm transition-colors hover:underline"
              style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: '#1DC690' }}
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4">
            {recent.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        <div
          className="flex flex-col items-start justify-between gap-4 rounded-xl p-6 sm:flex-row sm:items-center"
          style={{ backgroundColor: '#1C4670' }}
        >
          <div className="flex items-start gap-3">
            <span style={{ color: '#1DC690', fontSize: '1.4rem' }}>✦</span>
            <div>
              <p className="text-white" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.1rem' }}>
                Ask Chip - your free AI golf fitting advisor
              </p>
              <p className="text-white mt-1" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', opacity: 0.85 }}>
                Get personalised club recommendations based on your game.
              </p>
            </div>
          </div>
          <span
            className="inline-flex items-center rounded-[10px] px-5 py-2.5 text-sm font-bold transition-colors hover:opacity-90 flex-shrink-0 cursor-pointer"
            style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, backgroundColor: '#FFFFFF', color: '#1C4670' }}
          >
            Try Chip
          </span>
        </div>
      </section>
    </>
  );
}