'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getMyListings,
  bulkUpdateListings,
  bulkDeleteListings,
  deleteListing,
  markListingOffSale,
  relistListing,
  type ListingWithImages,
  type ListingStatus,
  type GetMyListingsParams,
  type GetMyListingsResponse,
  type BulkUpdateData,
} from '@mulligans/api-client';

const ITEMS_PER_PAGE = 20;

const CONDITION_MAP: Record<number, { label: string; bg: string; text: string }> = {
  5: { label: 'New', bg: '#1DC690', text: '#FFFFFF' },
  4: { label: 'Like New', bg: '#278AB0', text: '#FFFFFF' },
  3: { label: 'Very Good', bg: '#2A9DBF', text: '#FFFFFF' },
  2: { label: 'Good', bg: '#F59E0B', text: '#FFFFFF' },
  1: { label: 'Fair', bg: '#9CA3AF', text: '#FFFFFF' },
};

const STATUS_MAP: Record<string, { bg: string; text: string }> = {
  active: { bg: 'rgba(29,198,144,0.15)', text: '#1DC690' },
  draft: { bg: 'rgba(107,107,107,0.15)', text: '#6B6B6B' },
  paused: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
  sold: { bg: 'rgba(239,68,68,0.12)', text: '#E53E3E' },
  off_sale: { bg: 'rgba(124,92,191,0.15)', text: '#7C5CBF' },
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
}

function isWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

function isOlderThanDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > days;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronDownIcon({ color = '#6B6B6B' }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

// ─── Select Wrapper ────────────────────────────────────────────────────────────

function SelectField({
  value,
  onChange,
  children,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-[#E0E0D8] rounded-lg h-[40px] pl-3 pr-8 text-[0.85rem] text-[#0D0D0D] focus:border-[#1DC690] outline-none w-full cursor-pointer"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
        <ChevronDownIcon />
      </span>
    </div>
  );
}

// ─── Skeleton Row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-[#E0E0D8] animate-pulse">
      <td className="py-3 px-3 w-[44px]">
        <div className="w-4 h-4 bg-[#E0E0D8] rounded" />
      </td>
      <td className="py-3 px-3 w-[64px]">
        <div className="w-12 h-12 bg-[#E0E0D8] rounded-lg" />
      </td>
      <td className="py-3 px-3">
        <div className="h-4 bg-[#E0E0D8] rounded w-3/4 mb-2" />
        <div className="h-3 bg-[#E0E0D8] rounded w-1/2" />
      </td>
      <td className="py-3 px-3 w-[100px]">
        <div className="h-5 bg-[#E0E0D8] rounded-full w-16" />
      </td>
      <td className="py-3 px-3 w-[90px]">
        <div className="h-4 bg-[#E0E0D8] rounded w-14" />
      </td>
      <td className="py-3 px-3 w-[90px]">
        <div className="h-5 bg-[#E0E0D8] rounded-full w-14" />
      </td>
      <td className="py-3 px-3 w-[70px]">
        <div className="h-4 bg-[#E0E0D8] rounded w-8" />
      </td>
      <td className="py-3 px-3 w-[100px]">
        <div className="h-4 bg-[#E0E0D8] rounded w-16" />
      </td>
      <td className="py-3 px-3 w-[50px]">
        <div className="w-6 h-6 bg-[#E0E0D8] rounded" />
      </td>
    </tr>
  );
}

