'use client';

import React, { useState } from 'react';
import { CATEGORY_SLUG_TO_DB } from '@/lib/constants';

// ─── Category filters ────────────────────────────────────────
const CATEGORY_FILTERS = [
  { display: 'Clubs', db: 'Clubs' },
  { display: 'Clothing', db: 'Clothing' },
  { display: 'Shoes', db: 'Shoes' },
  { display: 'Accessories', db: 'Accessories' },
  { display: 'Balls', db: 'Balls' },
  { display: 'Training Aids', db: 'Training Aids' },
  { display: 'Shafts & Grips', db: 'Shafts, Grips & Heads' },
  { display: 'Everything Else', db: 'Everything Else' },
];

// ─── Condition ───────────────────────────────────────────────
const CONDITION_OPTIONS = [
  { value: 1, label: 'Poor', bg: '#EF4444' },
  { value: 2, label: 'Good', bg: '#F59E0B' },
  { value: 3, label: 'Very Good', bg: '#3B82F6' },
  { value: 4, label: 'Excellent', bg: '#8B5CF6' },
  { value: 5, label: 'New', bg: '#10B981' },
];

// ─── Club-specific ───────────────────────────────────────────
// FIX 1: Dexterity values match DB exactly (capital H, space not hyphen)
const DEXTERITY = ['Right Handed', 'Left Handed'];
// FIX 4: Junior added to shaft flex
const SHAFT_FLEX = ['Extra Stiff', 'Stiff', 'Regular', 'Senior', 'Ladies', 'Junior'];
const SHAFT_MATERIAL = ['Steel', 'Graphite'];
const GRIP_SIZE = ['Junior', 'Undersize', 'Standard', 'Midsize', 'Jumbo', 'Plus 4'];
const IRON_NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'PW', 'AW', 'GW'];
const PUTTER_HEAD_TYPE = ['Blade', 'Mid-Mallet', 'Mallet'];

// ─── Subcategories per category ──────────────────────────────
const CLUB_SUBS = ['Drivers', 'Fairway Woods', 'Hybrids', 'Irons', 'Wedges', 'Putters', 'Chippers', 'Complete Sets', 'Other'];
const CLOTHING_SUBS = ['Jackets', 'Polo Shirts', 'Trousers', 'Shorts', 'Hoodies', 'Knitwear', 'Gilets', 'Mid-Layers', 'Waterproofs', 'Hats & Caps', 'Sunglasses', 'Gloves', 'Other'];
const SHOES_SUBS = ['Golf Shoes', 'Other'];
const ACCESSORIES_SUBS = ['Bags', 'Headcovers', 'Tees', 'Rangefinders', 'Launch Monitors', 'GPS Devices', 'Towels', 'Golf Trolleys', 'Other'];
const BALLS_SUBS = ['New', 'Used/Lake', 'Other'];
const TRAINING_AIDS_SUBS = ['Swing Trainer', 'Putting Aid', 'Net', 'Mat', 'GPS Watch', 'Other'];
const SHAFTS_SUBS = ['Shafts', 'Grips', 'Heads', 'Other'];

// ─── Sizes ───────────────────────────────────────────────────
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13'];
const WAIST_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42'];
const GLOVE_SIZES = ['S', 'M', 'LM', 'L', 'XL', 'XXL'];
// FIX 4: Gender includes Junior
const GENDER = ['Male', 'Female', 'Junior'];

// ─── Brand lists per category (from mobile equipment DB) ─────
const CLUB_BRANDS = ['TaylorMade', 'Callaway', 'Titleist', 'Ping', 'Cobra', 'Mizuno', 'Srixon', 'Cleveland', 'Wilson', 'Wilson Staff', 'PXG', 'Honma', 'Tour Edge', 'Scotty Cameron', 'Odyssey', 'Bettinardi', 'LAB Golf', 'Evnroll', 'Adams', 'Ben Hogan', 'Bridgestone', 'MacGregor', 'Lynx', 'Top Flite', 'Yonex', 'Sub 70', 'Other'];
const CLOTHING_BRANDS = ['Nike', 'Adidas', 'Under Armour', 'Puma', 'FootJoy', 'Galvin Green', 'J.Lindeberg', 'TravisMathew', 'Peter Millar', 'Castore', 'G/FORE', 'Lyle & Scott', 'Glenmuir', 'Oscar Jacobson', 'Calvin Klein Golf', 'Hugo Boss', 'Lacoste', 'Ralph Lauren', 'Titleist Apparel', 'Callaway Apparel', 'Ping Apparel', 'Malbon Golf', 'Daily Sports', 'Other'];
const SHOES_BRANDS = ['FootJoy', 'Ecco', 'Nike', 'Adidas', 'Puma', 'Under Armour', 'New Balance', 'Skechers', 'G/FORE', 'Duca del Cosma', 'True Linkswear', 'Callaway', 'Cobra', 'Sqairz', 'Other'];
const BALLS_BRANDS = ['Titleist', 'TaylorMade', 'Callaway', 'Bridgestone', 'Srixon', 'Vice Golf', 'Snell Golf', 'OnCore', 'Cut Golf', 'Wilson', 'Volvik', 'Top Flite', 'Kirkland Signature', 'Mizuno', 'Honma', 'Other'];
const ACCESSORIES_BRANDS = ['Titleist', 'TaylorMade', 'Callaway', 'Ping', 'Cobra', 'Sun Mountain', 'Bushnell', 'Garmin', 'Motocaddy', 'PowaKaddy', 'Big Max', 'Clicgear', 'Vessel', 'Ogio', 'Jones Golf', 'Other'];
const TRAINING_AIDS_BRANDS = ['SuperSpeed Golf', 'Orange Whip', 'SKLZ', 'Tour Striker', 'PuttOUT', 'Perfect Practice', 'Eyeline Golf', 'Rukket Sports', 'Callaway', 'Arccos', 'Shot Scope', 'Other'];
const SHAFT_BRANDS = ['Fujikura', 'Mitsubishi Chemical', 'Project X', 'True Temper', 'KBS', 'Nippon', 'Graphite Design', 'Aldila', 'UST Mamiya', 'LA Golf', 'AutoFlex', 'Aerotech', 'Other'];
const GRIP_BRANDS = ['Golf Pride', 'SuperStroke', 'Lamkin', 'Winn', 'Iomic', 'Pure Grips', 'JumboMax', 'Karma', 'Other'];

