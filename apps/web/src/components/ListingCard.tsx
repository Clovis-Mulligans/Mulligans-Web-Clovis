'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { addFavourite, removeFavourite, checkFavourite } from '@mulligans/api-client';
import { CONDITION_COLOURS } from '@/lib/constants';

export interface ListingCardData {
  id: string;
  title: string;
  price: number | string;
  category?: string | null;
  subcategory?: string | null;
  brand?: string | null;
  model?: string | null;
  condition_overall?: number | null;
  status?: string;
  images?: { image_url: string; display_order?: number }[];
  users?: {
    id: string;
    display_name?: string | null;
    is_verified_seller?: boolean;
  };
}

interface ListingCardProps {
  listing: ListingCardData;
}

export function ListingCard({ listing }: ListingCardProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isFavourited, setIsFavourited] = useState(false);
  const mountedRef = useRef(true);

  const image = listing.images?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))[0]?.image_url;
  const isSold = listing.status === 'sold';
  const condition = listing.condition_overall ? CONDITION_COLOURS[listing.condition_overall] : null;
  const isVerified = listing.users?.is_verified_seller;
  const rawPrice = Number(listing.price);
const price = rawPrice * 1.075 + 0.99;

  const specParts: string[] = [];
  if (listing.brand) specParts.push(listing.brand);
  if (listing.model) specParts.push(listing.model);
  if (specParts.length === 0 && listing.subcategory) specParts.push(listing.subcategory);
  const specLine = specParts.join(' · ');

  // Check favourite status on mount — fixed: never revert on non-auth errors
  useEffect(() => {
    mountedRef.current = true;
    if (!isAuthenticated || !listing.id) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await checkFavourite(listing.id);
        if (!cancelled && mountedRef.current) {
          setIsFavourited(res.is_favourite);
        }
      } catch {
        // Silently default to false on any error (404, network, etc.)
        // Do NOT change isFavourited — leave it at its current state
      }
    })();

    return () => { cancelled = true; mountedRef.current = false; };
  }, [isAuthenticated, listing.id]);

  const handleFavouriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      const redirect = `/listings/${listing.id}`;
      router.push(`/login?redirect=${redirect}`);
      return;
    }

    // Optimistic update
    const wasFavourited = isFavourited;
    setIsFavourited(!wasFavourited);

    try {
      if (wasFavourited) {
        await removeFavourite(listing.id);
      } else {
        await addFavourite(listing.id);
      }
    } catch (err: any) {
      // Only revert on auth errors (401/403) — keep optimistic state for all other errors
      if (err?.status === 401 || err?.status === 403) {
        setIsFavourited(wasFavourited);
      }
      console.error('Favourite toggle failed:', err);
    }
  };

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block rounded-xl bg-white overflow-hidden transition-all duration-150 hover:-translate-y-0.5"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)', minWidth: '180px' }}
    >
      <div className="relative" style={{ aspectRatio: '3/4', backgroundColor: '#F4F4F0' }}>
        {image ? (
          <img src={image} alt={listing.title} className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-[1.02]" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl" style={{ color: '#ADADAD' }}>🏌️</div>
        )}

        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(6,7,10,0.6)' }}>
            <span className="rounded-full px-5 py-1.5 text-sm font-bold text-white" style={{ backgroundColor: '#06070A', fontFamily: 'var(--font-sans)', letterSpacing: '1px' }}>SOLD</span>
          </div>
        )}

        {isVerified && !isSold && (
          <div className="absolute top-2 left-2 flex items-center justify-center w-6 h-6 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#1DC690" stroke="#1DC690" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
        )}

        <button
          className="absolute bottom-2 right-2 flex items-center justify-center w-8 h-8 rounded-full transition-opacity"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={handleFavouriteClick}
          aria-label={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isFavourited ? '#1DC690' : 'none'} stroke={isFavourited ? '#1DC690' : '#FFFFFF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        </button>
      </div>

      <div className="p-3">
        <p className="line-clamp-2" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3, color: isSold ? '#ADADAD' : '#0D0D0D' }}>{listing.title}</p>
        {specLine && <p className="mt-0.5 truncate" style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: '0.8rem', color: '#6B6B6B' }}>{specLine}</p>}
        {condition && <span className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-white" style={{ backgroundColor: condition.bg, fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.7rem' }}>{condition.label}</span>}
        <p className="mt-1.5" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.1rem', color: isSold ? '#ADADAD' : '#1DC690' }}>£{price.toFixed(2)}</p>
      </div>
    </Link>
  );
}
