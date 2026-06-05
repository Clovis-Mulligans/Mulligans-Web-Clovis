'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createConversation } from '@mulligans/api-client';
import { ListingCard } from '@/components/ListingCard';
import { Breadcrumb } from '@/components/Breadcrumb';

const CATEGORIES = ['All', 'Clubs', 'Clothing', 'Shoes', 'Accessories', 'Balls', 'Training Aids', 'Memorabilia', 'Everything Else'];

interface StorePageClientProps {
  user: any;
  listings: any[];
}

export function StorePageClient({ user, listings }: StorePageClientProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState('All');

  const name = user.pro_store_name || user.display_name || 'Pro Store';
  const filteredListings = categoryFilter === 'All' ? listings : listings.filter((l: any) => l.category === categoryFilter);

  const handleMessage = async () => {
    if (!isAuthenticated) { router.push(`/login?redirect=/stores/${user.id}`); return; }
    try {
      await createConversation({ listing_id: listings[0]?.id || '', seller_id: user.id });
      router.push('/messages');
    } catch { /* silent */ }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-4">
      <Breadcrumb items={[{ label: name }]} />

      {/* Store header */}
      <div className="rounded-2xl bg-white p-6 sm:p-8 mb-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="w-[72px] h-[72px] rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: user.avatar_url ? undefined : '#1DC690' }}>
            {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center w-full h-full text-white text-2xl font-bold">{name[0].toUpperCase()}</div>}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.4rem', color: '#0D0D0D' }}>{name}</h1>
              {/* Pro Store badge */}
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'rgba(29,198,144,0.15)', color: '#1DC690', fontFamily: 'var(--font-sans)' }}>Pro Store</span>
              {user.is_verified_seller && (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#1DC690" stroke="#1DC690" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              )}
            </div>
            {user.location && <p className="mt-1 text-sm text-[#6B6B6B]" style={{ fontFamily: 'var(--font-sans)' }}>{user.location}</p>}
            <div className="mt-1 flex items-center gap-3 text-sm text-[#6B6B6B]" style={{ fontFamily: 'var(--font-sans)' }}>
              <span>⭐ {Number(user.rating || 0).toFixed(1)}</span>
              <span>{user.total_sales || 0} sales</span>
              <span>Member since {new Date(user.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
            </div>
            {user.pro_store_website && (
              <a href={user.pro_store_website} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm transition-colors hover:underline" style={{ color: '#278AB0', fontFamily: 'var(--font-sans)' }}>
                {new URL(user.pro_store_website).hostname}
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
              </a>
            )}
          </div>

          {/* Action */}
          <button onClick={handleMessage} className="rounded-[10px] px-5 py-2.5 text-sm font-bold transition-colors hover:bg-[#F4F4F0] flex-shrink-0" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, border: '1.5px solid #1C4670', color: '#1C4670' }}>Message Store</button>
        </div>

        {/* Stats bar */}
        <div className="mt-6 grid grid-cols-3 rounded-xl p-4 text-center text-white" style={{ backgroundColor: '#278AB0' }}>
          <div>
            <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-sans)' }}>{listings.length}</p>
            <p className="text-xs opacity-80" style={{ fontFamily: 'var(--font-sans)' }}>Listings</p>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', borderRight: '1px solid rgba(255,255,255,0.3)' }}>
            <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-sans)' }}>{user.total_sales || 0}</p>
            <p className="text-xs opacity-80" style={{ fontFamily: 'var(--font-sans)' }}>Sales</p>
          </div>
          <div>
            <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-sans)' }}>⭐ {Number(user.rating || 0).toFixed(1)}</p>
            <p className="text-xs opacity-80" style={{ fontFamily: 'var(--font-sans)' }}>Rating</p>
          </div>
        </div>
      </div>

      {/* Listings */}
      <h2 className="mb-4" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.25rem', color: '#0D0D0D' }}>All Listings from {name}</h2>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto mb-6" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCategoryFilter(c)} className="flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, backgroundColor: categoryFilter === c ? '#1DC690' : '#FFFFFF', color: categoryFilter === c ? '#FFFFFF' : '#6B6B6B', border: categoryFilter === c ? 'none' : '1px solid #E0E0D8' }}>
            {c}
          </button>
        ))}
      </div>

      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4 pb-12">
          {filteredListings.map((l: any) => <ListingCard key={l.id} listing={l} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">🏌️</span>
          <p className="font-semibold text-[#0D0D0D]" style={{ fontFamily: 'var(--font-sans)' }}>No active listings right now</p>
          <p className="mt-1 text-sm text-[#6B6B6B]" style={{ fontFamily: 'var(--font-sans)' }}>Check back soon</p>
        </div>
      )}
    </div>
  );
}
