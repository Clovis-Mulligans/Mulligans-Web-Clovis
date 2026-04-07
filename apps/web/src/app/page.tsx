import React from 'react';
import Link from 'next/link';
import { CategoryNav } from '@/components/CategoryNav';
import { FeaturedListings } from '@/components/FeaturedListings';
import { ListingCard, type ListingCardData } from '@/components/ListingCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com';

// FIX 1: Category icons updated from emojis to PNG images
const CATEGORIES = [
  { label: 'Clubs', slug: 'clubs', icon: '/icons/search-icons/Clubs.png' },
  { label: 'Clothing', slug: 'clothing', icon: '/icons/search-icons/Clothing.png' },
  { label: 'Shoes', slug: 'shoes', icon: '/icons/search-icons/Shoes.png' },
  { label: 'Accessories', slug: 'accessories', icon: '/icons/search-icons/Accessories.png' },
  { label: 'Balls', slug: 'balls', icon: '/icons/search-icons/Balls.png' },
  { label: 'Training Aids', slug: 'training-aids', icon: '/icons/search-icons/Training Aids.png' },
  { label: 'Shafts & Grips', slug: 'shafts-grips', icon: '/icons/search-icons/Shaft Grips and Heads.png' },
  { label: 'Everything Else', slug: 'everything-else', icon: '/icons/search-icons/Everything else.png' },
];

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
  const recent = await getRecentListings();

  return (
    <>
      <CategoryNav />

      {/* Hero — Depop-style two column */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1C4670 0%, #1DC690 100%)' }}>
        <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="flex flex-col lg:flex-row items-center gap-10">

            {/* Left: text + stats */}
            <div className="flex-1 max-w-lg">
              <p className="text-white uppercase" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.1em', opacity: 0.9 }}>
                The UK&apos;s Golf Marketplace
              </p>
              <h1 className="mt-3 text-white" style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 2.8rem)', lineHeight: 1.2 }}>
                Buy Smart. Sell Easy. Play Better.
              </h1>
              <p className="mt-4 text-white" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', opacity: 0.85, lineHeight: 1.6 }}>
                Find golf clubs, clothing, and accessories from verified sellers across the UK. Every purchase protected.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/search" className="inline-flex items-center rounded-[10px] px-6 py-3 text-sm font-bold transition-colors hover:opacity-90" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, backgroundColor: '#FFFFFF', color: '#1DC690' }}>
                  Browse Listings
                </Link>
                <Link href="/signup" className="inline-flex items-center rounded-[10px] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, border: '1.5px solid rgba(255,255,255,0.6)' }}>
                  Start Selling
                </Link>
              </div>

              {/* Stat boxes */}
              <div className="mt-10 grid grid-cols-2 gap-3">
                {[
                  { icon: '🛡', title: 'Buy Safely', sub: 'Buyer Protection Pro' },
                  { icon: '✓', title: 'Verified Sellers', sub: 'Every seller checked' },
                  { icon: '📦', title: 'Insured Shipping', sub: 'On all orders' },
                  { icon: '£', title: 'Zero Seller Fees', sub: 'Free to list & sell' },
                ].map((stat) => (
                  <div key={stat.title} className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
                    <span style={{ fontSize: '1.2rem' }}>{stat.icon}</span>
                    <p className="mt-1 text-white" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.88rem' }}>{stat.title}</p>
                    <p className="text-white" style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: '0.78rem', opacity: 0.8 }}>{stat.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: stacked rotated images */}
            <div className="relative flex-shrink-0 w-[340px] h-[280px] hidden lg:block">
              {/* Back left — club-specs */}
              <div className="absolute" style={{ left: '0px', top: '20px', transform: 'rotate(-8deg)', zIndex: 1 }}>
                <img src="/onboarding/club-specs.png" alt="Club specs" className="rounded-2xl shadow-2xl" style={{ width: '180px', height: '180px', objectFit: 'cover', backgroundColor: 'rgba(255,255,255,0.15)' }} />
              </div>
              {/* Front centre — protection-pro */}
              <div className="absolute" style={{ left: '80px', top: '0px', transform: 'rotate(0deg)', zIndex: 3 }}>
                <img src="/onboarding/protection-pro.png" alt="Buyer Protection" className="rounded-2xl shadow-2xl" style={{ width: '200px', height: '200px', objectFit: 'cover', backgroundColor: 'rgba(255,255,255,0.15)' }} />
              </div>
              {/* Back right — marketplace */}
              <div className="absolute" style={{ left: '160px', top: '25px', transform: 'rotate(7deg)', zIndex: 2 }}>
                <img src="/onboarding/marketplace.png" alt="Marketplace" className="rounded-2xl shadow-2xl" style={{ width: '180px', height: '180px', objectFit: 'cover', backgroundColor: 'rgba(255,255,255,0.15)' }} />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-white" style={{ borderBottom: '1px solid #E0E0D8' }}>
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-6 px-4 py-4 sm:gap-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.82rem', color: '#6B6B6B' }}>Buyer Protection on every purchase</span>
          </div>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#278AB0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect width="7" height="7" x="14" y="11" rx="1"/><path d="M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/><path d="M19 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/></svg>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.82rem', color: '#6B6B6B' }}>Insured Shipping on all orders</span>
          </div>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C4670" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.82rem', color: '#6B6B6B' }}>Verified Sellers</span>
          </div>
        </div>
      </section>

      {/* Featured Listings (client component) */}
      <FeaturedListings />

      {/* Shop by Category — FIX 1: PNG icons */}
      <section className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="mb-6" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.4rem', color: '#0D0D0D' }}>
          Shop by Category
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
          {CATEGORIES.map((cat) => (
            <Link key={cat.slug} href={`/category/${cat.slug}`} className="group flex flex-col items-center justify-center rounded-xl bg-white p-6 transition-all duration-150 hover:border-[#1DC690]" style={{ border: '1px solid #E0E0D8', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <img src={cat.icon} alt={cat.label} style={{ width: '48px', height: '48px', objectFit: 'contain', marginBottom: '8px' }} className="transition-transform duration-150 group-hover:scale-110" />
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.9rem', color: '#0D0D0D' }}>{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recently Listed */}
      {recent.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.4rem', color: '#0D0D0D' }}>Recently Listed</h2>
            <Link href="/search?sortBy=created_at&sortOrder=desc" className="text-sm transition-colors hover:underline" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: '#1DC690' }}>View All →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4">
            {recent.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {/* Chip AI Banner */}
      <section className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl p-6 sm:flex-row sm:items-center" style={{ backgroundColor: '#1C4670' }}>
          <div className="flex items-start gap-3">
            <span style={{ color: '#1DC690', fontSize: '1.4rem' }}>✦</span>
            <div>
              <p className="text-white" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.1rem' }}>Ask Chip — your free AI golf fitting advisor</p>
              <p className="text-white mt-1" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', opacity: 0.85 }}>Get personalised club recommendations based on your game.</p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-[10px] px-5 py-2.5 text-sm font-bold transition-colors hover:opacity-90 flex-shrink-0" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, backgroundColor: '#FFFFFF', color: '#1C4670' }} title="Available on the Mulligans app">
            Try Chip →
          </span>
        </div>
      </section>
    </>
  );
}
