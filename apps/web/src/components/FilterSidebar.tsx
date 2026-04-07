'use client';

import React, { useState } from 'react';

const CATEGORIES = ['Clubs', 'Clothing', 'Shoes', 'Accessories', 'Balls', 'Training Aids', 'Shafts & Grips'];
const CONDITION_OPTIONS = [
  { value: 1, label: 'Poor', bg: '#EF4444' },
  { value: 2, label: 'Good', bg: '#F59E0B' },
  { value: 3, label: 'Very Good', bg: '#3B82F6' },
  { value: 4, label: 'Excellent', bg: '#8B5CF6' },
  { value: 5, label: 'New', bg: '#10B981' },
];
const SHAFT_FLEX = ['Regular', 'Stiff', 'X-Stiff', 'Senior', 'Lady'];
const DEXTERITY = ['Right-handed', 'Left-handed'];
const CLUB_SUBS = ['Drivers', 'Fairway Woods', 'Hybrids', 'Irons', 'Wedges', 'Putters'];
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const GENDER = ['Men', 'Women', 'Unisex'];

interface FilterSidebarProps {
  params: Record<string, string | undefined>;
  onFilterChange: (key: string, value: string | undefined) => void;
  onClearAll: () => void;
  showCategoryFilter?: boolean;
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-full px-3 py-1 text-xs font-semibold transition-colors" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, backgroundColor: active ? '#1DC690' : '#FFFFFF', color: active ? '#FFFFFF' : '#6B6B6B', border: active ? 'none' : '1px solid #E0E0D8' }}>
      {label}
    </button>
  );
}

export function FilterSidebar({ params, onFilterChange, onClearAll, showCategoryFilter = true }: FilterSidebarProps) {
  const category = params.category;
  const isClubs = category === 'Clubs' || category === 'clubs';
  const isShafts = category === 'Shafts & Grips' || category === 'shafts-grips';
  const isClothing = category === 'Clothing' || category === 'clothing';
  const isShoes = category === 'Shoes' || category === 'shoes';
  const showClubFilters = isClubs || isShafts;
  const showSizeFilters = isClothing || isShoes;

  const hasAnyFilter = Object.values(params).some((v) => v !== undefined);

  return (
    <aside className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1rem', color: '#0D0D0D' }}>Filters</h3>
        {hasAnyFilter && (
          <button onClick={onClearAll} className="text-xs font-semibold transition-colors hover:underline" style={{ color: '#E53E3E', fontFamily: 'var(--font-sans)' }}>Clear All</button>
        )}
      </div>

      {/* Category */}
      {showCategoryFilter && (
        <div>
          <label className="block mb-2" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>Category</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <Pill key={c} label={c} active={params.category === c} onClick={() => onFilterChange('category', params.category === c ? undefined : c)} />
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <label className="block mb-2" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>Price Range</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6B6B6B]">£</span>
            <input type="number" placeholder="Min" value={params.minPrice || ''} onChange={(e) => onFilterChange('minPrice', e.target.value || undefined)} className="w-full rounded-lg border pl-6 pr-2 text-sm" style={{ height: '36px', fontFamily: 'var(--font-sans)', borderColor: '#E0E0D8', color: '#0D0D0D' }} />
          </div>
          <span className="self-center text-[#ADADAD]">–</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6B6B6B]">£</span>
            <input type="number" placeholder="Max" value={params.maxPrice || ''} onChange={(e) => onFilterChange('maxPrice', e.target.value || undefined)} className="w-full rounded-lg border pl-6 pr-2 text-sm" style={{ height: '36px', fontFamily: 'var(--font-sans)', borderColor: '#E0E0D8', color: '#0D0D0D' }} />
          </div>
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="block mb-2" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>Condition</label>
        <div className="flex flex-wrap gap-1.5">
          {CONDITION_OPTIONS.map((c) => (
            <button key={c.value} onClick={() => onFilterChange('condition', params.condition === String(c.value) ? undefined : String(c.value))} className="rounded-full px-3 py-1 text-xs font-semibold text-white transition-opacity" style={{ backgroundColor: c.bg, fontFamily: 'var(--font-sans)', fontWeight: 600, opacity: params.condition === String(c.value) ? 1 : 0.45 }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Brand */}
      <div>
        <label className="block mb-2" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>Brand</label>
        <input type="text" placeholder="e.g. TaylorMade" value={params.brand || ''} onChange={(e) => onFilterChange('brand', e.target.value || undefined)} className="w-full rounded-lg border px-3 text-sm" style={{ height: '36px', fontFamily: 'var(--font-sans)', borderColor: '#E0E0D8', color: '#0D0D0D' }} />
      </div>

      {/* Club-specific filters */}
      {showClubFilters && (
        <>
          <div>
            <label className="block mb-2" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>Shaft Flex</label>
            <div className="flex flex-wrap gap-1.5">
              {SHAFT_FLEX.map((f) => <Pill key={f} label={f} active={params.shaftFlex === f} onClick={() => onFilterChange('shaftFlex', params.shaftFlex === f ? undefined : f)} />)}
            </div>
          </div>
          <div>
            <label className="block mb-2" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>Dexterity</label>
            <div className="flex flex-wrap gap-1.5">
              {DEXTERITY.map((d) => <Pill key={d} label={d} active={params.dexterity === d} onClick={() => onFilterChange('dexterity', params.dexterity === d ? undefined : d)} />)}
            </div>
          </div>
          {isClubs && (
            <div>
              <label className="block mb-2" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>Subcategory</label>
              <div className="flex flex-wrap gap-1.5">
                {CLUB_SUBS.map((s) => <Pill key={s} label={s} active={params.subcategory === s} onClick={() => onFilterChange('subcategory', params.subcategory === s ? undefined : s)} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Size filters */}
      {showSizeFilters && (
        <>
          <div>
            <label className="block mb-2" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>Size</label>
            <div className="flex flex-wrap gap-1.5">
              {CLOTHING_SIZES.map((s) => <Pill key={s} label={s} active={params.size === s} onClick={() => onFilterChange('size', params.size === s ? undefined : s)} />)}
            </div>
          </div>
          <div>
            <label className="block mb-2" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>Gender</label>
            <div className="flex flex-wrap gap-1.5">
              {GENDER.map((g) => <Pill key={g} label={g} active={params.gender === g} onClick={() => onFilterChange('gender', params.gender === g ? undefined : g)} />)}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