// ─── Helpers ─────────────────────────────────────────────────

function getSubcategoriesForCategory(cat: string | undefined): string[] {
  if (!cat) return [];
  switch (cat) {
    case 'Clubs': return CLUB_SUBS;
    case 'Clothing': return CLOTHING_SUBS;
    case 'Shoes': return SHOES_SUBS;
    case 'Accessories': return ACCESSORIES_SUBS;
    case 'Balls': return BALLS_SUBS;
    case 'Training Aids': return TRAINING_AIDS_SUBS;
    case 'Shafts, Grips & Heads': return SHAFTS_SUBS;
    default: return [];
  }
}

function getBrandsForCategory(cat: string | undefined, sub?: string | undefined): string[] {
  if (!cat) return [];
  switch (cat) {
    case 'Clubs': return CLUB_BRANDS;
    case 'Clothing': return CLOTHING_BRANDS;
    case 'Shoes': return SHOES_BRANDS;
    case 'Balls': return BALLS_BRANDS;
    case 'Accessories': return ACCESSORIES_BRANDS;
    case 'Training Aids': return TRAINING_AIDS_BRANDS;
    case 'Shafts, Grips & Heads':
      if (sub === 'Shafts') return SHAFT_BRANDS;
      if (sub === 'Grips') return GRIP_BRANDS;
      return SHAFT_BRANDS; // default to shaft brands
    default: return [];
  }
}

// ─── Components ──────────────────────────────────────────────

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

