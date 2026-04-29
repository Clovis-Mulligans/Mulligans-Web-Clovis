'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Search, X, ArrowUpDown, Heart, Check } from 'lucide-react';
import { searchListings, addFavourite, removeFavourite, checkFavourite } from '@mulligans/api-client';
import type { ListingWithSeller } from '@mulligans/api-client';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORY_SLUG_TO_DB, CATEGORY_DB_TO_SLUG } from '@/lib/constants';

/* ── Category options ──────────────────────────────────── */

const CATEGORIES = [
  { display: 'Clubs', db: 'Clubs' },
  { display: 'Clothing', db: 'Clothing' },
  { display: 'Shoes', db: 'Shoes' },
  { display: 'Accessories', db: 'Accessories' },
  { display: 'Balls', db: 'Balls' },
  { display: 'Training Aids', db: 'Training Aids' },
  { display: 'Shafts & Grips', db: 'Shafts, Grips & Heads' },
  { display: 'Everything Else', db: 'Everything Else' },
];

/* ── Subcategories per category ────────────────────────── */

const SUBCATEGORIES: Record<string, string[]> = {
  'Clubs': ['Drivers', 'Fairway Woods', 'Hybrids', 'Irons', 'Wedges', 'Putters', 'Chippers', 'Complete Sets', 'Other'],
  'Clothing': ['Jackets', 'Polo Shirts', 'Trousers', 'Shorts', 'Hoodies', 'Knitwear', 'Gilets', 'Mid-Layers', 'Waterproofs', 'Hats & Caps', 'Sunglasses', 'Gloves', 'Other'],
  'Shoes': ['Golf Shoes', 'Other'],
  'Accessories': ['Bags', 'Headcovers', 'Tees', 'Rangefinders', 'Launch Monitors', 'GPS Devices', 'Towels', 'Golf Trolleys', 'Other'],
  'Balls': ['New', 'Used/Lake', 'Other'],
  'Training Aids': ['Swing Trainer', 'Putting Aid', 'Net', 'Mat', 'GPS Watch', 'Other'],
  'Shafts, Grips & Heads': ['Shafts', 'Grips', 'Heads', 'Other'],
};

/* ── Brand lists per category ──────────────────────────── */

const BRANDS: Record<string, string[]> = {
  'Clubs': ['TaylorMade', 'Callaway', 'Titleist', 'Ping', 'Cobra', 'Mizuno', 'Srixon', 'Cleveland', 'Wilson', 'Wilson Staff', 'PXG', 'Honma', 'Scotty Cameron', 'Odyssey', 'Bettinardi', 'LAB Golf', 'Evnroll', 'Other'],
  'Clothing': ['Nike', 'Adidas', 'Under Armour', 'Puma', 'FootJoy', 'Galvin Green', 'J.Lindeberg', 'TravisMathew', 'Peter Millar', 'Castore', 'G/FORE', 'Lyle & Scott', 'Glenmuir', 'Hugo Boss', 'Ralph Lauren', 'Other'],
  'Shoes': ['FootJoy', 'Ecco', 'Nike', 'Adidas', 'Puma', 'Under Armour', 'New Balance', 'Skechers', 'G/FORE', 'Duca del Cosma', 'Other'],
  'Balls': ['Titleist', 'TaylorMade', 'Callaway', 'Bridgestone', 'Srixon', 'Vice Golf', 'Snell Golf', 'Wilson', 'Volvik', 'Other'],
  'Accessories': ['Titleist', 'TaylorMade', 'Callaway', 'Ping', 'Sun Mountain', 'Bushnell', 'Garmin', 'Motocaddy', 'PowaKaddy', 'Other'],
  'Training Aids': ['SuperSpeed Golf', 'Orange Whip', 'SKLZ', 'Tour Striker', 'PuttOUT', 'Arccos', 'Shot Scope', 'Other'],
  'Shafts, Grips & Heads': ['Fujikura', 'Project X', 'True Temper', 'KBS', 'Nippon', 'Graphite Design', 'Other'],
};

/* ── Popular brands (pill row) ─────────────────────────── */

