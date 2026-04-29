'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { addToCart, createConversation, addFavourite, removeFavourite, checkFavourite, ApiError } from '@mulligans/api-client';
import { ImageGallery } from '@/components/ImageGallery';
import { OfferModal } from '@/components/OfferModal';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ListingCard } from '@/components/ListingCard';
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

// ─── Types ───────────────────────────────────────────────────

interface ListingDetailClientProps {
  listing: any;
  similar: any[];
}

// ─── Main Component ──────────────────────────────────────────

export function ListingDetailClient({ listing, similar }: ListingDetailClientProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [showOffer, setShowOffer] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showConditionExplainer, setShowConditionExplainer] = useState(false);
  const [isFavourited, setIsFavourited] = useState(false);
  const [showBuyerProtection, setShowBuyerProtection] = useState(false); // FIX 5

  // REGRESSION CHECK 2: isOwnListing BEFORE price
  const isOwnListing = user?.id === listing.seller_id;

  // REGRESSION CHECK 2: buyer-inclusive pricing
  const rawPrice = Number(listing.price);
  const price = isOwnListing ? rawPrice : rawPrice * 1.075 + 0.99;

  const originalPrice = listing.original_price ? Number(listing.original_price) : null;
  const isSold = listing.status === 'sold';
  const isActive = listing.status === 'active';
  const condition = listing.condition_overall ? CONDITION_COLOURS[listing.condition_overall] : null;

  // REGRESSION CHECK 3: seller key
  const seller = listing.seller || listing.users;

  const sizeQuantities = listing.specifications?.sizeQuantities as Record<string, number> | undefined;
  const hasSizes = sizeQuantities && Object.keys(sizeQuantities).length > 0;
  const shippingCost = listing.shipping_cost ? Number(listing.shipping_cost) : null;
  const parcelLabel = listing.parcel_size
    ? listing.parcel_size.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
    : 'Shipping';

  // REGRESSION CHECK 4: category null guard
  const breadcrumbs = [
    { label: listing.category || 'All', href: `/category/${(listing.category || '').toLowerCase().replace(/[^a-z]+/g, '-')}` },
    ...(listing.subcategory ? [{ label: listing.subcategory }] : []),
  ];

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // ─── Favourite ─────────────────────────────────────────
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

  // ─── Actions ───────────────────────────────────────────
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

  // REGRESSION CHECK 5: specs filter with proper type guard
  const specs = listing.specifications
    ? Object.entries(listing.specifications).filter(([k]) => k !== 'sizeQuantities' && k !== 'model')
    : [];

  const specRows = [
    listing.category ? ['Category', listing.category] : null,
    listing.subcategory ? ['Subcategory', listing.subcategory] : null,
    listing.brand ? ['Brand', listing.brand] : null,
    listing.model ? ['Model', listing.model] : null,
    ...specs.map(([k, v]) => [k.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()), String(v)]),
  ].filter((item): item is [string, string] => Array.isArray(item) && item.length === 2);

  return (
    <>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-2">
        <Breadcrumb items={breadcrumbs} />

        <div className="flex flex-col lg:flex-row gap-8 pb-12">
          {/* ─── Left: Images + Description (FIX 3) ──── */}
          <div className="lg:w-[55%]">
            <ImageGallery
              images={listing.images || []}
              title={listing.title}
              showFavourite={!isOwnListing}
              isFavourited={isFavourited}
              onFavouriteClick={handleFavouriteToggle}
            />

            {/* FIX 3: Description moved here from below fold */}
            {listing.description && (
              <div className="mt-4">
                <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.1rem', color: '#0D0D0D' }}>Description</h2>
                <div className="mt-2 rounded-xl bg-white" style={{ border: '1px solid #E0E0D8', padding: '20px 24px' }}>
                  <p className="whitespace-pre-wrap" style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: '0.9rem', color: '#0D0D0D', lineHeight: 1.7 }}>{listing.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* ─── Right: White card ─────────────────────── */}
          <div className="lg:w-[45%] lg:sticky lg:top-[80px] lg:self-start lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto">
            <div className="rounded-2xl bg-white" style={{ border: '1px solid #E0E0D8', padding: '24px' }}>

              {/* SECTION A — TITLE */}
              <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.5rem', color: '#0D0D0D', lineHeight: 1.3, marginBottom: '16px' }}>
                {listing.title}
              </h1>

              {/* SECTION B — PRICE BLOCK (FIX 4: price table removed) */}
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-3">
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '2.2rem', color: isSold ? '#ADADAD' : '#1DC690' }}>
                    £{price.toFixed(2)}
                  </span>
                  {isOwnListing && (
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: '#ADADAD' }}>(your listing)</span>
                  )}
                  {originalPrice && originalPrice > price && !isSold && !isOwnListing && (
                    <>
                      <span className="line-through" style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: '#ADADAD' }}>£{(originalPrice * 1.075 + 0.99).toFixed(2)}</span>
                      <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: '#1DC690' }}>
                        Save {Math.round(((originalPrice - rawPrice) / originalPrice) * 100)}%
                      </span>
                    </>
                  )}
                </div>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: '#ADADAD' }}>Listed {getAge(listing.created_at)}</span>
              </div>

              {/* Divider */}
              <div style={{ borderBottom: '1px solid #E0E0D8', margin: '16px 0' }} />

              {/* SECTION C — TRUST SIGNALS */}

              {/* FIX 5: Buyer Protection as expandable card */}
              <div className="mb-2 rounded-[10px] overflow-hidden" style={{ border: '1px solid rgba(29,198,144,0.2)' }}>
                <button
                  onClick={() => setShowBuyerProtection(!showBuyerProtection)}
                  className="w-full flex items-center gap-2 text-left"
                  style={{ backgroundColor: 'rgba(29,198,144,0.06)', padding: '12px 14px' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                  <span className="flex-1" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>Protected by Mulligans Buyer Protection Pro</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 transition-transform duration-200" style={{ transform: showBuyerProtection ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <div className="overflow-hidden transition-all duration-200 ease-in-out" style={{ maxHeight: showBuyerProtection ? '400px' : '0px', opacity: showBuyerProtection ? 1 : 0 }}>
                  <div style={{ padding: '14px 16px', borderTop: '1px solid #E0E0D8' }}>
                    <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D', marginBottom: '8px' }}>Buyer Protection Fee</p>
                    <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: '0.82rem', color: '#6B6B6B', lineHeight: 1.6 }}>
                      Our Buyer Protection is added for a fee to every purchase made with every purchase on Mulligans. Buyer Protection includes our Refund Policy.
                    </p>
                    <p className="mt-2" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.85rem', color: '#1DC690' }}>7.5% + £0.99</p>

                    <p className="mt-3" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D', marginBottom: '6px' }}>Secure Payment (Escrow)</p>
                    <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: '0.82rem', color: '#6B6B6B', lineHeight: 1.6 }}>Your payment is held securely until:</p>
                    <ul className="mt-1 space-y-1" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: '#6B6B6B', paddingLeft: '16px', listStyleType: 'disc' }}>
                      <li>The seller ships the item</li>
                      <li>You receive it</li>
                      <li>You confirm everything is as expected</li>
                    </ul>
                  </div>
                </div>
              </div>

              {shippingCost !== null && (
                <div className="rounded-[10px] mb-2" style={{ backgroundColor: '#FAFAF8', border: '1px solid #E0E0D8', padding: '12px 14px' }}>
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>{parcelLabel}: £{shippingCost.toFixed(2)}</span>
                  </div>
                  <p className="mt-1" style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: '0.78rem', color: '#6B6B6B' }}>Insured delivery — covered if lost or damaged in transit.</p>
                </div>
              )}

              {/* FIX 6: Accepts Offers as prominent card */}
              {listing.is_negotiable && (
                <div className="rounded-[10px] mb-2" style={{ backgroundColor: 'rgba(39,138,176,0.06)', border: '1px solid rgba(39,138,176,0.2)', padding: '12px 14px' }}>
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#278AB0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.85rem', color: '#278AB0' }}>Accepts Offers</span>
                  </div>
                  <p className="mt-1" style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: '0.78rem', color: '#6B6B6B' }}>Make an offer below the asking price — the seller can accept, decline, or counter.</p>
                </div>
              )}

              {/* Divider */}
              <div style={{ borderBottom: '1px solid #E0E0D8', margin: '16px 0' }} />

              {/* SECTION D — SELLER CARD */}
              {seller && (
                <div className="rounded-xl mb-4" style={{ backgroundColor: '#FAFAF8', border: '1px solid #E0E0D8', padding: '16px' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: seller.avatar_url ? undefined : '#1DC690' }}>
                      {seller.avatar_url ? (
                        <img src={seller.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-white" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.1rem' }}>
                          {(seller.display_name || '?')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.95rem', color: '#0D0D0D' }}>{seller.display_name || 'Seller'}</span>
                        {seller.is_verified_seller && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#1DC690" stroke="#1DC690" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
                      </div>
                      <div className="flex items-center gap-2" style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: '0.8rem', color: '#6B6B6B' }}>
                        {listing.location && <span>{listing.location}</span>}
                        {seller.rating && <span>⭐ {Number(seller.rating).toFixed(1)}</span>}
                        <span>{seller.total_sales || 0} sales</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link href={`/user/${seller.id}`} className="flex-1 flex items-center justify-center rounded-[10px] transition-colors hover:bg-[#F4F4F0]" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.82rem', border: '1px solid #1DC690', color: '#1DC690', height: '40px' }}>Visit Seller</Link>
                    {!isOwnListing && (
                      <button onClick={handleMessage} className="flex-1 flex items-center justify-center rounded-[10px] transition-colors hover:bg-[#F4F4F0]" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.82rem', border: '1px solid #1DC690', color: '#1DC690', height: '40px' }}>Message</button>
                    )}
                  </div>
                </div>
              )}

              {/* Divider before actions */}
              {(isActive || isSold) && <div style={{ borderBottom: '1px solid #E0E0D8', margin: '16px 0' }} />}

              {/* SECTION E — SIZE SELECTOR */}
              {hasSizes && isActive && (
                <div className="mb-4">
                  <p className="mb-2" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>Select Size</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(sizeQuantities!).map(([size, qty]) => (
                      <button key={size} onClick={() => setSelectedSize(size)} disabled={qty <= 0} className="rounded-full px-4 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.82rem', minHeight: '44px', backgroundColor: selectedSize === size ? '#1DC690' : '#FFFFFF', color: selectedSize === size ? '#FFFFFF' : '#0D0D0D', border: selectedSize === size ? 'none' : '1px solid #E0E0D8', textDecoration: qty <= 0 ? 'line-through' : 'none' }}>
                        {size} {qty > 0 && <span className="opacity-60">({qty})</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION F — ACTION BUTTONS */}
              {isActive && !isOwnListing && (
                <div className="space-y-2.5">
                  <button onClick={handleAddToCart} disabled={addingToCart} className="w-full rounded-xl text-white transition-colors hover:opacity-90 disabled:opacity-50" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1rem', height: '52px', backgroundColor: '#1DC690' }}>
                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                  </button>
                  {listing.is_negotiable && (
                    <button onClick={handleMakeOffer} className="w-full rounded-xl transition-colors hover:bg-[#F4F4F0]" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1rem', height: '52px', border: '2px solid #1C4670', color: '#1C4670', marginTop: '10px' }}>
                      Make an Offer
                    </button>
                  )}
                </div>
              )}

              {isSold && (
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#06070A' }}>
                  <p className="text-white font-bold" style={{ fontFamily: 'var(--font-sans)' }}>This item has been sold</p>
                  <a href="#similar" className="mt-2 inline-block text-sm hover:underline" style={{ fontFamily: 'var(--font-sans)', color: '#1DC690' }}>See Similar Items ↓</a>
                </div>
              )}

              {/* SECTION G — CONDITION */}
              {condition && (
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full px-3 py-1 text-white" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.82rem', backgroundColor: condition.bg }}>
                      {condition.label}
                    </span>
                    <button
                      onClick={() => setShowConditionExplainer(!showConditionExplainer)}
                      className="text-xs transition-colors hover:underline"
                      style={{ fontFamily: 'var(--font-sans)', color: '#ADADAD', cursor: 'pointer' }}
                    >
                      What does this mean?
                    </button>
                  </div>

                  {showConditionExplainer && (
                    <div className="mt-2 rounded-[10px]" style={{ border: '1px solid #E0E0D8', padding: '12px' }}>
                      {Object.entries(CONDITION_COLOURS).reverse().map(([grade, { bg, label, description }]) => (
                        <div key={grade} className="flex items-center gap-2 py-1" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem' }}>
                          <span className="flex-shrink-0 rounded-full" style={{ width: '6px', height: '6px', backgroundColor: bg }} />
                          <span className="font-semibold" style={{ color: '#0D0D0D' }}>{grade} — {label}</span>
                          <span style={{ color: '#6B6B6B' }}>{description}</span>
                        </div>
                      ))}
                      {listing.condition_head != null && (
                        <p className="mt-1 italic" style={{ fontSize: '0.75rem', color: '#ADADAD', fontFamily: 'var(--font-sans)' }}>For clubs, condition is graded separately for Head, Shaft and Grip.</p>
                      )}
                    </div>
                  )}

                  {listing.condition_head != null && listing.condition_shaft != null && listing.condition_grip != null && (
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center" style={{ fontFamily: 'var(--font-sans)' }}>
                      {[
                        { label: 'Head', value: listing.condition_head },
                        { label: 'Shaft', value: listing.condition_shaft },
                        { label: 'Grip', value: listing.condition_grip },
                      ].map(({ label, value }) => {
                        const c = CONDITION_COLOURS[value] || { bg: '#6B6B6B' };
                        return (
                          <div key={label} className="rounded-[10px] p-2.5" style={{ backgroundColor: `${c.bg}1A` }}>
                            <span style={{ fontSize: '0.78rem', color: '#6B6B6B' }}>{label}</span>
                            <p style={{ fontWeight: 700, fontSize: '1rem', color: c.bg, marginTop: '2px' }}>{value}/5</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>{/* end white card */}
          </div>{/* end right column */}
        </div>

        {/* ─── BELOW FOLD (FIX 3: description removed from here) ── */}

        {specRows.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.1rem', color: '#0D0D0D' }}>Specifications</h2>
            <div className="rounded-xl bg-white overflow-hidden" style={{ border: '1px solid #E0E0D8' }}>
              {specRows.map(([label, value], i) => (
                <div key={i} className="flex justify-between" style={{ padding: '11px 16px', fontFamily: 'var(--font-sans)', backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FAFAF8', borderBottom: i < specRows.length - 1 ? '1px solid #E0E0D8' : 'none' }}>
                  <span style={{ fontWeight: 500, fontSize: '0.82rem', color: '#6B6B6B' }}>{label}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0D0D0D' }}>{value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {similar.length > 0 && (
          <section id="similar" className="mb-12">
            <h2 className="mb-3" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.1rem', color: '#0D0D0D' }}>Similar Items</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
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
