'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ListingCard, type ListingCardData } from '@/components/ListingCard';
import { CardSkeletonGrid } from '@/components/LoadingSkeleton';
import {
  getPublicProfile, getUserStats, getSellerStats, getUserSoldItems, getMyListings,
} from '@mulligans/api-client';
import type { UserStats, SellerStats } from '@mulligans/api-client';
import { getUserReviewStats } from '@mulligans/api-client';
import type { ReviewStats } from '@mulligans/api-client';
import {
  User, MapPin, Calendar, Share2, Settings, Star, ChevronRight, ChevronDown,
  ShoppingBag, Pencil, Search, Check, ShieldCheck, Tag, Inbox, Send,
  Zap, Package, Eye, Heart,
} from 'lucide-react';

const CLOUDFRONT_BASE = 'https://d1bhj4xuvi3dve.cloudfront.net';
const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'oldest', label: 'Oldest' },
] as const;

function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith('http') ? url : `${CLOUDFRONT_BASE}/${url}`;
}

interface ProfileUser {
  id: string; display_name: string | null; avatar_url: string | null;
  is_verified_seller: boolean; is_pro_store?: boolean; pro_store_name?: string | null;
  rating: number; total_sales?: number; location: string | null; bio: string | null; created_at: string;
}

export default function MyProfilePage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  useEffect(() => { if (!authLoading && !isAuthenticated) router.replace('/login?redirect=/profile'); }, [authLoading, isAuthenticated, router]);
  const userId = authUser?.id;

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [soldItems, setSoldItems] = useState<any[]>([]);
  const [listingsTotal, setListingsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [listingsPage, setListingsPage] = useState(1);
  const [hasMoreListings, setHasMoreListings] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [profileData, statsData, reviewStatsData] = await Promise.all([
        getPublicProfile(userId), getUserStats(userId), getUserReviewStats(userId),
      ]);
      setProfile((profileData as any).user || profileData);
      setStats(statsData); setReviewStats(reviewStatsData);
      try { setSellerStats(await getSellerStats(userId)); } catch {}
    } catch (err) { console.error('Failed to load profile:', err); }
    finally { setLoading(false); }
  }, [userId]);

  const loadListings = useCallback(async (page = 1, append = false) => {
    if (!userId) return;
    try {
      setListingsLoading(true);
      if (activeTab === 'active') {
        const data = await getMyListings({ page, limit: 20, status: 'active', sort: sortBy, search: searchQuery || undefined });
        const items = data.listings || [];
        setListings(append ? (prev) => [...prev, ...items] : items);
        setListingsTotal(data.total || 0);
        setHasMoreListings(page < (data.totalPages || 1));
      } else {
        const data = await getUserSoldItems(userId);
        const items = (data as any).items || (data as any) || [];
        setSoldItems(Array.isArray(items) ? items : []);
      }
    } catch (err) { console.error('Failed to load listings:', err); }
    finally { setListingsLoading(false); }
  }, [userId, activeTab, sortBy, searchQuery]);

  useEffect(() => { if (!authLoading && userId) loadProfile(); }, [loadProfile, authLoading, userId]);
  useEffect(() => { if (!loading && userId) { setListingsPage(1); loadListings(1); } }, [activeTab, sortBy, searchQuery, loading, userId]);

  const handleShare = async () => {
    const url = `${window.location.origin}/user/${userId}`;
    try { if (navigator.share) await navigator.share({ title: profile?.display_name || 'Profile', url }); else { await navigator.clipboard.writeText(url); alert('Profile link copied!'); } } catch {}
  };
  const handleLoadMore = () => { const n = listingsPage + 1; setListingsPage(n); loadListings(n, true); };
  const toggleSelect = (id: string) => { setSelectedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }); };
  const executeBulkAction = async (action: 'sold' | 'inactive' | 'delete') => {
    const ids = Array.from(selectedIds);
    if (!confirm(`${action === 'delete' ? 'Delete' : action === 'sold' ? 'Mark as Sold' : 'Deactivate'} ${ids.length} listing(s)?${action === 'delete' ? ' This cannot be undone.' : ''}`)) return;
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com';
      const token = localStorage.getItem('mulligans_auth_token');
      await Promise.all(ids.map(id =>
        action === 'delete'
          ? fetch(`${base}/api/listings/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
          : fetch(`${base}/api/listings/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: action }) })
      ));
      setBulkMode(false); setSelectedIds(new Set()); loadListings(1);
    } catch { alert('Failed to update listings.'); }
  };

  const memberYear = profile?.created_at ? new Date(profile.created_at).getFullYear() : null;
  const avatarUrl = resolveImageUrl(profile?.avatar_url);
  const hasReviews = (reviewStats?.total_reviews || 0) > 0;
  const showSellerDashboard = (stats?.sales || 0) > 0 || (stats?.activeListingsCount || 0) > 0;
  const categories = useMemo(() => {
    const cats = new Set<string>();
    listings.forEach((l: any) => { if (l.category) cats.add(l.category); });
    return Array.from(cats).slice(0, 4);
  }, [listings]);

  if (loading || authLoading || !userId) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#EAEAE0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 16px' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#E5E7EB' }} />
            <div><div style={{ height: 24, width: 180, backgroundColor: '#E5E7EB', borderRadius: 6, marginBottom: 10 }} /><div style={{ height: 14, width: 260, backgroundColor: '#E5E7EB', borderRadius: 6 }} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>{[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 70, backgroundColor: '#E5E7EB', borderRadius: 10 }} />)}</div>
          <CardSkeletonGrid count={8} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#EAEAE0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px 80px' }}>

        {/* ═══ HEADER ═══ */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 16 }}>
          <div style={{ flexShrink: 0 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={profile?.display_name || 'You'} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff' }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff' }}>
                <User size={36} color="#9CA3AF" />
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px', lineHeight: 1.2 }}>{profile?.display_name || 'Mulligans User'}</h1>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
              <Calendar size={13} color="#6B7280" /> <span>Member since {memberYear}</span>
              {profile?.location && (<><span style={{ margin: '0 4px', color: '#D1D5DB' }}>·</span><MapPin size={13} color="#6B7280" /> <span>{profile.location}</span></>)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {profile?.is_verified_seller && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#1DC690' }}>
                  <ShieldCheck size={15} color="#1DC690" /> Verified Seller
                </span>
              )}
              {profile?.is_pro_store && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#C9A84C', background: '#FDF8ED', padding: '2px 10px', borderRadius: 20 }}>
                  <Tag size={13} color="#C9A84C" /> {profile.pro_store_name || 'Pro Store'}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, paddingTop: 4 }}>
            <button onClick={handleShare} style={{ width: 38, height: 38, borderRadius: 8, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Share"><Share2 size={17} color="#6B7280" /></button>
            <Link href="/settings" style={{ width: 38, height: 38, borderRadius: 8, border: '1px solid #E5E7EB', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }} title="Settings"><Settings size={17} color="#6B7280" /></Link>
          </div>
        </div>

        {/* ═══ STAT BOXES — white ═══ */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{stats?.sales || 0}</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Sales</div>
          </div>
          <Link href={`/user/${userId}/reviews`} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: '14px 12px', textAlign: 'center', textDecoration: 'none' }}>
            {hasReviews ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                  <Star size={15} fill="#F59E0B" color="#F59E0B" />
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{Number(stats?.rating || 0).toFixed(1)}</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>({reviewStats?.total_reviews})</span>
                </div>
                <div style={{ fontSize: 10, color: '#1DC690', fontWeight: 500, marginTop: 2 }}>View reviews</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>No reviews</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Rating</div>
              </>
            )}
          </Link>
          <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Eye size={14} color="#6B7280" />
              <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{sellerStats?.totalViews || 0}</span>
            </div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Views</div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Heart size={14} color="#6B7280" />
              <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{sellerStats?.totalFavorites || 0}</span>
            </div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Favourites</div>
          </div>
        </div>

        {/* ═══ TRUST BOXES — coloured ═══ */}
        {sellerStats && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, backgroundColor: '#E8F8F2', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Zap size={14} color="#085041" />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#085041' }}>{sellerStats.responseRate || 0}%</span>
              </div>
              <div style={{ fontSize: 11, color: '#0F6E56' }}>Response rate</div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#EDF5FA', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Package size={14} color="#0C447C" />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0C447C' }}>{sellerStats.avgShippingTime ? `${Number(sellerStats.avgShippingTime).toFixed(1)} days` : 'N/A'}</span>
              </div>
              <div style={{ fontSize: 11, color: '#185FA5' }}>Avg. dispatch</div>
            </div>
            {categories.length > 0 && (
              <div style={{ flex: 1, backgroundColor: '#FDF8ED', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Tag size={14} color="#633806" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#854F0B' }}>Specialises in</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {categories.map(cat => (
                    <span key={cat} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.7)', color: '#633806', fontWeight: 500 }}>{cat}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ BIO ═══ */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <p style={{ fontSize: 14, color: profile?.bio ? '#374151' : '#9CA3AF', lineHeight: 1.5, margin: 0, flex: 1, fontStyle: profile?.bio ? 'normal' : 'italic' }}>
              {profile?.bio || 'No bio yet. Add one in your profile settings.'}
            </p>
            <Link href="/settings/profile" style={{ fontSize: 13, fontWeight: 600, color: '#1DC690', textDecoration: 'none', whiteSpace: 'nowrap' }}>Edit profile</Link>
          </div>
        </div>

        {/* ═══ DIVIDER ═══ */}
        <div style={{ height: 1, backgroundColor: '#D4D4C8', margin: '4px 0 16px' }} />

        {/* ═══ ACTION CARDS ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 24 }}>
          {showSellerDashboard && (
            <div style={{ backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#1DC690', padding: '10px 16px' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>Seller Dashboard</h3>
              </div>
              <div style={{ display: 'flex', padding: 14 }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{'\u00A3'}{(sellerStats?.todayEarnings || 0).toFixed(2)}</div>
                  <div style={{ fontSize: 10, color: '#6B7280' }}>Today</div>
                </div>
                <div style={{ width: 1, backgroundColor: '#F0F0EA' }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{sellerStats?.totalFavorites || 0}</div>
                  <div style={{ fontSize: 10, color: '#6B7280' }}>Favourites</div>
                </div>
              </div>
              <Link href={profile?.is_pro_store ? 'https://dashboard.mulligans.uk.com' : '/settings'} style={{ display: 'block', textAlign: 'center', padding: '9px', fontSize: 12, fontWeight: 600, color: '#1DC690', borderTop: '1px solid #F5F5F0', textDecoration: 'none' }}>
                View Full Dashboard <ChevronRight size={13} style={{ verticalAlign: 'middle' }} />
              </Link>
            </div>
          )}
          <div style={{ backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#278AB0', padding: '10px 16px' }}><h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>Orders</h3></div>
            <Link href="/orders?tab=purchases" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', textDecoration: 'none', borderBottom: '1px solid #F5F5F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShoppingBag size={15} color="#278AB0" /><span style={{ fontSize: 13, color: '#111827' }}>Buying</span></div><ChevronRight size={15} color="#9CA3AF" />
            </Link>
            <Link href="/orders?tab=sales" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Pencil size={15} color="#278AB0" /><span style={{ fontSize: 13, color: '#111827' }}>Selling</span></div><ChevronRight size={15} color="#9CA3AF" />
            </Link>
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#7C5CBF', padding: '10px 16px' }}><h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>Offers</h3></div>
            <Link href="/offers?tab=received" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', textDecoration: 'none', borderBottom: '1px solid #F5F5F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Inbox size={15} color="#7C5CBF" /><span style={{ fontSize: 13, color: '#111827' }}>Received</span></div><ChevronRight size={15} color="#9CA3AF" />
            </Link>
            <Link href="/offers?tab=made" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Send size={15} color="#7C5CBF" /><span style={{ fontSize: 13, color: '#111827' }}>Made</span></div><ChevronRight size={15} color="#9CA3AF" />
            </Link>
          </div>
        </div>

        {/* ═══ LISTINGS ═══ */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16 }}>
            <button onClick={() => setActiveTab('active')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: activeTab === 'active' ? 700 : 500, color: activeTab === 'active' ? '#111827' : '#9CA3AF', borderBottom: activeTab === 'active' ? '2px solid #1DC690' : '2px solid transparent', paddingBottom: 8 }}>Active Listings ({listingsTotal})</button>
            <button onClick={() => setActiveTab('sold')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: activeTab === 'sold' ? 700 : 500, color: activeTab === 'sold' ? '#111827' : '#9CA3AF', borderBottom: activeTab === 'sold' ? '2px solid #1DC690' : '2px solid transparent', paddingBottom: 8 }}>Sold</button>
          </div>
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
          {listingsLoading && listings.length === 0 ? <CardSkeletonGrid count={8} /> : activeTab === 'sold' ? (
            soldItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}><ShoppingBag size={48} color="#D1D5DB" style={{ margin: '0 auto 16px', display: 'block' }} /><p style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>No sold items yet</p></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {soldItems.map((item: any) => {
                  const images = item.images || [];
                  const sorted = [...images].sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0) || (a.id || '').localeCompare(b.id || ''));
                  const imgUrl = resolveImageUrl(sorted[0]?.image_url);
                  return (
                    <Link key={item.id} href={`/listings/${item.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{ aspectRatio: '3/4', backgroundColor: '#F4F4F0', position: 'relative' }}>
                          {imgUrl ? <img src={imgUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={32} color="#D1D5DB" /></div>}
                          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(6,7,10,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ backgroundColor: '#06070A', color: '#fff', padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>SOLD</span>
                          </div>
                        </div>
                        <div style={{ padding: 12 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#9CA3AF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                          <p style={{ fontSize: 15, fontWeight: 700, color: '#9CA3AF', margin: '4px 0 0' }}>{'\u00A3'}{Number(item.price).toFixed(0)}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          ) : listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}><Search size={48} color="#D1D5DB" style={{ margin: '0 auto 16px', display: 'block' }} /><p style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>No listings found</p><p style={{ fontSize: 14, color: '#6B7280' }}>{searchQuery ? 'Try adjusting your search' : 'Start selling to see your listings here'}</p></div>
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
                  <button onClick={handleLoadMore} disabled={listingsLoading} style={{ padding: '12px 32px', borderRadius: 8, border: '2px solid #1DC690', backgroundColor: 'transparent', color: '#1DC690', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: listingsLoading ? 0.5 : 1 }}>{listingsLoading ? 'Loading...' : 'Load More'}</button>
                </div>
              )}
            </>
          )}
        </div>
        {bulkMode && selectedIds.size > 0 && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTop: '1px solid #E5E7EB', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 30 }}>
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
