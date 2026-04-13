'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ListingCard, type ListingCardData } from '@/components/ListingCard';
import { CardSkeletonGrid } from '@/components/LoadingSkeleton';
import {
  getPublicProfile,
  getUserStats,
  getSellerStats,
  getUserSoldItems,
  getMyListings,
} from '@mulligans/api-client';
import type { UserStats, SellerStats } from '@mulligans/api-client';
import { getUserReviewStats } from '@mulligans/api-client';
import type { ReviewStats } from '@mulligans/api-client';
import {
  User,
  MapPin,
  Calendar,
  Share2,
  Settings,
  Star,
  ChevronRight,
  ChevronDown,
  ShoppingBag,
  Pencil,
  Search,
  Check,
} from 'lucide-react';

const CLOUDFRONT_BASE = 'https://d1bhj4xuvi3dve.cloudfront.net';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'oldest', label: 'Oldest' },
] as const;

interface ProfileUser {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified_seller: boolean;
  is_pro_store?: boolean;
  pro_store_name?: string | null;
  rating: number;
  total_sales?: number;
  location: string | null;
  bio: string | null;
  created_at: string;
}

export default function MyProfilePage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const aboutRef = useRef<HTMLDivElement>(null);

  // Auth gate
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/profile');
    }
  }, [authLoading, isAuthenticated, router]);

  const userId = authUser?.id;

  // State
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [soldItems, setSoldItems] = useState<any[]>([]);
  const [listingsTotal, setListingsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(false);

  // Listing controls
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [listingsPage, setListingsPage] = useState(1);
  const [hasMoreListings, setHasMoreListings] = useState(false);

  // Bulk actions
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [profileData, statsData, reviewStatsData] = await Promise.all([
        getPublicProfile(userId),
        getUserStats(userId),
        getUserReviewStats(userId),
      ]);
      const userData = (profileData as any).user || profileData;
      setProfile(userData);
      setStats(statsData);
      setReviewStats(reviewStatsData);

      try {
        const sellerData = await getSellerStats(userId);
        setSellerStats(sellerData);
      } catch { /* seller stats not available */ }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadListings = useCallback(async (page = 1, append = false) => {
    if (!userId) return;
    try {
      setListingsLoading(true);
      if (activeTab === 'active') {
        const data = await getMyListings({
          page, limit: 20, status: 'active',
          sort: sortBy, search: searchQuery || undefined,
        });
        const newListings = data.listings || [];
        setListings(append ? (prev) => [...prev, ...newListings] : newListings);
        setListingsTotal(data.total || 0);
        setHasMoreListings(page < (data.totalPages || 1));
      } else {
        const data = await getUserSoldItems(userId);
        const items = (data as any).items || (data as any) || [];
        setSoldItems(Array.isArray(items) ? items : []);
      }
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setListingsLoading(false);
    }
  }, [userId, activeTab, sortBy, searchQuery]);

  useEffect(() => { if (!authLoading && userId) loadProfile(); }, [loadProfile, authLoading, userId]);
  useEffect(() => { if (!loading && userId) { setListingsPage(1); loadListings(1); } }, [activeTab, sortBy, searchQuery, loading, userId]);

  const handleShare = async () => {
    const url = `${window.location.origin}/user/${userId}`;
    try {
      if (navigator.share) { await navigator.share({ title: profile?.display_name || 'Profile', url }); }
      else { await navigator.clipboard.writeText(url); alert('Profile link copied to clipboard!'); }
    } catch { /* cancelled */ }
  };

  const handleLoadMore = () => { const next = listingsPage + 1; setListingsPage(next); loadListings(next, true); };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const scrollToAbout = () => { aboutRef.current?.scrollIntoView({ behavior: 'smooth' }); };

  const executeBulkAction = async (action: 'sold' | 'inactive' | 'delete') => {
    const ids = Array.from(selectedIds);
    const labels: Record<string, string> = { sold: 'Mark as Sold', inactive: 'Deactivate', delete: 'Delete' };
    if (!confirm(`${labels[action]} ${ids.length} listing(s)?${action === 'delete' ? ' This cannot be undone.' : ''}`)) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com';
      const token = localStorage.getItem('mulligans_auth_token');
      await Promise.all(ids.map(id =>
        action === 'delete'
          ? fetch(`${baseUrl}/api/listings/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
          : fetch(`${baseUrl}/api/listings/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: action }) })
      ));
      setBulkMode(false);
      setSelectedIds(new Set());
      loadListings(1);
    } catch { alert('Failed to update listings.'); }
  };

  const memberYear = profile?.created_at ? new Date(profile.created_at).getFullYear() : null;
  const avatarUrl = profile?.avatar_url
    ? profile.avatar_url.startsWith('http') ? profile.avatar_url : `${CLOUDFRONT_BASE}/${profile.avatar_url}`
    : null;
  const hasReviews = (reviewStats?.total_reviews || 0) > 0;
  const showSellerDashboard = (stats?.sales || 0) > 0 || (stats?.activeListingsCount || 0) > 0;

  // Loading
  if (loading || authLoading || !userId) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#EAEAE0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 16px' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#E5E7EB', animation: 'pulse 2s infinite' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 24, width: 200, backgroundColor: '#E5E7EB', borderRadius: 8, marginBottom: 8, animation: 'pulse 2s infinite' }} />
              <div style={{ height: 16, width: 140, backgroundColor: '#E5E7EB', borderRadius: 8, animation: 'pulse 2s infinite' }} />
            </div>
          </div>
          <div style={{ height: 72, backgroundColor: '#E5E7EB', borderRadius: 12, marginBottom: 24, animation: 'pulse 2s infinite' }} />
          <CardSkeletonGrid count={8} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#EAEAE0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px 64px' }}>

        {/* ═══ PROFILE HEADER ═══ */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
          <div style={{ flexShrink: 0 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={profile?.display_name || 'You'} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={36} color="#9CA3AF" />
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
              {profile?.display_name || 'Mulligans User'}
            </h1>
            {profile?.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 14, marginBottom: 2 }}>
                <MapPin size={14} /> <span>{profile.location}</span>
              </div>
            )}
            {memberYear && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 14 }}>
                <Calendar size={14} /> <span>Member since {memberYear}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button onClick={handleShare} style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Share profile">
              <Share2 size={18} color="#6B7280" />
            </button>
            <Link href="/settings" style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid #E5E7EB', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }} title="Settings">
              <Settings size={18} color="#6B7280" />
            </Link>
          </div>
        </div>

        {/* ═══ DARK STATS BAR ═══ */}
        <div style={{ backgroundColor: '#1C4670', borderRadius: 12, padding: '16px 0', display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>{stats?.sales || 0}</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 0' }}>Sales</p>
          </div>
          <div style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <Link href={`/user/${userId}/reviews`} style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
            {hasReviews ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Star size={18} fill="#F59E0B" color="#F59E0B" />
                <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{Number(stats?.rating || 0).toFixed(1)}</span>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>({reviewStats?.total_reviews})</span>
              </div>
            ) : (
              <p style={{ fontSize: 14, fontWeight: 600, color: '#9CA3AF', margin: 0 }}>No reviews yet</p>
            )}
          </Link>
          <div style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <button onClick={scrollToAbout} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>About</span>
            <ChevronRight size={16} color="#fff" />
          </button>
        </div>

        {/* ═══ ABOUT SECTION ═══ */}
        <div ref={aboutRef} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>About</h2>
            <Link href="/settings/profile" style={{ fontSize: 14, fontWeight: 600, color: '#1DC690', textDecoration: 'none' }}>Edit Profile</Link>
          </div>
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: '0 0 12px' }}>
            {profile?.bio || 'No bio yet. Add one in your profile settings.'}
          </p>
          {memberYear && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 14 }}>
              <Calendar size={16} color="#1DC690" /> <span>Member since {memberYear}</span>
            </div>
          )}
        </div>

        {/* ═══ SELLER DASHBOARD + ORDERS ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
          {showSellerDashboard && (
            <div style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#1DC690', padding: '12px 20px' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Seller Dashboard</h3>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <p style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>£{(sellerStats?.todayEarnings || 0).toFixed(2)}</p>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>Today</p>
                  </div>
                  <div style={{ width: 1, backgroundColor: '#E5E7EB' }} />
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <p style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>{sellerStats?.totalViews || 0}</p>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>Views (All Time)</p>
                  </div>
                  <div style={{ width: 1, backgroundColor: '#E5E7EB' }} />
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <p style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>{sellerStats?.totalFavorites || 0}</p>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>Favourites</p>
                  </div>
                </div>
                <Link href={profile?.is_pro_store ? 'https://dashboard.mulligans.uk.com' : '/settings'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: '#1DC690', textDecoration: 'none' }}>
                  View Full Dashboard <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          )}

          <div style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#278AB0', padding: '12px 20px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Orders</h3>
            </div>
            <div>
              <Link href="/orders?tab=purchases" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', textDecoration: 'none', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><ShoppingBag size={18} color="#278AB0" /><span style={{ fontSize: 15, fontWeight: 500, color: '#111827' }}>Buying</span></div>
                <ChevronRight size={18} color="#9CA3AF" />
              </Link>
              <Link href="/orders?tab=sales" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Pencil size={18} color="#278AB0" /><span style={{ fontSize: 15, fontWeight: 500, color: '#111827' }}>Selling</span></div>
                <ChevronRight size={18} color="#9CA3AF" />
              </Link>
            </div>
          </div>
        </div>

        {/* ═══ LISTINGS ═══ */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16 }}>
            <button onClick={() => setActiveTab('active')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: activeTab === 'active' ? 700 : 500, color: activeTab === 'active' ? '#111827' : '#9CA3AF', borderBottom: activeTab === 'active' ? '2px solid #1DC690' : '2px solid transparent', paddingBottom: 8 }}>
              Active Listings ({listingsTotal})
            </button>
            <button onClick={() => setActiveTab('sold')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: activeTab === 'sold' ? 700 : 500, color: activeTab === 'sold' ? '#111827' : '#9CA3AF', borderBottom: activeTab === 'sold' ? '2px solid #1DC690' : '2px solid transparent', paddingBottom: 8 }}>
              Sold
            </button>
          </div>

          {/* Search + Sort (active tab only) */}
          {activeTab === 'active' && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 280px', position: 'relative' }}>
                <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" placeholder="Search your listings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowSortDropdown(!showSortDropdown)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 8, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#374151', whiteSpace: 'nowrap' }}>
                  {SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort'} <ChevronDown size={16} />
                </button>
                {showSortDropdown && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', minWidth: 200, zIndex: 40, overflow: 'hidden' }}>
                    {SORT_OPTIONS.map((opt) => (
                      <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSortDropdown(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: 'none', backgroundColor: sortBy === opt.value ? '#F0FDF4' : 'transparent', cursor: 'pointer', fontSize: 14, color: sortBy === opt.value ? '#1DC690' : '#374151', fontWeight: sortBy === opt.value ? 600 : 400 }}>
                        {opt.label} {sortBy === opt.value && <Check size={16} color="#1DC690" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }} style={{ padding: '12px 16px', borderRadius: 8, border: bulkMode ? '2px solid #1DC690' : '1px solid #E5E7EB', backgroundColor: bulkMode ? '#F0FDF4' : '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: bulkMode ? '#1DC690' : '#374151', whiteSpace: 'nowrap' }}>
                {bulkMode ? 'Cancel' : 'Bulk Actions'}
              </button>
            </div>
          )}

          {/* Listings Grid */}
          {listingsLoading && listings.length === 0 ? (
            <CardSkeletonGrid count={8} />
          ) : activeTab === 'sold' ? (
            soldItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
                <ShoppingBag size={48} color="#D1D5DB" style={{ margin: '0 auto 16px', display: 'block' }} />
                <p style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>No sold items yet</p>
                <p style={{ fontSize: 14 }}>Your sold items will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {soldItems.map((item: any) => {
                  const img = item.images?.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0) || (a.id || '').localeCompare(b.id || ''))[0]?.image_url;
                  return (
                    <Link key={item.id} href={`/listings/${item.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <div style={{ aspectRatio: '3/4', backgroundColor: '#F4F4F0', position: 'relative' }}>
                          {img ? (<img src={img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D1D5DB', fontSize: 36 }}>🏌️</div>
                          )}
                          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(6,7,10,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ backgroundColor: '#06070A', color: '#fff', padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>SOLD</span>
                          </div>
                        </div>
                        <div style={{ padding: 12 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#9CA3AF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                          <p style={{ fontSize: 15, fontWeight: 700, color: '#9CA3AF', margin: '4px 0 0' }}>£{Number(item.price).toFixed(0)}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          ) : listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
              <Search size={48} color="#D1D5DB" style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>No listings found</p>
              <p style={{ fontSize: 14 }}>{searchQuery ? 'Try adjusting your search' : 'Start selling to see your listings here'}</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {listings.map((listing: any) => (
                  <div key={listing.id} style={{ position: 'relative' }}>
                    {bulkMode && (
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelect(listing.id); }} style={{ position: 'absolute', top: 8, left: 8, zIndex: 10, width: 28, height: 28, borderRadius: 6, border: selectedIds.has(listing.id) ? '2px solid #1DC690' : '2px solid #D1D5DB', backgroundColor: selectedIds.has(listing.id) ? '#1DC690' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedIds.has(listing.id) && <Check size={16} color="#fff" />}
                      </button>
                    )}
                    <ListingCard listing={listing as ListingCardData} />
                  </div>
                ))}
              </div>
              {hasMoreListings && (
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <button onClick={handleLoadMore} disabled={listingsLoading} style={{ padding: '12px 32px', borderRadius: 8, border: '2px solid #1DC690', backgroundColor: 'transparent', color: '#1DC690', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: listingsLoading ? 0.5 : 1 }}>
                    {listingsLoading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ═══ BULK ACTION BAR ═══ */}
        {bulkMode && selectedIds.size > 0 && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTop: '1px solid #E5E7EB', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 30, boxShadow: '0 -2px 10px rgba(0,0,0,0.1)' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{selectedIds.size} selected</span>
            <button onClick={() => executeBulkAction('sold')} style={{ padding: '10px 20px', borderRadius: 8, backgroundColor: '#1DC690', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Mark as Sold</button>
            <button onClick={() => executeBulkAction('inactive')} style={{ padding: '10px 20px', borderRadius: 8, backgroundColor: '#F59E0B', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Deactivate</button>
            <button onClick={() => executeBulkAction('delete')} style={{ padding: '10px 20px', borderRadius: 8, backgroundColor: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}
