'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Condition badge colours — matches mobile app exactly
const CONDITION_COLOURS: Record<number, { bg: string; label: string }> = {
  5: { bg: '#10B981', label: 'New' },
  4: { bg: '#8B5CF6', label: 'Excellent' },
  3: { bg: '#3B82F6', label: 'Very Good' },
  2: { bg: '#F59E0B', label: 'Good' },
  1: { bg: '#EF4444', label: 'Poor' },
};

export interface ListingCardData {
  id: string;
  title: string;
  price: number;
  category?: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  condition_overall?: number | null;
  status?: string;
  images?: { image_url: string; display_order?: number }[];
  users?: {
    id: string;
    display_name?: string;
    is_verified_seller?: boolean;
  };
}

interface ListingCardProps {
  listing: ListingCardData;
}

export function ListingCard({ listing }: ListingCardProps) {
  const image = listing.images?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))[0]?.image_url;
  const isSold = listing.status === 'sold';
  const condition = listing.condition_overall ? CONDITION_COLOURS[listing.condition_overall] : null;
  const isVerified = listing.users?.is_verified_seller;

  // Build spec line from brand/model/category
  const specParts: string[] = [];
  if (listing.brand) specParts.push(listing.brand);
  if (listing.model) specParts.push(listing.model);
  if (specParts.length === 0 && listing.subcategory) specParts.push(listing.subcategory);
  const specLine = specParts.join(' · ');

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block rounded-xl bg-white overflow-hidden transition-all duration-150"
      style={{
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        minWidth: '180px',
      }}
    >
      {/* Image */}
      <div className="relative" style={{ aspectRatio: '3/4', backgroundColor: '#F4F4F0' }}>
        {image ? (
          <Image
            src={image}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-150 group-hover:scale-[1.02]"
            quality={80}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl" style={{ color: '#ADADAD' }}>
            🏌️
          </div>
        )}

        {/* Sold overlay */}
        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(6,7,10,0.6)' }}>
            <span className="rounded-full px-5 py-1.5 text-sm font-bold text-white" style={{ backgroundColor: '#06070A', fontFamily: 'var(--font-sans)', letterSpacing: '1px' }}>
              SOLD
            </span>
          </div>
        )}

        {/* Verified seller badge */}
        {isVerified && !isSold && (
          <div className="absolute top-2 left-2 flex items-center justify-center w-6 h-6 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#1DC690" stroke="#1DC690" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
        )}

        {/* Heart button */}
        <button
          className="absolute bottom-2 right-2 flex items-center justify-center w-8 h-8 rounded-full transition-opacity"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* TODO: toggle favourite */ }}
          aria-label="Add to favourites"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <p
          className="line-clamp-2 text-[#0D0D0D]"
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: '0.95rem',
            lineHeight: 1.3,
            color: isSold ? '#ADADAD' : '#0D0D0D',
          }}
        >
          {listing.title}
        </p>

        {specLine && (
          <p
            className="mt-0.5 truncate"
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              fontSize: '0.8rem',
              color: '#6B6B6B',
            }}
          >
            {specLine}
          </p>
        )}

        {condition && (
          <span
            className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-white"
            style={{
              backgroundColor: condition.bg,
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          >
            {condition.label}
          </span>
        )}

        <p
          className="mt-1.5"
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: '1.1rem',
            color: isSold ? '#ADADAD' : '#1DC690',
          }}
        >
          £{Number(listing.price).toFixed(2)}
        </p>
      </div>
    </Link>
  );
}
