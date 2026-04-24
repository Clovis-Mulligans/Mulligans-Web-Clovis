'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star, Check, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import PageHeader from '@/components/PageHeader';
import { getOrder, createReview } from '@mulligans/api-client';
import type { OrderDetail } from '@mulligans/api-client';

interface ReviewPageProps {}

export default function ReviewPage({}: ReviewPageProps) {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const orderId = params?.id as string;

  // State
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState(0);

  // Auth guard - redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch order data
  useEffect(() => {
    if (!orderId || !isAuthenticated) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await getOrder(orderId);
        const data = (response as any).order || response;
        setOrder(data as OrderDetail);
      } catch (error: any) {
        console.error('Failed to fetch order:', error);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isAuthenticated]);

  // Auto-redirect after successful submission
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        router.push(`/orders/${orderId}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [submitted, orderId, router]);

  // Helper functions
  const getRatingLabel = (rating: number): string => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Below average';
      case 3: return 'Average';
      case 4: return 'Good';
      case 5: return 'Excellent';
      default: return 'Tap to rate';
    }
  };

  const handleStarClick = (star: number) => {
    setRating(star);
    setHoverRating(0);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a star rating');
      return;
    }

    if (!order) {
      setError('Order data not available');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await createReview({
        order_id: orderId,
        reviewed_user_id: order.seller.id,
        rating,
        review_text: reviewText.trim() || undefined,
        review_type: 'buyer_to_seller',
      });

      setSubmitted(true);
    } catch (error: any) {
      console.error('Submit review error:', error);

      if (error.response?.status === 400) {
        setError('You have already reviewed this order');
      } else {
        setError('Failed to submit review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: 20,
        backgroundColor: '#FFFFFF',
        minHeight: '100vh',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
          color: '#9CA3AF',
          fontSize: 14,
        }}>
          Loading...
        </div>
      </div>
    );
  }

  // Error state
  if (error && !order) {
    return (
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: 20,
        backgroundColor: '#FFFFFF',
        minHeight: '100vh',
      }}>
        <Link
          href={`/orders/${orderId}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#1DC690',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.02em',
            textDecoration: 'none',
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={16} />
          Back to order
        </Link>

        <PageHeader title="Leave a review" />

        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#6B7280',
        }}>
          {error}
        </div>
      </div>
    );
  }

  if (!order) return null;

  // Success state
  if (submitted) {
    return (
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: 20,
        backgroundColor: '#FFFFFF',
        minHeight: '100vh',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          textAlign: 'center',
        }}>
          <CheckCircle2 size={48} color="#1DC690" style={{ marginBottom: 16 }} />
          <h2 style={{
            fontSize: 18,
            fontWeight: 500,
            color: '#06070A',
            margin: '0 0 8px',
          }}>
            Review submitted
          </h2>
          <p style={{
            fontSize: 14,
            color: '#6B7280',
            margin: 0,
          }}>
            Thank you for your feedback
          </p>
        </div>
      </div>
    );
  }

  // Check if user can review this order
  if (order.status !== 'completed') {
    return (
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: 20,
        backgroundColor: '#FFFFFF',
        minHeight: '100vh',
      }}>
        <Link
          href={`/orders/${orderId}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#1DC690',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.02em',
            textDecoration: 'none',
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={16} />
          Back to order
        </Link>

        <PageHeader title="Leave a review" />

        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #F0F0F0',
          borderRadius: 14,
          padding: 20,
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: 14,
            color: '#6B7280',
            margin: 0,
          }}>
            Reviews can only be left for completed orders.
          </p>
        </div>
      </div>
    );
  }

  if (order.buyer.id !== user?.id) {
    return (
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: 20,
        backgroundColor: '#FFFFFF',
        minHeight: '100vh',
      }}>
        <Link
          href={`/orders/${orderId}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#1DC690',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.02em',
            textDecoration: 'none',
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={16} />
          Back to order
        </Link>

        <PageHeader title="Leave a review" />

        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #F0F0F0',
          borderRadius: 14,
          padding: 20,
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: 14,
            color: '#6B7280',
            margin: 0,
          }}>
            You can only review orders you purchased.
          </p>
        </div>
      </div>
    );
  }

  // Main review form
  return (
    <div style={{
      maxWidth: 600,
      margin: '0 auto',
      padding: 20,
      backgroundColor: '#FFFFFF',
      minHeight: '100vh',
    }}>
      {/* Back Link */}
      <Link
        href={`/orders/${orderId}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: '#1DC690',
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '0.02em',
          textDecoration: 'none',
          marginBottom: 24,
        }}
      >
        <ArrowLeft size={16} />
        Back to order
      </Link>

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 22,
          fontWeight: 500,
          color: '#06070A',
          margin: '0 0 8px',
        }}>
          Leave a review
        </h1>
        <div style={{
          width: 32,
          height: 3,
          backgroundColor: '#1DC690',
          borderRadius: 2,
        }} />
      </div>

      {/* Item Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #F0F0F0',
        borderRadius: 14,
        padding: 20,
        marginBottom: 14,
      }}>
        <div style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#278AB0',
          fontWeight: 500,
          marginBottom: 14,
        }}>
          ITEM
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {/* Item Image */}
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 8,
            overflow: 'hidden',
            flexShrink: 0,
            backgroundColor: '#F7F7F5',
          }}>
            {order.listing.images && order.listing.images.length > 0 ? (
              <img
                src={order.listing.images[0].image_url}
                alt={order.listing.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#F7F7F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: '#9CA3AF',
              }}>
                No image
              </div>
            )}
          </div>

          {/* Item Details */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 15,
              fontWeight: 500,
              color: '#06070A',
              marginBottom: 4,
              lineHeight: 1.3,
            }}>
              {order.listing.title}
            </div>

            {order.listing.brand && (
              <div style={{
                fontSize: 13,
                color: '#6B7280',
                marginBottom: 4,
              }}>
                {order.listing.brand}
              </div>
            )}

            <div style={{
              fontSize: 15,
              fontWeight: 500,
              color: '#1DC690',
              marginBottom: 8,
            }}>
              £{order.amount.toFixed(2)}
            </div>

            <div style={{
              fontSize: 13,
              color: '#9CA3AF',
            }}>
              Seller: {order.seller.display_name}{' '}
              {order.seller.rating && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <Star size={12} fill="#F59E0B" color="#F59E0B" />
                  {order.seller.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #F0F0F0',
        borderRadius: 14,
        padding: 20,
        marginBottom: 14,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#278AB0',
          fontWeight: 500,
          marginBottom: 16,
        }}>
          RATING
        </div>

        {/* Stars */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 12,
        }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              style={{
                background: 'none',
                border: 'none',
                padding: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Star
                size={32}
                fill={(hoverRating >= star || rating >= star) ? '#F59E0B' : 'none'}
                color={(hoverRating >= star || rating >= star) ? '#F59E0B' : '#D1D5DB'}
              />
            </button>
          ))}
        </div>

        {/* Rating Label */}
        <div style={{
          fontSize: 13,
          color: rating > 0 ? '#F59E0B' : '#9CA3AF',
          fontWeight: rating > 0 ? 500 : 400,
        }}>
          {getRatingLabel(hoverRating || rating)}
        </div>
      </div>

      {/* Review Text Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #F0F0F0',
        borderRadius: 14,
        padding: 20,
        marginBottom: 14,
      }}>
        <div style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#278AB0',
          fontWeight: 500,
          marginBottom: 16,
        }}>
          YOUR REVIEW
        </div>

        <textarea
          placeholder="Tell others about your experience with this seller. Was the item as described? How was the communication and shipping?"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          maxLength={500}
          style={{
            width: '100%',
            minHeight: 100,
            padding: '10px 14px',
            border: '1px solid #E5E7EB',
            borderRadius: 10,
            fontSize: 14,
            color: '#06070A',
            backgroundColor: '#FFFFFF',
            resize: 'vertical',
            fontFamily: 'inherit',
            lineHeight: 1.5,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#1DC690';
            e.target.style.boxShadow = '0 0 0 3px rgba(29,198,144,0.1)';
            e.target.style.outline = 'none';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#E5E7EB';
            e.target.style.boxShadow = 'none';
          }}
        />

        <div style={{
          textAlign: 'right',
          fontSize: 12,
          color: '#9CA3AF',
          marginTop: 8,
        }}>
          {reviewText.length}/500 characters
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 14,
          color: '#991B1B',
          fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        style={{
          width: '100%',
          height: 46,
          backgroundColor: rating === 0 ? '#9CA3AF' : '#1DC690',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: '0.01em',
          cursor: rating === 0 ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
        onMouseOver={(e) => {
          if (rating > 0 && !submitting) {
            e.currentTarget.style.backgroundColor = '#18B07E';
          }
        }}
        onMouseOut={(e) => {
          if (rating > 0) {
            e.currentTarget.style.backgroundColor = '#1DC690';
          }
        }}
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  );
}