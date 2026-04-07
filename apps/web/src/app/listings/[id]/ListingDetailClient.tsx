'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { addToCart, createConversation, addFavourite, removeFavourite, checkFavourite, ApiError } from '@mulligans/api-client';
import { ImageGallery } from '@/components/ImageGallery';
import { OfferModal } from '@/components/OfferModal';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ListingCard } from '@/components/ListingCard';
import { ExpandableInfoRow } from '@/components/ExpandableInfoRow';
import { CONDITION_COLOURS } from '@/lib/constants';

function getAge(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Condition Explainer Popup ───────────────────────────────

function ConditionExplainer({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleKey); };
  }, [onClose]);

  return (
    <div ref={ref} className="absolute left-0 top-full mt-2 z-50 w-72 rounded-xl bg-white p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.1)', border: '1px solid #E0E0D8' }}>
      <h4 className="mb-2 text-sm font-bold" style={{ fontFamily: 'var(--font-sans)', color: '#0D0D0D' }}>Condition Grading</h4>
      {Object.entries(CONDITION_COLOURS).reverse().map(([grade, { bg, label, description }]) => (
        <div key={grade} className="flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid #F4F4F0' }}>
          <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: bg }} />
          <span className="text-xs font-semibold" style={{ fontFamily: 'var(--font-sans)', color: '#0D0D0D', minWidth: '70px' }}>{grade} — {label}</span>
          <span className="text-xs" style={{ color: '#6B6B6B', fontFamily: 'var(--font-sans)' }}>{description}</span>
        </div>
      ))}
      <p className="mt-2 text-xs italic" style={{ color: '#ADADAD', fontFamily: 'var(--font-sans)' }}>For clubs, condition is graded separately for Head, Shaft and Grip.</p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

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
  const [openInfoRow, setOpenInfoRow] = useState<'protection' | 'shipping' | null>(null);
  const [showConditionExplainer, setShowConditionExplainer] = useState(false);
  const [isFavourited, setIsFavourited] = useState(false);

 const rawPrice = Number(listing.price);
  const originalPrice = listing.original_price ? Number(listing.original_price) : null;
  const isSold = listing.status === 'sold';
  const isActive = listing.status === 'active';
  const condition = listing.condition_overall ? CONDITION_COLOURS[listing.condition_overall] : null;
  const seller = listing.seller || listing.users;
  const sizeQuantities = listing.specifications?.sizeQuantities as Record<string, number> | undefined;
  const hasSizes = sizeQuantities && Object.keys(sizeQuantities).length > 0;
  const isOwnListing = user?.id === listing.seller_id;
  const price = isOwnListing ? rawPrice : rawPrice * 1.075 + 0.99;

  const breadcrumbs = [
    { label: listing.category, href: `/category/${(listing.category || '').toLowerCase().replace(/[^a-z]+/g, '-')}` },
    ...(listing.subcategory ? [{ label: listing.subcategory }] : []),
  ];

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Check favourite status
  useEffect(() => {
    if (!isAuthenticated || !listing.id || isOwnListing) return;
    checkFavourite(listing.id)
      .then((res) => setIsFavourited(res.is_favourite))
      .catch(() => {});
  }, [isAuthenticated, listing.id, isOwnListing]);

  const handleFavouriteToggle = async () => {
    if (!isAuthenticated) { router.push(`/login?redirect=/listings/${listing.id}`); return; }
    const was = isFavourited;
    setIsFavourited(!was);
    try {
      if (was) await removeFavourite(listing.id);
      else await addFavourite(listing.id);
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) setIsFavourited(was);
      console.error(err);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) { router.push(`/login?redirect=/listings/${listing.id}`); return; }
    if (hasSizes && !selectedSize) { showToast('Please select a size'); return; }
    setAddingToCart(true);
    try {
      await addToCart({ listing_id: listing.id, quantity: 1, selected_size: selectedSize || undefined });
      showToast('Added to cart ✓');
    } catch (err) {
      if (err instanceof ApiError) showToast('Could not add to cart');
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

  const specs = listing.specifications
    ? Object.entries(listing.specifications).filter(([k]) => k !== 'sizeQuantities' && k !== 'model')
    : [];

  const specRows = [
    ['Category', listing.category],
    listing.subcategory ? ['Subcategory', listing.subcategory] : null,
    listing.brand ? ['Brand', listing.brand] : null,
    listing.model ? ['Model', listing.model] : null,
    ...specs.map(([k, v]) => [k.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()), String(v)]),
  ].filter(Boolean) as [string, string][];

  return (
    <>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-2">
        <Breadcrumb items={breadcrumbs} />

        <div className="flex flex-col lg:flex-row gap-8 pb-12">
          {/* Left: Images */}
          <div className="lg:w-[55%]">
            <ImageGallery images={listing.images || []} title={listing.title} />
          </div>

          {/* Right: Info + actions */}
          <div className="lg:w-[45%] lg:sticky lg:top-[80px] lg:self-start lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto">

            {/* ─── Price block ─────────────────────────── */}
            <div className="mb-4 pb-4" style={{ borderBottom: '1px solid #E0E0D8' }}>
              {/* Title row with favourite heart */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, color: '#0D0D0D', lineHeight: 1.3 }}>{listing.title}</h1>
                {!isOwnListing && (
                  <button
                    onClick={handleFavouriteToggle}
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{ width: '44px', height: '44px' }}
                    aria-label={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isFavourited ? '#1DC690' : 'none'} stroke={isFavourited ? '#1DC690' : '#ADADAD'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                  </button>
                )}
              </div>

              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-3">
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '1.8rem', color: isSold ? '#ADADAD' : '#1DC690' }}>£{price.toFixed(2)}</span>
                  {originalPrice && originalPrice > price && !isSold && (
                    <>
                      <span className="line-through" style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: '#ADADAD' }}>£{originalPrice.toFixed(2)}</span>
                      <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: '#1DC690' }}>Save {Math.round(((originalPrice - price) / originalPrice) * 100)}%</span>
                    </>
                  )}
                </div>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: '#6B6B6B' }}>Listed {getAge(listing.created_at)}</span>
              </div>

              {/* Fee breakdown hint (non-own listings only) */}
              {!isOwnListing && !isSold && (
                <p className="mt-1 italic" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: '#ADADAD' }}>
                  Includes 7.5% Buyer Protection + £0.99 service fee
                </p>
              )}

              {/* Expandable info rows */}
              <div className="mt-3">
                <ExpandableInfoRow
                  icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>}
                  label="Includes Buyer Protection Pro"
                  isOpen={openInfoRow === 'protection'}
                  onToggle={() => setOpenInfoRow(openInfoRow === 'protection' ? null : 'protection')}
                >
                  <p className="text-sm font-semibold mb-1" style={{ fontFamily: 'var(--font-sans)', color: '#0D0D0D' }}>Mulligans Buyer Protection</p>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: '#6B6B6B', lineHeight: 1.5 }}>
                    Every purchase on Mulligans is covered by our Buyer Protection guarantee. If your item doesn&apos;t arrive or isn&apos;t as described, we&apos;ll make it right — full refund, no questions asked.
                  </p>
                  <p className="mt-2" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: '#6B6B6B' }}>🛡 Covers: Non-delivery, item not as described, damaged in transit</p>
                </ExpandableInfoRow>

                {listing.shipping_cost && (
                  <ExpandableInfoRow
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>}
                    label={`${listing.parcel_size ? listing.parcel_size.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Shipping'}: £${Number(listing.shipping_cost).toFixed(2)}`}
                    isOpen={openInfoRow === 'shipping'}
                    onToggle={() => setOpenInfoRow(openInfoRow === 'shipping' ? null : 'shipping')}
                  >
                    <p className="text-sm font-semibold mb-1" style={{ fontFamily: 'var(--font-sans)', color: '#0D0D0D' }}>Insured Shipping</p>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: '#6B6B6B', lineHeight: 1.5 }}>
                      Shipping on this item includes transit insurance at no extra cost to you. If your item is lost or damaged during delivery, you&apos;re covered.
                    </p>
                    <p className="mt-2" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: '#6B6B6B' }}>🚚 Estimated delivery: 2–5 working days</p>
                  </ExpandableInfoRow>
                )}

                {listing.is_negotiable && (
                  <div className="flex items-center gap-1.5 py-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#278AB0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: '#278AB0', fontWeight: 600 }}>Accepts Offers</span>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Seller card ─────────────────────────── */}
            {seller && (
              <div className="rounded-xl bg-white p-4 mb-4" style={{ border: '1px solid #E0E0D8' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: seller.avatar_url ? undefined : '#1DC690' }}>
                    {seller.avatar_url ? <img src={seller.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center w-full h-full text-white font-bold">{(seller.display_name || '?')[0].toUpperCase()}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#0D0D0D] truncate" style={{ fontFamily: 'var(--font-sans)' }}>{seller.display_name || 'Seller'}</span>
                      {seller.is_verified_seller && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#1DC690" stroke="#1DC690" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                      {listing.location && <span>{listing.location}</span>}
                      {seller.rating && <span>⭐ {Number(seller.rating).toFixed(1)}</span>}
                      <span>{seller.total_sales || 0} sales</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link href={`/profile/${seller.id}`} className="flex-1 rounded-[10px] py-2 text-center text-sm font-bold transition-colors hover:bg-[#F4F4F0]" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, border: '1px solid #1DC690', color: '#1DC690' }}>Visit Seller</Link>
                  {!isOwnListing && (
                    <button onClick={handleMessage} className="flex-1 rounded-[10px] py-2 text-sm font-bold transition-colors hover:bg-[#F4F4F0]" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, border: '1px solid #1DC690', color: '#1DC690' }}>Message</button>
                  )}
                </div>
              </div>
            )}

            {/* ─── Size selector ───────────────────────── */}
            {hasSizes && isActive && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-semibold text-[#0D0D0D]" style={{ fontFamily: 'var(--font-sans)' }}>Select Size:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(sizeQuantities!).map(([size, qty]) => (
                    <button key={size} onClick={() => setSelectedSize(size)} disabled={qty <= 0} className="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ fontFamily: 'var(--font-sans)', backgroundColor: selectedSize === size ? '#1DC690' : '#FFFFFF', color: selectedSize === size ? '#FFFFFF' : '#0D0D0D', border: selectedSize === size ? 'none' : '1px solid #E0E0D8', textDecoration: qty <= 0 ? 'line-through' : 'none', minHeight: '44px' }}>
                      {size} {qty > 0 && <span className="text-xs opacity-60">({qty})</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Action buttons ──────────────────────── */}
            {isActive && !isOwnListing && (
              <div className="space-y-2 mb-4">
                <button onClick={handleAddToCart} disabled={addingToCart} className="w-full rounded-[10px] py-3 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, height: '48px', backgroundColor: '#1DC690' }}>
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
                {listing.is_negotiable && (
                  <button onClick={handleMakeOffer} className="w-full rounded-[10px] py-3 text-sm font-bold transition-colors hover:bg-[#F4F4F0]" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, height: '48px', border: '1.5px solid #1C4670', color: '#1C4670' }}>
                    Make an Offer
                  </button>
                )}
              </div>
            )}

            {isSold && (
              <div className="rounded-xl p-4 mb-4 text-center" style={{ backgroundColor: '#06070A' }}>
                <p className="text-white font-bold" style={{ fontFamily: 'var(--font-sans)' }}>This item has been sold</p>
                <a href="#similar" className="mt-2 inline-block text-sm text-[#1DC690] hover:underline" style={{ fontFamily: 'var(--font-sans)' }}>See Similar Items ↓</a>
              </div>
            )}

            {/* ─── Condition with colour-coded sub-grades ── */}
            {condition && (
              <div className="mb-4">
                <div className="relative inline-flex items-center gap-2">
                  <span className="rounded-full px-3 py-1 text-sm font-semibold text-white" style={{ backgroundColor: condition.bg, fontFamily: 'var(--font-sans)' }}>{condition.label}</span>
                  <button
                    onClick={() => setShowConditionExplainer(!showConditionExplainer)}
                    className="flex items-center justify-center"
                    style={{ width: '44px', height: '44px' }}
                    aria-label="Condition grading information"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  </button>
                  {showConditionExplainer && <ConditionExplainer onClose={() => setShowConditionExplainer(false)} />}
                </div>

                {listing.condition_head != null && listing.condition_shaft != null && listing.condition_grip != null && (
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm" style={{ fontFamily: 'var(--font-sans)' }}>
                    {[
                      { label: 'Head', value: listing.condition_head },
                      { label: 'Shaft', value: listing.condition_shaft },
                      { label: 'Grip', value: listing.condition_grip },
                    ].map(({ label, value }) => {
                      const c = CONDITION_COLOURS[value] || { bg: '#6B6B6B' };
                      return (
                        <div key={label} className="rounded-lg p-2" style={{ backgroundColor: `${c.bg}12` }}>
                          <span className="text-[#6B6B6B]">{label}</span><br/>
                          <span className="font-bold" style={{ color: c.bg }}>{value}/5</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Below fold ──────────────────────────────── */}
        {listing.description && (
          <section className="mb-8">
            <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.25rem', color: '#0D0D0D' }}>Description</h2>
            <div className="mt-3 rounded-xl bg-white p-5" style={{ border: '1px solid #E0E0D8', borderLeft: '3px solid #1DC690' }}>
              <p className="whitespace-pre-wrap" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: '#0D0D0D', lineHeight: 1.6 }}>{listing.description}</p>
            </div>
          </section>
        )}

        {specRows.length > 0 && (
          <section className="mb-8 pt-2 pb-2">
            <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.25rem', color: '#0D0D0D' }}>Specifications</h2>
            <div className="mt-3 rounded-xl bg-white overflow-hidden" style={{ border: '1px solid #E0E0D8' }}>
              {specRows.map(([label, value], i) => (
                <div
                  key={i}
                  className="flex justify-between px-4 py-3 text-sm"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FAFAF8',
                    borderBottom: i < specRows.length - 1 ? '1px solid #E0E0D8' : 'none',
                  }}
                >
                  <span style={{ color: '#6B6B6B' }}>{label}</span>
                  <span className="font-semibold" style={{ color: '#0D0D0D' }}>{value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {similar.length > 0 && (
          <section id="similar" className="mb-12">
            <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.25rem', color: '#0D0D0D' }}>Similar Items</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
              {similar.slice(0, 4).map((l: any) => <ListingCard key={l.id} listing={l} />)}
            </div>
          </section>
        )}
      </div>

      <OfferModal listing={listing} isOpen={showOffer} onClose={() => setShowOffer(false)} />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg px-5 py-3 text-sm font-semibold text-white" style={{ backgroundColor: '#1DC690', fontFamily: 'var(--font-sans)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast}
        </div>
      )}
    </>
  );
}
