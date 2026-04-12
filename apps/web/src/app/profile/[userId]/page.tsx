'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { ListingCard, type ListingCardData } from '@/components/ListingCard';
import { CardSkeletonGrid } from '@/components/LoadingSkeleton';
import SimpleModal from '@/components/SimpleModal';
import {
  getPublicProfile,
  getUserStats,
  getSellerStats,
  getUserListings,
  getUserSoldItems,
  getMyListings,
  reportUser,
  blockUser,
  unblockUser,
  isUserBlocked,
} from '@mulligans/api-client';
import type { UserStats, SellerStats } from '@mulligans/api-client';
import {
  getUserReviews,
  getUserReviewStats,
} from '@mulligans/api-client';
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
  SlidersHorizontal,
  MoreHorizontal,
  MessageCircle,
  Flag,
  Ban,
  CheckCircle,
  Store,
  X,
  Check,
} from 'lucide-react';

const CLOUDFRONT_BASE = 'https://d1bhj4xuvi3dve.cloudfront.net';

const CONDITION_CONFIG: Record<number, { bg: string; label: string }> = {
  1: { bg: '#EF4444', label: 'Poor' },
  2: { bg: '#F59E0B', label: 'Good' },
  3: { bg: '#3B82F6', label: 'Very Good' },
  4: { bg: '#8B5CF6', label: 'Excellent' },
  5: { bg: '#10B981', label: 'New' },
};

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'oldest', label: 'Oldest' },
] as const;

