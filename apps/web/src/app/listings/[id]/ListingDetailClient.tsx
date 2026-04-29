'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { addToCart, createConversation, addFavourite, removeFavourite, checkFavourite, ApiError } from '@mulligans/api-client';
import { OfferModal } from '@/components/OfferModal';
import { CONDITION_COLOURS, CATEGORY_DB_TO_SLUG } from '@/lib/constants';
import {
  Heart,
  Share2,
  Flag,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Truck,
  Shield,
  Star,
  Check,
  X,
  Search,
  MessageCircle,
  User,
} from 'lucide-react';

function getAge(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function conditionBadgeStyle(level: number): { bg: string; text: string } {
  if (level >= 4) return { bg: 'rgba(29,198,144,0.1)', text: '#059669' };
  if (level === 3) return { bg: 'rgba(39,138,176,0.1)', text: '#278AB0' };
  if (level === 2) return { bg: 'rgba(245,158,11,0.1)', text: '#D97706' };
  return { bg: 'rgba(220,38,38,0.1)', text: '#DC2626' };
}

function conditionTextColour(level: number): string {
  if (level >= 4) return '#059669';
  if (level === 3) return '#278AB0';
  if (level === 2) return '#D97706';
  return '#DC2626';
}

interface ListingDetailClientProps {
  listing: any;
  similar: any[];
}

export function ListingDetailClient({ listing, similar }: ListingDetailClientProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [showOffer, setShowOffer] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isFavourited, setIsFavourited] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  const isOwnListing = user?.id === listing.seller_id;
  const rawPrice = Number(listing.price);
  const price = isOwnListing ? rawPrice : rawPrice * 1.075 + 0.99;
  const originalPrice = listing.original_price ? Number(listing.original_price) : null;
  const isSold = listing.status === 'sold';
  const isActive = listing.status === 'active';
  const condition = listing.condition_overall ? CONDITION_COLOURS[listing.condition_overall] : null;
  const seller = listing.seller || listing.users;
  const sizeQuantities = listing.specifications?.sizeQuantities as Record<string, number> | undefined;
  const hasSizes = sizeQuantities && Object.keys(sizeQuantities).length > 0;
  const shippingCost = listing.shipping_cost ? Number(listing.shipping_cost) : null;
  const images: { image_url: string }[] = listing.images || [];
  const favouriteCount = listing.favorites_count || 0;

  const buyerProtectionFee = rawPrice * 0.075 + 0.99;
  const totalPrice = rawPrice + (shippingCost || 0) + buyerProtectionFee;

  const categorySlug = listing.category ? CATEGORY_DB_TO_SLUG[listing.category] || listing.category.toLowerCase().replace(/[^a-z]+/g, '-') : '';

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!isAuthenticated || !listing.id || isOwnListing) return;
    checkFavourite(listing.id)
      .then((res) => setIsFavourited(res.is_favourite))
      .catch(() => {});
  }, [isAuthenticated, listing.id, isOwnListing]);

  const handleFavouriteToggle = () => {
    if (!isAuthenticated) { router.push(`/login?redirect=/listings/${listing.id}`); return; }
    const was = isFavourited;
    setIsFavourited(!was);
    (was ? removeFavourite(listing.id) : addFavourite(listing.id))
      .catch((err: any) => {
        if (err?.status === 401 || err?.status === 403) setIsFavourited(was);
        console.error(err);
      });
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) { router.push(`/login?redirect=/listings/${listing.id}`); return; }
    if (hasSizes && !selectedSize) { showToast('Please select a size'); return; }
    setAddingToCart(true);
    try {
      await addToCart({ listing_id: listing.id, quantity: 1, selected_size: selectedSize || undefined });
      showToast('Added to bag');
    } catch (err) {
      if (err instanceof ApiError) showToast('Could not add to bag');
      else showToast('Something went wrong');
      console.error(err);
    } finally { setAddingToCart(false); }
  };

  const handleMessage = async () => {
    if (!isAuthenticated) { router.push(`/login?redirect=/listings/${listing.id}`); return; }
    try {
      await createConversation({ listing_id: listing.id, seller_id: listing.seller_id });
      router.push('/messages');
    } catch (err) { console.error(err); showToast('Could not open conversation'); }
  };

  const handleMakeOffer = () => {
    if (!isAuthenticated) { router.push(`/login?redirect=/listings/${listing.id}`); return; }
    setShowOffer(true);
  };

  const handleShare = async () => {
    const url = `https://mulligans.uk.com/listings/${listing.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: listing.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Link copied');
    }
  };

  const specs = listing.specifications
    ? Object.entries(listing.specifications).filter(([k]) => k !== 'sizeQuantities' && k !== 'model')
    : [];

  const specRows = [
    listing.brand ? ['Brand', listing.brand] : null,
    listing.model ? ['Model', listing.model] : null,
    listing.category ? ['Category', listing.category] : null,
    listing.subcategory ? ['Subcategory', listing.subcategory] : null,
    ...specs.map(([k, v]) => [k.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()), String(v)]),
  ].filter((item): item is [string, string] => Array.isArray(item) && item.length === 2);

  const quickSpecParts: string[] = [];
  const specMap = listing.specifications || {};
  if (listing.category === 'Clubs') {
    if (specMap.loft) quickSpecParts.push(`${specMap.loft}deg`);
    if (specMap.shaftFlex) quickSpecParts.push(String(specMap.shaftFlex));
    if (specMap.dexterity) quickSpecParts.push(String(specMap.dexterity));
  } else if (listing.category === 'Clothing') {
    if (specMap.size) quickSpecParts.push(`Size ${specMap.size}`);
    if (specMap.colour) quickSpecParts.push(String(specMap.colour));
  } else if (listing.category === 'Shoes') {
    if (specMap.size) quickSpecParts.push(`UK ${specMap.size}`);
    if (specMap.colour) quickSpecParts.push(String(specMap.colour));
  } else if (listing.category === 'Balls') {
    if (listing.ball_condition_type) quickSpecParts.push(String(listing.ball_condition_type));
  }

  const nextImage = () => setSelectedImageIndex((i) => (i + 1) % images.length);
  const prevImage = () => setSelectedImageIndex((i) => (i - 1 + images.length) % images.length);

  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        {/* Breadcrumb */}
        {listing.category && (
          <nav style={{ padding: '16px 0 12px', fontSize: 13, fontFamily: 'var(--font-sans)' }}>
            <Link href="/" style={{ color: '#9CA3AF', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#1DC690')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}>
              Home
            </Link>
            <span style={{ color: '#9CA3AF', margin: '0 6px' }}>&gt;</span>
            <Link href={`/search?category=${categorySlug}`} style={{ color: '#9CA3AF', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#1DC690')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}>
              {listing.category}
            </Link>
            {listing.subcategory && (
              <>
                <span style={{ color: '#9CA3AF', margin: '0 6px' }}>&gt;</span>
                <Link href={`/search?category=${categorySlug}&subcategory=${encodeURIComponent(listing.subcategory)}`} style={{ color: '#9CA3AF', textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#1DC690')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}>
                  {listing.subcategory}
                </Link>
              </>
            )}
            <span style={{ color: '#9CA3AF', margin: '0 6px' }}>&gt;</span>
            <span style={{ color: '#06070A' }}>{listing.title}</span>
          </nav>
        )}

        {/* Two-column layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 40,
          alignItems: 'start',
          paddingBottom: 48,
        }} className="listing-grid">

          {/* ─── LEFT COLUMN — IMAGES ─── */}
          <div>
            {/* Main image */}
            <div style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 14, overflow: 'hidden', backgroundColor: '#F7F7F5' }}>
              {images.length > 0 ? (
                <img
                  src={images[selectedImageIndex]?.image_url}
                  alt={listing.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: images.length > 1 ? 'pointer' : 'default' }}
                  onClick={() => { if (images.length > 1) setShowLightbox(true); }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Search size={48} color="#D1D5DB" />
                </div>
              )}

              {isSold && (
                <div style={{
                  position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 20, color: '#FFFFFF', backgroundColor: '#06070A', padding: '10px 24px', borderRadius: 10 }}>SOLD</span>
                </div>
              )}

              {/* Favourite button */}
              {!isOwnListing && (
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <button
                    onClick={handleFavouriteToggle}
                    style={{
                      width: 40, height: 40, borderRadius: '50%', border: 'none',
                      backgroundColor: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.transform = 'scale(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)'; e.currentTarget.style.transform = 'scale(1)'; }}
                    aria-label={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
                  >
                    <Heart size={20} color={isFavourited ? '#DC2626' : '#9CA3AF'} fill={isFavourited ? '#DC2626' : 'none'} />
                  </button>
                  {favouriteCount > 0 && (
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{favouriteCount}</span>
                  )}
                </div>
              )}

              {/* Image nav arrows */}
              {images.length > 1 && (
                <>
                  <button onClick={prevImage} style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    width: 34, height: 34, borderRadius: '50%', border: 'none',
                    backgroundColor: 'rgba(255,255,255,0.85)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }} aria-label="Previous image">
                    <ChevronLeft size={18} color="#06070A" />
                  </button>
                  <button onClick={nextImage} style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    width: 34, height: 34, borderRadius: '50%', border: 'none',
                    backgroundColor: 'rgba(255,255,255,0.85)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }} aria-label="Next image">
                    <ChevronRight size={18} color="#06070A" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail row */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto' }}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    style={{
                      width: 72, height: 72, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                      border: `2px solid ${i === selectedImageIndex ? '#1DC690' : 'transparent'}`,
                      cursor: 'pointer', padding: 0, background: 'none',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => { if (i !== selectedImageIndex) e.currentTarget.style.borderColor = '#D1D5DB'; }}
                    onMouseLeave={(e) => { if (i !== selectedImageIndex) e.currentTarget.style.borderColor = 'transparent'; }}
                  >
                    <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}

            {/* Share / Report / Edit row under images */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14 }}>
              <button onClick={handleShare} style={{
                display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 13, color: '#9CA3AF',
              }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#06070A')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}>
                <Share2 size={15} /> Share
              </button>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 13, color: '#9CA3AF',
              }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#06070A')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}>
                <Flag size={15} /> Report
              </button>
              {isOwnListing && (
                <Link href={`/listings/${listing.id}/edit`} style={{
                  display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none',
                  fontFamily: 'var(--font-sans)', fontSize: 13, color: '#9CA3AF',
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#06070A')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}>
                  <Pencil size={15} /> Edit listing
                </Link>
              )}
            </div>
          </div>

          {/* ─── RIGHT COLUMN — INFO ─── */}
          <div>
            {/* 1. Title */}
            <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 22, color: '#06070A', lineHeight: 1.3, margin: 0 }}>
              {listing.title}
            </h1>

            {/* 2. Price row */}
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 22, color: isSold ? '#9CA3AF' : '#06070A' }}>
                {isOwnListing ? `£${rawPrice.toFixed(2)}` : `£${price.toFixed(2)}`}
              </span>
              {!isOwnListing && (
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#9CA3AF' }}>Incl. fees & shipping</span>
              )}
              {isOwnListing && (
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#9CA3AF' }}>(your listing)</span>
              )}
              {originalPrice && originalPrice > rawPrice && !isSold && !isOwnListing && (
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#9CA3AF', textDecoration: 'line-through' }}>
                  £{(originalPrice * 1.075 + 0.99).toFixed(2)}
                </span>
              )}
            </div>

            {/* 3. Quick specs line */}
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {condition && (
                <span style={{
                  fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 12, borderRadius: 10,
                  padding: '4px 10px', backgroundColor: conditionBadgeStyle(listing.condition_overall).bg,
                  color: conditionBadgeStyle(listing.condition_overall).text,
                }}>
                  {condition.label}
                </span>
              )}
              {quickSpecParts.length > 0 && (
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#6B7280' }}>
                  {quickSpecParts.join(' · ')}
                </span>
              )}
            </div>

            {/* Size selector */}
            {hasSizes && isActive && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: '#06070A', marginBottom: 8 }}>Select Size</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(sizeQuantities!).map(([size, qty]) => (
                    <button key={size} onClick={() => setSelectedSize(size)} disabled={qty <= 0}
                      style={{
                        fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13, minHeight: 40,
                        padding: '8px 16px', borderRadius: 10, cursor: qty > 0 ? 'pointer' : 'not-allowed',
                        backgroundColor: selectedSize === size ? '#06070A' : '#FFFFFF',
                        color: selectedSize === size ? '#FFFFFF' : '#06070A',
                        border: selectedSize === size ? '1px solid #06070A' : '1px solid #E0E0E0',
                        opacity: qty <= 0 ? 0.4 : 1,
                      }}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. CTA Buttons */}
            {isActive && !isOwnListing && (
              <div style={{ marginTop: 20 }}>
                <button onClick={handleAddToCart} disabled={addingToCart}
                  style={{
                    width: '100%', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15,
                    color: '#FFFFFF', backgroundColor: '#1DC690', border: 'none', borderRadius: 12,
                    padding: 14, cursor: addingToCart ? 'not-allowed' : 'pointer', transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!addingToCart) e.currentTarget.style.backgroundColor = '#17a87a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1DC690'; }}>
                  {addingToCart ? 'Adding...' : 'Buy now'}
                </button>
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  {listing.is_negotiable && (
                    <button onClick={handleMakeOffer}
                      style={{
                        flex: 1, fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14,
                        color: '#06070A', backgroundColor: '#FFFFFF', border: '1px solid #E0E0E0',
                        borderRadius: 12, padding: 13, cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.backgroundColor = '#FAFAF8'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.backgroundColor = '#FFFFFF'; }}>
                      Make offer
                    </button>
                  )}
                  <button onClick={handleAddToCart} disabled={addingToCart}
                    style={{
                      flex: 1, fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14,
                      color: '#06070A', backgroundColor: '#FFFFFF', border: '1px solid #E0E0E0',
                      borderRadius: 12, padding: 13, cursor: addingToCart ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!addingToCart) { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.backgroundColor = '#FAFAF8'; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.backgroundColor = '#FFFFFF'; }}>
                    Add to bag
                  </button>
                </div>

                {/* Shipping note */}
                <div style={{ textAlign: 'center', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Truck size={16} color="#278AB0" />
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#278AB0' }}>
                    {shippingCost && shippingCost > 0
                      ? `Insured tracked shipping · £${shippingCost.toFixed(2)}`
                      : 'Free insured tracked shipping'}
                  </span>
                </div>
              </div>
            )}

            {isSold && (
              <div style={{ marginTop: 20, backgroundColor: '#06070A', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: '#FFFFFF', margin: 0 }}>This item has been sold</p>
                <a href="#similar" style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#1DC690', marginTop: 8, display: 'inline-block' }}>See similar items</a>
              </div>
            )}

            {isOwnListing && (
              <div style={{ marginTop: 20 }}>
                <Link href={`/listings/${listing.id}/edit`}
                  style={{
                    display: 'block', width: '100%', textAlign: 'center', fontFamily: 'var(--font-sans)',
                    fontWeight: 600, fontSize: 15, color: '#FFFFFF', backgroundColor: '#1C4670',
                    borderRadius: 12, padding: 14, textDecoration: 'none',
                  }}>
                  Edit listing
                </Link>
              </div>
            )}

            {/* 5. Divider */}
            <div style={{ borderBottom: '1px solid #E5E7EB', margin: '20px 0' }} />

            {/* 6. Price breakdown card */}
            {!isOwnListing && (
              <div style={{ backgroundColor: '#FAFAF8', borderRadius: 12, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Star size={18} color="#1DC690" />
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: '#06070A' }}>Price breakdown</span>
                </div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#9CA3AF', margin: '0 0 12px' }}>{"What's included in the total price"}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#6B7280' }}>Item price</span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#06070A' }}>{'£'}{rawPrice.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#6B7280' }}>Shipping</span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: shippingCost && shippingCost > 0 ? '#06070A' : '#1DC690' }}>
                      {shippingCost && shippingCost > 0 ? `£${shippingCost.toFixed(2)}` : 'Free'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#6B7280' }}>Buyer protection (7.5% + {'£'}0.99)</span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#06070A' }}>{'£'}{buyerProtectionFee.toFixed(2)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: '#06070A' }}>Total</span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: '#06070A' }}>{'£'}{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Buyer protection row */}
            {!isOwnListing && (
              <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(29,198,144,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Shield size={18} color="#1DC690" />
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600, color: '#06070A' }}>Buyer protection included. </span>
                  Every purchase is covered by Mulligans Buyer Protection. Full refund if the item isn{"'"}t as described.{' '}
                  <a href="/buyer-protection" style={{ color: '#278AB0', textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}>
                    Learn more
                  </a>
                </div>
              </div>
            )}

            {/* 8. Divider */}
            <div style={{ borderBottom: '1px solid #E5E7EB', margin: '20px 0' }} />

            {/* 9. Description */}
            {listing.description && (
              <>
                <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: '#06070A', margin: '0 0 10px' }}>Description</h2>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#6B7280', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                  {listing.description}
                </p>
                <div style={{ borderBottom: '1px solid #E5E7EB', margin: '20px 0' }} />
              </>
            )}

            {/* 11. Specifications */}
            {specRows.length > 0 && (
              <>
                <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: '#06070A', margin: '0 0 10px' }}>Specifications</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  {specRows.map(([label, value], i) => {
                    const isEven = i % 2 === 1;
                    return (
                      <div key={i} style={{
                        padding: '10px 0',
                        paddingRight: isEven ? 0 : 16,
                        paddingLeft: isEven ? 16 : 0,
                        borderBottom: '1px solid #F0F0F0',
                        borderLeft: isEven ? '1px solid #F0F0F0' : 'none',
                      }}>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#9CA3AF' }}>{label}</div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: '#06070A', marginTop: 2 }}>{value}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ borderBottom: '1px solid #E5E7EB', margin: '20px 0' }} />
              </>
            )}

            {/* 13. Condition */}
            {condition && (
              <>
                <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: '#06070A', margin: '0 0 10px' }}>Condition</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 12, borderRadius: 10,
                    padding: '4px 10px', backgroundColor: conditionBadgeStyle(listing.condition_overall).bg,
                    color: conditionBadgeStyle(listing.condition_overall).text,
                  }}>
                    {condition.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#6B7280' }}>Overall</span>
                </div>

                {listing.condition_head != null && listing.condition_shaft != null && listing.condition_grip != null && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 10 }}>
                    {[
                      { label: 'HEAD', value: listing.condition_head },
                      { label: 'SHAFT', value: listing.condition_shaft },
                      { label: 'GRIP', value: listing.condition_grip },
                    ].map(({ label, value }) => {
                      const cLabel = CONDITION_COLOURS[value]?.label || `${value}/5`;
                      return (
                        <div key={label} style={{
                          textAlign: 'center', padding: 10, backgroundColor: '#FFFFFF',
                          border: '1px solid #F0F0F0', borderRadius: 10,
                        }}>
                          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase' as const }}>{label}</div>
                          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: conditionTextColour(value), marginTop: 4 }}>{cLabel}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ borderBottom: '1px solid #E5E7EB', margin: '20px 0' }} />
              </>
            )}

            {/* 15. Seller card */}
            {seller && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                    background: seller.avatar_url ? undefined : 'linear-gradient(135deg, #1C4670, #278AB0)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {seller.avatar_url ? (
                      <img src={seller.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 18, color: '#FFFFFF' }}>
                        {(seller.display_name || '?')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: '#06070A' }}>
                        {seller.display_name || 'Seller'}
                      </span>
                      {seller.is_verified_seller && (
                        <span style={{
                          width: 16, height: 16, borderRadius: '50%', backgroundColor: '#1DC690',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Check size={10} color="#FFFFFF" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span>{seller.total_sales || 0} sold</span>
                      <span style={{ color: '#D1D5DB' }}>{'·'}</span>
                      <span>Active {getAge(seller.created_at || listing.created_at)}</span>
                    </div>
                    {seller.rating && Number(seller.rating) > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={13} color="#F59E0B" fill={i < Math.round(Number(seller.rating)) ? '#F59E0B' : 'none'} />
                        ))}
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#9CA3AF', marginLeft: 2 }}>
                          ({Number(seller.rating).toFixed(1)})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <Link href={`/user/${seller.id}`}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13, color: '#06070A',
                      backgroundColor: '#FFFFFF', border: '1px solid #E0E0E0', borderRadius: 10,
                      padding: 10, textDecoration: 'none', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.backgroundColor = '#FAFAF8'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.backgroundColor = '#FFFFFF'; }}>
                    View profile
                  </Link>
                  {!isOwnListing && (
                    <button onClick={handleMessage}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13, color: '#06070A',
                        backgroundColor: '#FFFFFF', border: '1px solid #E0E0E0', borderRadius: 10,
                        padding: 10, cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.backgroundColor = '#FAFAF8'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.backgroundColor = '#FFFFFF'; }}>
                      Message seller
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── SIMILAR ITEMS — Full width below two-column ─── */}
        {similar.length > 0 && (
          <section id="similar" style={{ paddingBottom: 48 }}>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 16, color: '#06070A', marginBottom: 16 }}>Similar items</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }} className="similar-grid">
              {similar.slice(0, 4).map((item: any) => {
                const itemRaw = Number(item.price);
                const itemPrice = itemRaw * 1.075 + 0.99;
                const itemImages: { image_url: string }[] = item.images || [];
                const itemCondition = item.condition_overall ? CONDITION_COLOURS[item.condition_overall] : null;
                const isVerified = item.seller?.is_verified_seller || item.users?.is_verified_seller;
                const itemSpecs: string[] = [];
                const iSpec = item.specifications || {};
                if (item.category === 'Clubs') {
                  if (iSpec.loft) itemSpecs.push(`${iSpec.loft}deg`);
                  if (iSpec.shaftFlex) itemSpecs.push(String(iSpec.shaftFlex));
                  if (iSpec.dexterity) itemSpecs.push(String(iSpec.dexterity));
                } else if (item.category === 'Clothing') {
                  if (iSpec.size) itemSpecs.push(`Size ${iSpec.size}`);
                  if (iSpec.colour) itemSpecs.push(String(iSpec.colour));
                } else if (item.category === 'Shoes') {
                  if (iSpec.size) itemSpecs.push(`UK ${iSpec.size}`);
                  if (iSpec.colour) itemSpecs.push(String(iSpec.colour));
                }

                return (
                  <Link key={item.id} href={`/listings/${item.id}`} style={{ textDecoration: 'none', transition: 'opacity 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
                    <div style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 14, overflow: 'hidden', backgroundColor: '#F7F7F5' }}>
                      {itemImages[0] ? (
                        <img src={itemImages[0].image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Search size={32} color="#D1D5DB" />
                        </div>
                      )}
                      {isVerified && (
                        <div style={{
                          position: 'absolute', bottom: 8, left: 8, display: 'flex', alignItems: 'center', gap: 4,
                          backgroundColor: 'rgba(29,198,144,0.9)', borderRadius: 8, padding: '3px 8px',
                        }}>
                          <Check size={11} color="#FFFFFF" strokeWidth={3} />
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: '#FFFFFF' }}>Verified</span>
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: '#06070A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.brand || 'Unknown'}</div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.model || item.title}</div>
                      {itemSpecs.length > 0 && (
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{itemSpecs.join(' · ')}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 16, color: '#1DC690' }}>{'£'}{itemPrice.toFixed(2)}</span>
                        {itemCondition && (
                          <span style={{
                            fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500, borderRadius: 8, padding: '2px 7px',
                            backgroundColor: conditionBadgeStyle(item.condition_overall).bg,
                            color: conditionBadgeStyle(item.condition_overall).text,
                          }}>
                            {itemCondition.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && images.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowLightbox(false)}>
          <button onClick={() => setShowLightbox(false)} style={{
            position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: '50%',
            border: 'none', backgroundColor: 'rgba(255,255,255,0.15)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={22} color="#FFFFFF" />
          </button>
          <img
            src={images[selectedImageIndex]?.image_url}
            alt={listing.title}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prevImage(); }} style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: '50%', border: 'none',
                backgroundColor: 'rgba(255,255,255,0.15)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ChevronLeft size={24} color="#FFFFFF" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); nextImage(); }} style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: '50%', border: 'none',
                backgroundColor: 'rgba(255,255,255,0.15)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ChevronRight size={24} color="#FFFFFF" />
              </button>
            </>
          )}
          {/* Lightbox thumbnails */}
          <div style={{ position: 'absolute', bottom: 20, display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
            {images.map((img, i) => (
              <button key={i} onClick={() => setSelectedImageIndex(i)} style={{
                width: 48, height: 48, borderRadius: 8, overflow: 'hidden', border: `2px solid ${i === selectedImageIndex ? '#1DC690' : 'transparent'}`,
                cursor: 'pointer', padding: 0, background: 'none', opacity: i === selectedImageIndex ? 1 : 0.6,
              }}>
                <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      <OfferModal listing={listing} isOpen={showOffer} onClose={() => setShowOffer(false)} />

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 50, borderRadius: 10, padding: '12px 20px',
          fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: '#FFFFFF',
          backgroundColor: '#1DC690', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {toast}
        </div>
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 799px) {
          .listing-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .similar-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
        }
        @media (min-width: 800px) and (max-width: 1023px) {
          .similar-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
    </>
  );
}
