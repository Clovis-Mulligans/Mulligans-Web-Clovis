'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ListingCard, type ListingCardData } from '@/components/ListingCard';
import { CardSkeletonGrid } from '@/components/LoadingSkeleton';
import SimpleModal from '@/components/SimpleModal';
import {
  getPublicProfile, getUserStats, getSellerStats, getUserListings,
  reportUser, blockUser, unblockUser, isUserBlocked,
} from '@mulligans/api-client';
import type { UserStats, SellerStats } from '@mulligans/api-client';
import { getUserReviewStats } from '@mulligans/api-client';
import type { ReviewStats } from '@mulligans/api-client';
import {
  User, MapPin, Calendar, Share2, Star, MoreHorizontal, MessageCircle,
  Flag, Ban, ShieldCheck, Tag, Store, Zap, Package, Eye, Heart,
} from 'lucide-react';

const CLOUDFRONT_BASE = 'https://d1bhj4xuvi3dve.cloudfront.net';
const REPORT_REASONS = ['Inappropriate content', 'Spam', 'Scam/fraud', 'Harassment', 'Other'];

function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith('http') ? url : `${CLOUDFRONT_BASE}/${url}`;
}

interface ProfileUser {
  id: string; display_name: string | null; avatar_url: string | null;
  is_verified_seller: boolean; is_pro_store?: boolean; pro_store_name?: string | null;
  rating: number; total_sales?: number; location: string | null; bio: string | null; created_at: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, isAuthenticated } = useAuth();
  const userId = params.userId as string;

  useEffect(() => { if (authUser?.id === userId) router.replace('/profile'); }, [authUser, userId, router]);

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
      setStats(statsData); setReviewStats(reviewStatsData);
      try { setSellerStats(await getSellerStats(userId)); } catch {}
      if (authUser) { try { setIsBlocked((await isUserBlocked(userId)).is_blocked); } catch {} }
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
    if (!reportReason) return; setReportSubmitting(true);
    try { await reportUser({ reported_user_id: userId, reason: reportReason, details: reportDetails || undefined }); setShowReportModal(false); setReportReason(''); setReportDetails(''); alert('Report submitted. Thank you.'); }
    catch (err: any) { alert((err as any)?.data?.error || 'Failed to submit report.'); }
    finally { setReportSubmitting(false); }
  };
  const handleBlock = async () => {
    try { if (isBlocked) { await unblockUser(userId); setIsBlocked(false); } else { await blockUser(userId); setIsBlocked(true); } setShowBlockConfirm(false); setShowMenu(false); }
    catch (err: any) { alert((err as any)?.data?.error || 'Action failed.'); }
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
            <div><div style={{ height: 24, width: 180, backgroundColor: '#E5E7EB', borderRadius: 6, marginBottom: 10 }} /><div style={{ height: 14, width: 260, backgroundColor: '#E5E7EB', borderRadius: 6 }} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>{[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 70, backgroundColor: '#E5E7EB', borderRadius: 10 }} />)}</div>
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
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 16 }}>
          <div style={{ flexShrink: 0 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={profile.display_name || 'User'} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff' }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff' }}>
                <User size={36} color="#9CA3AF" />
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px', lineHeight: 1.2 }}>{profile.display_name || 'Mulligans User'}</h1>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
              <Calendar size={13} color="#6B7280" /> <span>Member since {memberYear}</span>
              {profile.location && (<><span style={{ margin: '0 4px', color: '#D1D5DB' }}>·</span><MapPin size={13} color="#6B7280" /> <span>{profile.location}</span></>)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {profile.is_verified_seller && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#1DC690' }}>
                  <ShieldCheck size={15} color="#1DC690" /> Verified Seller
                </span>
              )}
              {profile.is_pro_store && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#C9A84C', background: '#FDF8ED', padding: '2px 10px', borderRadius: 20 }}>
                  <Store size={13} color="#C9A84C" /> {profile.pro_store_name || 'Pro Store'}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, paddingTop: 4 }}>
            <button onClick={handleShare} style={{ width: 38, height: 38, borderRadius: 8, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Share2 size={17} color="#6B7280" /></button>
            {isAuthenticated && (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowMenu(!showMenu)} style={{ width: 38, height: 38, borderRadius: 8, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MoreHorizontal size={17} color="#6B7280" /></button>
                {showMenu && (
                  <div style={{ position: 'absolute', top: 42, right: 0, backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: 180, zIndex: 50, overflow: 'hidden' }}>
                    <button onClick={() => { setShowMenu(false); setShowReportModal(true); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 14, color: '#374151' }}><Flag size={16} /> Report User</button>
                    <button onClick={() => { setShowMenu(false); setShowBlockConfirm(true); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 14, color: isBlocked ? '#1DC690' : '#EF4444' }}><Ban size={16} /> {isBlocked ? 'Unblock User' : 'Block User'}</button>
                  </div>
                )}
              </div>
            )}
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
                <div style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>New seller</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>No reviews yet</div>
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
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 14, color: profile.bio ? '#374151' : '#9CA3AF', lineHeight: 1.5, margin: 0, fontStyle: profile.bio ? 'normal' : 'italic' }}>
            {profile.bio || "This user hasn't added a bio yet."}
          </p>
        </div>

        {/* ═══ BUYER PROTECTION ═══ */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#278AB0', padding: '5px 10px', backgroundColor: '#EDF5FA', borderRadius: 6, marginBottom: 14 }}>
          <ShieldCheck size={13} color="#278AB0" /> Protected by Mulligans Buyer Protection
        </div>

        {/* ═══ CONTACT ═══ */}
        <div style={{ marginBottom: 8 }}>
          <button
            onClick={() => { if (!isAuthenticated) { router.push(`/login?redirect=/user/${userId}`); return; } router.push(`/messages?userId=${userId}`); }}
            style={{ padding: '10px 22px', backgroundColor: '#1DC690', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <MessageCircle size={16} /> Contact Seller
          </button>
        </div>

        <div style={{ height: 1, backgroundColor: '#D4D4C8', margin: '12px 0 16px' }} />

        {/* ═══ LISTINGS ═══ */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Listings ({listingsTotal})</h2>
          {listingsLoading && listings.length === 0 ? <CardSkeletonGrid count={8} /> : listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
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
                  <button onClick={handleLoadMore} disabled={listingsLoading} style={{ padding: '12px 32px', borderRadius: 8, border: '2px solid #1DC690', backgroundColor: 'transparent', color: '#1DC690', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: listingsLoading ? 0.5 : 1 }}>{listingsLoading ? 'Loading...' : 'Load More'}</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <SimpleModal open={showReportModal} onClose={() => { setShowReportModal(false); setReportReason(''); setReportDetails(''); }} title="Report User">
        <div>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Reason</label>
          <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, marginBottom: 16, backgroundColor: '#fff' }}>
            <option value="">Select a reason...</option>
            {REPORT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
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