const POPULAR_BRANDS: Record<string, string[]> = {
  'Clubs': ['TaylorMade', 'Titleist', 'Callaway', 'Ping', 'Cobra', 'Mizuno', 'Srixon', 'Cleveland'],
  'Clothing': ['FootJoy', 'Nike', 'Adidas', 'Under Armour', 'Puma', 'Galvin Green'],
  'Shoes': ['FootJoy', 'Ecco', 'Nike', 'Adidas', 'Puma', 'Under Armour'],
  'Accessories': ['Titleist', 'TaylorMade', 'Callaway', 'Bushnell', 'Motocaddy', 'Sun Mountain'],
  'Balls': ['Titleist', 'TaylorMade', 'Callaway', 'Bridgestone', 'Srixon', 'Vice Golf'],
  'Training Aids': ['SuperSpeed Golf', 'Orange Whip', 'SKLZ', 'Tour Striker', 'PuttOUT', 'Arccos'],
  'Shafts, Grips & Heads': ['Fujikura', 'Project X', 'True Temper', 'KBS', 'Nippon', 'Graphite Design'],
  'Everything Else': ['TaylorMade', 'Callaway', 'Titleist', 'Ping', 'Nike', 'FootJoy'],
};
const DEFAULT_BRANDS = ['TaylorMade', 'Callaway', 'Titleist', 'Ping', 'Nike', 'FootJoy'];

/* ── Condition ─────────────────────────────────────────── */

const CONDITIONS = [
  { value: 5, label: 'New' },
  { value: 4, label: 'Excellent' },
  { value: 3, label: 'Good' },
  { value: 2, label: 'Fair' },
  { value: 1, label: 'Poor' },
];

const CONDITION_BADGE: Record<number, { bg: string; color: string; label: string }> = {
  5: { bg: 'rgba(29,198,144,0.1)', color: '#059669', label: 'New' },
  4: { bg: 'rgba(29,198,144,0.1)', color: '#059669', label: 'Excellent' },
  3: { bg: 'rgba(39,138,176,0.1)', color: '#278AB0', label: 'Good' },
  2: { bg: 'rgba(245,158,11,0.1)', color: '#D97706', label: 'Fair' },
  1: { bg: 'rgba(239,68,68,0.08)', color: '#DC2626', label: 'Poor' },
};

/* ── Club-specific options ─────────────────────────────── */

const SHAFT_FLEX = ['Regular', 'Stiff', 'Extra Stiff', 'Senior', 'Ladies'];
const DEXTERITY = ['Right Handed', 'Left Handed'];

/* ── Sort ───────────────────────────────────────────────── */

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Most recent' },
  { value: 'price:asc', label: 'Price low-high' },
  { value: 'price:desc', label: 'Price high-low' },
  { value: 'views:desc', label: 'Most popular' },
];

/* ── Helpers ────────────────────────────────────────────── */

function getSpec(listing: ListingWithSeller, key: string): string | undefined {
  const s = listing.specifications as Record<string, string | undefined> | null;
  return s?.[key] || undefined;
}

function buildSpecLine(listing: ListingWithSeller): string {
  const parts: string[] = [];
  const cat = listing.category;
  if (cat === 'Clubs' || cat === 'Shafts, Grips & Heads') {
    const loft = getSpec(listing, 'loft');
    const flex = getSpec(listing, 'shaftFlex');
    const dex = getSpec(listing, 'dexterity');
    if (loft) parts.push(`${loft}°`);
    if (flex) parts.push(flex);
    if (dex) parts.push(dex);
  } else if (cat === 'Clothing') {
    const sz = getSpec(listing, 'size');
    const col = getSpec(listing, 'colour');
    if (sz) parts.push(`Size ${sz}`);
    if (col) parts.push(col);
  } else if (cat === 'Shoes') {
    const sz = getSpec(listing, 'size');
    const col = getSpec(listing, 'colour');
    if (sz) parts.push(`UK ${sz}`);
    if (col) parts.push(col);
  } else if (cat === 'Balls') {
    if (listing.ball_condition_type) parts.push(listing.ball_condition_type);
  }
  return parts.join(' · ');
}

function fmtCount(n: number): string {
  return n.toLocaleString('en-GB');
}

/* ── Result card (inline — new design) ──────────────────── */

