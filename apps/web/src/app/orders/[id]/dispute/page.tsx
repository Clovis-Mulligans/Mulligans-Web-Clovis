'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Camera, X, Info, Loader2, Package,
  AlertTriangle, CheckCircle, XCircle, MessageSquare,
  Shield, Clock, ChevronLeft, ChevronRight, Check,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  getOrder,
  openDispute,
  getDisputeByOrder,
  uploadDisputeImage,
  respondToDispute,
  acceptCounterOffer,
  escalateDispute,
} from '@mulligans/api-client';
import type { OrderDetail } from '@mulligans/api-client';
import type { Dispute } from '@mulligans/api-client';

// ─── Constants ────────────────────────────────────────────────────────────────

const CLOUDFRONT_BASE = 'https://d1bhj4xuvi3dve.cloudfront.net/';
const SELLER_DEADLINE_HOURS = 72;
const DISPUTE_WINDOW_DAYS = 5;

const REASON_OPTIONS = [
  {
    value: 'not_as_described',
    label: 'Item not as described',
    description: "Item doesn't match the listing description",
  },
  {
    value: 'damaged',
    label: 'Item arrived damaged',
    description: 'Item was damaged during shipping',
  },
  {
    value: 'wrong_item',
    label: 'Wrong item sent',
    description: 'Received a different item than ordered',
  },
  {
    value: 'counterfeit',
    label: 'Item appears counterfeit',
    description: 'Item appears to be fake or replica',
  },
  {
    value: 'missing_parts',
    label: 'Missing parts/accessories',
    description: 'Item is incomplete or missing components',
  },
  {
    value: 'other',
    label: 'Other issue',
    description: 'Something else went wrong',
  },
];