const REPORT_REASONS = [
  'Inappropriate content',
  'Spam',
  'Scam/fraud',
  'Harassment',
  'Other',
];

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

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const userId = params.userId as string;
  const aboutRef = useRef<HTMLDivElement>(null);

  // Detect own profile
  const isOwnProfile = authUser?.id === userId;

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

  // Listing tabs (own profile)
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [listingsPage, setListingsPage] = useState(1);
  const [hasMoreListings, setHasMoreListings] = useState(false);

  // Bulk actions (own profile)
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Other-user actions
  const [isBlocked, setIsBlocked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  // ───────────────────── DATA LOADING ─────────────────────

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      const [profileData, statsData, reviewStatsData] = await Promise.all([
        getPublicProfile(userId),
        getUserStats(userId),
        getUserReviewStats(userId),
      ]);

      // The backend getUser returns the user object directly (not wrapped)
      const userData = (profileData as any).user || profileData;
      setProfile(userData);
      setStats(statsData);
      setReviewStats(reviewStatsData);

      // Load seller stats for own profile
      if (authUser?.id === userId) {
        try {
          const sellerData = await getSellerStats(userId);
          setSellerStats(sellerData);
        } catch {
          // seller stats not available — fine
        }
      }

      // Check if blocked (other user, authenticated)
      if (authUser && authUser.id !== userId) {
        try {
          const blockStatus = await isUserBlocked(userId);
          setIsBlocked(blockStatus.is_blocked);
        } catch {
          // not critical
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, authUser]);

  const loadListings = useCallback(async (page = 1, append = false) => {
    try {
      setListingsLoading(true);

      if (authUser?.id === userId && activeTab === 'active') {
        // Own profile — use authenticated endpoint
        const sortMap: Record<string, string> = {
          recent: 'recent',
          oldest: 'oldest',
          price_asc: 'price_asc',
          price_desc: 'price_desc',
        };
        const data = await getMyListings({
          page,
          limit: 20,
          status: 'active',
          sort: sortMap[sortBy] || 'recent',
          search: searchQuery || undefined,
        });
        const newListings = data.listings || [];
        setListings(append ? (prev) => [...prev, ...newListings] : newListings);
        setListingsTotal(data.total || 0);
        setHasMoreListings(page < (data.totalPages || 1));
      } else if (authUser?.id === userId && activeTab === 'sold') {
        // Own profile — sold tab
        const data = await getUserSoldItems(userId);
        const items = (data as any).items || (data as any) || [];
        setSoldItems(Array.isArray(items) ? items : []);
      } else {
        // Other user — public listings
        const data = await getUserListings(userId, {
          page,
          limit: 20,
          sort: sortBy,
        });
        const newListings = data.listings || [];
        setListings(append ? (prev) => [...prev, ...newListings] : newListings);
        setListingsTotal(data.total || 0);
        setHasMoreListings(newListings.length >= 20);
      }
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setListingsLoading(false);
    }
  }, [userId, authUser, activeTab, sortBy, searchQuery]);

  useEffect(() => {
    if (!authLoading) {
      loadProfile();
    }
  }, [loadProfile, authLoading]);

  useEffect(() => {
    if (!loading) {
      setListingsPage(1);
      loadListings(1);
    }
  }, [activeTab, sortBy, searchQuery, loading]);

  // ───────────────────── HANDLERS ────���────────────────

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${userId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: profile?.display_name || 'Profile', url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Profile link copied to clipboard!');
      }
    } catch {
      // user cancelled share
    }
  };

  const handleLoadMore = () => {
    const next = listingsPage + 1;
    setListingsPage(next);
    loadListings(next, true);
  };

  const handleReport = async () => {
    if (!reportReason) return;
    setReportSubmitting(true);
    try {
      await reportUser({
        reported_user_id: userId,
        reason: reportReason,
        details: reportDetails || undefined,
      });
      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
      alert('Report submitted. Thank you.');
    } catch (err: any) {
      const msg = (err as any)?.data?.error || 'Failed to submit report.';
      alert(msg);
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleBlock = async () => {
    try {
      if (isBlocked) {
        await unblockUser(userId);
        setIsBlocked(false);
      } else {
        await blockUser(userId);
        setIsBlocked(true);
      }
      setShowBlockConfirm(false);
      setShowMenu(false);
    } catch (err: any) {
      const msg = (err as any)?.data?.error || 'Action failed.';
      alert(msg);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ───────────────────── RENDER HELPERS ─────────────────────

  const memberYear = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : null;

  const avatarUrl = profile?.avatar_url
    ? profile.avatar_url.startsWith('http')
      ? profile.avatar_url
      : `${CLOUDFRONT_BASE}/${profile.avatar_url}`
    : null;

  // ───────────────────── LOADING STATE ─────────────────────

  if (loading || authLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#EAEAE0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 16px' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#E5E7EB' }} className="animate-pulse" />
            <div style={{ flex: 1 }}>
              <div style={{ height: 24, width: 200, backgroundColor: '#E5E7EB', borderRadius: 8, marginBottom: 8 }} className="animate-pulse" />
              <div style={{ height: 16, width: 140, backgroundColor: '#E5E7EB', borderRadius: 8 }} className="animate-pulse" />
            </div>
          </div>
          <div style={{ height: 72, backgroundColor: '#E5E7EB', borderRadius: 12, marginBottom: 24 }} className="animate-pulse" />
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
        <button
          onClick={() => router.push('/')}
          style={{ padding: '10px 24px', backgroundColor: '#1DC690', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          Go Home
        </button>
      </div>
    );
  }

  const showSellerDashboard = isOwnProfile && ((stats?.sales || 0) > 0 || (stats?.activeListingsCount || 0) > 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#EAEAE0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px 64px' }}>

        {/* ═══════════ PROFILE HEADER ════��══════ */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
          {/* Avatar */}
          <div style={{ flexShrink: 0 }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profile.display_name || 'User'}
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={36} color="#9CA3AF" />
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
                {profile.display_name || 'Mulligans User'}
              </h1>
            </div>

            {profile.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 14, marginBottom: 2 }}>
                <MapPin size={14} />
                <span>{profile.location}</span>
              </div>
            )}

            {memberYear && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 14, marginBottom: 6 }}>
                <Calendar size={14} />
                <span>Member since {memberYear}</span>
              </div>
            )}

            {/* Badges — other user only */}
            {!isOwnProfile && profile.is_verified_seller && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1DC690', fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                <CheckCircle size={16} color="#1DC690" />
                <span>Verified Seller</span>
              </div>
            )}
            {!isOwnProfile && profile.is_pro_store && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#C9A84C', fontSize: 14, fontWeight: 600 }}>
                <Store size={16} color="#C9A84C" />
                <span>{profile.pro_store_name || 'Pro Store'}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button
              onClick={handleShare}
              style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Share profile"
            >
              <Share2 size={18} color="#6B7280" />
            </button>

            {isOwnProfile && (
              <Link
                href="/settings"
                style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid #E5E7EB', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                title="Settings"
              >
                <Settings size={18} color="#6B7280" />
              </Link>
            )}

            {!isOwnProfile && isAuthenticated && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <MoreHorizontal size={18} color="#6B7280" />
                </button>

                {showMenu && (
                  <div style={{ position: 'absolute', top: 44, right: 0, backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: 180, zIndex: 50, overflow: 'hidden' }}>
                    <button
                      onClick={() => { setShowMenu(false); setShowReportModal(true); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 14, color: '#374151' }}
                    >
                      <Flag size={16} /> Report User
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); setShowBlockConfirm(true); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 14, color: isBlocked ? '#1DC690' : '#EF4444' }}
                    >
                      <Ban size={16} /> {isBlocked ? 'Unblock User' : 'Block User'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════ DARK STATS BAR ═══════════ */}
        <div style={{
          backgroundColor: '#1C4670',
          borderRadius: 12,
          padding: '16px 0',
          display: 'flex',
          alignItems: 'center',
          marginBottom: 24,
        }}>
          {/* Sales */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>
              {stats?.sales || 0}
            </p>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 0' }}>Sales</p>
          </div>

          <div style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' }} />

          {/* Rating */}
          <Link
            href={`/profile/${userId}/reviews`}
            style={{ flex: 1, textAlign: 'center', textDecoration: 'none', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Star size={18} fill="#F59E0B" color="#F59E0B" />
              <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
                {Number(stats?.rating || 0).toFixed(1)}
              </span>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                ({reviewStats?.total_reviews || 0})
              </span>
            </div>
          </Link>

          <div style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' }} />

          {/* About */}
          <button
            onClick={scrollToAbout}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>About</span>
            <ChevronRight size={16} color="#fff" />
          </button>
        </div>

        {/* ═══════════ ABOUT SECTION ═══════════ */}
        <div ref={aboutRef} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>About</h2>
            {isOwnProfile && (
              <Link href="/settings/profile" style={{ fontSize: 14, fontWeight: 600, color: '#1DC690', textDecoration: 'none' }}>
                Edit Profile
              </Link>
            )}
          </div>

          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: '0 0 12px' }}>
            {profile.bio ||
              (isOwnProfile
                ? 'No bio yet. Add one in your profile settings.'
                : "This user hasn't added a bio yet.")}
          </p>

          {profile.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 14, marginBottom: 8 }}>
              <MapPin size={16} color="#1DC690" />
              <span>{profile.location}</span>
            </div>
          )}

          {profile.is_verified_seller && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1DC690', fontSize: 14, fontWeight: 600 }}>
              <CheckCircle size={16} color="#1DC690" />
              <span>Verified Seller</span>
            </div>
          )}
        </div>

        {/* ═══════════ OWN PROFILE: SELLER DASHBOARD + ORDERS ═══════════ */}
        {isOwnProfile && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>

            {/* Seller Dashboard Card */}
            {showSellerDashboard && (
              <div style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#1DC690', padding: '12px 20px' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Seller Dashboard</h3>
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <p style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>
                        £{(sellerStats?.todayEarnings || 0).toFixed(2)}
                      </p>
                      <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>Today</p>
                    </div>
                    <div style={{ width: 1, backgroundColor: '#E5E7EB' }} />
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <p style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>
                        {sellerStats?.totalViews || 0}
                      </p>
                      <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>Views (All Time)</p>
                    </div>
                    <div style={{ width: 1, backgroundColor: '#E5E7EB' }} />
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <p style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>
                        {sellerStats?.totalFavorites || 0}
                      </p>
                      <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>Favourites</p>
                    </div>
                  </div>
                  <Link
                    href={profile.is_pro_store ? 'https://dashboard.mulligans.uk.com' : '/settings'}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: '#1DC690', textDecoration: 'none' }}
                  >
                    View Full Dashboard <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            )}

            {/* Orders Card */}
            <div style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#278AB0', padding: '12px 20px' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Orders</h3>
              </div>
              <div>
                <Link
                  href="/orders?tab=purchases"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', textDecoration: 'none', borderBottom: '1px solid #E5E7EB' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShoppingBag size={18} color="#278AB0" />
                    <span style={{ fontSize: 15, fontWeight: 500, color: '#111827' }}>Buying</span>
                  </div>
                  <ChevronRight size={18} color="#9CA3AF" />
                </Link>
                <Link
                  href="/orders?tab=sales"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', textDecoration: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Pencil size={18} color="#278AB0" />
                    <span style={{ fontSize: 15, fontWeight: 500, color: '#111827' }}>Selling</span>
                  </div>
                  <ChevronRight size={18} color="#9CA3AF" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ CONTACT SELLER (other user) ═��═════════ */}
        {!isOwnProfile && (
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  router.push(`/login?redirect=/profile/${userId}`);
                  return;
                }
                router.push(`/messages?userId=${userId}`);
              }}
              style={{
                width: '100%',
                maxWidth: 400,
                padding: '14px 24px',
                backgroundColor: '#1DC690',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <MessageCircle size={18} />
              Contact Seller
            </button>
          </div>
        )}

        {/* ═══════════ LISTINGS SECTION ═══════════ */}
        <div>
          {/* Tab bar (own profile) or title (other) */}
          {isOwnProfile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16 }}>
              <button
                onClick={() => setActiveTab('active')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  fontWeight: activeTab === 'active' ? 700 : 500,
                  color: activeTab === 'active' ? '#111827' : '#9CA3AF',
                  borderBottom: activeTab === 'active' ? '2px solid #1DC690' : '2px solid transparent',
                  paddingBottom: 8,
                }}
              >
                Active Listings ({listingsTotal})
              </button>
              <button
                onClick={() => setActiveTab('sold')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  fontWeight: activeTab === 'sold' ? 700 : 500,
                  color: activeTab === 'sold' ? '#111827' : '#9CA3AF',
                  borderBottom: activeTab === 'sold' ? '2px solid #1DC690' : '2px solid transparent',
                  paddingBottom: 8,
                }}
              >
                Sold
              </button>
            </div>
          ) : (
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
              Listings ({listingsTotal})
            </h2>
          )}

          {/* Search + Sort (own profile, active tab only) */}
          {isOwnProfile && activeTab === 'active' && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              {/* Search */}
              <div style={{ flex: '1 1 280px', position: 'relative' }}>
                <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search your listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    borderRadius: 8,
                    border: '1px solid #E5E7EB',
                    fontSize: 14,
                    backgroundColor: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Sort dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#374151',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort'}
                  <ChevronDown size={16} />
                </button>

                {showSortDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 4,
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    minWidth: 200,
                    zIndex: 40,
                    overflow: 'hidden',
                  }}>
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setShowSortDropdown(false); }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          border: 'none',
                          backgroundColor: sortBy === opt.value ? '#F0FDF4' : 'transparent',
                          cursor: 'pointer',
                          fontSize: 14,
                          color: sortBy === opt.value ? '#1DC690' : '#374151',
                          fontWeight: sortBy === opt.value ? 600 : 400,
                        }}
                      >
                        {opt.label}
                        {sortBy === opt.value && <Check size={16} color="#1DC690" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bulk Actions toggle */}
              <button
                onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }}
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: bulkMode ? '2px solid #1DC690' : '1px solid #E5E7EB',
                  backgroundColor: bulkMode ? '#F0FDF4' : '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  color: bulkMode ? '#1DC690' : '#374151',
                  whiteSpace: 'nowrap',
                }}
              >
                {bulkMode ? 'Cancel' : 'Bulk Actions'}
              </button>
            </div>
          )}

          {/* Listings Grid */}
          {listingsLoading && listings.length === 0 ? (
            <CardSkeletonGrid count={8} />
          ) : (
            <>
              {activeTab === 'sold' && isOwnProfile ? (
                // Sold items grid
                soldItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
                    <ShoppingBag size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
                    <p style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>No sold items yet</p>
                    <p style={{ fontSize: 14 }}>Your sold items will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                    {soldItems.map((item: any) => {
                      const img = item.images?.sort((a: any, b: any) =>
                        (a.display_order || 0) - (b.display_order || 0) ||
                        (a.id || '').localeCompare(b.id || '')
                      )[0]?.image_url;
                      return (
                        <Link key={item.id} href={`/listings/${item.id}`} style={{ textDecoration: 'none' }}>
                          <div style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                            <div style={{ aspectRatio: '3/4', backgroundColor: '#F4F4F0', position: 'relative' }}>
                              {img ? (
                                <img src={img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                              ) : (
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
              ) : (
                // Active listings grid
                listings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
                    <Search size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
                    <p style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>No listings found</p>
                    <p style={{ fontSize: 14 }}>
                      {searchQuery ? 'Try adjusting your search' : (isOwnProfile ? 'Start selling to see your listings here' : 'This user has no active listings')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                    {listings.map((listing: any) => (
                      <div key={listing.id} style={{ position: 'relative' }}>
                        {bulkMode && (
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelect(listing.id); }}
                            style={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              zIndex: 10,
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              border: selectedIds.has(listing.id) ? '2px solid #1DC690' : '2px solid #D1D5DB',
                              backgroundColor: selectedIds.has(listing.id) ? '#1DC690' : '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {selectedIds.has(listing.id) && <Check size={16} color="#fff" />}
                          </button>
                        )}
                        <ListingCard listing={listing as ListingCardData} />
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Load More */}
              {hasMoreListings && activeTab === 'active' && (
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <button
                    onClick={handleLoadMore}
                    disabled={listingsLoading}
                    style={{
                      padding: '12px 32px',
                      borderRadius: 8,
                      border: '2px solid #1DC690',
                      backgroundColor: 'transparent',
                      color: '#1DC690',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      opacity: listingsLoading ? 0.5 : 1,
                    }}
                  >
                    {listingsLoading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ═══════════ BULK ACTION BAR (own profile) ═══════════ */}
        {bulkMode && selectedIds.size > 0 && (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            borderTop: '1px solid #E5E7EB',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            zIndex: 30,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
              {selectedIds.size} selected
            </span>
            <button
              onClick={async () => {
                if (!confirm(`Mark ${selectedIds.size} listing(s) as sold?`)) return;
                try {
                  const ids = Array.from(selectedIds);
                  await Promise.all(ids.map(id =>
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com'}/api/listings/${id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('mulligans_auth_token')}` },
                      body: JSON.stringify({ status: 'sold' }),
                    })
                  ));
                  setBulkMode(false);
                  setSelectedIds(new Set());
                  loadListings(1);
                } catch { alert('Failed to update listings.'); }
              }}
              style={{ padding: '10px 20px', borderRadius: 8, backgroundColor: '#1DC690', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
              Mark as Sold
            </button>
            <button
              onClick={async () => {
                if (!confirm(`Deactivate ${selectedIds.size} listing(s)?`)) return;
                try {
                  const ids = Array.from(selectedIds);
                  await Promise.all(ids.map(id =>
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com'}/api/listings/${id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('mulligans_auth_token')}` },
                      body: JSON.stringify({ status: 'inactive' }),
                    })
                  ));
                  setBulkMode(false);
                  setSelectedIds(new Set());
                  loadListings(1);
                } catch { alert('Failed to deactivate listings.'); }
              }}
              style={{ padding: '10px 20px', borderRadius: 8, backgroundColor: '#F59E0B', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
              Deactivate
            </button>
            <button
              onClick={async () => {
                if (!confirm(`Delete ${selectedIds.size} listing(s)? This cannot be undone.`)) return;
                try {
                  const ids = Array.from(selectedIds);
                  await Promise.all(ids.map(id =>
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com'}/api/listings/${id}`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${localStorage.getItem('mulligans_auth_token')}` },
                    })
                  ));
                  setBulkMode(false);
                  setSelectedIds(new Set());
                  loadListings(1);
                } catch { alert('Failed to delete listings.'); }
              }}
              style={{ padding: '10px 20px', borderRadius: 8, backgroundColor: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* ═══════════ REPORT USER MODAL ═══════════ */}
      <SimpleModal
        open={showReportModal}
        onClose={() => { setShowReportModal(false); setReportReason(''); setReportDetails(''); }}
        title="Report User"
      >
        <div>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Reason
          </label>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              fontSize: 14,
              marginBottom: 16,
              backgroundColor: '#fff',
              appearance: 'auto',
            }}
          >
            <option value="">Select a reason...</option>
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Details (optional)
          </label>
          <textarea
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            placeholder="Provide additional details..."
            rows={4}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              fontSize: 14,
              resize: 'vertical',
              marginBottom: 16,
              boxSizing: 'border-box',
            }}
          />

          <button
            onClick={handleReport}
            disabled={!reportReason || reportSubmitting}
            style={{
              width: '100%',
              padding: '12px 24px',
              borderRadius: 8,
              backgroundColor: !reportReason || reportSubmitting ? '#D1D5DB' : '#EF4444',
              color: '#fff',
              border: 'none',
              cursor: !reportReason || reportSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {reportSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </SimpleModal>

      {/* ═══════════ BLOCK CONFIRM MODAL ═══════════ */}
      <SimpleModal
        open={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        title={isBlocked ? 'Unblock User' : 'Block User'}
      >
        <div>
          <p style={{ fontSize: 14, color: '#374151', marginBottom: 20, lineHeight: 1.6 }}>
            {isBlocked
              ? `Are you sure you want to unblock ${profile?.display_name || 'this user'}? They will be able to message you and see your listings again.`
              : `Are you sure you want to block ${profile?.display_name || 'this user'}? They won't be able to message you or see your listings.`}
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setShowBlockConfirm(false)}
              style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#374151' }}
            >
              Cancel
            </button>
            <button
              onClick={handleBlock}
              style={{ flex: 1, padding: '12px', borderRadius: 8, border: 'none', backgroundColor: isBlocked ? '#1DC690' : '#EF4444', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
              {isBlocked ? 'Unblock' : 'Block'}
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Close menu when clicking outside */}
      {showMenu && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
