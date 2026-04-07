import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ListingDetailClient } from './ListingDetailClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com';

async function fetchListing(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/listings/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.listing || data;
  } catch { return null; }
}

async function fetchSimilar(category: string, excludeId: string) {
  try {
    const res = await fetch(`${API_URL}/api/search/?category=${encodeURIComponent(category)}&limit=6`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.listings || []).filter((l: { id: string }) => l.id !== excludeId);
  } catch { return []; }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const listing = await fetchListing(params.id);
  if (!listing) return { title: 'Listing Not Found | Mulligans' };

  const price = Number(listing.price);
  const description = listing.description?.slice(0, 160) || `${listing.title} on Mulligans`;
  const image = listing.images?.[0]?.image_url;

  return {
    title: `${listing.title} | Mulligans`,
    description,
    openGraph: {
      title: listing.title,
      description,
      images: image ? [{ url: image }] : [],
      type: 'website',
      url: `https://mulligans.uk.com/listings/${listing.id}`,
    },
    other: {
      'product:price:amount': price.toFixed(2),
      'product:price:currency': 'GBP',
    },
  };
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = await fetchListing(params.id);

  if (!listing || listing.status === 'draft' || listing.status === 'inactive') {
    notFound();
  }

  const similar = await fetchSimilar(listing.category, listing.id);

  return <ListingDetailClient listing={listing} similar={similar} />;
}
