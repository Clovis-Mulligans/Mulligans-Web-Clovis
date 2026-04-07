'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { addToCart, createConversation, ApiError } from '@mulligans/api-client';
import { ImageGallery } from '@/components/ImageGallery';
import { OfferModal } from '@/components/OfferModal';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ListingCard } from '@/components/ListingCard';

const CONDITION_COLOURS: Record<number, { bg: string; label: string }> = {
  5: { bg: '#10B981', label: 'New' },
  4: { bg: '#8B5CF6', label: 'Excellent' },
  3: { bg: '#3B82F6', label: 'Very Good' },
  2: { bg: '#F59E0B', label: 'Good' },
  1: { bg: '#EF4444', label: 'Poor' },
};

function getAge(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
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

  const price = Number(listing.price);
  const originalPrice = listing.original_price ? Number(listing.original_price) : null;
  const isSold = listing.status === 'sold';
  const isActive = listing.status === 'active';
  const condition = listing.condition_overall ? CONDITION_COLOURS[listing.condition_overall] : null;
  const seller = listing.seller || listing.users;
  const sizeQuantities = listing.specifications?.sizeQuantities as Record<string, number> | undefined;
  const hasSizes = sizeQuantities && Object.keys(sizeQuantities).length > 0;
  const isOwnListing = user?.id === listing.seller_id;

  const breadcrumbs = [
    { label: listing.category, href: `/category/${(listing.category || '').toLowerCase().replace(/[^a-z]+/g, '-')}` },
    ...(listing.subcategory ? [{ label: listing.subcategory }] : []),
  ];

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleAddToCart = async () => {
    if (!isAuthenticated) { router.push(`/login?redirect=/listings/${listing.id}`); return; }
    if (hasSizes && !selectedSize) { showToast('Please select a size'); return; }
    setAddingToCart(true);
    try {
      await addToCart({ listing_id: listing.id, quantity: 1, selected_size: selectedSize || undefined });
      showToast('Added to cart ✓');
    } catch (err) {
      if (err instanceof ApiError) showToast((err.data as { error?: string })?.error || 'Could not add to cart');
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

  // Specs (excluding sizeQuantities and model)
  const specs = listing.specifications
    ? Object.entries(listing.specifications).filter(([k]) => k !== 'sizeQuantities' && k !== 'model')
    : [];

  return (
    <>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-2">
        <Breadcrumb items={breadcrumbs} />

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8 pb-12">
          {/* Left: Images */}
          <div className="lg:w-[55%]">
            <ImageGallery images={listing.images || []} title={listing.title} />
          </div>

          {/* Right: Info + actions */}
          <div className="lg:w-[45%] lg:sticky lg:top-[80px] lg:self-start lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto rounded-xl bg-white p-6" style={{ border: '1px solid #E0E0D8' }}>
            <h1 className="mb-4" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.4rem', color: '#0D0D0D', lineHeight: 1.3 }}>{listing.title}</h1>
            {/* Price block */}
            <div className="mb-4">
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
              <div className="mt-2 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: '#1DC690' }}>Includes Buyer Protection Pro</span>
              </div>
              {listing.is_negotiable && (
                <div className="mt-1 flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#278AB0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: '#278AB0' }}>Accepts Offers</span>
                </div>
              )}
            </div>

            {/* Seller card */}
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

            {/* Size selector */}
            {hasSizes && isActive && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-semibold text-[#0D0D0D]" style={{ fontFamily: 'var(--font-sans)' }}>Select Size:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(sizeQuantities!).map(([size, qty]) => (
                    <button key={size} onClick={() => setSelectedSize(size)} disabled={qty <= 0} className="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ fontFamily: 'var(--font-sans)', backgroundColor: selectedSize === size ? '#1DC690' : '#FFFFFF', color: selectedSize === size ? '#FFFFFF' : '#0D0D0D', border: selectedSize === size ? 'none' : '1px solid #E0E0D8', textDecoration: qty <= 0 ? 'line-through' : 'none' }}>
                      {size} {qty > 0 && <span className="text-xs opacity-60">({qty})</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
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

            {/* Condition */}
            {condition && (
              <div className="mb-4">
                <span className="rounded-full px-3 py-1 text-sm font-semibold text-white" style={{ backgroundColor: condition.bg, fontFamily: 'var(--font-sans)' }}>{condition.label}</span>
                {listing.condition_head != null && listing.condition_shaft != null && listing.condition_grip != null && (
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm" style={{ fontFamily: 'var(--font-sans)' }}>
                    <div className="rounded-lg p-2" style={{ backgroundColor: '#F4F4F0' }}><span className="text-[#6B6B6B]">Head</span><br/><span className="font-bold">{listing.condition_head}/5</span></div>
                    <div className="rounded-lg p-2" style={{ backgroundColor: '#F4F4F0' }}><span className="text-[#6B6B6B]">Shaft</span><br/><span className="font-bold">{listing.condition_shaft}/5</span></div>
                    <div className="rounded-lg p-2" style={{ backgroundColor: '#F4F4F0' }}><span className="text-[#6B6B6B]">Grip</span><br/><span className="font-bold">{listing.condition_grip}/5</span></div>
                  </div>
                )}
              </div>
            )}

            {/* Postage */}
            {listing.shipping_cost && (
              <div className="rounded-xl p-4 mb-4" style={{ border: '1px solid #E0E0D8' }}>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>
                  <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-sans)', color: '#0D0D0D' }}>
                    {listing.parcel_size ? listing.parcel_size.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Shipping'}: £{Number(listing.shipping_cost).toFixed(2)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                  <span className="text-xs" style={{ color: '#1DC690', fontFamily: 'var(--font-sans)' }}>Insured shipping included</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Below fold */}
        {listing.description && (
          <section className="mb-8">
            <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.25rem', color: '#0D0D0D' }}>Description</h2>
            <p className="mt-3 whitespace-pre-wrap" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: '#0D0D0D', lineHeight: 1.6 }}>{listing.description}</p>
          </section>
        )}

        {specs.length > 0 && (
          <section className="mb-8">
            <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.25rem', color: '#0D0D0D' }}>Specifications</h2>
            <div className="mt-3 rounded-xl bg-white overflow-hidden" style={{ border: '1px solid #E0E0D8' }}>
              {[
                ['Category', listing.category],
                listing.subcategory ? ['Subcategory', listing.subcategory] : null,
                listing.brand ? ['Brand', listing.brand] : null,
                listing.model ? ['Model', listing.model] : null,
                ...specs.map(([k, v]) => [k.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()), String(v)]),
              ].filter((item): item is [string, string] => Array.isArray(item) && item.length === 2).map(([label, value], i) => (
                <div key={i} className="flex justify-between px-4 py-3 text-sm" style={{ borderBottom: '1px solid #E0E0D8', fontFamily: 'var(--font-sans)' }}>
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg px-5 py-3 text-sm font-semibold text-white" style={{ backgroundColor: '#1DC690', fontFamily: 'var(--font-sans)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast}
        </div>
      )}
    </>
  );
}