const REFUND_PERCENTAGES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildImageUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith('http')) return key;
  return `${CLOUDFRONT_BASE}${key}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatReasonLabel(reasonType: string): string {
  return REASON_OPTIONS.find(r => r.value === reasonType)?.label
    ?? reasonType.replace(/_/g, ' ');
}

function formatDisputeStatus(status: string): string {
  const map: Record<string, string> = {
    open: 'Open — Awaiting Seller',
    counter_offered: 'Counter Offer Sent',
    seller_accepted: 'Refund Approved',
    buyer_accepted: 'Counter Offer Accepted',
    escalated: 'Under Admin Review',
    admin_resolved: 'Resolved',
  };
  return map[status] ?? status.replace(/_/g, ' ');
}

function formatResolutionType(type: string | null): string {
  const map: Record<string, string> = {
    full_refund: 'Full Refund',
    partial_refund: 'Partial Refund',
    no_refund: 'No Refund',
  };
  return type ? (map[type] ?? type.replace(/_/g, ' ')) : '';
}

// ─── Shared style constants ───────────────────────────────────────────────────

const CONTAINER: React.CSSProperties = {
  maxWidth: 900,
  margin: '0 auto',
  padding: 20,
  backgroundColor: '#FFFFFF',
  minHeight: '100vh',
};

const BACK_LINK: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  color: '#1DC690',
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: '0.02em',
  textDecoration: 'none',
  marginBottom: 24,
};

const CARD: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E0E0E0',
  borderRadius: 14,
  padding: 20,
  marginBottom: 14,
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#278AB0',
  fontWeight: 500,
  marginBottom: 14,
};

const PRIMARY_BTN: React.CSSProperties = {
  width: '100%',
  height: 46,
  backgroundColor: '#1DC690',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

const DISABLED_BTN: React.CSSProperties = {
  ...PRIMARY_BTN,
  backgroundColor: '#F7F7F5',
  color: '#9CA3AF',
  border: '1px solid #F0F0F0',
  opacity: 0.7,
  cursor: 'not-allowed',
};

const SECONDARY_BTN: React.CSSProperties = {
  width: '100%',
  height: 46,
  backgroundColor: '#FFFFFF',
  color: '#1C4670',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

const DANGER_BTN: React.CSSProperties = {
  width: '100%',
  height: 46,
  backgroundColor: '#FFFFFF',
  color: '#DC2626',
  border: '1px solid #FCA5A5',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

// ─── Status banner config ─────────────────────────────────────────────────────

const WARNING_GRADIENT = 'linear-gradient(135deg, #78350F 0%, #92400E 100%)';
const INFO_GRADIENT    = 'linear-gradient(135deg, #1C4670 0%, #278AB0 100%)';
const SUCCESS_GRADIENT = 'linear-gradient(135deg, #065F46 0%, #059669 100%)';

interface BannerConfig {
  gradient: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
}

function getStatusBannerConfig(status: string, isBuyer: boolean, d: any): BannerConfig {
  const deadlineFormatted = formatDateTime(d.seller_deadline);
  const resAmt = d.resolution_amount != null ? `£${parseFloat(d.resolution_amount).toFixed(2)}` : '';

  switch (status) {
    case 'open':
      return isBuyer
        ? {
            gradient: WARNING_GRADIENT,
            icon: <AlertTriangle size={20} color="#FFFFFF" />,
            iconBg: 'rgba(255,255,255,0.15)',
            title: 'Awaiting Seller Response',
            desc: `The seller has until ${deadlineFormatted} to respond`,
          }
        : {
            gradient: WARNING_GRADIENT,
            icon: <AlertTriangle size={20} color="#FFFFFF" />,
            iconBg: 'rgba(255,255,255,0.15)',
            title: 'Dispute Opened',
            desc: `You have until ${deadlineFormatted} to respond`,
          };

    case 'counter_offered':
      return isBuyer
        ? {
            gradient: INFO_GRADIENT,
            icon: <MessageSquare size={20} color="#FFFFFF" />,
            iconBg: 'rgba(255,255,255,0.15)',
            title: 'Counter Offer Received',
            desc: 'The seller has proposed a different refund amount',
          }
        : {
            gradient: INFO_GRADIENT,
            icon: <MessageSquare size={20} color="#FFFFFF" />,
            iconBg: 'rgba(255,255,255,0.15)',
            title: 'Counter Offer Sent',
            desc: 'Waiting for the buyer to respond',
          };

    case 'seller_accepted':
      return {
        gradient: SUCCESS_GRADIENT,
        icon: <CheckCircle size={20} color="#FFFFFF" />,
        iconBg: 'rgba(29,198,144,0.25)',
        title: 'Refund Approved',
        desc: 'The seller accepted your claim. Refund is being processed.',
      };

    case 'buyer_accepted':
      return {
        gradient: SUCCESS_GRADIENT,
        icon: <CheckCircle size={20} color="#FFFFFF" />,
        iconBg: 'rgba(29,198,144,0.25)',
        title: 'Counter Offer Accepted',
        desc: 'Refund is being processed.',
      };

    case 'escalated':
      return {
        gradient: WARNING_GRADIENT,
        icon: <Shield size={20} color="#FFFFFF" />,
        iconBg: 'rgba(255,255,255,0.15)',
        title: 'Under Admin Review',
        desc: 'Our team is reviewing this dispute. Both parties will be notified when a decision is made.',
      };

    case 'admin_resolved':
      if (d.resolution_type === 'no_refund') {
        return {
          gradient: INFO_GRADIENT,
          icon: <XCircle size={20} color="#FFFFFF" />,
          iconBg: 'rgba(255,255,255,0.15)',
          title: 'Resolved — No Refund',
          desc: 'The admin determined no refund is warranted.',
        };
      }
      return {
        gradient: SUCCESS_GRADIENT,
        icon: <CheckCircle size={20} color="#FFFFFF" />,
        iconBg: 'rgba(29,198,144,0.25)',
        title: 'Resolved — Refund Issued',
        desc: resAmt ? `${resAmt} has been refunded.` : 'Refund has been issued.',
      };

    default:
      return {
        gradient: INFO_GRADIENT,
        icon: <Info size={20} color="#FFFFFF" />,
        iconBg: 'rgba(255,255,255,0.15)',
        title: formatDisputeStatus(status),
        desc: '',
      };
  }
}

// ─── Data row helper ──────────────────────────────────────────────────────────

function DataRow({
  label,
  value,
  valueColor,
  isLast,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  isLast?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: isLast ? undefined : '1px solid #F5F5F5',
      }}
    >
      <span style={{ fontSize: 13, color: '#9CA3AF' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: valueColor ?? '#06070A' }}>
        {value}
      </span>
    </div>
  );
}

// ─── Thumbnail gallery helper ─────────────────────────────────────────────────

function PhotoGallery({
  images,
  onOpen,
}: {
  images: Array<{ id: string; image_url: string }>;
  onOpen: (urls: string[], index: number) => void;
}) {
  if (images.length === 0) return null;
  const urls = images.map(img => img.image_url);
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
      {images.map((img, i) => (
        <button
          key={img.id}
          onClick={() => onOpen(urls, i)}
          style={{
            width: 80,
            height: 80,
            borderRadius: 10,
            overflow: 'hidden',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <img
            src={img.image_url}
            alt={`Evidence ${i + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DisputePage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null!);
  const sellerFileInputRef = useRef<HTMLInputElement>(null!);

  const orderId = params?.id as string;

  // ── Data state ───────────────────────────────────────────────────────────
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── Creation form state ──────────────────────────────────────────────────
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [refundPercent, setRefundPercent] = useState<number | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  // ── Submission state ─────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ── Status view state (6R-B) ─────────────────────────────────────────────
  const [sellerView, setSellerView] = useState<'buttons' | 'counter' | 'reject'>('buttons');
  const [counterPercent, setCounterPercent] = useState<number>(30);
  const [counterText, setCounterText] = useState('');
  const [counterTextFocused, setCounterTextFocused] = useState(false);
  const [counterTextTouched, setCounterTextTouched] = useState(false);
  const [rejectText, setRejectText] = useState('');
  const [rejectTextFocused, setRejectTextFocused] = useState(false);
  const [rejectTextTouched, setRejectTextTouched] = useState(false);
  const [sellerPhotoFiles, setSellerPhotoFiles] = useState<File[]>([]);
  const [sellerPhotoUrls, setSellerPhotoUrls] = useState<string[]>([]);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [activeModal, setActiveModal] = useState<
    null | 'accept' | 'counter' | 'reject' | 'acceptCounter' | 'escalate'
  >(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [deadlineText, setDeadlineText] = useState('');

  // ── Toast helper ─────────────────────────────────────────────────────────
  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Auth gate ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/orders/${orderId}/dispute`);
    }
  }, [isAuthenticated, authLoading, router, orderId]);

  // ── Data fetch ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId || !isAuthenticated) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [orderRes, disputeRes] = await Promise.allSettled([
          getOrder(orderId),
          getDisputeByOrder(orderId),
        ]);

        if (orderRes.status === 'fulfilled') {
          const raw = orderRes.value as any;
          const data = raw?.data?.data ?? raw?.data ?? raw;
          const orderData = data?.order ?? data;
          setOrder(orderData as OrderDetail);
        } else {
          setFetchError('Failed to load order details');
        }

        if (disputeRes.status === 'fulfilled') {
          const raw = disputeRes.value as any;
          const data = raw?.data?.data ?? raw?.data ?? raw;
          // getDisputeByOrder proxies to getDispute which returns { dispute: {...} }
          const disputeData = data?.dispute ?? data;
          if (disputeData && disputeData.id) setDispute(disputeData as Dispute);
        }
        // 404 on dispute means no dispute exists — not an error
      } catch {
        setFetchError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId, isAuthenticated]);

  // ── Deadline countdown ───────────────────────────────────────────────────
  useEffect(() => {
    const d = dispute as any;
    if (!d || d.status !== 'open' || !d.seller_deadline) return;

    const updateDeadline = () => {
      const ms = new Date(d.seller_deadline).getTime() - Date.now();
      if (ms <= 0) {
        setDeadlineText('expired');
        return;
      }
      const h = Math.floor(ms / (1000 * 60 * 60));
      const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      setDeadlineText(`${h} hours, ${m} minutes`);
    };

    updateDeadline();
    const interval = setInterval(updateDeadline, 60000);
    return () => clearInterval(interval);
  }, [dispute]);

  // ── Creation form: photo handling ────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - photoFiles.length;
    const toAdd = files.slice(0, remaining);

    for (const file of toAdd) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('error', 'Image must be under 10MB');
        e.target.value = '';
        return;
      }
    }

    const urls = toAdd.map(f => URL.createObjectURL(f));
    setPhotoFiles(prev => [...prev, ...toAdd]);
    setPhotoPreviewUrls(prev => [...prev, ...urls]);
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviewUrls[index]);
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // ── Seller photo handling ────────────────────────────────────────────────
  const handleSellerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - sellerPhotoFiles.length;
    const toAdd = files.slice(0, remaining);

    for (const file of toAdd) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('error', 'Image must be under 10MB');
        e.target.value = '';
        return;
      }
    }

    const urls = toAdd.map(f => URL.createObjectURL(f));
    setSellerPhotoFiles(prev => [...prev, ...toAdd]);
    setSellerPhotoUrls(prev => [...prev, ...urls]);
    e.target.value = '';
  };

  const removeSellerPhoto = (index: number) => {
    URL.revokeObjectURL(sellerPhotoUrls[index]);
    setSellerPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setSellerPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  async function uploadSellerPhotos(disputeId: string) {
    for (const file of sellerPhotoFiles) {
      const fd = new FormData();
      fd.append('image', file);
      try { await uploadDisputeImage(disputeId, fd); } catch { /* individual failure does not block */ }
    }
  }

  // ── Seller actions ───────────────────────────────────────────────────────
  const doSellerAccept = async () => {
    const d = dispute as any;
    if (!d || actionSubmitting) return;
    setActiveModal(null);
    setActionSubmitting(true);
    try {
      await respondToDispute(d.id, { responseType: 'accept' });
      showToast('success', 'Refund approved');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      showToast('error', err?.response?.data?.error ?? 'Failed to process');
      setActionSubmitting(false);
    }
  };

  const doSellerCounter = async () => {
    const d = dispute as any;
    if (!d || actionSubmitting) return;
    setActiveModal(null);
    setActionSubmitting(true);
    try {
      await respondToDispute(d.id, {
        responseType: 'counter',
        counterOfferPercent: counterPercent,
        responseText: counterText.trim() || undefined,
      });
      await uploadSellerPhotos(d.id);
      showToast('success', 'Counter offer sent');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      showToast('error', err?.response?.data?.error ?? 'Failed to submit counter offer');
      setActionSubmitting(false);
    }
  };

  const doSellerReject = async () => {
    const d = dispute as any;
    if (!d || actionSubmitting) return;
    setActiveModal(null);
    setActionSubmitting(true);
    try {
      await respondToDispute(d.id, {
        responseType: 'reject',
        responseText: rejectText,
      });
      await uploadSellerPhotos(d.id);
      showToast('success', 'Response submitted');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      showToast('error', err?.response?.data?.error ?? 'Failed to submit');
      setActionSubmitting(false);
    }
  };

  const doBuyerAcceptCounter = async () => {
    const d = dispute as any;
    if (!d || actionSubmitting) return;
    setActiveModal(null);
    setActionSubmitting(true);
    try {
      await acceptCounterOffer(d.id);
      showToast('success', 'Counter offer accepted');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      showToast('error', err?.response?.data?.error ?? 'Failed to accept');
      setActionSubmitting(false);
    }
  };

  const doBuyerEscalate = async () => {
    const d = dispute as any;
    if (!d || actionSubmitting) return;
    setActiveModal(null);
    setActionSubmitting(true);
    try {
      await escalateDispute(d.id);
      showToast('success', 'Dispute escalated to admin');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      showToast('error', err?.response?.data?.error ?? 'Failed to escalate');
      setActionSubmitting(false);
    }
  };

  // ── Derived values ───────────────────────────────────────────────────────
  const orderAmount = order ? parseFloat(order.amount as any) : 0;

  const refundAmount =
    refundPercent !== null ? (orderAmount * refundPercent / 100).toFixed(2) : null;

  const isFormValid =
    selectedReason !== null &&
    description.length >= 20 &&
    refundPercent !== null &&
    !submitting;

  // ── Creation form submit ──────────────────────────────────────────────────
  const handleConfirmSubmit = async () => {
    if (!isFormValid || !order) return;
    setShowModal(false);
    setSubmitting(true);

    try {
      const res = await openDispute(orderId, {
        reasonType: selectedReason!,
        reasonText: description,
        requestedRefundPercent: refundPercent!,
      });

      const raw = res as any;
      const data = raw?.data?.data ?? raw?.data ?? raw;
      const disputeId = data?.dispute?.id ?? data?.disputeId ?? data?.id;

      if (photoFiles.length > 0 && disputeId) {
        for (const file of photoFiles) {
          const formData = new FormData();
          formData.append('image', file);
          try {
            await uploadDisputeImage(disputeId, formData);
          } catch { /* individual image failure does not block */ }
        }
      }

      showToast('success', 'Dispute submitted');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      const message =
        err?.response?.data?.error ??
        err?.message ??
        'Failed to submit dispute. Please try again.';
      showToast('error', message);
      setSubmitting(false);
    }
  };

  // ── Render helpers ───────────────────────────────────────────────────────

  function renderBackLink() {
    return (
      <Link href={`/orders/${orderId}`} style={BACK_LINK}>
        <ArrowLeft size={16} />
        Back to order
      </Link>
    );
  }

  function renderSimpleCard(message: string) {
    return (
      <div style={CARD}>
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#6B7280', fontSize: 14 }}>
          {message}
        </div>
      </div>
    );
  }

  // ── Seller photo upload grid (matches creation form style) ────────────────

  function renderSellerPhotoGrid() {
    return (
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {sellerPhotoUrls.map((url, i) => (
          <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={url}
              alt={`Evidence ${i + 1}`}
              style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', display: 'block' }}
            />
            <button
              onClick={() => removeSellerPhoto(i)}
              style={{
                position: 'absolute', top: -6, right: -6,
                width: 20, height: 20, borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: '#FFFFFF', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
              }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {sellerPhotoFiles.length < 5 && (
          <button
            onClick={() => sellerFileInputRef.current?.click()}
            style={{
              width: 80, height: 80,
              border: '2px dashed #E5E7EB', borderRadius: 10,
              backgroundColor: '#FFFFFF', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1DC690'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
          >
            <Camera size={24} color="#9CA3AF" />
          </button>
        )}
      </div>
    );
  }

  // ── Confirmation modal ────────────────────────────────────────────────────

  function renderActionModal() {
    if (!activeModal) return null;
    const d = dispute as any;
    const reqAmt = parseFloat(d.requested_refund_amount).toFixed(2);
    const ctrAmt = d.counter_offer_amount != null ? parseFloat(d.counter_offer_amount).toFixed(2) : '0.00';
    const ctrPct = d.counter_offer_percent ?? counterPercent;
    const counterCalc = ((d.order?.amount ?? 0) * counterPercent / 100).toFixed(2);

    let title = '';
    let body = '';
    let onConfirm: () => void = () => {};
    let confirmLabel = 'Confirm';
    let confirmStyle: React.CSSProperties = PRIMARY_BTN;

    if (activeModal === 'accept') {
      title = 'Accept Refund?';
      body = `Accept the buyer's request for a £${reqAmt} refund (${d.requested_refund_percent}%)? The refund will be processed immediately. This cannot be undone.`;
      onConfirm = doSellerAccept;
    } else if (activeModal === 'counter') {
      title = 'Send Counter Offer?';
      body = `You're proposing a ${counterPercent}% refund (£${counterCalc}) instead of the buyer's ${d.requested_refund_percent}% request. The buyer can accept this or escalate to admin review.`;
      onConfirm = doSellerCounter;
    } else if (activeModal === 'reject') {
      title = 'Reject Claim?';
      body = 'This will escalate the dispute to admin review. Our team will make the final decision. This cannot be undone.';
      onConfirm = doSellerReject;
      confirmLabel = 'Reject & Escalate';
      confirmStyle = DANGER_BTN;
    } else if (activeModal === 'acceptCounter') {
      title = 'Accept Counter Offer?';
      body = `Accept the seller's offer of £${ctrAmt} (${ctrPct}%)? This will process the refund. This cannot be undone.`;
      onConfirm = doBuyerAcceptCounter;
    } else if (activeModal === 'escalate') {
      title = 'Escalate to Admin?';
      body = 'Reject the counter offer and escalate to admin review? Our team will review all evidence and make a final decision. This cannot be undone.';
      onConfirm = doBuyerEscalate;
      confirmLabel = 'Escalate';
      confirmStyle = DANGER_BTN;
    }

    return (
      <div
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(6,7,10,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, padding: 20,
        }}
        onClick={() => setActiveModal(null)}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24,
            maxWidth: 440, width: '100%',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontSize: 18, fontWeight: 600, color: '#06070A', marginBottom: 12 }}>
            {title}
          </div>
          <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5, marginBottom: 20 }}>
            {body}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setActiveModal(null)}
              style={{ ...SECONDARY_BTN, flex: 1 }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={actionSubmitting}
              style={{ ...confirmStyle, flex: 1 }}
            >
              {actionSubmitting ? <Loader2 size={16} /> : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Lightbox ──────────────────────────────────────────────────────────────

  function renderLightbox() {
    if (!lightbox) return null;
    const { images, index } = lightbox;
    const total = images.length;

    return (
      <div
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(6,7,10,0.85)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={() => setLightbox(null)}
      >
        {/* Close */}
        <button
          onClick={() => setLightbox(null)}
          style={{
            position: 'absolute', top: 20, right: 20,
            background: 'none', border: 'none', cursor: 'pointer', color: '#FFFFFF',
          }}
        >
          <X size={24} />
        </button>

        {/* Image */}
        <img
          src={images[index]}
          alt={`Evidence ${index + 1}`}
          style={{
            maxWidth: '90vw', maxHeight: '90vh',
            objectFit: 'contain', borderRadius: 8,
          }}
          onClick={e => e.stopPropagation()}
        />

        {/* Navigation */}
        {total > 1 && (
          <>
            <button
              onClick={e => {
                e.stopPropagation();
                setLightbox(lb => lb ? { ...lb, index: (lb.index - 1 + total) % total } : lb);
              }}
              style={{
                position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
                width: 36, height: 36, borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.4)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                setLightbox(lb => lb ? { ...lb, index: (lb.index + 1) % total } : lb);
              }}
              style={{
                position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
                width: 36, height: 36, borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.4)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <ChevronRight size={20} />
            </button>
            <div style={{ marginTop: 14, fontSize: 12, color: '#FFFFFF' }}>
              {index + 1} / {total}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div style={CONTAINER}>
        {[70, 120, 220, 180, 140].map((h, i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#F7F7F5',
              borderRadius: 14,
              height: h,
              marginBottom: 14,
            }}
          />
        ))}
      </div>
    );
  }

  // ── Fetch error ──────────────────────────────────────────────────────────

  if (fetchError || !order) {
    return (
      <div style={CONTAINER}>
        {renderBackLink()}
        {renderSimpleCard(fetchError ?? 'Order not found')}
      </div>
    );
  }

  // ── Role detection ───────────────────────────────────────────────────────

  const isBuyer = (order as any).buyer?.id === user?.id;

  // ── ROUTING: Dispute exists → status view (buyer AND seller) ──────────────
  //    This check must come BEFORE the buyer-only gate so sellers can see their dispute.

  if (dispute) {
    const d = dispute as any;

    // Prefer backend-supplied role flags; fall back to order-derived isBuyer
    const disputeIsBuyer: boolean = d.is_buyer ?? isBuyer;

    const reqRefAmt = parseFloat(d.requested_refund_amount ?? '0').toFixed(2);
    const ctrAmt =
      d.counter_offer_amount != null
        ? parseFloat(d.counter_offer_amount).toFixed(2)
        : null;
    const resAmt =
      d.resolution_amount != null
        ? parseFloat(d.resolution_amount).toFixed(2)
        : null;
    const orderDisplayAmt =
      d.order?.amount != null ? parseFloat(d.order.amount).toFixed(2) : '0.00';
    const counterCalcAmt = (
      (d.order?.amount ?? 0) * counterPercent / 100
    ).toFixed(2);

    const buyerImages: Array<{ id: string; image_url: string }> = d.buyer_images ?? [];
    const sellerImages: Array<{ id: string; image_url: string }> = d.seller_images ?? [];

    const bannerConfig = getStatusBannerConfig(d.status, disputeIsBuyer, d);

    const sImgs = (order as any).listing?.images as
      | { image_url: string; display_order?: number }[]
      | undefined;
    const sSorted = sImgs?.length
      ? [...sImgs].sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99))
      : [];
    const listingImageUrl = sSorted[0]?.image_url || null;

    // ── Shared: Order context card ─────────────────────────────────────────

    function renderOrderContextCard() {
      return (
        <div style={CARD}>
          <div style={SECTION_LABEL}>ORDER</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 64, height: 64, borderRadius: 10, overflow: 'hidden',
                flexShrink: 0, backgroundColor: '#F7F7F5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {listingImageUrl ? (
                <img
                  src={listingImageUrl}
                  alt={d.order?.listing_title ?? 'Item'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Package size={24} color="#9CA3AF" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15, fontWeight: 600, color: '#06070A', marginBottom: 4,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {d.order?.listing_title ?? (order as any).listing?.title ?? 'Item'}
              </div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 2 }}>
                Buyer:{' '}
                <span style={{ color: '#06070A', fontWeight: 600 }}>
                  {d.buyer?.display_name ?? 'Buyer'}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                Seller:{' '}
                <span style={{ color: '#06070A', fontWeight: 600 }}>
                  {d.seller?.display_name ?? 'Seller'}
                </span>
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1DC690', flexShrink: 0 }}>
              £{orderDisplayAmt}
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#9CA3AF' }}>
            {formatDate(d.created_at)}
          </div>
        </div>
      );
    }

    // ── Shared: Buyer's claim card ─────────────────────────────────────────

    function renderBuyerClaimCard() {
      return (
        <div style={CARD}>
          <div style={SECTION_LABEL}>{disputeIsBuyer ? 'YOUR CLAIM' : "BUYER'S CLAIM"}</div>
          <DataRow label={disputeIsBuyer ? 'Reason' : "Buyer's Reason"} value={formatReasonLabel(d.reason_type)} />
          <DataRow
            label={disputeIsBuyer ? 'Requested Refund' : 'Refund Requested'}
            value={`${d.requested_refund_percent}% (£${reqRefAmt})`}
            valueColor="#1DC690"
          />
          <DataRow label="Filed" value={formatDate(d.created_at)} isLast />

          {d.reason_text && (
            <div
              style={{
                marginTop: 14,
                fontSize: 14,
                color: '#6B7280',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {!disputeIsBuyer && <span style={{ fontWeight: 600, color: '#374151' }}>Buyer's description: </span>}
              {d.reason_text}
            </div>
          )}

          {buyerImages.length > 0 && (
            <PhotoGallery
              images={buyerImages}
              onOpen={(urls, i) => setLightbox({ images: urls, index: i })}
            />
          )}
        </div>
      );
    }

    // ── Deadline card (open only) ──────────────────────────────────────────

    function renderDeadlineCard() {
      const expired = deadlineText === 'expired';
      return (
        <div
          style={{
            backgroundColor: 'rgba(39,138,176,0.08)',
            borderRadius: 14,
            padding: 16,
            marginBottom: 14,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <Clock size={18} color="#278AB0" style={{ flexShrink: 0, marginTop: 1 }} />
          {expired ? (
            <div style={{ fontSize: 14, color: '#DC2626', fontWeight: 500 }}>
              Deadline expired — this dispute will be escalated to admin review
            </div>
          ) : (
            <div style={{ fontSize: 14, color: '#1C4670' }}>
              Seller has{' '}
              <span style={{ fontWeight: 600 }}>{deadlineText || '...'}</span> to respond
            </div>
          )}
        </div>
      );
    }

    // ── Seller response: inline counter-offer form ─────────────────────────

    function renderCounterForm() {
      const borderColor = counterTextFocused
        ? '#1DC690'
        : counterTextTouched && counterText.length < 20
        ? '#DC2626'
        : '#E5E7EB';
      return (
        <div style={CARD}>
          <div style={SECTION_LABEL}>YOUR COUNTER OFFER</div>

          {/* Percentage pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {REFUND_PERCENTAGES.map(pct => {
              const sel = counterPercent === pct;
              return (
                <button
                  key={pct}
                  onClick={() => setCounterPercent(pct)}
                  style={{
                    padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                    cursor: 'pointer',
                    border: sel ? 'none' : '1px solid #E5E7EB',
                    backgroundColor: sel ? '#1DC690' : '#FFFFFF',
                    color: sel ? '#FFFFFF' : '#6B7280',
                  }}
                >
                  {pct}%
                </button>
              );
            })}
          </div>

          {/* Live amount */}
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1DC690', marginBottom: 14 }}>
            Counter offer: £{counterCalcAmt}
          </div>

          {/* Explanation textarea */}
          <textarea
            placeholder="Explain your counter offer..."
            value={counterText}
            onChange={e => setCounterText(e.target.value)}
            maxLength={2000}
            style={{
              width: '100%', minHeight: 100, padding: '10px 14px',
              border: `1px solid ${borderColor}`,
              borderRadius: 10, fontSize: 14, color: '#06070A',
              backgroundColor: '#FFFFFF', resize: 'vertical',
              fontFamily: 'inherit', lineHeight: 1.5,
              boxSizing: 'border-box', outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={() => setCounterTextFocused(true)}
            onBlur={() => { setCounterTextFocused(false); setCounterTextTouched(true); }}
          />
          <div style={{ textAlign: 'right', fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>
            {counterText.length} / 2000
          </div>

          {/* Photo grid */}
          <div style={{ marginTop: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 10 }}>
              Evidence photos (optional, up to 5)
            </div>
            {renderSellerPhotoGrid()}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => setActiveModal('counter')}
              disabled={actionSubmitting}
              style={actionSubmitting ? DISABLED_BTN : PRIMARY_BTN}
            >
              {actionSubmitting ? <Loader2 size={16} /> : 'Submit Counter Offer'}
            </button>
            <button
              onClick={() => { setSellerView('buttons'); setCounterText(''); setSellerPhotoFiles([]); setSellerPhotoUrls([]); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, color: '#6B7280', textDecoration: 'underline', textAlign: 'center',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    // ── Seller response: inline reject form ────────────────────────────────

    function renderRejectForm() {
      const borderColor = rejectTextFocused
        ? '#1DC690'
        : rejectTextTouched && rejectText.length < 20
        ? '#DC2626'
        : '#E5E7EB';
      return (
        <div style={CARD}>
          <div style={SECTION_LABEL}>REJECTION REASON</div>

          {/* Warning banner */}
          <div
            style={{
              backgroundColor: 'rgba(239,68,68,0.08)',
              borderRadius: 12,
              padding: 14,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, color: '#991B1B', lineHeight: 1.5 }}>
              Rejecting will escalate this dispute to admin review. Please provide a detailed
              explanation.
            </div>
          </div>

          <textarea
            placeholder="Explain why you're rejecting this claim..."
            value={rejectText}
            onChange={e => setRejectText(e.target.value)}
            maxLength={2000}
            style={{
              width: '100%', minHeight: 100, padding: '10px 14px',
              border: `1px solid ${borderColor}`,
              borderRadius: 10, fontSize: 14, color: '#06070A',
              backgroundColor: '#FFFFFF', resize: 'vertical',
              fontFamily: 'inherit', lineHeight: 1.5,
              boxSizing: 'border-box', outline: 'none',
            }}
            onFocus={() => setRejectTextFocused(true)}
            onBlur={() => { setRejectTextFocused(false); setRejectTextTouched(true); }}
          />
          <div
            style={{
              textAlign: 'right', fontSize: 12, marginTop: 6,
              color: rejectTextTouched && rejectText.length < 20 ? '#DC2626' : '#9CA3AF',
            }}
          >
            {rejectText.length} / 2000
          </div>

          {/* Photo grid */}
          <div style={{ marginTop: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 10 }}>
              Evidence photos (optional, up to 5)
            </div>
            {renderSellerPhotoGrid()}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => {
                if (rejectText.trim().length < 20) {
                  setRejectTextTouched(true);
                  return;
                }
                setActiveModal('reject');
              }}
              disabled={actionSubmitting}
              style={actionSubmitting ? DISABLED_BTN : DANGER_BTN}
            >
              {actionSubmitting ? <Loader2 size={16} /> : 'Confirm Rejection'}
            </button>
            <button
              onClick={() => { setSellerView('buttons'); setRejectText(''); setSellerPhotoFiles([]); setSellerPhotoUrls([]); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, color: '#6B7280', textDecoration: 'underline', textAlign: 'center',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    // ── Status-specific sections ───────────────────────────────────────────

    function renderStatusSection() {
      if (d.status === 'open') {
        if (!disputeIsBuyer) {
          // Seller: response buttons or expanded form
          if (sellerView === 'counter') return renderCounterForm();
          if (sellerView === 'reject') return renderRejectForm();

          // Seller: three buttons
          return (
            <div style={CARD}>
              <div style={SECTION_LABEL}>YOUR RESPONSE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => setActiveModal('accept')}
                  disabled={actionSubmitting}
                  style={actionSubmitting ? DISABLED_BTN : PRIMARY_BTN}
                >
                  Accept Refund
                </button>
                <button
                  onClick={() => setSellerView('counter')}
                  disabled={actionSubmitting}
                  style={SECONDARY_BTN}
                >
                  Make Counter Offer
                </button>
                <button
                  onClick={() => setSellerView('reject')}
                  disabled={actionSubmitting}
                  style={DANGER_BTN}
                >
                  Reject Claim
                </button>
              </div>
            </div>
          );
        } else {
          // Buyer: waiting
          return (
            <div style={CARD}>
              <div style={SECTION_LABEL}>WAITING FOR SELLER</div>
              <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
                The seller has been notified and has until{' '}
                <strong style={{ color: '#06070A' }}>
                  {formatDateTime(d.seller_deadline)}
                </strong>{' '}
                to respond. If they don't respond in time, the dispute will be escalated to our
                team for review.
              </div>
            </div>
          );
        }
      }

      if (d.status === 'counter_offered') {
        if (disputeIsBuyer) {
          // Buyer: review counter offer
          return (
            <div style={CARD}>
              <div style={SECTION_LABEL}>SELLER'S COUNTER OFFER</div>
              <DataRow label="Original request" value={`${d.requested_refund_percent}% (£${reqRefAmt})`} />
              <DataRow
                label="Counter offer"
                value={ctrAmt ? `${d.counter_offer_percent}% (£${ctrAmt})` : '—'}
                valueColor="#1DC690"
                isLast={!d.seller_response_text && sellerImages.length === 0}
              />

              {d.seller_response_text && (
                <div
                  style={{
                    marginTop: 14,
                    fontSize: 14,
                    color: '#6B7280',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {d.seller_response_text}
                </div>
              )}

              {sellerImages.length > 0 && (
                <PhotoGallery
                  images={sellerImages}
                  onOpen={(urls, i) => setLightbox({ images: urls, index: i })}
                />
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button
                  onClick={() => setActiveModal('escalate')}
                  disabled={actionSubmitting}
                  style={{ ...DANGER_BTN, flex: 1 }}
                >
                  Escalate to Admin
                </button>
                <button
                  onClick={() => setActiveModal('acceptCounter')}
                  disabled={actionSubmitting}
                  style={{ ...PRIMARY_BTN, flex: 1 }}
                >
                  {actionSubmitting ? <Loader2 size={16} /> : 'Accept Counter Offer'}
                </button>
              </div>
            </div>
          );
        } else {
          // Seller: read-only counter offer
          return (
            <div style={CARD}>
              <div style={SECTION_LABEL}>YOUR COUNTER OFFER</div>
              <DataRow label="Original request" value={`${d.requested_refund_percent}% (£${reqRefAmt})`} />
              <DataRow
                label="Your counter offer"
                value={ctrAmt ? `${d.counter_offer_percent}% (£${ctrAmt})` : '—'}
                valueColor="#1DC690"
                isLast
              />
              {d.seller_response_text && (
                <div style={{ marginTop: 14, fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
                  {d.seller_response_text}
                </div>
              )}
              {sellerImages.length > 0 && (
                <PhotoGallery
                  images={sellerImages}
                  onOpen={(urls, i) => setLightbox({ images: urls, index: i })}
                />
              )}
              <div style={{ marginTop: 14, fontSize: 13, color: '#6B7280' }}>
                Waiting for the buyer to accept your counter offer or escalate to admin review.
              </div>
            </div>
          );
        }
      }

      if (d.status === 'seller_accepted') {
        return (
          <div style={CARD}>
            <div style={SECTION_LABEL}>RESOLUTION</div>
            <DataRow label="Outcome" value="Seller accepted" />
            <DataRow
              label="Refund"
              value={`${d.requested_refund_percent}% (£${reqRefAmt})`}
              valueColor="#1DC690"
            />
            <DataRow
              label="Resolved"
              value={formatDate(d.seller_responded_at)}
              isLast
            />
          </div>
        );
      }

      if (d.status === 'buyer_accepted') {
        return (
          <div style={CARD}>
            <div style={SECTION_LABEL}>RESOLUTION</div>
            <DataRow label="Outcome" value="Counter offer accepted" />
            <DataRow label="Original request" value={`${d.requested_refund_percent}% (£${reqRefAmt})`} />
            <DataRow
              label="Accepted offer"
              value={ctrAmt ? `${d.counter_offer_percent}% (£${ctrAmt})` : '—'}
              valueColor="#1DC690"
            />
            <DataRow
              label="Resolved"
              value={formatDate(d.resolved_at ?? d.updated_at)}
              isLast
            />
          </div>
        );
      }

      if (d.status === 'escalated') {
        return (
          <div style={CARD}>
            <div style={SECTION_LABEL}>UNDER ADMIN REVIEW</div>
            <DataRow
              label="Escalated"
              value={formatDate(d.escalated_at ?? d.updated_at)}
            />
            <DataRow
              label="Buyer's request"
              value={`${d.requested_refund_percent}% (£${reqRefAmt})`}
            />
            {ctrAmt && (
              <DataRow
                label="Seller's counter"
                value={`${d.counter_offer_percent}% (£${ctrAmt})`}
                isLast
              />
            )}
            <div style={{ marginTop: 14, fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
              Our team is reviewing all evidence and will make a final decision. Both parties will
              be notified.
            </div>
          </div>
        );
      }

      if (d.status === 'admin_resolved') {
        const decisionColor =
          d.resolution_type === 'full_refund' ? '#065F46'
          : d.resolution_type === 'partial_refund' ? '#1C4670'
          : '#991B1B';

        return (
          <div style={CARD}>
            <div style={SECTION_LABEL}>ADMIN DECISION</div>
            <DataRow
              label="Decision"
              value={formatResolutionType(d.resolution_type)}
              valueColor={decisionColor}
            />
            {resAmt && d.resolution_type !== 'no_refund' && (
              <DataRow label="Refund amount" value={`£${resAmt}`} valueColor="#1DC690" />
            )}
            <DataRow label="Resolved by" value="Admin" />
            <DataRow label="Date" value={formatDate(d.resolved_at)} isLast />

            {d.resolution_notes && (
              <div style={{ marginTop: 14 }}>
                <div style={{ ...SECTION_LABEL, marginBottom: 8 }}>ADMIN NOTES</div>
                <div
                  style={{
                    fontSize: 14, color: '#6B7280', lineHeight: 1.6,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}
                >
                  {d.resolution_notes}
                </div>
              </div>
            )}
          </div>
        );
      }

      return null;
    }

    // ── Timeline ───────────────────────────────────────────────────────────

    function renderTimeline() {
      const DOT_SIZE = 18;

      interface TimelineStep {
        label: string;
        timestamp: string | null;
        completed: boolean;
      }

      const steps: TimelineStep[] = [];

      // Step 1: always present
      steps.push({ label: 'Dispute opened', timestamp: d.created_at, completed: true });

      // Step 2: seller responded
      if (d.seller_responded_at) {
        const typeLabel =
          d.seller_response_type === 'accept' ? '(accepted)'
          : d.seller_response_type === 'counter' ? '(counter offered)'
          : d.seller_response_type === 'reject' ? '(rejected)'
          : '';
        steps.push({
          label: `Seller responded ${typeLabel}`.trim(),
          timestamp: d.seller_responded_at,
          completed: true,
        });
      } else if (['open'].includes(d.status)) {
        steps.push({ label: 'Seller responds', timestamp: null, completed: false });
      }

      // Step 3: buyer responded (only if applicable)
      if (d.status === 'buyer_accepted') {
        steps.push({
          label: 'Buyer accepted counter offer',
          timestamp: d.resolved_at ?? d.updated_at,
          completed: true,
        });
      } else if (d.status === 'escalated' && d.seller_responded_at) {
        steps.push({
          label: 'Buyer escalated to admin',
          timestamp: d.escalated_at ?? d.updated_at,
          completed: true,
        });
      } else if (d.status === 'counter_offered') {
        steps.push({ label: 'Buyer responds', timestamp: null, completed: false });
      }

      // Step 4: escalated
      if (d.escalated_at || d.status === 'escalated' || d.status === 'admin_resolved') {
        steps.push({
          label: 'Escalated to admin',
          timestamp: d.escalated_at ?? (d.status !== 'open' && d.status !== 'counter_offered' ? d.updated_at : null),
          completed: d.status === 'escalated' || d.status === 'admin_resolved',
        });
      }

      // Step 5: resolved
      if (d.resolved_at || d.status === 'seller_accepted' || d.status === 'buyer_accepted' || d.status === 'admin_resolved') {
        const resLabel =
          d.resolution_type === 'full_refund' ? 'Full refund issued'
          : d.resolution_type === 'partial_refund' && resAmt ? `Partial refund (£${resAmt})`
          : d.resolution_type === 'no_refund' ? 'No refund'
          : 'Resolved';
        steps.push({
          label: resLabel,
          timestamp: d.resolved_at,
          completed: !!d.resolved_at,
        });
      } else if (!['open', 'counter_offered'].includes(d.status)) {
        steps.push({ label: 'Resolved', timestamp: null, completed: false });
      }

      // Dot colours: green → blue → dark blue
      const dotColors = ['#1DC690', '#1DC690', '#278AB0', '#1C4670', '#1C4670'];

      return (
        <div style={CARD}>
          <div style={SECTION_LABEL}>TIMELINE</div>
          <div style={{ position: 'relative' }}>
            {/* Vertical line */}
            <div
              style={{
                position: 'absolute',
                left: DOT_SIZE / 2 - 1,
                top: 0,
                bottom: 0,
                width: 2,
                background: 'linear-gradient(180deg, #1DC690 0%, #278AB0 100%)',
                zIndex: 0,
              }}
            />

            {steps.map((step, i) => {
              const color = step.completed ? (dotColors[i] ?? '#1C4670') : '#E5E7EB';
              const isLast = i === steps.length - 1;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    position: 'relative',
                    zIndex: 1,
                    marginBottom: isLast ? 0 : 22,
                  }}
                >
                  {/* Dot */}
                  <div
                    style={{
                      width: DOT_SIZE,
                      height: DOT_SIZE,
                      borderRadius: '50%',
                      backgroundColor: color,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {step.completed && <Check size={10} color="#FFFFFF" />}
                  </div>

                  {/* Text */}
                  <div style={{ paddingTop: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#06070A' }}>
                      {step.label}
                    </div>
                    {step.timestamp && (
                      <div style={{ fontSize: 12, color: '#D1D5DB', marginTop: 2 }}>
                        {formatDateTime(step.timestamp)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ── Render status view ─────────────────────────────────────────────────

    return (
      <div style={CONTAINER}>
        {/* Toast */}
        {toast && (
          <div
            style={{
              position: 'fixed', top: 20, right: 20, zIndex: 1000,
              backgroundColor: toast.type === 'success' ? '#1DC690' : '#DC2626',
              color: '#FFFFFF', borderRadius: 10, padding: '12px 18px',
              fontSize: 14, fontWeight: 500, maxWidth: 320,
            }}
          >
            {toast.message}
          </div>
        )}

        {/* Action modal */}
        {renderActionModal()}

        {/* Lightbox */}
        {renderLightbox()}

        {/* Seller file input */}
        <input
          ref={sellerFileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          style={{ display: 'none' }}
          onChange={handleSellerFileSelect}
        />

        {renderBackLink()}

        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#06070A', margin: '0 0 8px' }}>
            Dispute Details
          </h1>
          <div style={{ width: 32, height: 3, backgroundColor: '#1DC690', borderRadius: 2 }} />
        </div>

        {/* 1. Status banner */}
        <div
          style={{
            background: bannerConfig.gradient,
            borderRadius: 14,
            padding: '20px 24px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 40, height: 40, borderRadius: '50%',
              backgroundColor: bannerConfig.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {bannerConfig.icon}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#FFFFFF', marginBottom: 4 }}>
              {bannerConfig.title}
            </div>
            {bannerConfig.desc && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                {bannerConfig.desc}
              </div>
            )}
          </div>
        </div>

        {/* 2. Order context card */}
        {renderOrderContextCard()}

        {/* 3. Buyer's claim card */}
        {renderBuyerClaimCard()}

        {/* 4. Deadline card (open only) */}
        {d.status === 'open' && renderDeadlineCard()}

        {/* 5. Status-specific section */}
        {renderStatusSection()}

        {/* 6. Timeline */}
        {renderTimeline()}
      </div>
    );
  }

  // ── Buyer-only gate (for creation form — not for dispute view) ────────────

  if (!isBuyer) {
    return (
      <div style={CONTAINER}>
        {renderBackLink()}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#06070A', margin: '0 0 8px' }}>
            Report a Problem
          </h1>
          <div style={{ width: 32, height: 3, backgroundColor: '#1DC690', borderRadius: 2 }} />
        </div>
        {renderSimpleCard('Only the buyer can open a dispute.')}
        {renderBackLink()}
      </div>
    );
  }

  // ── Order not eligible ───────────────────────────────────────────────────

  if (order.status !== 'delivered' && order.status !== 'in_transit') {
    return (
      <div style={CONTAINER}>
        {renderBackLink()}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#06070A', margin: '0 0 8px' }}>
            Report a Problem
          </h1>
          <div style={{ width: 32, height: 3, backgroundColor: '#1DC690', borderRadius: 2 }} />
        </div>
        {renderSimpleCard(
          'Disputes can only be opened for orders that are delivered or in transit.',
        )}
        {renderBackLink()}
      </div>
    );
  }

  // ── Dispute window expired ───────────────────────────────────────────────

  if (order.status === 'delivered' && (order as any).delivered_at) {
    const deliveredAt = new Date((order as any).delivered_at);
    const windowExpires = new Date(
      deliveredAt.getTime() + DISPUTE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    if (new Date() > windowExpires) {
      return (
        <div style={CONTAINER}>
          {renderBackLink()}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: '#06070A', margin: '0 0 8px' }}>
              Report a Problem
            </h1>
            <div style={{ width: 32, height: 3, backgroundColor: '#1DC690', borderRadius: 2 }} />
          </div>
          {renderSimpleCard(
            `The ${DISPUTE_WINDOW_DAYS}-day dispute window for this order has expired.`,
          )}
          {renderBackLink()}
        </div>
      );
    }
  }

  // ── Creation form ────────────────────────────────────────────────────────

  const imgs = (order as any).listing?.images as
    | { image_url: string; display_order?: number }[]
    | undefined;
  const sorted = imgs?.length
    ? [...imgs].sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99))
    : [];
  const imageUrl = sorted[0]?.image_url || null;

  const descBorderColor = descFocused
    ? '#1DC690'
    : descriptionTouched && description.length < 20
    ? '#DC2626'
    : '#E5E7EB';

  const descShadow = descFocused ? '0 0 0 3px rgba(29,198,144,0.1)' : 'none';

  return (
    <div style={CONTAINER}>

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 1000,
            backgroundColor: toast.type === 'success' ? '#1DC690' : '#DC2626',
            color: '#FFFFFF',
            borderRadius: 10,
            padding: '12px 18px',
            fontSize: 14,
            fontWeight: 500,
            maxWidth: 320,
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Confirmation modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(6,7,10,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
              maxWidth: 440,
              width: '100%',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 600, color: '#06070A', marginBottom: 12 }}>
              Open Dispute?
            </div>
            <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5, marginBottom: 20 }}>
              You're requesting a £{refundAmount} refund ({refundPercent}%) for this order.
              The seller will have {SELLER_DEADLINE_HOURS} hours to respond. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  height: 46,
                  backgroundColor: '#FFFFFF',
                  color: '#1C4670',
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button onClick={handleConfirmSubmit} style={{ flex: 1, ...PRIMARY_BTN }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back link */}
      {renderBackLink()}

      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#06070A', margin: '0 0 8px' }}>
          Report a Problem
        </h1>
        <div style={{ width: 32, height: 3, backgroundColor: '#1DC690', borderRadius: 2 }} />
      </div>

      {/* ── CARD 1: Order context ────────────────────────────────────────── */}
      <div style={CARD}>
        <div style={SECTION_LABEL}>ORDER</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Item image */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 10,
              overflow: 'hidden',
              flexShrink: 0,
              backgroundColor: '#F7F7F5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={(order as any).listing?.title ?? 'Item'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Package size={24} color="#9CA3AF" />
            )}
          </div>

          {/* Item details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#06070A',
                marginBottom: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {(order as any).listing?.title ?? 'Item'}
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>
              Sold by {(order as any).seller?.display_name ?? 'Seller'}
            </div>
            <div style={{ fontSize: 13, color: '#D1D5DB' }}>
              {formatDate((order as any).created_at)}
            </div>
          </div>

          {/* Order amount */}
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1DC690', flexShrink: 0 }}>
            £{orderAmount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* ── CARD 2: Reason type ──────────────────────────────────────────── */}
      <div style={CARD}>
        <div style={SECTION_LABEL}>WHAT WENT WRONG?</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
          }}
        >
          {REASON_OPTIONS.map(reason => {
            const selected = selectedReason === reason.value;
            return (
              <button
                key={reason.value}
                onClick={() => setSelectedReason(reason.value)}
                style={{
                  backgroundColor: selected ? 'rgba(29,198,144,0.04)' : '#FFFFFF',
                  border: selected ? '2px solid #1DC690' : '1px solid #E5E7EB',
                  borderRadius: 12,
                  padding: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!selected) {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                    e.currentTarget.style.backgroundColor = '#FAFAF8';
                  }
                }}
                onMouseLeave={e => {
                  if (!selected) {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: '#06070A', marginBottom: 4 }}>
                  {reason.label}
                </div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>
                  {reason.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CARD 3: Description ──────────────────────────────────────────── */}
      <div style={CARD}>
        <div style={SECTION_LABEL}>DESCRIPTION</div>
        <textarea
          placeholder="Describe the issue in detail..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={2000}
          style={{
            width: '100%',
            minHeight: 120,
            padding: '10px 14px',
            border: `1px solid ${descBorderColor}`,
            borderRadius: 10,
            fontSize: 14,
            color: '#06070A',
            backgroundColor: '#FFFFFF',
            resize: 'vertical',
            fontFamily: 'inherit',
            lineHeight: 1.5,
            boxSizing: 'border-box',
            outline: 'none',
            boxShadow: descShadow,
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          }}
          onFocus={() => setDescFocused(true)}
          onBlur={() => {
            setDescFocused(false);
            setDescriptionTouched(true);
          }}
        />
        <div
          style={{
            textAlign: 'right',
            fontSize: 12,
            color: descriptionTouched && description.length < 20 ? '#DC2626' : '#9CA3AF',
            marginTop: 6,
          }}
        >
          {description.length} / 2000
        </div>
      </div>

      {/* ── CARD 4: Evidence photos ──────────────────────────────────────── */}
      <div style={CARD}>
        <div style={SECTION_LABEL}>EVIDENCE PHOTOS</div>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>
          Up to 5 photos — helps resolve disputes faster
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {photoPreviewUrls.map((url, i) => (
            <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={url}
                alt={`Evidence ${i + 1}`}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 10,
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <button
                onClick={() => removePhoto(i)}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {photoFiles.length < 5 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 80,
                height: 80,
                border: '2px dashed #E5E7EB',
                borderRadius: 10,
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#1DC690';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
            >
              <Camera size={24} color="#9CA3AF" />
            </button>
          )}
        </div>
      </div>

      {/* ── CARD 5: Refund amount ────────────────────────────────────────── */}
      <div style={CARD}>
        <div style={SECTION_LABEL}>REQUESTED REFUND</div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: refundPercent !== null ? 14 : 0 }}>
          {REFUND_PERCENTAGES.map(pct => {
            const selected = refundPercent === pct;
            return (
              <button
                key={pct}
                onClick={() => setRefundPercent(pct)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: selected ? 'none' : '1px solid #E5E7EB',
                  backgroundColor: selected ? '#1DC690' : '#FFFFFF',
                  color: selected ? '#FFFFFF' : '#6B7280',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!selected) e.currentTarget.style.borderColor = '#D1D5DB';
                }}
                onMouseLeave={e => {
                  if (!selected) e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              >
                {pct}%
              </button>
            );
          })}
        </div>

        {refundPercent !== null && (
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1DC690', marginBottom: 14 }}>
            Refund amount: £{(orderAmount * refundPercent / 100).toFixed(2)}
          </div>
        )}

        {refundPercent !== null && refundPercent >= 60 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              backgroundColor: 'rgba(39,138,176,0.08)',
              borderRadius: 12,
              padding: 14,
            }}
          >
            <Info size={18} color="#278AB0" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, color: '#1C4670', lineHeight: 1.5 }}>
              Refunds of 60% or more may require you to return the item to the seller.
            </div>
          </div>
        )}
      </div>

      {/* ── Submit section ───────────────────────────────────────────────── */}
      <div style={{ marginTop: 8 }}>
        <div
          style={{
            fontSize: 13,
            color: '#6B7280',
            maxWidth: 600,
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          Once submitted, the seller will have {SELLER_DEADLINE_HOURS} hours to respond. Your
          payment will remain held in escrow until the dispute is resolved.
        </div>

        <button
          onClick={() => { if (isFormValid) setShowModal(true); }}
          disabled={!isFormValid}
          style={isFormValid ? PRIMARY_BTN : DISABLED_BTN}
        >
          {submitting ? (
            <>
              <Loader2 size={18} />
              Submitting...
            </>
          ) : (
            'Submit Dispute'
          )}
        </button>
      </div>

    </div>
  );
}
