import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { StorePageClient } from './StorePageClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com';

async function fetchProfile(userId: string) {
  try {
    const res = await fetch(`${API_URL}/api/users/${userId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || data;
  } catch { return null; }
}

async function fetchListings(sellerId: string) {
  try {
    const res = await fetch(`${API_URL}/api/listings/seller/${sellerId}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.listings || [];
  } catch { return []; }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const user = await fetchProfile(params.slug);
  if (!user || !user.is_pro_store) return { title: 'Store Not Found | Mulligans' };
  const name = user.pro_store_name || user.display_name || 'Pro Store';
  return {
    title: `${name} | Mulligans Pro Store`,
    description: `Browse listings from ${name} on Mulligans, the UK golf marketplace.`,
  };
}

export default async function StorePageServer({ params }: { params: { slug: string } }) {
  const user = await fetchProfile(params.slug);
  if (!user || !user.is_pro_store) notFound();

  const listings = await fetchListings(params.slug);

  return <StorePageClient user={user} listings={listings} />;
}
