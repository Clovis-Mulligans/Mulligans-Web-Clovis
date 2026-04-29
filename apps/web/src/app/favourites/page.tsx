'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Search } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import PageHeader from '@/components/PageHeader';
import { ListingCard, type ListingCardData } from '@/components/ListingCard';
import { getFavourites, removeFavourite } from '@mulligans/api-client';

type SortKey = 'recent' | 'priceAsc' | 'priceDesc' | 'nameAsc';

interface FavouriteRow {
  id: string;              // favourite row id
  created_at: string;      // for "Recently Added" sort
  listing: ListingCardData & { price: number | string; status?: string };
}

const PALETTE = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  green: '#1DC690',
  textDark: '#111827',
  textMid: '#374151',
  textLight: '#6B7280',
  border: '#E0E0E0',
  heartRed: '#EF4444',
  inputBg: '#FFFFFF',
};

export default function FavouritesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<FavouriteRow[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');

  /* Auth gate */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/favourites');
    }
  }, [authLoading, isAuthenticated, router]);

  /* Fetch favourites */
  const fetchFavourites = useCallback(async () => {
    if (!isAuthenticated) return;
    setError(null);
    try {
      const res = await getFavourites();
      const list =
        (res as unknown as { listings?: unknown[] }).listings ||
        (res as unknown as { favourites?: unknown[] }).favourites ||
        (res as unknown as { favorites?: unknown[] }).favorites ||
        (Array.isArray(res) ? (res as unknown[]) : []);
      const normalised: FavouriteRow[] = (list as Array<Record<string, unknown>>)
        .filter(Boolean)
        .map((item, idx) => {
          // Backend returns flat listings (not favourite rows with nested listing)
          const listing = (item as any).listing || item;
          return {
            id: (item as any).id || `fav-${idx}`,
            created_at: (item as any).created_at || new Date().toISOString(),
            listing: listing as FavouriteRow['listing'],
          };
        });
      setRows(normalised);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favourites');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchFavourites(); }, [fetchFavourites]);

  /* Re-fetch on tab focus so the grid reflects unfavourites that the
     user toggled inside <ListingCard>'s own heart button. */
  useEffect(() => {
    function onFocus() { fetchFavourites(); }
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [fetchFavourites]);

  /* Client-side search + sort */
  const visible = useMemo(() => {
    let out = rows;
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter(r => {
        const l = r.listing;
        return (
          (l.title || '').toLowerCase().includes(q) ||
          (l.brand || '').toLowerCase().includes(q) ||
          (l.model || '').toLowerCase().includes(q)
        );
      });
    }
    const copy = [...out];
    copy.sort((a, b) => {
      const ap = Number(a.listing.price) || 0;
      const bp = Number(b.listing.price) || 0;
      switch (sort) {
        case 'priceAsc':  return ap - bp;
        case 'priceDesc': return bp - ap;
        case 'nameAsc':   return (a.listing.title || '').localeCompare(b.listing.title || '');
        case 'recent':
        default:
          return (b.created_at || '').localeCompare(a.created_at || '');
      }
    });
    return copy;
  }, [rows, query, sort]);

  /* Explicit unfavourite from this page (optimistic). ListingCard's own
     heart also works; we provide this in case we ever wire a bulk action. */
  async function handleUnfavourite(listingId: string) {
    const prev = rows;
    setRows(r => r.filter(x => x.listing.id !== listingId));
    try {
      await removeFavourite(listingId);
    } catch {
      setRows(prev);
    }
  }

  /* ───── Render ───── */

  if (authLoading || !isAuthenticated) {
    return (
      <div style={{
        minHeight: '60vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: PALETTE.textMid, fontSize: 14,
      }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: PALETTE.bg, minHeight: '100vh', padding: '24px 16px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <PageHeader
          title="Favourites"
          subtitle="Items you've saved"
        />

        {/* Controls */}
        <div style={{
          display: 'flex', gap: 12, marginBottom: 20,
          flexWrap: 'wrap', alignItems: 'center',
        }}>
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 420 }}>
            <Search
              size={16}
              color={PALETTE.textLight}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search favourites…"
              style={{
                width: '100%', padding: '10px 12px 10px 36px',
                border: `1px solid ${PALETTE.border}`,
                borderRadius: 8, fontSize: 14,
                backgroundColor: PALETTE.inputBg, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            style={{
              padding: '10px 12px',
              border: `1px solid ${PALETTE.border}`,
              borderRadius: 8, fontSize: 14,
              backgroundColor: PALETTE.inputBg,
              color: PALETTE.textDark, outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="recent">Recently Added</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
            <option value="nameAsc">Name: A–Z</option>
          </select>

          <div style={{ marginLeft: 'auto', fontSize: 13, color: PALETTE.textLight }}>
            {loading ? '' : `${visible.length} of ${rows.length}`}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px 16px', marginBottom: 16,
            backgroundColor: '#FEF2F2', color: '#B91C1C',
            borderRadius: 8, fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {/* States */}
        {loading ? (
          <SkeletonGrid />
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : visible.length === 0 ? (
          <div style={{
            padding: 48, textAlign: 'center',
            backgroundColor: '#fff', borderRadius: 14,
            border: `1px solid ${PALETTE.border}`,
            color: PALETTE.textMid, fontSize: 14,
          }}>
            No favourites match &quot;{query}&quot;.
          </div>
        ) : (
          <div style={gridStyle}>
            {visible.map(row => (
              <div key={row.listing.id} style={{ position: 'relative' }}>
                <ListingCard listing={row.listing} />
                {/* Unused but kept for reference — the ListingCard's own
                    heart handles toggling; we re-fetch on focus to sync. */}
                {false && (
                  <button
                    type="button"
                    onClick={() => handleUnfavourite(row.listing.id)}
                    aria-label="Remove from favourites"
                    style={{ display: 'none' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───── Skeleton ───── */

function SkeletonGrid() {
  return (
    <div style={gridStyle}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{
          aspectRatio: '3/4',
          backgroundColor: '#F7F7F5',
          borderRadius: 14,
        }} />
      ))}
    </div>
  );
}

/* ───── Empty state ───── */

function EmptyState() {
  return (
    <div style={{
      padding: '64px 24px', textAlign: 'center',
      backgroundColor: '#fff', borderRadius: 14,
      border: `1px solid ${PALETTE.border}`,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        backgroundColor: '#FEF2F2',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <Heart size={30} color={PALETTE.heartRed} />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: PALETTE.textDark, margin: '0 0 8px' }}>
        No favourites yet
      </h2>
      <p style={{ fontSize: 14, color: PALETTE.textMid, margin: '0 0 20px' }}>
        Browse listings and tap the heart icon to save items you love.
      </p>
      <Link
        href="/search"
        style={{
          display: 'inline-block',
          padding: '10px 20px',
          backgroundColor: PALETTE.green,
          color: '#fff', fontSize: 14, fontWeight: 600,
          borderRadius: 8, textDecoration: 'none',
        }}
      >
        Browse Listings
      </Link>
    </div>
  );
}

/* ───── Shared grid ───── */

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 16,
};
