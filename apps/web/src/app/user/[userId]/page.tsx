'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ListingCard, type ListingCardData } from '@/components/ListingCard';
import { CardSkeletonGrid } from '@/components/LoadingSkeleton';
import SimpleModal from '@/components/SimpleModal';
import {
  getPublicProfile,
  getUserStats,
  getSellerStats,
  getUserListings,
  reportUser,
  blockUser,
  unblockUser,
  isUserBlocked,
} from '@mulligans/api-client';
import type { UserStats, SellerStats } from '@mulligans/api-client';
import { getUserReviewStats } from '@mulligans/api-client';
import type { ReviewStats } from '@mulligans/api-client';
import {
  User,
  MapPin,
  Calendar,
  Share2,
  Star,
  ChevronRight,
  MoreHorizontal,
  MessageCircle,
  Flag,
  Ban,
  ShieldCheck,
  Tag,
  Zap,
  Package,
  Store,
} from 'lucide-react';

const CLOUDFRONT_BASE = 'https://d1bhj4xuvi3dve.cloudfront.net';

const REPORT_REASONS = ['Inappropriate content', 'Spam', 'Scam/fraud', 'Harassment', 'Other'];

function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${CLOUDFRONT_BASE}/${url}`;
}

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

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, isAuthenticated } = useAuth();
  const userId = params.userId as string;

  useEffect(() => {
    if (authUser?.id === userId) router.replace('/profile');
  }, [authUser, userId, router]);

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [listingsTotal, setListingsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsPage, setListingsPage] = useState(1);
  const [hasMoreListings, setHasMoreListings] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const [profileData, statsData, reviewStatsData] = await Promise.all([
        getPublicProfile(userId), getUserStats(userId), getUserReviewStats(userId),
      ]);
      setProfile((profileData as any).user || profileData);
      setStats(statsData);
      setReviewStats(reviewStatsData);
      // Load seller stats (public endpoint — no auth needed for the stats we use)
      try { setSellerStats(await getSellerStats(userId)); } catch { /* ok */ }
      if (authUser) {
        try { setIsBlocked((await isUserBlocked(userId)).is_blocked); } catch { /* ok */ }
      }
    } catch (err) { console.error('Failed to load profile:', err); }
    finally { setLoading(false); }
  }, [userId, authUser]);

  const loadListings = useCallback(async (page = 1, append = false) => {
    try {
      setListingsLoading(true);
      const data = await getUserListings(userId, { page, limit: 20, sort: 'recent' });
      const items = data.listings || [];
      setListings(append ? (prev) => [...prev, ...items] : items);
      setListingsTotal(data.total || 0);
      setHasMoreListings(items.length >= 20);
    } catch (err) { console.error('Failed to load listings:', err); }
    finally { setListingsLoading(false); }
  }, [userId]);

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => { if (!loading) loadListings(1); }, [loading]);

  const handleShare = async () => {
    const url = `${window.location.origin}/user/${userId}`;
    try { if (navigator.share) await navigator.share({ title: profile?.display_name || 'Profile', url }); else { await navigator.clipboard.writeText(url); alert('Profile link copied!'); } } catch {}
  };
  const handleLoadMore = () => { const n = listingsPage + 1; setListingsPage(n); loadListings(n, true); };
  const handleReport = async () => {
    if (!reportReason) return;
    setReportSubmitting(true);
    try {
      await reportUser({ reported_user_id: userId, reason: reportReason, details: reportDetails || undefined });
      setShowReportModal(false); setReportReason(''); setReportDetails('');
      alert('Report submitted. Thank you.');
    } catch (err: any) { alert((err as any)?.data?.error || 'Failed to submit report.'); }
    finally { setReportSubmitting(false); }
  };
  const handleBlock = async () => {
    try {
      if (isBlocked) { await unblockUser(userId); setIsBlocked(false); }
      else { await blockUser(userId); setIsBlocked(true); }
      setShowBlockConfirm(false); setShowMenu(false);
    } catch (err: any) { alert((err as any)?.data?.error || 'Action failed.'); }
  };

  const memberYear = profile?.created_at ? new Date(profile.created_at).getFullYear() : null;
  const avatarUrl = resolveImageUrl(profile?.avatar_url);
  const hasReviews = (reviewStats?.total_reviews || 0) > 0;

  const categories = useMemo(() => {
    const cats = new Set<string>();
    listings.forEach((l: any) => { if (l.category) cats.add(l.category); });
    return Array.from(cats).slice(0, 4);
  }, [listings]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#EAEAE0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 16px' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#E5E7EB' }} />
            <div style={{ flex: 1 }}><div style={{ height: 24, width: 200, backgroundColor: '#E5E7EB', borderRadius: 8, marginBottom: 8 }} /><div style={{ height: 16, width: 140, backgroundColor: '#E5E7EB', borderRadius: 8 }} /></div>
          </div>
          <div style={{ height: 200, backgroundColor: '#E5E7EB', borderRadius: 12, marginBottom: 24 }} />
          <CardSkeletonGrid count={8} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#EAEAE0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <User size={64} color="#9CA3AF" />
        <p style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>User not found</p>
        <button onClick={() => router.push('/')} style={{ padding: '10px 24px', backgroundColor: '#1DC690', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Go Home</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#EAEAE0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px 64px' }}>

        {/* ═══ HEADER ═══ */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
          <div style={{ flexShrink: 0 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={profile.display_name || 'User'} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={36} color="#9CA3AF" />
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>{profile.display_name || 'Mulligans User'}</h1>
            {profile.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 14, marginBottom: 2 }}>
                <MapPin size={14} /> <span>{profile.location}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 14, marginBottom: 4 }}>
              <Calendar size={14} /> <span>Member since {memberYear}</span>
            </div>
            {profile.is_verified_seller && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1DC690', fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                <ShieldCheck size={16} color="#1DC690" /> Verified Seller
              </div>
            )}
            {profile.is_pro_store && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#C9A84C', fontSize: 13, fontWeight: 600, marginTop: 2, background: '#FDF8ED', padding: '2px 10px', borderRadius: 20 }}>
                <Store size={14} color="#C9A84C" /> {profile.pro_store_name || 'Pro Store'}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={handleShare} style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Share2 size={18} color="#6B7280" /></button>
            {isAuthenticated && (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowMenu(!showMenu)} style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MoreHorizontal size={18} color="#6B7280" /></button>
                {showMenu && (
                  <div style={{ position: 'absolute', top: 44, right: 0, backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: 180, zIndex: 50, overflow: 'hidden' }}>
                    <button onClick={() => { setShowMenu(false); setShowReportModal(true); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 14, color: '#374151' }}><Flag size={16} /> Report User</button>
                    <button onClick={() => { setShowMenu(false); setShowBlockConfirm(true); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 14, color: isBlocked ? '#1DC690' : '#EF4444' }}><Ban size={16} /> {isBlocked ? 'Unblock User' : 'Block User'}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══ MERGED PROFILE CARD (Option A) ═══ */}
        <div style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 20, display: 'flex' }}>
          <div style={{ flex: 1, padding: '20px 24px', borderRight: '1px solid #F0F0EA' }}>
            <p style={{ fontSize: 14, color: profile.bio ? '#374151' : '#9CA3AF', lineHeight: 1.6, marginBottom: 12, fontStyle: profile.bio ? 'normal' : 'italic' }}>
              {profile.bio || "This user hasn't added a bio yet."}
            </p>
            {profile.is_verified_seller && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1DC690', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                <ShieldCheck size={14} color="#1DC690" /> Verified Seller
              </div>
            )}

            <div style={{ height: 1, backgroundColor: '#F0F0EA', margin: '12px 0' }} />

            {/* Trust metrics */}
            {sellerStats ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #F5F5F0' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#E8F8F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={16} color="#1DC690" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{sellerStats.responseRate || 0}%</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>Response rate</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #F5F5F0' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F0F7FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={16} color="#278AB0" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                      {sellerStats.avgShippingTime ? `${Number(sellerStats.avgShippingTime).toFixed(1)} days` : 'N/A'}
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>Avg. dispatch time</div>
                  </div>
                </div>
                {categories.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #F5F5F0' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FDF8ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Tag size={16} color="#C9A84C" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{categories.join(', ')}</div>
                      <div style={{ fontSize: 11, color: '#6B7280' }}>Specialises in</div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 13, marginBottom: 6 }}>
                  <Calendar size={14} color="#1DC690" /> Member since {memberYear}
                </div>
                {profile.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 13, marginBottom: 6 }}>
                    <MapPin size={14} color="#1DC690" /> {profile.location}
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#278AB0', marginTop: 12, padding: '8px 10px', backgroundColor: '#F0F7FB', borderRadius: 8 }}>
              <ShieldCheck size={14} color="#278AB0" /> All purchases protected by Mulligans Buyer Protection
            </div>
          </div>

          {/* Right — stacked stats */}
          <div style={{ width: 200, padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#111827' }}>{stats?.sales || 0}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Sales</div>
            </div>
            <div style={{ height: 1, backgroundColor: '#F0F0EA' }} />
            <Link href={`/user/${userId}/reviews`} style={{ textAlign: 'center', padding: '12px 0', textDecoration: 'none' }}>
              {hasReviews ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Star size={16} fill="#F59E0B" color="#F59E0B" />
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{Number(stats?.rating || 0).toFixed(1)}</span>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>({reviewStats?.total_reviews})</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#1DC690', fontWeight: 500, marginTop: 2 }}>View reviews</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#9CA3AF' }}>New seller</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>No reviews yet</div>
                </>
              )}
            </Link>
            <div style={{ height: 1, backgroundColor: '#F0F0EA' }} />
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{sellerStats?.totalViews || 0}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Views</div>
            </div>
            <div style={{ height: 1, backgroundColor: '#F0F0EA' }} />
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{sellerStats?.totalFavorites || 0}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Favourites</div>
            </div>
          </div>
        </div>

        {/* ═══ CONTACT SELLER ═══ */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => { if (!isAuthenticated) { router.push(`/login?redirect=/user/${userId}`); return; } router.push(`/messages?userId=${userId}`); }}
            style={{ padding: '12px 24px', backgroundColor: '#1DC690', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <MessageCircle size={18} /> Contact Seller
          </button>
        </div>

        {/* ═══ LISTINGS ═══ */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Listings ({listingsTotal})</h2>
          {listingsLoading && listings.length === 0 ? (
            <CardSkeletonGrid count={8} />
          ) : listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
              <User size={48} color="#D1D5DB" style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>No active listings</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {listings.map((listing: any) => (<ListingCard key={listing.id} listing={listing as ListingCardData} />))}
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
      </div>

      {/* ═══ REPORT MODAL ═══ */}
      <SimpleModal open={showReportModal} onClose={() => { setShowReportModal(false); setReportReason(''); setReportDetails(''); }} title="Report User">
        <div>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Reason</label>
          <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, marginBottom: 16, backgroundColor: '#fff' }}>
            <option value="">Select a reason...</option>
            {REPORT_REASONS.map((r) => (<option key={r} value={r}>{r}</option>))}
          </select>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Details (optional)</label>
          <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Provide additional details..." rows={4} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, resize: 'vertical', marginBottom: 16, boxSizing: 'border-box' }} />
          <button onClick={handleReport} disabled={!reportReason || reportSubmitting} style={{ width: '100%', padding: '12px', borderRadius: 8, backgroundColor: !reportReason || reportSubmitting ? '#D1D5DB' : '#EF4444', color: '#fff', border: 'none', cursor: !reportReason || reportSubmitting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14 }}>
            {reportSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </SimpleModal>

      <SimpleModal open={showBlockConfirm} onClose={() => setShowBlockConfirm(false)} title={isBlocked ? 'Unblock User' : 'Block User'}>
        <div>
          <p style={{ fontSize: 14, color: '#374151', marginBottom: 20, lineHeight: 1.6 }}>
            {isBlocked ? `Unblock ${profile?.display_name || 'this user'}?` : `Block ${profile?.display_name || 'this user'}? They won't be able to message you or see your listings.`}
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setShowBlockConfirm(false)} style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#374151' }}>Cancel</button>
            <button onClick={handleBlock} style={{ flex: 1, padding: '12px', borderRadius: 8, border: 'none', backgroundColor: isBlocked ? '#1DC690' : '#EF4444', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>{isBlocked ? 'Unblock' : 'Block'}</button>
          </div>
        </div>
      </SimpleModal>

      {showMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowMenu(false)} />}
    </div>
  );
}
