import React from 'react';
import Link from 'next/link';
import { CategoryNav } from '@/components/CategoryNav';
import { FeaturedListings } from '@/components/FeaturedListings';
import { ListingCard, type ListingCardData } from '@/components/ListingCard';
import { BrandLogoWall } from '@/components/BrandLogoWall';

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

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1C4670 0%, #1DC690 100%)' }}>
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="flex flex-col lg:flex-row items-center gap-8">

            {/* Left: text + stats */}
            <div className="flex-1 max-w-lg">
              <p className="text-white uppercase" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.12em', opacity: 0.85 }}>
                The UK&apos;s Golf Marketplace
              </p>
              <h1 className="mt-2 text-white" style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', lineHeight: 1.15 }}>
                Buy <span style={{ color: '#1DC690' }}>Smart.</span> Sell <span style={{ color: '#1DC690' }}>Easy.</span><br />Play <span style={{ color: '#1DC690' }}>Better.</span>
              </h1>
              <p className="mt-3 text-white" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', opacity: 0.8, lineHeight: 1.6 }}>
                Find golf clubs, clothing, and accessories from verified sellers across the UK. Every purchase protected.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/search" className="inline-flex items-center rounded-[10px] px-5 py-2.5 text-sm font-bold transition-colors hover:opacity-90" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, backgroundColor: '#FFFFFF', color: '#1DC690' }}>
                  Browse Listings
                </Link>
                <Link href="/sell" className="inline-flex items-center rounded-[10px] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, border: '1.5px solid rgba(255,255,255,0.5)' }}>
                  Start Selling
                </Link>
              </div>

              {/* Stat boxes */}
              <div className="mt-6 grid grid-cols-2 gap-2">
                {[
                  { title: 'Buy Safely', sub: 'Buyer Protection Pro' },
                  { title: 'Verified Sellers', sub: 'Every seller checked' },
                  { title: 'Insured Shipping', sub: 'On all orders' },
                  { title: 'Zero Seller Fees', sub: 'Free to list & sell' },
                ].map((stat) => (
                  <div key={stat.title} className="rounded-lg px-3 py-2.5" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <p className="text-white" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.82rem' }}>{stat.title}</p>
                    <p className="text-white" style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: '0.72rem', opacity: 0.75 }}>{stat.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: stacked images */}
            <div className="relative hidden lg:flex items-center justify-end flex-shrink-0 ml-auto" style={{ width: '620px', height: '340px' }}>
              {/* Left image — club-specs */}
              <div className="absolute rounded-2xl overflow-hidden shadow-2xl" style={{ left: '50px', top: '50px', width: '195px', height: '195px', transform: 'rotate(-8deg)', zIndex: 1, backgroundColor: '#FFFFFF' }}>
                <img src="/onboarding/club-specs.png" alt="Club specs" className="w-full h-full" style={{ objectFit: 'contain', padding: '14px' }} />
              </div>
              {/* Centre image — protection-pro (front) */}
              <div className="absolute rounded-2xl overflow-hidden shadow-2xl" style={{ left: '195px', top: '15px', width: '225px', height: '225px', transform: 'rotate(0deg)', zIndex: 3, backgroundColor: '#FFFFFF' }}>
                <img src="/onboarding/protection-pro.png" alt="Buyer Protection" className="w-full h-full" style={{ objectFit: 'contain', padding: '14px' }} />
              </div>
              {/* Right image — marketplace */}
              <div className="absolute rounded-2xl overflow-hidden shadow-2xl" style={{ left: '370px', top: '55px', width: '195px', height: '195px', transform: 'rotate(7deg)', zIndex: 2, backgroundColor: '#FFFFFF' }}>
                <img src="/onboarding/marketplace.png" alt="Marketplace" className="w-full h-full" style={{ objectFit: 'contain', padding: '14px' }} />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Brand wall — trust signal */}
      <BrandLogoWall />

     {/* Trust Bar */}
      <section className="bg-white" style={{ borderBottom: '1px solid #E0E0D8' }}>
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-8 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.82rem', color: '#0D0D0D' }}>Golf-specific filters</p>
              <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: '0.75rem', color: '#6B6B6B' }}>No other marketplace offers this</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#278AB0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.82rem', color: '#0D0D0D' }}>3-day inspection window</p>
              <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: '0.75rem', color: '#6B6B6B' }}>Return if not as described</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C4670" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.82rem', color: '#0D0D0D' }}>Verified seller ratings</p>
              <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: '0.75rem', color: '#6B6B6B' }}>Real reviews from real buyers</p>
            </div>
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
