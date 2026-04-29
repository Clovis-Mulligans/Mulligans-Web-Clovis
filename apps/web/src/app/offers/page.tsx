'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import SimpleModal from '@/components/SimpleModal';
import PageHeader from '@/components/PageHeader';
import {
  getReceivedOffers,
  getMyOffers,
  getOfferCounts,
  acceptOffer,
  declineOffer,
  counterOffer,
  acceptCounter,
  declineCounter,
  withdrawOffer,
} from '@mulligans/api-client';
import type {
  ReceivedOffer,
  MadeOffer,
  OfferStatus,
  OfferCounts,
} from '@mulligans/api-client';
import {
  Tag,
  Clock,
  User,
  ShoppingCart,
  AlertCircle,
  ArrowRight,
  X,
  RotateCcw,
  ShieldCheck,
  Percent,
} from 'lucide-react';

const CLOUDFRONT_BASE = 'https://d1bhj4xuvi3dve.cloudfront.net';

// ─── Status badge config (defined locally per brief rule #149) ───
const STATUS_CONFIG: Record<OfferStatus, { bg: string; text: string; label: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
  ACCEPTED: { bg: '#D1FAE5', text: '#065F46', label: 'Accepted' },
  COUNTER_ACCEPTED: { bg: '#D1FAE5', text: '#065F46', label: 'Counter Accepted' },
  COUNTERED: { bg: '#E0E7FF', text: '#3730A3', label: 'Countered' },
  DECLINED: { bg: '#FEE2E2', text: '#991B1B', label: 'Declined' },
  COUNTER_DECLINED: { bg: '#FEE2E2', text: '#991B1B', label: 'Counter Declined' },
  EXPIRED: { bg: '#F3F4F6', text: '#6B7280', label: 'Expired' },
  VOID: { bg: '#F3F4F6', text: '#6B7280', label: 'Void' },
  WITHDRAWN: { bg: '#F3F4F6', text: '#6B7280', label: 'Withdrawn' },
  PURCHASED: { bg: '#D1FAE5', text: '#065F46', label: 'Purchased' },
};

const ACTIVE_STATUSES: OfferStatus[] = ['PENDING', 'COUNTERED', 'ACCEPTED', 'COUNTER_ACCEPTED'];

