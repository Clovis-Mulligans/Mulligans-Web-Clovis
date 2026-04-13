'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  getUserReviews,
  getUserReviewStats,
} from '@mulligans/api-client';
import type { ReviewData, ReviewStats } from '@mulligans/api-client';
import { getPublicProfile } from '@mulligans/api-client';
import {
  ArrowLeft,
  Star,
  User,
  ChevronRight,
} from 'lucide-react';

const CLOUDFRONT_BASE = 'https://d1bhj4xuvi3dve.cloudfront.net';
const REVIEWS_PER_PAGE = 10;

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          fill={star <= rating ? '#F59E0B' : 'none'}
          color={star <= rating ? '#F59E0B' : '#D1D5DB'}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [profileData, statsData, reviewsData] = await Promise.all([
        getPublicProfile(userId),
        getUserReviewStats(userId),
        getUserReviews(userId, { limit: REVIEWS_PER_PAGE, offset: 0 }),
      ]);

      const userData = (profileData as any).user || profileData;
      setUserName(userData.display_name || 'User');
      setStats(statsData);
      setReviews(reviewsData.reviews || []);
      setHasMore(reviewsData.hasMore || false);
      setOffset(REVIEWS_PER_PAGE);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadMore = async () => {
    try {
      setLoadingMore(true);
      const data = await getUserReviews(userId, {
        limit: REVIEWS_PER_PAGE,
        offset,
      });
      setReviews((prev) => [...prev, ...(data.reviews || [])]);
      setHasMore(data.hasMore || false);
      setOffset((prev) => prev + REVIEWS_PER_PAGE);
    } catch (err) {
      console.error('Failed to load more reviews:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // ─── LOADING ───
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#EAEAE0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 16px' }}>
          <div style={{ height: 20, width: 160, backgroundColor: '#E5E7EB', borderRadius: 8, marginBottom: 24 }} className="animate-pulse" />
          <div style={{ height: 160, backgroundColor: '#E5E7EB', borderRadius: 12, marginBottom: 24 }} className="animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 120, backgroundColor: '#E5E7EB', borderRadius: 12, marginBottom: 12 }} className="animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const maxBarCount = stats ? Math.max(...Object.values(stats.rating_counts), 1) : 1;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#EAEAE0' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px 64px' }}>

        {/* Back link */}
        <Link
          href={`/user/${userId}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#1DC690',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={18} />
          Back to profile
        </Link>

        {/* Page title */}
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 24px' }}>
          {userName}&apos;s Reviews
        </h1>

        {/* ═══════════ RATING SUMMARY ═══════════ */}
        {stats && (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
          }}>
            {/* Left — big number */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingRight: 24,
              borderRight: '1px solid #E5E7EB',
              minWidth: 100,
            }}>
              <p style={{ fontSize: 42, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1 }}>
                {Number(stats.average_rating).toFixed(1)}
              </p>
              <div style={{ margin: '8px 0' }}>
                <StarRating rating={Math.round(stats.average_rating)} size={20} />
              </div>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                {stats.total_reviews} {stats.total_reviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Right — bar chart */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center', minWidth: 200 }}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.rating_counts[star as keyof typeof stats.rating_counts] || 0;
                const pct = (count / maxBarCount) * 100;
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: '#6B7280', width: 16, textAlign: 'center', fontWeight: 500 }}>{star}</span>
                    <Star size={14} fill="#F59E0B" color="#F59E0B" />
                    <div style={{ flex: 1, height: 10, backgroundColor: '#F3F4F6', borderRadius: 5, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          backgroundColor: '#F59E0B',
                          borderRadius: 5,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 13, color: '#9CA3AF', width: 28, textAlign: 'right' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════ REVIEW CARDS ═══════════ */}
        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
            <Star size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>No reviews yet</p>
            <p style={{ fontSize: 14 }}>This seller hasn&apos;t received any reviews yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reviews.map((review) => {
              const reviewerAvatar = review.reviewer.avatar_url
                ? review.reviewer.avatar_url.startsWith('http')
                  ? review.reviewer.avatar_url
                  : `${CLOUDFRONT_BASE}/${review.reviewer.avatar_url}`
                : null;

              return (
                <div
                  key={review.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 20,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Link
                      href={`/profile/${review.reviewer.id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
                    >
                      {reviewerAvatar ? (
                        <img
                          src={reviewerAvatar}
                          alt={review.reviewer.display_name}
                          style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#1DC690', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
                            {review.reviewer.display_name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                        {review.reviewer.display_name}
                      </span>
                    </Link>
                    <span style={{ fontSize: 13, color: '#9CA3AF' }}>
                      {formatRelativeTime(review.created_at)}
                    </span>
                  </div>

                  {/* Stars */}
                  <div style={{ marginBottom: 10 }}>
                    <StarRating rating={review.rating} size={16} />
                  </div>

                  {/* Text */}
                  {review.review_text && (
                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: '0 0 12px' }}>
                      {review.review_text}
                    </p>
                  )}

                  {/* Linked item */}
                  {review.listing && (
                    <Link
                      href={`/listings/${review.listing.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        backgroundColor: '#F9FAFB',
                        borderRadius: 8,
                        textDecoration: 'none',
                      }}
                    >
                      {review.listing.image ? (
                        <img
                          src={review.listing.image.startsWith('http') ? review.listing.image : `${CLOUDFRONT_BASE}/${review.listing.image}`}
                          alt={review.listing.title}
                          style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 6, backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={16} color="#9CA3AF" />
                        </div>
                      )}
                      <span style={{ flex: 1, fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {review.listing.title}
                      </span>
                      <ChevronRight size={16} color="#9CA3AF" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button
              onClick={loadMore}
              disabled={loadingMore}
              style={{
                padding: '12px 32px',
                borderRadius: 8,
                border: '2px solid #1DC690',
                backgroundColor: 'transparent',
                color: '#1DC690',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: loadingMore ? 0.5 : 1,
              }}
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