function ResultCard({ listing }: { listing: ListingWithSeller }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isFav, setIsFav] = useState(false);
  const alive = useRef(true);

  const image = listing.images
    ?.sort(
      (a, b) =>
        (a.display_order || 0) - (b.display_order || 0) ||
        (a.id || '').localeCompare(b.id || ''),
    )[0]?.image_url;

  const cond = listing.condition_overall ? CONDITION_BADGE[listing.condition_overall] : null;
  const verified = listing.users?.is_verified_seller;
  const spec = buildSpecLine(listing);
  const price = Number(listing.price) * 1.075 + 0.99;

  useEffect(() => {
    alive.current = true;
    if (!isAuthenticated || !listing.id) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await checkFavourite(listing.id);
        if (!cancelled && alive.current) setIsFav(r.is_favourite);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; alive.current = false; };
  }, [isAuthenticated, listing.id]);

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { router.push(`/login?redirect=/listings/${listing.id}`); return; }
    const was = isFav;
    setIsFav(!was);
    try {
      if (was) await removeFavourite(listing.id);
      else await addFavourite(listing.id);
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) setIsFav(was);
    }
  };

  return (
    <Link href={`/listings/${listing.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        {/* Image */}
        <div style={{
          position: 'relative', width: '100%', aspectRatio: '1/1',
          borderRadius: 14, overflow: 'hidden', backgroundColor: '#F7F7F5',
        }}>
          {image ? (
            <img
              src={image} alt={listing.title} loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <Search size={40} color="#D1D5DB" />
            </div>
          )}

          {/* Favourite — top right */}
          <button
            onClick={toggleFav}
            aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
            style={{
              position: 'absolute', top: 8, right: 8, width: 34, height: 34,
              borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)',
              border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.15s, background-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Heart size={18} color={isFav ? '#1DC690' : '#9CA3AF'} fill={isFav ? '#1DC690' : 'none'} />
          </button>

          {/* Verified — bottom left */}
          {verified && (
            <div style={{
              position: 'absolute', bottom: 8, left: 8,
              backgroundColor: 'rgba(29,198,144,0.9)', color: '#FFFFFF',
              fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500,
              borderRadius: 10, padding: '3px 9px',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <Check size={11} strokeWidth={3} />
              Verified
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ paddingTop: 10 }}>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
            color: '#06070A', margin: 0, lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {listing.brand || listing.title}
          </p>
          {(listing.model || listing.subcategory) && (
            <p style={{
              fontFamily: 'var(--font-sans)', fontSize: 14, color: '#6B7280',
              margin: '2px 0 0', lineHeight: 1.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {listing.model || listing.subcategory}
            </p>
          )}
          {spec && (
            <p style={{
              fontFamily: 'var(--font-sans)', fontSize: 12, color: '#9CA3AF',
              margin: '4px 0 0', lineHeight: 1.3,
            }}>
              {spec}
            </p>
          )}
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600,
            color: '#1DC690', margin: '6px 0 0',
          }}>
            £{price.toFixed(2)}
          </p>
          {cond && (
            <span style={{
              display: 'inline-block', fontFamily: 'var(--font-sans)',
              fontSize: 11, fontWeight: 500, borderRadius: 10,
              padding: '3px 9px', marginTop: 6,
              backgroundColor: cond.bg, color: cond.color,
            }}>
              {cond.label}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ── Skeleton card ──────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div>
      <div style={{
        width: '100%', aspectRatio: '1/1', borderRadius: 14,
        backgroundColor: '#F7F7F5',
        animation: 'skeletonPulse 1.5s ease-in-out infinite',
      }} />
      <div style={{ paddingTop: 10 }}>
        <div style={{ height: 14, borderRadius: 6, backgroundColor: '#F7F7F5', width: '70%', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 12, borderRadius: 6, backgroundColor: '#F7F7F5', width: '50%', marginTop: 6, animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 14, borderRadius: 6, backgroundColor: '#F7F7F5', width: '35%', marginTop: 8, animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
      </div>
    </div>
  );
}

/* ── Shared styles ──────────────────────────────────────── */

const F = 'var(--font-sans)';

function filterBtnStyle(active: boolean): React.CSSProperties {
  return {
    fontFamily: F, fontSize: 13, fontWeight: 500,
    padding: '8px 14px', borderRadius: 8,
    border: active ? 'none' : '1px solid #E0E0E0',
    backgroundColor: active ? '#06070A' : '#FFFFFF',
    color: active ? '#FFFFFF' : '#06070A',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    gap: 6, whiteSpace: 'nowrap' as const,
    transition: 'border-color 0.15s, background-color 0.15s',
  };
}

const DROP: React.CSSProperties = {
  position: 'absolute', top: '100%', left: 0, marginTop: 8,
  backgroundColor: '#FFFFFF', border: '1px solid #E0E0E0',
  borderRadius: 12, padding: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  maxHeight: 300, overflowY: 'auto', zIndex: 20, minWidth: 200,
};

const APPLY_BTN: React.CSSProperties = {
  marginTop: 8, width: '100%', padding: '6px 0', borderRadius: 8,
  border: 'none', backgroundColor: '#1DC690', color: '#FFFFFF',
  fontFamily: F, fontSize: 12, fontWeight: 600, cursor: 'pointer',
};

const OPT_ROW: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '6px 4px', cursor: 'pointer',
  fontFamily: F, fontSize: 13, color: '#06070A',
};

/* ── Main content ───────────────────────────────────────── */

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  /* existing state */
  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  /* new UI state */
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [brandSearch, setBrandSearch] = useState('');
  const [localMin, setLocalMin] = useState('');
  const [localMax, setLocalMax] = useState('');
  const [localLoft, setLocalLoft] = useState('');
  const barRef = useRef<HTMLDivElement>(null);

  const query = searchParams.get('q') || '';
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

  /* ── filter params (existing logic preserved) ── */
  const getFilterParams = useCallback(() => {
    const p: Record<string, string | undefined> = {};
    ['category', 'subcategory', 'minPrice', 'maxPrice', 'condition',
     'brand', 'gender', 'dexterity', 'shaftFlex', 'shaftMaterial',
     'size', 'loft'].forEach((k) => {
      const v = searchParams.get(k);
      if (v) p[k] = v;
    });
    return p;
  }, [searchParams]);

  /* ── fetch (existing logic preserved) ── */
  const fetchListings = useCallback(async (pageNum: number, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    try {
      const fp = getFilterParams();
      const rawCat = fp.category;
      const dbCat = rawCat ? (CATEGORY_SLUG_TO_DB[rawCat] || rawCat) : undefined;
      const res = await searchListings({
        query: query || undefined,
        ...fp,
        category: dbCat,
        minPrice: fp.minPrice ? Number(fp.minPrice) : undefined,
        maxPrice: fp.maxPrice ? Number(fp.maxPrice) : undefined,
        condition: fp.condition ? Number(fp.condition) : undefined,
        sortBy, sortOrder,
        page: pageNum, limit: 20,
      });
      const nl = res.listings || [];
      setListings(append ? (prev) => [...prev, ...nl] : nl);
      setTotal(res.pagination?.total || (res as any).total || 0);
      setHasMore(pageNum < (res.pagination?.pages || (res as any).totalPages || 0));
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query, sortBy, sortOrder, getFilterParams]);

  useEffect(() => { setPage(1); fetchListings(1); }, [fetchListings]);

  /* ── handlers (existing logic preserved) ── */
  const handleLoadMore = () => {
    const np = page + 1;
    setPage(np);
    fetchListings(np, true);
  };

  const handleFilterChange = (key: string, value: string | undefined) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    if (key === 'category') {
      ['subcategory', 'brand', 'shaftFlex', 'dexterity', 'loft',
       'shaftMaterial', 'size', 'gender'].forEach((k) => p.delete(k));
    }
    router.push(`/search?${p.toString()}`);
  };

  const handleClearAll = () => {
    const p = new URLSearchParams();
    if (query) p.set('q', query);
    router.push(`/search?${p.toString()}`);
  };

  const handleSortChange = (v: string) => {
    const p = new URLSearchParams(searchParams.toString());
    const [by, ord] = v.split(':');
    p.set('sortBy', by);
    p.set('sortOrder', ord);
    router.push(`/search?${p.toString()}`);
  };

  /* ── close dropdown on outside click ── */
  useEffect(() => {
    if (!openFilter) return;
    const h = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpenFilter(null);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [openFilter]);

  /* ── sync local price/loft with URL ── */
  useEffect(() => {
    setLocalMin(searchParams.get('minPrice') || '');
    setLocalMax(searchParams.get('maxPrice') || '');
    setLocalLoft(searchParams.get('loft') || '');
  }, [searchParams]);

  /* ── derived ── */
  const fp = getFilterParams();
  const rawCat = fp.category;
  const cat = rawCat ? (CATEGORY_SLUG_TO_DB[rawCat] || rawCat) : undefined;
  const isClubs = cat === 'Clubs' || cat === 'Shafts, Grips & Heads';
  const subcats = cat ? (SUBCATEGORIES[cat] || []) : [];
  const catBrands = cat ? (BRANDS[cat] || []) : [];
  const popBrands = cat ? (POPULAR_BRANDS[cat] || DEFAULT_BRANDS) : DEFAULT_BRANDS;
  const filteredBrands = brandSearch
    ? catBrands.filter((b) => b.toLowerCase().includes(brandSearch.toLowerCase()))
    : catBrands;

  /* active filter tags */
  const tags: { key: string; label: string }[] = [];
  if (fp.category) {
    const c = CATEGORIES.find((x) => x.db === cat);
    tags.push({ key: 'category', label: c?.display || fp.category });
  }
  if (fp.subcategory) tags.push({ key: 'subcategory', label: fp.subcategory });
  if (fp.brand) tags.push({ key: 'brand', label: fp.brand });
  if (fp.condition) {
    const c = CONDITIONS.find((x) => String(x.value) === fp.condition);
    tags.push({ key: 'condition', label: c?.label || fp.condition });
  }
  if (fp.shaftFlex) tags.push({ key: 'shaftFlex', label: fp.shaftFlex });
  if (fp.dexterity) tags.push({ key: 'dexterity', label: fp.dexterity });
  if (fp.loft) tags.push({ key: 'loft', label: `Loft ${fp.loft}°` });
  if (fp.minPrice || fp.maxPrice) {
    const l = fp.minPrice && fp.maxPrice
      ? `£${fp.minPrice} – £${fp.maxPrice}`
      : fp.minPrice ? `From £${fp.minPrice}` : `Up to £${fp.maxPrice}`;
    tags.push({ key: 'price', label: l });
  }
  if (fp.gender) tags.push({ key: 'gender', label: fp.gender });
  if (fp.size) tags.push({ key: 'size', label: `Size ${fp.size}` });

  const removeTag = (key: string) => {
    if (key === 'price') {
      const p = new URLSearchParams(searchParams.toString());
      p.delete('minPrice'); p.delete('maxPrice'); p.delete('page');
      router.push(`/search?${p.toString()}`);
    } else {
      handleFilterChange(key, undefined);
    }
  };

  /* title */
  const title = query
    ? `Results for '${query}'`
    : cat
      ? (CATEGORIES.find((x) => x.db === cat)?.display || cat)
      : 'Search results';

  /* breadcrumb */
  const crumbs: { label: string; href?: string }[] = [];
  if (cat) {
    const disp = CATEGORIES.find((x) => x.db === cat)?.display || cat;
    if (fp.subcategory) {
      crumbs.push({ label: disp, href: `/search?category=${encodeURIComponent(cat)}` });
      crumbs.push({ label: fp.subcategory });
    } else {
      crumbs.push({ label: disp });
    }
  }

  const toggle = (name: string) => { setOpenFilter(openFilter === name ? null : name); setBrandSearch(''); };

  const applyPrice = () => {
    const p = new URLSearchParams(searchParams.toString());
    if (localMin) p.set('minPrice', localMin); else p.delete('minPrice');
    if (localMax) p.set('maxPrice', localMax); else p.delete('maxPrice');
    p.delete('page');
    router.push(`/search?${p.toString()}`);
    setOpenFilter(null);
  };

  const applyLoft = () => {
    handleFilterChange('loft', localLoft || undefined);
    setOpenFilter(null);
  };

  /* hover helpers for filter buttons */
  const hoverIn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = '#D1D5DB';
    e.currentTarget.style.backgroundColor = '#FAFAF8';
  };
  const hoverOut = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = '#E0E0E0';
    e.currentTarget.style.backgroundColor = '#FFFFFF';
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      <style>{`@keyframes skeletonPulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px' }}>

        {/* ── BREADCRUMB ── */}
        {crumbs.length > 0 && (
          <nav style={{ paddingTop: 16, paddingBottom: 4 }} aria-label="Breadcrumb">
            <ol style={{
              display: 'flex', alignItems: 'center', gap: 6,
              listStyle: 'none', margin: 0, padding: 0,
              fontFamily: F, fontSize: 13, flexWrap: 'wrap',
            }}>
              <li>
                <Link
                  href="/"
                  style={{ color: '#9CA3AF', textDecoration: 'none' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#1DC690'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF'; }}
                >Home</Link>
              </li>
              {crumbs.map((c, i) => (
                <React.Fragment key={i}>
                  <li style={{ color: '#9CA3AF' }} aria-hidden>&rsaquo;</li>
                  <li>
                    {c.href ? (
                      <Link
                        href={c.href}
                        style={{ color: '#9CA3AF', textDecoration: 'none' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#1DC690'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF'; }}
                      >{c.label}</Link>
                    ) : (
                      <span style={{ color: '#06070A' }}>{c.label}</span>
                    )}
                  </li>
                </React.Fragment>
              ))}
            </ol>
          </nav>
        )}

        {/* ── TITLE + COUNT ── */}
        <div style={{ paddingTop: crumbs.length > 0 ? 8 : 24, paddingBottom: 20 }}>
          <h1 style={{ fontFamily: F, fontSize: 26, fontWeight: 600, color: '#06070A', margin: 0 }}>
            {title}
          </h1>
          {!loading && (
            <p style={{ fontFamily: F, fontSize: 13, color: '#9CA3AF', margin: '4px 0 0' }}>
              ({fmtCount(total)} result{total !== 1 ? 's' : ''})
            </p>
          )}
        </div>

        {/* ── POPULAR BRANDS ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          paddingBottom: 20, borderBottom: '1px solid #E5E7EB',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: '#06070A', whiteSpace: 'nowrap' }}>
            Popular brands
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {popBrands.map((b) => {
              const active = fp.brand === b;
              return (
                <button
                  key={b}
                  onClick={() => handleFilterChange('brand', active ? undefined : b)}
                  style={{
                    fontFamily: F, fontSize: 13,
                    padding: '6px 16px', borderRadius: 20,
                    border: active ? 'none' : '1px solid #E0E0E0',
                    backgroundColor: active ? '#06070A' : '#FFFFFF',
                    color: active ? '#FFFFFF' : '#06070A',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = '#1DC690'; e.currentTarget.style.color = '#1DC690'; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.color = '#06070A'; } }}
                >
                  {b}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── FILTER BAR ── */}
        <div
          ref={barRef}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            paddingTop: 16, paddingBottom: 16,
            overflowX: 'auto', position: 'relative',
          }}
        >
          {/* Category */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => toggle('category')}
              style={filterBtnStyle(!!fp.category)}
              onMouseEnter={!fp.category ? hoverIn : undefined}
              onMouseLeave={!fp.category ? hoverOut : undefined}
            >
              Category <ChevronDown size={14} color={fp.category ? '#FFFFFF' : '#9CA3AF'} />
            </button>
            {openFilter === 'category' && (
              <div style={DROP}>
                {CATEGORIES.map((c) => (
                  <label key={c.db} style={OPT_ROW}>
                    <input
                      type="radio" name="f-cat"
                      checked={cat === c.db}
                      onChange={() => { handleFilterChange('category', cat === c.db ? undefined : c.db); setOpenFilter(null); }}
                      style={{ accentColor: '#1DC690' }}
                    />
                    {c.display}
                  </label>
                ))}
                <button onClick={() => setOpenFilter(null)} style={APPLY_BTN}>Apply</button>
              </div>
            )}
          </div>

          {/* Subcategory */}
          {subcats.length > 0 && (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => toggle('subcategory')}
                style={filterBtnStyle(!!fp.subcategory)}
                onMouseEnter={!fp.subcategory ? hoverIn : undefined}
                onMouseLeave={!fp.subcategory ? hoverOut : undefined}
              >
                Subcategory <ChevronDown size={14} color={fp.subcategory ? '#FFFFFF' : '#9CA3AF'} />
              </button>
              {openFilter === 'subcategory' && (
                <div style={DROP}>
                  {subcats.map((s) => (
                    <label key={s} style={OPT_ROW}>
                      <input
                        type="radio" name="f-sub"
                        checked={fp.subcategory === s}
                        onChange={() => { handleFilterChange('subcategory', fp.subcategory === s ? undefined : s); setOpenFilter(null); }}
                        style={{ accentColor: '#1DC690' }}
                      />
                      {s}
                    </label>
                  ))}
                  <button onClick={() => setOpenFilter(null)} style={APPLY_BTN}>Apply</button>
                </div>
              )}
            </div>
          )}

          {/* Brand (searchable) */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => toggle('brand')}
              style={filterBtnStyle(!!fp.brand)}
              onMouseEnter={!fp.brand ? hoverIn : undefined}
              onMouseLeave={!fp.brand ? hoverOut : undefined}
            >
              Brand <ChevronDown size={14} color={fp.brand ? '#FFFFFF' : '#9CA3AF'} />
            </button>
            {openFilter === 'brand' && (
              <div style={DROP}>
                <input
                  type="text" placeholder="Search brands..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '6px 10px', borderRadius: 6,
                    border: '1px solid #E0E0E0', fontFamily: F,
                    fontSize: 13, color: '#06070A', marginBottom: 8,
                    boxSizing: 'border-box' as const,
                  }}
                />
                {filteredBrands.length === 0 && (
                  <p style={{ fontFamily: F, fontSize: 12, color: '#9CA3AF', padding: '8px 4px', margin: 0 }}>
                    No brands found
                  </p>
                )}
                {filteredBrands.map((b) => (
                  <label key={b} style={OPT_ROW}>
                    <input
                      type="radio" name="f-brand"
                      checked={fp.brand === b}
                      onChange={() => { handleFilterChange('brand', fp.brand === b ? undefined : b); setOpenFilter(null); }}
                      style={{ accentColor: '#1DC690' }}
                    />
                    {b}
                  </label>
                ))}
                <button onClick={() => setOpenFilter(null)} style={APPLY_BTN}>Apply</button>
              </div>
            )}
          </div>

          {/* Shaft flex (clubs) */}
          {isClubs && (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => toggle('shaftFlex')}
                style={filterBtnStyle(!!fp.shaftFlex)}
                onMouseEnter={!fp.shaftFlex ? hoverIn : undefined}
                onMouseLeave={!fp.shaftFlex ? hoverOut : undefined}
              >
                Shaft Flex <ChevronDown size={14} color={fp.shaftFlex ? '#FFFFFF' : '#9CA3AF'} />
              </button>
              {openFilter === 'shaftFlex' && (
                <div style={DROP}>
                  {SHAFT_FLEX.map((f) => (
                    <label key={f} style={OPT_ROW}>
                      <input
                        type="radio" name="f-flex"
                        checked={fp.shaftFlex === f}
                        onChange={() => { handleFilterChange('shaftFlex', fp.shaftFlex === f ? undefined : f); setOpenFilter(null); }}
                        style={{ accentColor: '#1DC690' }}
                      />
                      {f}
                    </label>
                  ))}
                  <button onClick={() => setOpenFilter(null)} style={APPLY_BTN}>Apply</button>
                </div>
              )}
            </div>
          )}

          {/* Loft (clubs) */}
          {isClubs && (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => toggle('loft')}
                style={filterBtnStyle(!!fp.loft)}
                onMouseEnter={!fp.loft ? hoverIn : undefined}
                onMouseLeave={!fp.loft ? hoverOut : undefined}
              >
                Loft <ChevronDown size={14} color={fp.loft ? '#FFFFFF' : '#9CA3AF'} />
              </button>
              {openFilter === 'loft' && (
                <div style={{ ...DROP, minWidth: 180 }}>
                  <input
                    type="text" placeholder="e.g. 10.5"
                    value={localLoft}
                    onChange={(e) => setLocalLoft(e.target.value)}
                    style={{
                      width: '100%', padding: '6px 10px', borderRadius: 6,
                      border: '1px solid #E0E0E0', fontFamily: F,
                      fontSize: 13, color: '#06070A',
                      boxSizing: 'border-box' as const,
                    }}
                  />
                  <button onClick={applyLoft} style={APPLY_BTN}>Apply</button>
                </div>
              )}
            </div>
          )}

          {/* Condition */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => toggle('condition')}
              style={filterBtnStyle(!!fp.condition)}
              onMouseEnter={!fp.condition ? hoverIn : undefined}
              onMouseLeave={!fp.condition ? hoverOut : undefined}
            >
              Condition <ChevronDown size={14} color={fp.condition ? '#FFFFFF' : '#9CA3AF'} />
            </button>
            {openFilter === 'condition' && (
              <div style={DROP}>
                {CONDITIONS.map((c) => (
                  <label key={c.value} style={OPT_ROW}>
                    <input
                      type="radio" name="f-cond"
                      checked={fp.condition === String(c.value)}
                      onChange={() => { handleFilterChange('condition', fp.condition === String(c.value) ? undefined : String(c.value)); setOpenFilter(null); }}
                      style={{ accentColor: '#1DC690' }}
                    />
                    {c.label}
                  </label>
                ))}
                <button onClick={() => setOpenFilter(null)} style={APPLY_BTN}>Apply</button>
              </div>
            )}
          </div>

          {/* Price */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => toggle('price')}
              style={filterBtnStyle(!!(fp.minPrice || fp.maxPrice))}
              onMouseEnter={!(fp.minPrice || fp.maxPrice) ? hoverIn : undefined}
              onMouseLeave={!(fp.minPrice || fp.maxPrice) ? hoverOut : undefined}
            >
              Price <ChevronDown size={14} color={(fp.minPrice || fp.maxPrice) ? '#FFFFFF' : '#9CA3AF'} />
            </button>
            {openFilter === 'price' && (
              <div style={{ ...DROP, minWidth: 220 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9CA3AF' }}>&pound;</span>
                    <input
                      type="number" placeholder="Min" value={localMin}
                      onChange={(e) => setLocalMin(e.target.value)}
                      style={{
                        width: '100%', padding: '6px 8px 6px 22px', borderRadius: 6,
                        border: '1px solid #E0E0E0', fontFamily: F,
                        fontSize: 13, color: '#06070A', boxSizing: 'border-box' as const,
                      }}
                    />
                  </div>
                  <span style={{ color: '#9CA3AF', fontSize: 13 }}>&ndash;</span>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9CA3AF' }}>&pound;</span>
                    <input
                      type="number" placeholder="Max" value={localMax}
                      onChange={(e) => setLocalMax(e.target.value)}
                      style={{
                        width: '100%', padding: '6px 8px 6px 22px', borderRadius: 6,
                        border: '1px solid #E0E0E0', fontFamily: F,
                        fontSize: 13, color: '#06070A', boxSizing: 'border-box' as const,
                      }}
                    />
                  </div>
                </div>
                <button onClick={applyPrice} style={APPLY_BTN}>Apply</button>
              </div>
            )}
          </div>

          {/* Dexterity (clubs) */}
          {isClubs && (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => toggle('dexterity')}
                style={filterBtnStyle(!!fp.dexterity)}
                onMouseEnter={!fp.dexterity ? hoverIn : undefined}
                onMouseLeave={!fp.dexterity ? hoverOut : undefined}
              >
                Dexterity <ChevronDown size={14} color={fp.dexterity ? '#FFFFFF' : '#9CA3AF'} />
              </button>
              {openFilter === 'dexterity' && (
                <div style={DROP}>
                  {DEXTERITY.map((d) => (
                    <label key={d} style={OPT_ROW}>
                      <input
                        type="radio" name="f-dex"
                        checked={fp.dexterity === d}
                        onChange={() => { handleFilterChange('dexterity', fp.dexterity === d ? undefined : d); setOpenFilter(null); }}
                        style={{ accentColor: '#1DC690' }}
                      />
                      {d}
                    </label>
                  ))}
                  <button onClick={() => setOpenFilter(null)} style={APPLY_BTN}>Apply</button>
                </div>
              )}
            </div>
          )}

          {/* Sort — right aligned */}
          <div style={{ marginLeft: 'auto', position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => toggle('sort')}
              style={filterBtnStyle(false)}
              onMouseEnter={hoverIn}
              onMouseLeave={hoverOut}
            >
              <ArrowUpDown size={14} color="#9CA3AF" />
              Sort
            </button>
            {openFilter === 'sort' && (
              <div style={{ ...DROP, left: 'auto', right: 0 }}>
                {SORT_OPTIONS.map((o) => (
                  <label key={o.value} style={OPT_ROW}>
                    <input
                      type="radio" name="f-sort"
                      checked={`${sortBy}:${sortOrder}` === o.value}
                      onChange={() => { handleSortChange(o.value); setOpenFilter(null); }}
                      style={{ accentColor: '#1DC690' }}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── ACTIVE FILTERS ── */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 16, flexWrap: 'wrap' }}>
            {tags.map((t) => (
              <button
                key={t.key}
                onClick={() => removeTag(t.key)}
                style={{
                  fontFamily: F, fontSize: 12, fontWeight: 500,
                  padding: '6px 12px', borderRadius: 20,
                  backgroundColor: '#06070A', color: '#FFFFFF',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {t.label}
                <X size={12} />
              </button>
            ))}
            <button
              onClick={handleClearAll}
              style={{
                fontFamily: F, fontSize: 12, color: '#9CA3AF',
                background: 'none', border: 'none', cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── RESULTS ── */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '60px 0', textAlign: 'center',
          }}>
            <Search size={48} color="#D1D5DB" />
            <p style={{ fontFamily: F, fontSize: 16, fontWeight: 500, color: '#6B7280', marginTop: 16, marginBottom: 4 }}>
              No results found
            </p>
            <p style={{ fontFamily: F, fontSize: 13, color: '#9CA3AF', margin: 0 }}>
              Try adjusting your filters or search terms
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {listings.map((l) => <ResultCard key={l.id} listing={l} />)}
            </div>

            {hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 32, paddingBottom: 40 }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{
                    fontFamily: F, fontSize: 14, fontWeight: 500,
                    backgroundColor: '#FFFFFF', color: '#1C4670',
                    border: '1px solid #E5E7EB', borderRadius: 12,
                    height: 46, padding: '0 32px',
                    cursor: loadingMore ? 'default' : 'pointer',
                    opacity: loadingMore ? 0.5 : 1,
                    maxWidth: 300, width: '100%',
                    transition: 'opacity 0.15s',
                  }}
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

/* ── Page export ─────────────────────────────────────────── */

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 32px', backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
        <style>{`@keyframes skeletonPulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