function FilterDropdown({ label, value, options, onChange, placeholder }: { label: string; value: string | undefined; options: string[]; onChange: (v: string | undefined) => void; placeholder: string }) {
  const [showCustom, setShowCustom] = useState(value === 'Other');

  const handleSelect = (v: string) => {
    if (v === '') { onChange(undefined); setShowCustom(false); return; }
    if (v === 'Other') { setShowCustom(true); onChange(undefined); return; }
    setShowCustom(false);
    onChange(v);
  };

  return (
    <div>
      <label className="block mb-2" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>{label}</label>
      <select
        value={showCustom ? 'Other' : (value || '')}
        onChange={(e) => handleSelect(e.target.value)}
        className="w-full rounded-lg border text-sm"
        style={{ height: '40px', padding: '8px 12px', fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: '0.82rem', borderColor: '#E0E0D8', color: value ? '#0D0D0D' : '#ADADAD', backgroundColor: '#FFFFFF', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6B6B' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {showCustom && (
        <input
          type="text"
          placeholder={`Enter ${label.toLowerCase()}...`}
          value={value || ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="w-full mt-2 rounded-lg border px-3 text-sm"
          style={{ height: '36px', fontFamily: 'var(--font-sans)', borderColor: '#E0E0D8', color: '#0D0D0D' }}
        />
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <label className="block mb-2" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>{children}</label>;
}

// ─── Main Component ──────────────────────────────────────────

export function FilterSidebar({ params, onFilterChange, onClearAll, showCategoryFilter = true }: FilterSidebarProps) {
  const category = params.category;
  const subcategory = params.subcategory;
  const isClubs = category === 'Clubs';
  const isShafts = category === 'Shafts, Grips & Heads';
  const isClothing = category === 'Clothing';
  const isShoes = category === 'Shoes';
  const isBalls = category === 'Balls';
  const isAccessories = category === 'Accessories';
  const showClubFilters = isClubs || isShafts;
  const showSizeFilters = isClothing || isShoes;
  const showGender = isClubs || isClothing || isShoes;

  const subcategories = getSubcategoriesForCategory(category);
  const brands = getBrandsForCategory(category, subcategory);
  const hasAnyFilter = Object.entries(params).some(([k, v]) => v !== undefined && k !== 'category');

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
          <SectionLabel>Category</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_FILTERS.map((c) => (
              <Pill key={c.db} label={c.display} active={params.category === c.db} onClick={() => onFilterChange('category', params.category === c.db ? undefined : c.db)} />
            ))}
          </div>
        </div>
      )}

      {/* Subcategory */}
      {subcategories.length > 0 && (
        <div>
          <SectionLabel>Subcategory</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {subcategories.map((s) => <Pill key={s} label={s} active={params.subcategory === s} onClick={() => onFilterChange('subcategory', params.subcategory === s ? undefined : s)} />)}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <SectionLabel>Price Range</SectionLabel>
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
        <SectionLabel>Condition</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {CONDITION_OPTIONS.map((c) => (
            <button key={c.value} onClick={() => onFilterChange('condition', params.condition === String(c.value) ? undefined : String(c.value))} className="rounded-full px-3 py-1 text-xs font-semibold text-white transition-opacity" style={{ backgroundColor: c.bg, fontFamily: 'var(--font-sans)', fontWeight: 600, opacity: params.condition === String(c.value) ? 1 : 0.45 }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Brand dropdown (category-specific) */}
      {brands.length > 0 && (
        <FilterDropdown label="Brand" value={params.brand} options={brands} onChange={(v) => onFilterChange('brand', v)} placeholder="Select brand..." />
      )}

      {/* Gender (Clubs, Clothing, Shoes) */}
      {showGender && (
        <div>
          <SectionLabel>Gender</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {GENDER.map((g) => <Pill key={g} label={g} active={params.gender === g} onClick={() => onFilterChange('gender', params.gender === g ? undefined : g)} />)}
          </div>
        </div>
      )}

      {/* Club-specific filters */}
      {showClubFilters && (
        <>
          <div>
            <SectionLabel>Shaft Flex</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {SHAFT_FLEX.map((f) => <Pill key={f} label={f} active={params.shaftFlex === f} onClick={() => onFilterChange('shaftFlex', params.shaftFlex === f ? undefined : f)} />)}
            </div>
          </div>

          <div>
            <SectionLabel>Shaft Material</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {SHAFT_MATERIAL.map((m) => <Pill key={m} label={m} active={params.shaftMaterial === m} onClick={() => onFilterChange('shaftMaterial', params.shaftMaterial === m ? undefined : m)} />)}
            </div>
          </div>

          <div>
            <SectionLabel>Dexterity</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {DEXTERITY.map((d) => <Pill key={d} label={d} active={params.dexterity === d} onClick={() => onFilterChange('dexterity', params.dexterity === d ? undefined : d)} />)}
            </div>
          </div>

          {/* Grip Size (Clubs only) */}
          {isClubs && (
            <div>
              <SectionLabel>Grip Size</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {GRIP_SIZE.map((g) => <Pill key={g} label={g} active={params.gripSize === g} onClick={() => onFilterChange('gripSize', params.gripSize === g ? undefined : g)} />)}
              </div>
            </div>
          )}

          {/* Putter head type */}
          {isClubs && subcategory === 'Putters' && (
            <div>
              <SectionLabel>Head Type</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {PUTTER_HEAD_TYPE.map((h) => <Pill key={h} label={h} active={params.headType === h} onClick={() => onFilterChange('headType', params.headType === h ? undefined : h)} />)}
              </div>
            </div>
          )}

          {/* Iron set makeup (multi-select) */}
          {isClubs && subcategory === 'Irons' && (
            <div>
              <SectionLabel>Iron Numbers</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {IRON_NUMBERS.map((n) => {
                  const current = (params.setMakeup || '').split(',').filter(Boolean);
                  const isActive = current.includes(n);
                  return (
                    <Pill key={n} label={n} active={isActive} onClick={() => {
                      const updated = isActive ? current.filter((c) => c !== n) : [...current, n];
                      onFilterChange('setMakeup', updated.length > 0 ? updated.join(',') : undefined);
                    }} />
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Size filters (Clothing / Shoes) */}
      {showSizeFilters && (
        <>
          <div>
            <SectionLabel>Size</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {(isShoes ? SHOE_SIZES : CLOTHING_SIZES).map((s) => <Pill key={s} label={s} active={params.size === s} onClick={() => onFilterChange('size', params.size === s ? undefined : s)} />)}
            </div>
          </div>

          {/* Waist size (clothing trousers/shorts) */}
          {isClothing && (subcategory === 'Trousers' || subcategory === 'Shorts') && (
            <div>
              <SectionLabel>Waist</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {WAIST_SIZES.map((w) => <Pill key={w} label={w} active={params.waist === w} onClick={() => onFilterChange('waist', params.waist === w ? undefined : w)} />)}
              </div>
            </div>
          )}

          {/* Glove size (clothing gloves subcategory) */}
          {isClothing && subcategory === 'Gloves' && (
            <div>
              <SectionLabel>Glove Size</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {GLOVE_SIZES.map((g) => <Pill key={g} label={g} active={params.gloveSize === g} onClick={() => onFilterChange('gloveSize', params.gloveSize === g ? undefined : g)} />)}
              </div>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
