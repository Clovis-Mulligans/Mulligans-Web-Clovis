'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Copy,
  Printer,
  MapPin,
  ChevronRight,
  Info,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  getReturnRequest,
  getReturnShippingRates,
  purchaseReturnLabelBuyer,
  purchaseReturnLabelSeller,
} from '@mulligans/api-client';
import type {
  ReturnData,
  ReturnShippingRate,
} from '@mulligans/api-client';

/* ── Constants ──────────────────────────────────────────── */

const BRAND_GREEN = '#1DC690';
const BRAND_BLUE = '#278AB0';
const DARK_BLUE = '#1C4670';
const TEXT_PRIMARY = '#06070A';
const TEXT_SECONDARY = '#6B7280';
const TEXT_HINT = '#9CA3AF';
const CARD_BORDER = '#E5E7EB';
const SURFACE = '#F7F7F5';
const DIVIDER = '#F0F0F0';

const CARD_SHADOW =
  '0 4px 14px rgba(6,7,10,0.10), 0 2px 4px rgba(6,7,10,0.06)';

const CLOUDFRONT = 'https://d1bhj4xuvi3dve.cloudfront.net';

const PARCEL_SIZES: Record<string, { name: string; description: string }> = {
  small: { name: 'Small', description: 'Balls, gloves, grips' },
  medium: { name: 'Medium', description: 'Shoes, clothing, accessories' },
  large: { name: 'Large', description: 'Single club, putter' },
  extra_large: { name: 'Extra Large', description: 'Iron set, stand bag' },
  oversized: { name: 'Oversized', description: 'Full bag with clubs, travel bag' },
};

const CARRIER_DROPOFF: Record<string, { name: string; url: string; tip: string }> = {
  evri: { name: 'Evri', url: 'https://www.evri.com/find-a-parcelshop', tip: 'Most ParcelShops offer printing if you don\'t have a printer' },
  hermes: { name: 'Evri', url: 'https://www.evri.com/find-a-parcelshop', tip: 'Hermes is now Evri — same drop-off locations' },
  dpd: { name: 'DPD', url: 'https://pickup.dpd.co.uk/', tip: 'Over 6,000 locations including Sainsbury\'s and local shops' },
  'royal mail': { name: 'Royal Mail', url: 'https://www.postoffice.co.uk/branch-finder', tip: 'Any Post Office will accept Royal Mail parcels' },
  yodel: { name: 'Yodel', url: 'https://www.yodel.co.uk/collect-plus-location-finder', tip: 'Also known as Collect+ points' },
  parcelforce: { name: 'Parcelforce', url: 'https://www.parcelforce.com/help-and-advice/sending-and-collecting/find-your-nearest-depot', tip: 'Also accepted at most Post Offices' },
  ups: { name: 'UPS', url: 'https://www.ups.com/dropoff?loc=en_GB', tip: 'Many convenience stores are UPS Access Points' },
  fedex: { name: 'FedEx', url: 'https://local.fedex.com/en-gb', tip: 'Check FedEx drop box availability' },
};

function findCarrierDropoff(carrier: string) {
  const normalised = carrier.toLowerCase();
  for (const [key, value] of Object.entries(CARRIER_DROPOFF)) {
    if (normalised.includes(key)) return value;
  }
  return null;
}

/* ── Shared styles ──────────────────────────────────────── */

const cardBase: React.CSSProperties = {
  background: '#FFFFFF',
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: 16,
  padding: '20px 22px',
  boxShadow: CARD_SHADOW,
};

const sectionLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: BRAND_BLUE,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.10em',
  marginBottom: 16,
  margin: 0,
};

const dataRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 14,
};

const dataLabel: React.CSSProperties = {
  fontWeight: 500,
  color: TEXT_SECONDARY,
};

const dataValue: React.CSSProperties = {
  fontWeight: 700,
  color: TEXT_PRIMARY,
};

const primaryBtn: React.CSSProperties = {
  height: 46,
  borderRadius: 12,
  background: BRAND_GREEN,
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: '0.01em',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  textDecoration: 'none',
};