// ─── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteModal({
  ids,
  title,
  onConfirm,
  onCancel,
  loading,
}: {
  ids: string[];
  title?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const count = ids.length;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.1)] p-6 max-w-[440px] w-[calc(100%-32px)]">
        <h2 className="text-[1.1rem] font-bold text-[#0D0D0D]">
          {count === 1 && title ? `Delete "${title}"?` : `Delete ${count} listing${count !== 1 ? 's' : ''}?`}
        </h2>
        <p className="text-[#6B6B6B] text-[0.9rem] mt-2">This cannot be undone.</p>
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="border border-[#E0E0D8] text-[#6B6B6B] rounded-[10px] h-[44px] px-5 font-bold text-[0.95rem] hover:bg-[#F4F4F0] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="bg-[#E53E3E] text-white rounded-[10px] h-[44px] px-5 font-bold text-[0.95rem] hover:bg-[#C53030] transition disabled:opacity-50"
          >
            {loading ? 'Deleting…' : `Delete ${count} Listing${count !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Price Edit Modal ──────────────────────────────────────────────────────────

function PriceModal({
  selectedCount,
  onConfirm,
  onCancel,
  loading,
}: {
  selectedCount: number;
  onConfirm: (data: { mode: 'set' | 'percent'; value: string }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [mode, setMode] = useState<'set' | 'percent'>('set');
  const [priceValue, setPriceValue] = useState('');
  const [percentValue, setPercentValue] = useState('');

  function handleSubmit() {
    if (mode === 'set') {
      onConfirm({ mode: 'set', value: priceValue });
    } else {
      onConfirm({ mode: 'percent', value: percentValue });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.1)] p-6 max-w-[440px] w-[calc(100%-32px)]">
        <h2 className="text-[1.1rem] font-bold text-[#0D0D0D]">Edit Price</h2>
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={mode === 'set'}
              onChange={() => setMode('set')}
              className="accent-[#1DC690] w-4 h-4"
            />
            <span className="text-[0.9rem] text-[#0D0D0D] font-medium">Set new price</span>
          </label>
          {mode === 'set' && (
            <div className="ml-6">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] text-[0.9rem] font-medium">£</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-[#E0E0D8] rounded-lg h-[40px] pl-7 pr-3 text-[0.85rem] text-[#0D0D0D] placeholder-[#ADADAD] focus:border-[#1DC690] focus:shadow-[0_0_0_3px_rgba(29,198,144,0.12)] outline-none"
                />
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={mode === 'percent'}
              onChange={() => setMode('percent')}
              className="accent-[#1DC690] w-4 h-4"
            />
            <span className="text-[0.9rem] text-[#0D0D0D] font-medium">Adjust by percentage</span>
          </label>
          {mode === 'percent' && (
            <div className="ml-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPercentValue((v) => String(Math.max(-100, Number(v || 0) - 5)))}
                  className="w-8 h-8 flex items-center justify-center border border-[#E0E0D8] rounded-lg text-[#0D0D0D] hover:bg-[#F4F4F0] font-bold"
                >
                  −
                </button>
                <div className="relative">
                  <input
                    type="number"
                    value={percentValue}
                    onChange={(e) => setPercentValue(e.target.value)}
                    placeholder="0"
                    className="w-20 bg-white border border-[#E0E0D8] rounded-lg h-[40px] px-3 pr-6 text-[0.85rem] text-[#0D0D0D] placeholder-[#ADADAD] focus:border-[#1DC690] outline-none text-center"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6B6B] text-[0.8rem]">%</span>
                </div>
                <button
                  onClick={() => setPercentValue((v) => String(Number(v || 0) + 5))}
                  className="w-8 h-8 flex items-center justify-center border border-[#E0E0D8] rounded-lg text-[#0D0D0D] hover:bg-[#F4F4F0] font-bold"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
        <p className="text-[#6B6B6B] text-[0.85rem] mt-4">
          This will update prices for {selectedCount} listing{selectedCount !== 1 ? 's' : ''}.
        </p>
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="border border-[#E0E0D8] text-[#6B6B6B] rounded-[10px] h-[44px] px-5 font-bold text-[0.95rem] hover:bg-[#F4F4F0] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (mode === 'set' ? !priceValue : !percentValue)}
            className="bg-[#1DC690] text-white rounded-[10px] h-[44px] px-5 font-bold text-[0.95rem] hover:bg-[#19B07F] transition disabled:opacity-50"
          >
            {loading ? 'Applying…' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Discount Modal ────────────────────────────────────────────────────────────

function DiscountModal({
  selectedCount,
  onConfirm,
  onCancel,
  loading,
}: {
  selectedCount: number;
  onConfirm: (data: { mode: 'sale' | 'permanent'; priceMode: 'fixed' | 'percent'; value: string }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [mode, setMode] = useState<'sale' | 'permanent'>('sale');
  const [priceMode, setPriceMode] = useState<'fixed' | 'percent'>('fixed');
  const [value, setValue] = useState('');

  const previewOriginal = 149.99;
  const previewNew =
    priceMode === 'fixed'
      ? parseFloat(value) || previewOriginal
      : previewOriginal * (1 - (parseFloat(value) || 0) / 100);

  function handleSubmit() {
    onConfirm({ mode, priceMode, value });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.1)] p-6 max-w-[440px] w-[calc(100%-32px)]">
        <h2 className="text-[1.1rem] font-bold text-[#0D0D0D]">Apply Discount</h2>
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              checked={mode === 'sale'}
              onChange={() => setMode('sale')}
              className="accent-[#1DC690] w-4 h-4 mt-0.5"
            />
            <div>
              <span className="text-[0.9rem] text-[#0D0D0D] font-medium">Temporary sale price</span>
              <p className="text-[0.8rem] text-[#6B6B6B] mt-0.5">
                Original price shown crossed out. Sale price displayed to buyers.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              checked={mode === 'permanent'}
              onChange={() => setMode('permanent')}
              className="accent-[#1DC690] w-4 h-4 mt-0.5"
            />
            <div>
              <span className="text-[0.9rem] text-[#0D0D0D] font-medium">Permanent price change</span>
              <p className="text-[0.8rem] text-[#6B6B6B] mt-0.5">
                Permanently updates the listing price. No strikethrough.
              </p>
            </div>
          </label>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setPriceMode('fixed')}
              className={`text-[0.8rem] font-semibold px-3 py-1 rounded-full border transition ${priceMode === 'fixed' ? 'bg-[#1DC690] text-white border-[#1DC690]' : 'bg-white text-[#6B6B6B] border-[#E0E0D8] hover:border-[#1DC690]'}`}
            >
              £ Fixed
            </button>
            <button
              onClick={() => setPriceMode('percent')}
              className={`text-[0.8rem] font-semibold px-3 py-1 rounded-full border transition ${priceMode === 'percent' ? 'bg-[#1DC690] text-white border-[#1DC690]' : 'bg-white text-[#6B6B6B] border-[#E0E0D8] hover:border-[#1DC690]'}`}
            >
              % Off
            </button>
          </div>
          <div className="relative">
            {priceMode === 'fixed' && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] text-[0.9rem] font-medium">£</span>
            )}
            <input
              type="number"
              min="0"
              step={priceMode === 'fixed' ? '0.01' : '1'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={priceMode === 'fixed' ? '0.00' : '0'}
              className={`w-full bg-white border border-[#E0E0D8] rounded-lg h-[40px] ${priceMode === 'fixed' ? 'pl-7' : 'pl-3'} pr-8 text-[0.85rem] text-[#0D0D0D] placeholder-[#ADADAD] focus:border-[#1DC690] focus:shadow-[0_0_0_3px_rgba(29,198,144,0.12)] outline-none`}
            />
            {priceMode === 'percent' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] text-[0.8rem]">%</span>
            )}
          </div>
        </div>

        {value && (
          <div className="mt-4 bg-[#F4F4F0] rounded-lg p-3">
            <p className="text-[0.78rem] text-[#6B6B6B] mb-1 font-medium uppercase tracking-wide">Preview</p>
            {mode === 'sale' ? (
              <div className="flex items-center gap-2">
                <span className="text-[0.9rem] text-[#9CA3AF] line-through">£{previewOriginal.toFixed(2)}</span>
                <span className="text-[0.95rem] font-bold text-[#1DC690]">£{Math.max(0, previewNew).toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-[0.95rem] font-bold text-[#1DC690]">£{Math.max(0, previewNew).toFixed(2)}</span>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="border border-[#E0E0D8] text-[#6B6B6B] rounded-[10px] h-[44px] px-5 font-bold text-[0.95rem] hover:bg-[#F4F4F0] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !value}
            className="bg-[#1DC690] text-white rounded-[10px] h-[44px] px-5 font-bold text-[0.95rem] hover:bg-[#19B07F] transition disabled:opacity-50"
          >
            {loading ? 'Applying…' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const router = useRouter();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [conditionFilter, setConditionFilter] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [ageFilter, setAgeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Data state
  const [listings, setListings] = useState<ListingWithImages[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // UI state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; ids: string[]; title?: string }>({ open: false, ids: [] });
  const [priceModal, setPriceModal] = useState<boolean>(false);
  const [discountModal, setDiscountModal] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (openMenuId && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [openMenuId]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: GetMyListingsParams = {
        page,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter as ListingStatus : undefined,
        category: categoryFilter || undefined,
        condition: conditionFilter || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      };
      const response: GetMyListingsResponse = await getMyListings(params);
      setListings(response.listings);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, categoryFilter, conditionFilter, minPrice, maxPrice]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Client-side age filter applied after fetch
  const filteredListings = ageFilter
    ? listings.filter((l) => {
        if (ageFilter === '91') return isOlderThanDays(l.created_at, 90);
        return isWithinDays(l.created_at, parseInt(ageFilter));
      })
    : listings;

  const hasActiveFilters =
    statusFilter !== 'all' ||
    categoryFilter !== '' ||
    conditionFilter !== '' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    ageFilter !== '' ||
    searchQuery !== '';

  function clearFilters() {
    setStatusFilter('all');
    setCategoryFilter('');
    setConditionFilter('');
    setMinPrice('');
    setMaxPrice('');
    setAgeFilter('');
    setSearchQuery('');
    setPage(1);
  }

  // Selection helpers
  const allVisibleSelected =
    filteredListings.length > 0 && filteredListings.every((l) => selectedIds.has(l.id));

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredListings.forEach((l) => next.delete(l.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredListings.forEach((l) => next.add(l.id));
        return next;
      });
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Bulk actions
  async function handleBulkPause() {
    setActionLoading(true);
    try {
      const data: BulkUpdateData = { ids: Array.from(selectedIds), status: 'paused' };
      await bulkUpdateListings(data);
      setSelectedIds(new Set());
      await fetchListings();
    } catch {
      // silently fail — in a real app, show toast
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBulkResume() {
    setActionLoading(true);
    try {
      const data: BulkUpdateData = { ids: Array.from(selectedIds), status: 'active' };
      await bulkUpdateListings(data);
      setSelectedIds(new Set());
      await fetchListings();
    } catch {
      // silently fail
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmDelete() {
    setActionLoading(true);
    try {
      if (deleteModal.ids.length === 1) {
        await deleteListing(deleteModal.ids[0]);
      } else {
        await bulkDeleteListings(deleteModal.ids);
      }
      setSelectedIds(new Set());
      setDeleteModal({ open: false, ids: [] });
      await fetchListings();
    } catch {
      // silently fail
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePriceApply(data: { mode: 'set' | 'percent'; value: string }) {
    setActionLoading(true);
    try {
      const bulkData: BulkUpdateData =
        data.mode === 'set'
          ? { ids: Array.from(selectedIds), price: parseFloat(data.value) }
          : { ids: Array.from(selectedIds), price_adjustment_percent: parseFloat(data.value) };
      await bulkUpdateListings(bulkData);
      setSelectedIds(new Set());
      setPriceModal(false);
      await fetchListings();
    } catch {
      // silently fail
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDiscountApply(data: { mode: 'sale' | 'permanent'; priceMode: 'fixed' | 'percent'; value: string }) {
    setActionLoading(true);
    try {
      let bulkData: BulkUpdateData;
      if (data.mode === 'sale') {
        if (data.priceMode === 'fixed') {
          bulkData = { ids: Array.from(selectedIds), price: parseFloat(data.value) };
        } else {
          bulkData = { ids: Array.from(selectedIds), price_adjustment_percent: -Math.abs(parseFloat(data.value)) };
        }
      } else {
        if (data.priceMode === 'fixed') {
          bulkData = { ids: Array.from(selectedIds), price: parseFloat(data.value), original_price: undefined };
        } else {
          bulkData = { ids: Array.from(selectedIds), price_adjustment_percent: -Math.abs(parseFloat(data.value)) };
        }
      }
      await bulkUpdateListings(bulkData);
      setSelectedIds(new Set());
      setDiscountModal(false);
      await fetchListings();
    } catch {
      // silently fail
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRowPause(id: string) {
    setOpenMenuId(null);
    try {
      await bulkUpdateListings({ ids: [id], status: 'paused' });
      await fetchListings();
    } catch {
      // silently fail
    }
  }

  async function handleRowResume(id: string) {
    setOpenMenuId(null);
    try {
      await bulkUpdateListings({ ids: [id], status: 'active' });
      await fetchListings();
    } catch {
      // silently fail
    }
  }

  async function handleRowMarkSold(id: string) {
    setOpenMenuId(null);
    try {
      await bulkUpdateListings({ ids: [id], status: 'sold' });
      await fetchListings();
    } catch {
      // silently fail
    }
  }

  async function handleRowMarkOffSale(id: string) {
    setOpenMenuId(null);
    try {
      await markListingOffSale(id);
      await fetchListings();
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Failed to mark as off-sale';
      alert(message);
    }
  }

  async function handleRowRelist(id: string) {
    setOpenMenuId(null);
    try {
      await relistListing(id);
      await fetchListings();
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Failed to relist';
      alert(message);
    }
  }

  // Pagination range
  function getPageNumbers(): number[] {
    const range: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }

  const showingFrom = total === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const showingTo = Math.min(page * ITEMS_PER_PAGE, total);

  return (
    <div className="min-h-screen p-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-[0.75rem] font-semibold text-[#6B6B6B] uppercase tracking-[0.12em]">
          Inventory
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href="/inventory/import"
            className="inline-flex items-center justify-center border-2 border-[#1C4670] text-[#1C4670] bg-transparent rounded-[10px] h-[44px] px-5 font-bold text-[0.95rem] hover:bg-[#1C4670]/5 transition"
          >
            Import CSV
          </Link>
          <Link
            href="/inventory/new"
            className="inline-flex items-center justify-center bg-[#1DC690] text-white rounded-[10px] h-[44px] px-5 font-bold text-[0.95rem] hover:bg-[#19B07F] transition"
          >
            + New Listing
          </Link>
        </div>
      </div>

      {/* ── Status Quick-Filter Pills ── */}
      <div className="flex items-center gap-2 mt-5 flex-wrap">
        {['all', 'active', 'draft', 'paused', 'sold', 'off_sale'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={
              statusFilter === s
                ? 'bg-[#1DC690] text-white rounded-full px-4 py-1.5 text-[0.8rem] font-semibold cursor-pointer'
                : 'bg-white border border-[#E0E0D8] text-[#6B6B6B] rounded-full px-4 py-1.5 text-[0.8rem] font-semibold cursor-pointer hover:border-[#1DC690] transition'
            }
          >
            {s === 'all' ? 'All' : s === 'off_sale' ? 'Off Sale' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Filter Row ── */}
      <div className="flex items-center gap-3 mt-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search listings…"
            className="w-full bg-white border border-[#E0E0D8] rounded-lg h-[40px] pl-9 pr-3 text-[0.85rem] text-[#0D0D0D] placeholder-[#ADADAD] focus:border-[#1DC690] focus:shadow-[0_0_0_3px_rgba(29,198,144,0.12)] outline-none"
          />
        </div>

        {/* Category */}
        <SelectField value={categoryFilter} onChange={(v) => { setCategoryFilter(v); setPage(1); }} className="min-w-[160px]">
          <option value="">All Categories</option>
          <option value="Clubs">Clubs</option>
          <option value="Shafts Grips &amp; Heads">Shafts Grips &amp; Heads</option>
          <option value="Clothing">Clothing</option>
          <option value="Shoes">Shoes</option>
          <option value="Accessories">Accessories</option>
          <option value="Balls">Balls</option>
          <option value="Training Aids">Training Aids</option>
          <option value="Everything Else">Everything Else</option>
        </SelectField>

        {/* Condition */}
        <SelectField value={conditionFilter} onChange={(v) => { setConditionFilter(v); setPage(1); }} className="min-w-[140px]">
          <option value="">All Conditions</option>
          <option value="5">New</option>
          <option value="4">Like New</option>
          <option value="3">Very Good</option>
          <option value="2">Good</option>
          <option value="1">Fair</option>
        </SelectField>

        {/* Price Range */}
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
            placeholder="Min £"
            className="w-[80px] bg-white border border-[#E0E0D8] rounded-lg h-[40px] px-3 text-[0.85rem] text-[#0D0D0D] placeholder-[#ADADAD] focus:border-[#1DC690] outline-none"
          />
          <span className="text-[#ADADAD] text-[0.85rem]">–</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
            placeholder="Max £"
            className="w-[80px] bg-white border border-[#E0E0D8] rounded-lg h-[40px] px-3 text-[0.85rem] text-[#0D0D0D] placeholder-[#ADADAD] focus:border-[#1DC690] outline-none"
          />
        </div>

        {/* Listing Age */}
        <SelectField value={ageFilter} onChange={(v) => { setAgeFilter(v); setPage(1); }} className="min-w-[140px]">
          <option value="">All Ages</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="91">Older than 90 days</option>
        </SelectField>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-[#6B6B6B] text-[0.8rem] font-medium hover:text-[#0D0D0D] underline transition whitespace-nowrap"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Inventory Table Card ── */}
      <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden mt-5">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F4F4F0]">
                <th className="py-3 px-3 w-[44px] text-left">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className="accent-[#1DC690] w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 w-[64px] text-left text-[#6B6B6B] uppercase text-[0.72rem] font-semibold tracking-[0.08em]">
                  Photo
                </th>
                <th className="py-3 px-3 text-left text-[#6B6B6B] uppercase text-[0.72rem] font-semibold tracking-[0.08em]">
                  Listing
                </th>
                <th className="py-3 px-3 w-[100px] text-left text-[#6B6B6B] uppercase text-[0.72rem] font-semibold tracking-[0.08em]">
                  Condition
                </th>
                <th className="py-3 px-3 w-[90px] text-left text-[#6B6B6B] uppercase text-[0.72rem] font-semibold tracking-[0.08em]">
                  Price
                </th>
                <th className="py-3 px-3 w-[90px] text-left text-[#6B6B6B] uppercase text-[0.72rem] font-semibold tracking-[0.08em]">
                  Status
                </th>
                <th className="py-3 px-3 w-[70px] text-left text-[#6B6B6B] uppercase text-[0.72rem] font-semibold tracking-[0.08em]">
                  Views
                </th>
                <th className="py-3 px-3 w-[100px] text-left text-[#6B6B6B] uppercase text-[0.72rem] font-semibold tracking-[0.08em]">
                  Listed
                </th>
                <th className="py-3 px-3 w-[50px]" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error ? null : filteredListings.length === 0 ? null : (
                filteredListings.map((listing, idx) => {
                  const isSelected = selectedIds.has(listing.id);
                  const conditionInfo = listing.condition_overall != null ? CONDITION_MAP[listing.condition_overall] : null;
                  const statusInfo = STATUS_MAP[listing.status] ?? { bg: 'rgba(107,107,107,0.15)', text: '#6B6B6B' };
                  const imageUrl = listing.images?.[0]?.image_url ?? null;
                  const specsArr: string[] = [];
                  if (listing.brand) specsArr.push(listing.brand);
                  if (listing.category) specsArr.push(listing.category);
                  const shaftFlex = listing.specifications?.shaft_flex as string | undefined;
                  if (shaftFlex) specsArr.push(shaftFlex);
                  const specsStr = specsArr.join(' · ');
                  const priceNum = parseFloat(listing.price);
                  const originalPriceNum = listing.original_price ? parseFloat(listing.original_price) : null;
                  const showOriginal = originalPriceNum != null && originalPriceNum !== priceNum;
                  const rowBg = isSelected
                    ? 'rgba(29,198,144,0.06)'
                    : idx % 2 === 0
                    ? '#FFFFFF'
                    : '#FAFAF8';

                  return (
                    <tr
                      key={listing.id}
                      style={{ backgroundColor: rowBg }}
                      className="border-b border-[#E0E0D8] hover:bg-[#F4F4F0] transition-colors"
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(listing.id)}
                          className="accent-[#1DC690] w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Photo */}
                      <td className="py-3 px-3 align-middle">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={listing.title}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-[#F4F4F0] flex items-center justify-center">
                            <CameraIcon />
                          </div>
                        )}
                      </td>

                      {/* Title + Specs */}
                      <td className="py-3 px-3 align-middle">
                        <div
                          className="text-[0.9rem] font-bold text-[#0D0D0D] overflow-hidden"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {listing.title}
                        </div>
                        {specsStr && (
                          <div className="text-[0.78rem] text-[#6B6B6B] mt-0.5">{specsStr}</div>
                        )}
                      </td>

                      {/* Condition */}
                      <td className="py-3 px-3 align-middle">
                        {conditionInfo ? (
                          <span
                            className="rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold inline-block"
                            style={{ backgroundColor: conditionInfo.bg, color: conditionInfo.text }}
                          >
                            {conditionInfo.label}
                          </span>
                        ) : (
                          <span className="text-[0.78rem] text-[#ADADAD]">—</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 align-middle">
                        {showOriginal && (
                          <div className="text-[0.75rem] text-[#9CA3AF] line-through leading-none mb-0.5">
                            £{originalPriceNum!.toFixed(2)}
                          </div>
                        )}
                        <div className="text-[#1DC690] font-bold text-[0.95rem]">
                          £{priceNum.toFixed(2)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 align-middle">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold inline-block"
                          style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
                        >
                          {listing.status === 'off_sale' ? 'Off Sale' : listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                        </span>
                      </td>

                      {/* Views */}
                      <td className="py-3 px-3 align-middle text-[#6B6B6B] text-[0.85rem]">
                        {listing.views}
                      </td>

                      {/* Listed */}
                      <td className="py-3 px-3 align-middle text-[#6B6B6B] text-[0.78rem]">
                        {formatRelativeDate(listing.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 align-middle">
                        <div className="relative" ref={openMenuId === listing.id ? menuRef : null}>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === listing.id ? null : listing.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B6B6B] hover:bg-[#F4F4F0] transition text-[1.1rem] leading-none"
                            aria-label="Actions"
                          >
                            ⋮
                          </button>
                          {openMenuId === listing.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.1)] border border-[#E0E0D8] py-1 min-w-[160px] z-50">
                              {/* Edit */}
                              <Link
                                href={`/inventory/${listing.id}/edit`}
                                onClick={() => setOpenMenuId(null)}
                                className="flex items-center gap-2 px-3 py-2 text-[0.85rem] text-[#0D0D0D] hover:bg-[#F4F4F0] cursor-pointer"
                              >
                                <PencilIcon />
                                Edit
                              </Link>

                              {/* Pause / Resume */}
                              {listing.status === 'active' && (
                                <button
                                  onClick={() => handleRowPause(listing.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[0.85rem] text-[#0D0D0D] hover:bg-[#F4F4F0] cursor-pointer text-left"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                                  </svg>
                                  Pause
                                </button>
                              )}
                              {listing.status === 'paused' && (
                                <button
                                  onClick={() => handleRowResume(listing.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[0.85rem] text-[#0D0D0D] hover:bg-[#F4F4F0] cursor-pointer text-left"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                  </svg>
                                  Resume
                                </button>
                              )}

                              {/* Mark as Sold */}
                              {listing.status !== 'sold' && listing.status !== 'off_sale' && (
                                <button
                                  onClick={() => handleRowMarkSold(listing.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[0.85rem] text-[#0D0D0D] hover:bg-[#F4F4F0] cursor-pointer text-left"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  Mark as Sold
                                </button>
                              )}

                              {/* Mark sold elsewhere (off-sale) */}
                              {listing.status === 'active' && (
                                <button
                                  onClick={() => handleRowMarkOffSale(listing.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[0.85rem] text-[#7C5CBF] hover:bg-[#F4F4F0] cursor-pointer text-left"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6L6 18" /><path d="M6 6l12 12" />
                                  </svg>
                                  Mark sold elsewhere
                                </button>
                              )}

                              {/* Relist (from off_sale) */}
                              {listing.status === 'off_sale' && (
                                <button
                                  onClick={() => handleRowRelist(listing.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[0.85rem] text-[#1DC690] hover:bg-[#F4F4F0] cursor-pointer text-left"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                  </svg>
                                  Relist
                                </button>
                              )}

                              {/* Duplicate (disabled) */}
                              <button
                                disabled
                                className="w-full flex items-center gap-2 px-3 py-2 text-[0.85rem] text-[#0D0D0D] opacity-40 cursor-not-allowed text-left"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                Duplicate
                              </button>

                              <div className="border-t border-[#E0E0D8] my-1" />

                              {/* Delete */}
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setDeleteModal({ open: true, ids: [listing.id], title: listing.title });
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[0.85rem] text-[#E53E3E] hover:bg-[#F4F4F0] cursor-pointer text-left"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Error state */}
          {!loading && error && (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 px-6">
              <p className="text-[1.1rem] font-bold text-[#0D0D0D]">Something went wrong</p>
              <p className="text-[#6B6B6B] text-[0.9rem]">{error}</p>
              <button
                onClick={fetchListings}
                className="bg-[#1DC690] text-white rounded-[10px] h-[44px] px-5 font-bold text-[0.95rem] hover:bg-[#19B07F] transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredListings.length === 0 && (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 px-6">
              {hasActiveFilters ? (
                <>
                  <p className="text-[1.1rem] font-bold text-[#0D0D0D]">No listings match your filters</p>
                  <button
                    onClick={clearFilters}
                    className="text-[#1DC690] text-[0.9rem] font-semibold underline"
                  >
                    Clear Filters
                  </button>
                </>
              ) : (
                <>
                  <PackageIcon />
                  <div className="text-center">
                    <p className="text-[1.1rem] font-bold text-[#0D0D0D]">No listings yet</p>
                    <p className="text-[#6B6B6B] text-[0.9rem] mt-1">
                      Create your first listing or import via CSV to get started.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href="/inventory/new"
                      className="inline-flex items-center justify-center bg-[#1DC690] text-white rounded-[10px] h-[44px] px-5 font-bold text-[0.95rem] hover:bg-[#19B07F] transition"
                    >
                      + Create Listing
                    </Link>
                    <Link
                      href="/inventory/import"
                      className="inline-flex items-center justify-center border-2 border-[#1C4670] text-[#1C4670] bg-transparent rounded-[10px] h-[44px] px-5 font-bold text-[0.95rem] hover:bg-[#1C4670]/5 transition"
                    >
                      Import CSV
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Pagination ── */}
      {!loading && !error && total > 0 && (
        <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
          <p className="text-[#6B6B6B] text-[0.85rem]">
            Showing {showingFrom}–{showingTo} of {total} listing{total !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border border-[#E0E0D8] text-[#6B6B6B] rounded-lg h-8 px-3 text-[0.8rem] font-medium hover:border-[#1DC690] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {getPageNumbers().map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`rounded-lg w-8 h-8 text-[0.85rem] font-semibold transition ${n === page ? 'bg-[#1DC690] text-white' : 'bg-white border border-[#E0E0D8] text-[#6B6B6B] hover:border-[#1DC690]'}`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border border-[#E0E0D8] text-[#6B6B6B] rounded-lg h-8 px-3 text-[0.8rem] font-medium hover:border-[#1DC690] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── Bulk Action Bar ── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[800px] w-[calc(100%-48px)]">
          <div className="bg-[#1C4670] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.1)] px-5 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-white font-semibold text-[0.9rem]">
                {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-white/60 hover:text-white text-[0.9rem] font-medium transition"
                aria-label="Clear selection"
              >
                ×
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleBulkPause}
                disabled={actionLoading}
                className="border border-white/30 text-white rounded-lg px-4 py-2 text-[0.85rem] font-medium hover:bg-white/10 transition disabled:opacity-50"
              >
                Pause
              </button>
              <button
                onClick={handleBulkResume}
                disabled={actionLoading}
                className="border border-white/30 text-white rounded-lg px-4 py-2 text-[0.85rem] font-medium hover:bg-white/10 transition disabled:opacity-50"
              >
                Resume
              </button>
              <button
                onClick={() => setPriceModal(true)}
                disabled={actionLoading}
                className="border border-white/30 text-white rounded-lg px-4 py-2 text-[0.85rem] font-medium hover:bg-white/10 transition disabled:opacity-50"
              >
                Edit Price
              </button>
              <button
                onClick={() => setDiscountModal(true)}
                disabled={actionLoading}
                className="border border-white/30 text-white rounded-lg px-4 py-2 text-[0.85rem] font-medium hover:bg-white/10 transition disabled:opacity-50"
              >
                Discount
              </button>
              <button
                onClick={() => setDeleteModal({ open: true, ids: Array.from(selectedIds) })}
                disabled={actionLoading}
                className="border border-[#E53E3E] text-[#E53E3E] rounded-lg px-4 py-2 text-[0.85rem] font-medium hover:bg-[#E53E3E]/10 transition disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteModal.open && (
        <DeleteModal
          ids={deleteModal.ids}
          title={deleteModal.title}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModal({ open: false, ids: [] })}
          loading={actionLoading}
        />
      )}

      {/* ── Price Edit Modal ── */}
      {priceModal && (
        <PriceModal
          selectedCount={selectedIds.size}
          onConfirm={handlePriceApply}
          onCancel={() => setPriceModal(false)}
          loading={actionLoading}
        />
      )}

      {/* ── Discount Modal ── */}
      {discountModal && (
        <DiscountModal
          selectedCount={selectedIds.size}
          onConfirm={handleDiscountApply}
          onCancel={() => setDiscountModal(false)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