function isActive(status: OfferStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

// ─── Format countdown time ───
function formatTimeLeft(ms: number): string {
  if (ms <= 0) return 'Expired';
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (days > 0) return `Expires in ${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `Expires in ${hours}h ${minutes}m`;
  return `Expires in ${minutes}m ${seconds}s`;
}

function resolveImage(raw: string | null): string | null {
  if (!raw) return null;
  return raw.startsWith('http') ? raw : `${CLOUDFRONT_BASE}/${raw}`;
}

// Buyer protection fee: 7.5% + £0.99
function withFees(price: number): number {
  return price * 1.075 + 0.99;
}

function formatPrice(price: number): string {
  return `£${price.toFixed(2)}`;
}

// ──────────────────────────────────────────────────────────────
// COUNTDOWN TIMER — ticks every second
// ──────────────────────────────────────────────────────────────
function CountdownTimer({
  expiresAt,
  onExpire,
}: {
  expiresAt: string;
  onExpire: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const expireMs = new Date(expiresAt).getTime();
  const remaining = expireMs - now;
  const expired = remaining <= 0;
  const urgent = remaining > 0 && remaining < 2 * 60 * 60 * 1000;

  useEffect(() => {
    if (expired) {
      onExpire();
    }
  }, [expired, onExpire]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13,
      fontWeight: 500,
      color: urgent ? '#EF4444' : '#6B7280',
    }}>
      <Clock size={14} />
      <span>{formatTimeLeft(remaining)}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// STATUS BADGE
// ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: OfferStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      backgroundColor: config.bg,
      color: config.text,
      whiteSpace: 'nowrap',
    }}>
      {config.label}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────
// COUNTER OFFER MODAL
// ──────────────────────────────────────────────────────────────
function CounterOfferModal({
  open,
  onClose,
  offer,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  offer: ReceivedOffer | null;
  onSubmit: (amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setAmount('');
      setError('');
    }
  }, [open]);

  if (!offer) return null;

  const minAmount = Number(offer.offer_amount) + 0.01;
  const maxAmount = Number(offer.list_price);

  const handleSubmit = async () => {
    const num = parseFloat(amount);
    if (isNaN(num)) {
      setError('Please enter a valid amount');
      return;
    }
    if (num < minAmount || num > maxAmount) {
      setError(`Must be between £${minAmount.toFixed(2)} and £${maxAmount.toFixed(2)}`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(num);
      onClose();
    } catch (err: any) {
      setError((err as any)?.data?.error || 'Failed to submit counter. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const img = resolveImage(offer.listing.image);

  return (
    <SimpleModal open={open} onClose={onClose} title="Counter Offer">
      <div>
        {/* Listing summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: 12, backgroundColor: '#F9FAFB', borderRadius: 8 }}>
          {img ? (
            <img src={img} alt={offer.listing.title} style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: 6, backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={20} color="#9CA3AF" />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {offer.listing.title}
            </p>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>
              Buyer offered £{Number(offer.offer_amount).toFixed(2)}
            </p>
          </div>
        </div>

        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
          Your counter (£)
        </label>
        <input
          type="number"
          step="0.01"
          min={minAmount}
          max={maxAmount}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`£${minAmount.toFixed(2)} – £${maxAmount.toFixed(2)}`}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 8,
            border: error ? '1px solid #EF4444' : '1px solid #E0E0E0',
            fontSize: 16,
            marginBottom: 8,
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
        <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 16px' }}>
          Must be between £{minAmount.toFixed(2)} and £{maxAmount.toFixed(2)}
        </p>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 10, backgroundColor: '#FEE2E2', borderRadius: 8, marginBottom: 16 }}>
            <AlertCircle size={16} color="#991B1B" />
            <span style={{ fontSize: 13, color: '#991B1B' }}>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1px solid #E0E0E0', backgroundColor: '#fff', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14, color: '#374151' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !amount}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: submitting || !amount ? '#D1D5DB' : '#1DC690',
              color: '#fff',
              cursor: submitting || !amount ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Counter'}
          </button>
        </div>
      </div>
    </SimpleModal>
  );
}

// ──────────────────────────────────────────────────────────────
// OFFER CARD — improved layout
// ──────────────────────────────────────────────────────────────
interface OfferCardProps {
  offer: ReceivedOffer | MadeOffer;
  tab: 'received' | 'made';
  onAction: () => void;
  onCounter: (offer: ReceivedOffer) => void;
}

function OfferCard({ offer, tab, onAction, onCounter }: OfferCardProps) {
  const [busy, setBusy] = useState(false);
  const statusActive = isActive(offer.status);
  const img = resolveImage(offer.listing.image);
  const isBuyer = tab === 'made';

  const expiresTimestamp =
    offer.status === 'ACCEPTED' || offer.status === 'COUNTER_ACCEPTED'
      ? offer.acceptance_expires_at
      : offer.expires_at;

  const buyerName = tab === 'received' ? (offer as ReceivedOffer).buyer?.display_name || 'Buyer' : null;

  // Price helpers — buyers see fees included, sellers see raw amounts
  const offerRaw = Number(offer.offer_amount);
  const listRaw = Number(offer.list_price);
  const counterRaw = offer.counter_amount != null ? Number(offer.counter_amount) : null;
  const finalRaw = offer.final_amount != null ? Number(offer.final_amount) : null;

  const offerDisplay = isBuyer ? withFees(offerRaw) : offerRaw;
  const listDisplay = isBuyer ? withFees(listRaw) : listRaw;
  const counterDisplay = counterRaw != null ? (isBuyer ? withFees(counterRaw) : counterRaw) : null;
  const finalDisplay = finalRaw != null ? (isBuyer ? withFees(finalRaw) : finalRaw) : null;

  const discount = listRaw > 0 ? Math.round(((listRaw - offerRaw) / listRaw) * 100) : 0;

  const handleAction = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try { await fn(); onAction(); }
    catch (err: any) { alert((err as any)?.data?.error || 'Action failed. Please try again.'); }
    finally { setBusy(false); }
  };

  const renderActions = () => {
    if (!statusActive) return null;

    if (tab === 'received') {
      if (offer.status === 'PENDING') {
        return (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => handleAction(() => acceptOffer(offer.id))} disabled={busy}
              style={{ padding: '10px 24px', borderRadius: 8, border: 'none', backgroundColor: '#1DC690', color: '#fff', cursor: busy ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14, opacity: busy ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={15} /> Accept
            </button>
            <button onClick={() => onCounter(offer as ReceivedOffer)} disabled={busy}
              style={{ padding: '10px 24px', borderRadius: 8, border: '2px solid #278AB0', backgroundColor: '#EDF5FA', color: '#278AB0', cursor: busy ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14, opacity: busy ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <RotateCcw size={15} /> Counter
            </button>
            <button onClick={() => handleAction(() => declineOffer(offer.id))} disabled={busy}
              style={{ padding: '10px 24px', borderRadius: 8, border: '2px solid #FEE2E2', backgroundColor: '#FEF2F2', color: '#EF4444', cursor: busy ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14, opacity: busy ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <X size={15} /> Decline
            </button>
          </div>
        );
      }
      if (offer.status === 'COUNTERED') {
        return <p style={{ fontSize: 13, color: '#3730A3', margin: 0, fontWeight: 500, padding: '8px 12px', backgroundColor: '#E0E7FF', borderRadius: 8, display: 'inline-block' }}>Waiting for buyer to respond</p>;
      }
      if (offer.status === 'ACCEPTED' || offer.status === 'COUNTER_ACCEPTED') {
        return <p style={{ fontSize: 13, color: '#065F46', margin: 0, fontWeight: 500, padding: '8px 12px', backgroundColor: '#D1FAE5', borderRadius: 8, display: 'inline-block' }}>Waiting for buyer to purchase</p>;
      }
    } else {
      if (offer.status === 'PENDING') {
        return (
          <button onClick={() => handleAction(() => withdrawOffer(offer.id))} disabled={busy}
            style={{ padding: '10px 24px', borderRadius: 8, border: '2px solid #E0E0E0', backgroundColor: '#F9FAFB', color: '#6B7280', cursor: busy ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14, opacity: busy ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <X size={15} /> Withdraw Offer
          </button>
        );
      }
      if (offer.status === 'COUNTERED') {
        return (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => handleAction(() => acceptCounter(offer.id))} disabled={busy}
              style={{ padding: '10px 24px', borderRadius: 8, border: 'none', backgroundColor: '#1DC690', color: '#fff', cursor: busy ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14, opacity: busy ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={15} /> Accept Counter
            </button>
            <button onClick={() => handleAction(() => declineCounter(offer.id))} disabled={busy}
              style={{ padding: '10px 24px', borderRadius: 8, border: '2px solid #FEE2E2', backgroundColor: '#FEF2F2', color: '#EF4444', cursor: busy ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14, opacity: busy ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <X size={15} /> Decline Counter
            </button>
          </div>
        );
      }
      if (offer.status === 'ACCEPTED' || offer.status === 'COUNTER_ACCEPTED') {
        return (
          <Link href={`/listings/${offer.listing_id}`}
            style={{ padding: '10px 24px', borderRadius: 8, backgroundColor: '#1DC690', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ShoppingCart size={16} /> Buy Now
          </Link>
        );
      }
    }
    return null;
  };

  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
      border: `1px solid #E0E0E0`,
      opacity: statusActive ? 1 : 0.75,
    }}>
      {/* Card body */}
      <div style={{ padding: 20, display: 'flex', gap: 16 }}>
        {/* Image — larger */}
        <Link href={`/listings/${offer.listing_id}`} style={{ flexShrink: 0 }}>
          {img ? (
            <img src={img} alt={offer.listing.title} style={{ width: 88, height: 88, borderRadius: 10, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 88, height: 88, borderRadius: 10, backgroundColor: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={28} color="#D1D5DB" />
            </div>
          )}
        </Link>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title + badge row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
            <Link href={`/listings/${offer.listing_id}`} style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {offer.listing.title}
              </p>
            </Link>
            <StatusBadge status={offer.status} />
          </div>

          {/* Party info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={12} color="#6B7280" />
            </div>
            <span style={{ fontSize: 13, color: '#6B7280' }}>
              {tab === 'received' ? `From ${buyerName}` : `To ${(offer as any).seller?.display_name || 'Seller'}`}
            </span>
            {discount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#7C5CBF', backgroundColor: '#F3F0FF', padding: '2px 8px', borderRadius: 12, marginLeft: 4, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Percent size={10} /> {discount}% off
              </span>
            )}
          </div>

          {/* Price breakdown */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>{isBuyer ? 'Your offer (inc. fees)' : 'Offer'}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#7C5CBF' }}>{formatPrice(offerDisplay)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>{isBuyer ? 'List price (inc. fees)' : 'List price'}</div>
              <div style={{ fontSize: 14, color: '#9CA3AF', textDecoration: 'line-through' }}>{formatPrice(listDisplay)}</div>
            </div>
            {counterDisplay != null && (
              <div>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>{isBuyer ? 'Counter (inc. fees)' : 'Your counter'}</div>
                <div style={{ fontSize: 17, fontWeight: 600, color: '#278AB0' }}>{formatPrice(counterDisplay)}</div>
              </div>
            )}
            {finalDisplay != null && (offer.status === 'ACCEPTED' || offer.status === 'COUNTER_ACCEPTED' || offer.status === 'PURCHASED') && (
              <div>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>{isBuyer ? 'You pay' : 'Agreed price'}</div>
                <div style={{ fontSize: 17, fontWeight: 600, color: '#1DC690' }}>{formatPrice(finalDisplay)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer — timer + actions */}
      {statusActive && (
        <div style={{ padding: '12px 20px', backgroundColor: '#F9FAFB', borderTop: '1px solid #E0E0E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {expiresTimestamp && <CountdownTimer expiresAt={expiresTimestamp} onExpire={onAction} />}
          <div>{renderActions()}</div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN OFFERS PAGE
// ──────────────────────────────────────────────────────────────
function OffersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const tabParam = searchParams.get('tab');
  const initialTab: 'received' | 'made' = tabParam === 'made' ? 'made' : 'received';

  const [tab, setTab] = useState<'received' | 'made'>(initialTab);
  const [received, setReceived] = useState<ReceivedOffer[]>([]);
  const [made, setMade] = useState<MadeOffer[]>([]);
  const [counts, setCounts] = useState<OfferCounts | null>(null);
  const [loading, setLoading] = useState(true);

  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<ReceivedOffer | null>(null);

  // Auth gate
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/offers');
    }
  }, [authLoading, isAuthenticated, router]);

  // Keep URL in sync with tab
  useEffect(() => {
    const currentTab = searchParams.get('tab') || 'received';
    if (currentTab !== tab) {
      router.replace(`/offers?tab=${tab}`);
    }
  }, [tab, router, searchParams]);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const [receivedRes, madeRes, countsRes] = await Promise.all([
        getReceivedOffers(),
        getMyOffers(),
        getOfferCounts().catch(() => null),
      ]);
      setReceived(receivedRes.offers || []);
      setMade(madeRes.offers || []);
      if (countsRes) setCounts(countsRes);
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadData();
    }
  }, [authLoading, isAuthenticated, loadData]);

  // Sort: active first by expires ascending, then terminal by created_at descending
  const sortOffers = useCallback(<T extends ReceivedOffer | MadeOffer>(offers: T[]): T[] => {
    const active = offers.filter((o) => isActive(o.status));
    const terminal = offers.filter((o) => !isActive(o.status));

    active.sort((a, b) => {
      const aExp = (a.status === 'ACCEPTED' || a.status === 'COUNTER_ACCEPTED') ? a.acceptance_expires_at : a.expires_at;
      const bExp = (b.status === 'ACCEPTED' || b.status === 'COUNTER_ACCEPTED') ? b.acceptance_expires_at : b.expires_at;
      return new Date(aExp || 0).getTime() - new Date(bExp || 0).getTime();
    });

    terminal.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return [...active, ...terminal];
  }, []);

  const handleCounter = (offer: ReceivedOffer) => {
    setSelectedOffer(offer);
    setCounterModalOpen(true);
  };

  const handleSubmitCounter = async (amount: number) => {
    if (!selectedOffer) return;
    await counterOffer(selectedOffer.id, { counter_amount: amount });
    loadData();
  };

  // ─── Loading state ───
  if (authLoading || (loading && isAuthenticated)) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>
          <div style={{ height: 32, width: 140, backgroundColor: '#E5E7EB', borderRadius: 8, marginBottom: 24 }} className="animate-pulse" />
          <div style={{ height: 48, backgroundColor: '#E5E7EB', borderRadius: 8, marginBottom: 24 }} className="animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 180, backgroundColor: '#E5E7EB', borderRadius: 14, marginBottom: 12 }} className="animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect in progress — render nothing
    return null;
  }

  const activeReceivedCount = received.filter((o) => isActive(o.status)).length;
  const activeMadeCount = made.filter((o) => isActive(o.status)).length;

  const displayOffers = tab === 'received' ? sortOffers(received) : sortOffers(made);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px 64px' }}>
        <PageHeader title="Offers" />

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          backgroundColor: '#fff',
          borderRadius: 14,
          padding: 4,
          border: '1px solid #E0E0E0',
        }}>
          <button
            onClick={() => setTab('received')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: tab === 'received' ? '#1DC690' : 'transparent',
              color: tab === 'received' ? '#fff' : '#6B7280',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            Received
            {activeReceivedCount > 0 && (
              <span style={{
                backgroundColor: tab === 'received' ? 'rgba(255,255,255,0.25)' : '#1DC690',
                color: '#fff',
                borderRadius: 999,
                padding: '2px 10px',
                fontSize: 12,
                fontWeight: 600,
              }}>
                {activeReceivedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('made')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: tab === 'made' ? '#1DC690' : 'transparent',
              color: tab === 'made' ? '#fff' : '#6B7280',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            Made
            {activeMadeCount > 0 && (
              <span style={{
                backgroundColor: tab === 'made' ? 'rgba(255,255,255,0.25)' : '#1DC690',
                color: '#fff',
                borderRadius: 999,
                padding: '2px 10px',
                fontSize: 12,
                fontWeight: 600,
              }}>
                {activeMadeCount}
              </span>
            )}
          </button>
        </div>

        {/* Offers list */}
        {displayOffers.length === 0 ? (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            padding: '60px 32px',
            textAlign: 'center',
            border: '1px solid #E0E0E0',
          }}>
            <Tag size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
              {tab === 'received' ? 'No offers received' : 'No offers made'}
            </p>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
              {tab === 'received'
                ? "When buyers make offers on your listings, they'll appear here"
                : "Make offers on items you're interested in"}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                tab={tab}
                onAction={loadData}
                onCounter={handleCounter}
              />
            ))}
          </div>
        )}
      </div>

      {/* Counter modal */}
      <CounterOfferModal
        open={counterModalOpen}
        onClose={() => { setCounterModalOpen(false); setSelectedOffer(null); }}
        offer={selectedOffer}
        onSubmit={handleSubmitCounter}
      />
    </div>
  );
}

// Wrapper with Suspense (required by Next.js for useSearchParams)
export default function OffersPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>
          <div style={{ height: 32, width: 140, backgroundColor: '#E5E7EB', borderRadius: 8 }} className="animate-pulse" />
        </div>
      </div>
    }>
      <OffersPageInner />
    </Suspense>
  );
}