const secondaryBtn: React.CSSProperties = {
  height: 46,
  borderRadius: 12,
  background: '#FFFFFF',
  color: DARK_BLUE,
  fontSize: 14,
  fontWeight: 600,
  border: `1px solid ${CARD_BORDER}`,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  textDecoration: 'none',
};

const disabledBtn: React.CSSProperties = {
  ...primaryBtn,
  background: SURFACE,
  color: TEXT_HINT,
  border: `1px solid ${DIVIDER}`,
  opacity: 0.7,
  cursor: 'not-allowed',
};

/* ── Page component ─────────────────────────────────────── */

type WizardStep = 'details' | 'service' | 'review' | 'success';

export default function ReturnPage() {
  const router = useRouter();
  const params = useParams();
  const returnId = params?.id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [returnData, setReturnData] = useState<ReturnData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<WizardStep>('details');

  const [rates, setRates] = useState<ReturnShippingRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ReturnShippingRate | null>(null);

  const [purchasingLabel, setPurchasingLabel] = useState(false);
  const [labelResult, setLabelResult] = useState<{
    trackingNumber: string | null;
    carrier: string;
    labelUrl: string;
    labelCost: number;
    newRefundAmount?: number;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  /* ── Load return data ── */

  const loadReturn = useCallback(async () => {
    if (!returnId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getReturnRequest(returnId);
      const data = res?.data ?? (res as any);
      setReturnData(data);
      if (data.return_label_url) {
        setLabelResult({
          trackingNumber: data.return_tracking_number,
          carrier: data.return_carrier || '',
          labelUrl: data.return_label_url,
          labelCost: Number(data.label_cost) || 0,
          newRefundAmount: data.refund_amount != null ? Number(data.refund_amount) : undefined,
        });
        setStep('success');
      }
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Failed to load return details';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [returnId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=/orders/return/${returnId}`);
      return;
    }
    loadReturn();
  }, [authLoading, isAuthenticated, returnId, loadReturn, router]);

  /* ── Get shipping rates ── */

  const handleGetRates = async () => {
    if (!returnData || loadingRates) return;
    setLoadingRates(true);
    try {
      const res = await getReturnShippingRates(returnId);
      const data = res?.data ?? (res as any);
      const fetched = data.rates || [];
      if (fetched.length === 0) {
        setError('No tracked shipping services available for this return.');
        return;
      }
      setRates(fetched);
      setStep('service');
    } catch (err: any) {
      setError(err?.data?.error || 'Failed to get shipping rates');
    } finally {
      setLoadingRates(false);
    }
  };

  /* ── Purchase label ── */

  const handlePurchaseLabel = async () => {
    if (!returnData || !selectedRate || purchasingLabel) return;
    setPurchasingLabel(true);
    try {
      const whoPays = (returnData as any).who_pays_return || returnData.paid_by;
      const purchaseFn =
        whoPays === 'seller' ? purchaseReturnLabelSeller : purchaseReturnLabelBuyer;
      const args: [string, string, ...any[]] =
        whoPays === 'seller'
          ? [returnId, selectedRate.id, '']
          : [returnId, selectedRate.id];
      const res = await (purchaseFn as any)(...args);
      const data = res?.data ?? res;
      setLabelResult({
        trackingNumber: data.trackingNumber,
        carrier: data.carrier,
        labelUrl: data.labelUrl,
        labelCost: data.labelCost,
        newRefundAmount: data.newRefundAmount,
      });
      setStep('success');
    } catch (err: any) {
      setError(err?.data?.error || 'Failed to create return label');
    } finally {
      setPurchasingLabel(false);
    }
  };

  /* ── Copy tracking ── */

  const handleCopyTracking = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard not available */ }
  };

  /* ── Helpers ── */

  const refundAmount = returnData?.refund_amount != null ? Number(returnData.refund_amount) : 0;
  const whoPays = (returnData as any)?.who_pays_return || returnData?.paid_by || 'buyer';
  const buyerPays = whoPays === 'buyer';
  const listing = returnData?.orders?.listings;
  const itemTitle = listing?.title || 'Item';
  const itemAmount = returnData?.orders?.amount ? Number(returnData.orders.amount) : 0;

  const itemImage = (() => {
    if (listing?.images?.length) return `${CLOUDFRONT}/${listing.images[0]}`;
    if (returnData?.orders?.listing_image) return `${CLOUDFRONT}/${returnData.orders.listing_image}`;
    return null;
  })();

  const parcelKey = listing?.parcel_size || 'medium';
  const parcel = PARCEL_SIZES[parcelKey] || PARCEL_SIZES.medium;

  const narrow = typeof window !== 'undefined' && window.innerWidth < 640;

  /* ── Auth / loading / error guards ── */

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${CARD_BORDER}`, borderTopColor: BRAND_GREEN, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (error && !returnData) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 64px' }}>
          <Link href="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BRAND_GREEN, fontSize: 13, fontWeight: 600, textDecoration: 'none', letterSpacing: '0.02em', marginBottom: 24 }}>
            <ArrowLeft size={16} /> Back to Orders
          </Link>
          <div style={{ ...cardBase, textAlign: 'center', padding: '80px 0' }}>
            <AlertCircle size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 8px' }}>
              Return Not Found
            </h2>
            <p style={{ fontSize: 14, color: TEXT_HINT, maxWidth: 360, margin: '0 auto' }}>
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!returnData) return null;

  /* ── Step titles ── */

  const stepTitles: Record<WizardStep, { title: string; subtitle: string }> = {
    details: {
      title: 'Return Shipment Details',
      subtitle: 'Review the return information before creating a shipping label.',
    },
    service: {
      title: 'Select Shipping Service',
      subtitle: 'All options include tracking for return protection.',
    },
    review: {
      title: 'Review & Confirm',
      subtitle: 'Please confirm all details before creating the return label.',
    },
    success: {
      title: 'Return Label Created!',
      subtitle: 'Print this label and attach it to your parcel.',
    },
  };

  /* ── Step indicator ── */

  const steps: WizardStep[] = ['details', 'service', 'review', 'success'];
  const stepIndex = steps.indexOf(step);

  const StepIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
      {steps.map((s, i) => {
        const done = i < stepIndex;
        const active = i === stepIndex;
        const color = done ? BRAND_GREEN : active ? BRAND_BLUE : CARD_BORDER;
        return (
          <React.Fragment key={s}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: done ? BRAND_GREEN : active ? BRAND_BLUE : '#FFFFFF',
              border: `2px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
              color: done || active ? '#FFFFFF' : TEXT_HINT,
              flexShrink: 0,
            }}>
              {done ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2,
                background: i < stepIndex ? BRAND_GREEN : CARD_BORDER,
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  /* ── Render ── */

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 64px' }}>
        {/* Back link */}
        {step !== 'success' && (
          <Link
            href={returnData.orders?.id ? `/orders/${returnData.orders.id}` : '/orders'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: BRAND_GREEN, fontSize: 13, fontWeight: 600,
              textDecoration: 'none', letterSpacing: '0.02em', marginBottom: 24,
            }}
          >
            <ArrowLeft size={16} /> Back to Order
          </Link>
        )}

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
            {stepTitles[step].title}
          </h1>
          <div style={{ width: 40, height: 3, backgroundColor: BRAND_GREEN, borderRadius: 2 }} />
          <p style={{ fontSize: 13, color: TEXT_HINT, margin: '8px 0 0' }}>
            {stepTitles[step].subtitle}
          </p>
        </div>

        <StepIndicator />

        {/* Error banner */}
        {error && (
          <div style={{
            ...cardBase,
            background: 'rgba(239,68,68,0.08)',
            borderColor: '#FCA5A5',
            marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <AlertCircle size={18} color="#DC2626" />
            <span style={{ fontSize: 14, color: '#991B1B' }}>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B', fontSize: 18, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        )}

        {/* ── STEP 1: Details ── */}
        {step === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Item card */}
            <div style={cardBase}>
              <p style={{ ...sectionLabel, marginBottom: 16 }}>Item to Return</p>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 12,
                  background: SURFACE, flexShrink: 0, overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {itemImage ? (
                    <img src={itemImage} alt={itemTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Package size={24} color="#D1D5DB" />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {itemTitle}
                  </p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: BRAND_GREEN, margin: 0 }}>
                    £{itemAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Return reason */}
            <div style={cardBase}>
              <p style={{ ...sectionLabel, marginBottom: 16 }}>Return Reason</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, margin: 0 }}>
                {returnData.reason || 'No reason provided'}
              </p>
            </div>

            {/* Return to */}
            <div style={cardBase}>
              <p style={{ ...sectionLabel, marginBottom: 16 }}>Return To (Seller)</p>
              {returnData.sellerHasAddress ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MapPin size={18} color={BRAND_GREEN} />
                  <p style={{ fontSize: 14, fontWeight: 500, color: TEXT_SECONDARY, margin: 0 }}>
                    Seller's verified address will be used for the return label.
                  </p>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(245,158,11,0.1)',
                  borderRadius: 10, padding: '12px 14px',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <AlertCircle size={18} color="#92400E" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#92400E', margin: 0 }}>
                    The seller needs to complete their Stripe account setup to receive returns. They have been notified.
                  </p>
                </div>
              )}
            </div>

            {/* Parcel size */}
            <div style={cardBase}>
              <p style={{ ...sectionLabel, marginBottom: 16 }}>Parcel Size</p>
              <div style={dataRow}>
                <span style={dataLabel}>Size</span>
                <span style={dataValue}>{parcel.name}</span>
              </div>
              <div style={{ ...dataRow, marginTop: 8 }}>
                <span style={dataLabel}>Suitable for</span>
                <span style={{ ...dataValue, fontWeight: 500 }}>{parcel.description}</span>
              </div>
            </div>

            {/* Who pays */}
            <div style={{
              ...cardBase,
              background: buyerPays ? 'rgba(39,138,176,0.08)' : 'rgba(29,198,144,0.08)',
              borderColor: buyerPays ? BRAND_BLUE : BRAND_GREEN,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Info size={18} color={buyerPays ? BRAND_BLUE : BRAND_GREEN} />
                <p style={{ fontSize: 14, fontWeight: 600, color: buyerPays ? DARK_BLUE : '#065F46', margin: 0 }}>
                  {buyerPays
                    ? `Return shipping will be deducted from your refund of £${refundAmount.toFixed(2)}.`
                    : 'The seller will pay for this return shipping label.'}
                </p>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleGetRates}
              disabled={loadingRates || !returnData.sellerHasAddress}
              style={returnData.sellerHasAddress ? primaryBtn : disabledBtn}
            >
              {loadingRates ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Getting Rates...
                </>
              ) : !returnData.sellerHasAddress ? (
                <>
                  <Clock size={18} />
                  Waiting for Seller
                </>
              ) : (
                <>
                  <Truck size={18} />
                  Get Shipping Options
                </>
              )}
            </button>
          </div>
        )}

        {/* ── STEP 2: Service Selection ── */}
        {step === 'service' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Cost banner */}
            <div style={cardBase}>
              <p style={{ ...sectionLabel, marginBottom: 16 }}>Cost Summary</p>
              <div style={dataRow}>
                <span style={dataLabel}>Refund Amount</span>
                <span style={dataValue}>£{refundAmount.toFixed(2)}</span>
              </div>
              {buyerPays && selectedRate && (
                <>
                  <div style={{ ...dataRow, marginTop: 8 }}>
                    <span style={dataLabel}>Label Cost</span>
                    <span style={{ fontWeight: 700, color: '#DC2626', fontSize: 14 }}>
                      -£{selectedRate.price.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ borderTop: `1px solid ${CARD_BORDER}`, paddingTop: 14, marginTop: 6, ...dataRow }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY }}>You'll Receive</span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: BRAND_GREEN, letterSpacing: '-0.01em' }}>
                      £{Math.max(0, refundAmount - selectedRate.price).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              {!buyerPays && (
                <div style={{
                  marginTop: 10, background: 'rgba(29,198,144,0.08)',
                  borderRadius: 8, padding: '7px 13px',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                  <CheckCircle2 size={14} color={BRAND_GREEN} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>Seller Pays</span>
                </div>
              )}
            </div>

            {/* Rate cards */}
            {rates.map((rate) => {
              const isSelected = selectedRate?.id === rate.id;
              const dropoff = findCarrierDropoff(rate.carrier);
              return (
                <button
                  key={rate.id}
                  onClick={() => setSelectedRate(rate)}
                  style={{
                    ...cardBase,
                    cursor: 'pointer',
                    borderColor: isSelected ? BRAND_GREEN : CARD_BORDER,
                    boxShadow: isSelected ? `0 0 0 2px ${BRAND_GREEN}40, ${CARD_SHADOW}` : CARD_SHADOW,
                    textAlign: 'left',
                    transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 4px' }}>
                        {rate.carrier}
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: TEXT_SECONDARY, margin: '0 0 4px' }}>
                        {rate.service}
                      </p>
                      {rate.estimatedDays != null && (
                        <p style={{ fontSize: 13, fontWeight: 500, color: TEXT_HINT, margin: 0 }}>
                          Est. {rate.estimatedDays} day{rate.estimatedDays !== 1 ? 's' : ''} delivery
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 18, fontWeight: 700, color: BRAND_GREEN, margin: 0 }}>
                        £{rate.price.toFixed(2)}
                      </p>
                      {isSelected && (
                        <CheckCircle2 size={20} color={BRAND_GREEN} style={{ marginTop: 4 }} />
                      )}
                    </div>
                  </div>
                  {dropoff && (
                    <a
                      href={dropoff.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 13, fontWeight: 600, color: BRAND_BLUE,
                        textDecoration: 'none', marginTop: 10,
                      }}
                    >
                      <MapPin size={14} /> Find drop-off points <ExternalLink size={12} />
                    </a>
                  )}
                </button>
              );
            })}

            {/* Tracked notice */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
              <ShieldCheck size={16} color={BRAND_GREEN} />
              <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_SECONDARY }}>
                All services include tracking for return protection
              </span>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setStep('details'); setSelectedRate(null); }} style={secondaryBtn}>
                <ArrowLeft size={16} /> Back
              </button>
              <button
                onClick={() => setStep('review')}
                disabled={!selectedRate}
                style={selectedRate ? primaryBtn : disabledBtn}
              >
                Review <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Review & Confirm ── */}
        {step === 'review' && selectedRate && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={cardBase}>
              <p style={{ ...sectionLabel, marginBottom: 16 }}>Order Summary</p>

              <div style={{ ...dataRow, marginBottom: 10 }}>
                <span style={dataLabel}>Item</span>
                <span style={dataValue}>{itemTitle}</span>
              </div>
              <div style={{ ...dataRow, marginBottom: 10 }}>
                <span style={dataLabel}>Service</span>
                <span style={dataValue}>{selectedRate.carrier} — {selectedRate.service}</span>
              </div>
              <div style={{ ...dataRow, marginBottom: 10 }}>
                <span style={dataLabel}>Est. Delivery</span>
                <span style={dataValue}>
                  {selectedRate.estimatedDays != null
                    ? `${selectedRate.estimatedDays} day${selectedRate.estimatedDays !== 1 ? 's' : ''}`
                    : 'Standard'}
                </span>
              </div>

              <div style={{ borderTop: `1px solid ${DIVIDER}`, margin: '6px 0', paddingTop: 10 }}>
                <div style={{ ...dataRow, marginBottom: 8 }}>
                  <span style={dataLabel}>Original refund</span>
                  <span style={dataValue}>£{refundAmount.toFixed(2)}</span>
                </div>
                <div style={{ ...dataRow, marginBottom: 8 }}>
                  <span style={dataLabel}>Return label cost</span>
                  <span style={{ fontWeight: 700, color: buyerPays ? '#DC2626' : '#065F46', fontSize: 14 }}>
                    {buyerPays ? `-£${selectedRate.price.toFixed(2)}` : 'Paid by seller'}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${CARD_BORDER}`, paddingTop: 14, marginTop: 6, ...dataRow }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY }}>Your Refund</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: BRAND_GREEN, letterSpacing: '-0.01em' }}>
                  £{(buyerPays ? Math.max(0, refundAmount - selectedRate.price) : refundAmount).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Info box */}
            <div style={{
              ...cardBase,
              background: buyerPays ? 'rgba(39,138,176,0.08)' : 'rgba(29,198,144,0.08)',
              borderColor: buyerPays ? BRAND_BLUE : BRAND_GREEN,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Info size={18} color={buyerPays ? BRAND_BLUE : BRAND_GREEN} />
                <p style={{ fontSize: 14, fontWeight: 500, color: buyerPays ? DARK_BLUE : '#065F46', margin: 0 }}>
                  {buyerPays
                    ? `£${selectedRate.price.toFixed(2)} will be deducted from your refund to cover return shipping.`
                    : 'The seller is covering the return shipping cost.'}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep('service')} style={secondaryBtn}>
                <ArrowLeft size={16} /> Back
              </button>
              <button
                onClick={handlePurchaseLabel}
                disabled={purchasingLabel}
                style={purchasingLabel ? disabledBtn : primaryBtn}
              >
                {purchasingLabel ? (
                  <>
                    <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Creating Label...
                  </>
                ) : (
                  <>
                    <Printer size={18} />
                    Create Label
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Success ── */}
        {step === 'success' && labelResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Success icon */}
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: `linear-gradient(135deg, ${BRAND_GREEN}, ${BRAND_BLUE})`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle2 size={36} color="#FFFFFF" />
              </div>
            </div>

            {/* Tracking card */}
            <div style={cardBase}>
              <p style={{ ...sectionLabel, marginBottom: 16 }}>Tracking Information</p>
              {labelResult.carrier && (
                <div style={{ ...dataRow, marginBottom: 10 }}>
                  <span style={dataLabel}>Carrier</span>
                  <span style={dataValue}>{labelResult.carrier}</span>
                </div>
              )}
              {labelResult.trackingNumber && (
                <div style={{ ...dataRow, marginBottom: 10 }}>
                  <span style={dataLabel}>Tracking Number</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 500, color: DARK_BLUE }}>
                      {labelResult.trackingNumber}
                    </span>
                    <button
                      onClick={() => handleCopyTracking(labelResult.trackingNumber!)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: 4, display: 'flex', alignItems: 'center',
                      }}
                    >
                      {copied ? (
                        <CheckCircle2 size={16} color={BRAND_GREEN} />
                      ) : (
                        <Copy size={16} color={TEXT_HINT} />
                      )}
                    </button>
                  </div>
                </div>
              )}
              {buyerPays && labelResult.newRefundAmount != null && (
                <div style={{ borderTop: `1px solid ${CARD_BORDER}`, paddingTop: 14, marginTop: 6, ...dataRow }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY }}>Your Refund</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: BRAND_GREEN, letterSpacing: '-0.01em' }}>
                    £{Number(labelResult.newRefundAmount).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <a
              href={labelResult.labelUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={primaryBtn}
            >
              <Printer size={18} />
              Print Label
            </a>

            {(() => {
              const dropoff = findCarrierDropoff(labelResult.carrier);
              if (!dropoff) return null;
              return (
                <a
                  href={dropoff.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...secondaryBtn, color: BRAND_BLUE }}
                >
                  <MapPin size={18} />
                  Find Drop-off Point
                </a>
              );
            })()}

            <Link
              href={`/orders/${returnData.orders?.id}`}
              style={{
                display: 'block', textAlign: 'center',
                fontSize: 14, fontWeight: 500, color: TEXT_SECONDARY,
                textDecoration: 'underline', padding: '10px 0',
              }}
            >
              I'll ship later
            </Link>

            {/* Reminder */}
            <div style={{
              ...cardBase,
              background: 'rgba(39,138,176,0.08)',
              borderColor: BRAND_BLUE,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={18} color={BRAND_BLUE} />
                <p style={{ fontSize: 14, fontWeight: 500, color: DARK_BLUE, margin: 0 }}>
                  Please ship your return within 7 days. Your refund will be processed once the seller confirms receipt.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
