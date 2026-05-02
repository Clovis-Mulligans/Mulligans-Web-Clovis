'use client';

import React, { useState, useMemo } from 'react';

// ─── Constants (preserved from original) ─────────────────────

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

const CONDITION_OPTIONS = [
  { value: 1, label: 'Poor', bg: '#EF4444' },
  { value: 2, label: 'Good', bg: '#F59E0B' },
  { value: 3, label: 'Very Good', bg: '#3B82F6' },
  { value: 4, label: 'Excellent', bg: '#7C5CBF' },
  { value: 5, label: 'New', bg: '#1DC690' },
];

const DEXTERITY = ['Right Handed', 'Left Handed'];

const SHAFT_FLEX = ['Extra Stiff', 'Stiff', 'Regular', 'Senior', 'Ladies', 'Junior'];
const SHAFT_MATERIAL = ['Steel', 'Graphite'];
const GRIP_SIZE = ['Junior', 'Undersize', 'Standard', 'Midsize', 'Jumbo', 'Plus 4'];
const IRON_NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'PW', 'AW', 'GW'];
const PUTTER_HEAD_TYPE = ['Blade', 'Mid-Mallet', 'Mallet'];

// Subcategories per top-level category
const CLUB_SUBS = ['Drivers', 'Fairway Woods', 'Hybrids', 'Irons', 'Wedges', 'Putters', 'Chippers', 'Complete Sets', 'Other'];
const CLOTHING_SUBS = ['Jackets', 'Polo Shirts', 'Trousers', 'Shorts', 'Hoodies', 'Knitwear', 'Gilets', 'Mid-Layers', 'Waterproofs', 'Hats & Caps', 'Sunglasses', 'Gloves', 'Other'];
const SHOES_SUBS = ['Golf Shoes', 'Other'];
const ACCESSORIES_SUBS = ['Bags', 'Headcovers', 'Tees', 'Rangefinders', 'Launch Monitors', 'GPS Devices', 'Towels', 'Golf Trolleys', 'Other'];
const BALLS_SUBS = ['New', 'Used/Lake', 'Other'];
const TRAINING_AIDS_SUBS = ['Swing Trainer', 'Putting Aid', 'Net', 'Mat', 'GPS Watch', 'Other'];
const SHAFTS_SUBS = ['Shafts', 'Grips', 'Heads', 'Other'];

// Sizes
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13'];
const WAIST_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42'];
const GLOVE_SIZES = ['S', 'M', 'LM', 'L', 'XL', 'XXL'];

const GENDER = ['Male', 'Female', 'Junior'];

// Brands per category (preserved from original)
const CLUB_BRANDS = ['TaylorMade', 'Callaway', 'Titleist', 'Ping', 'Cobra', 'Mizuno', 'Srixon', 'Cleveland', 'Wilson', 'Wilson Staff', 'PXG', 'Honma', 'Tour Edge', 'Scotty Cameron', 'Odyssey', 'Bettinardi', 'LAB Golf', 'Evnroll', 'Adams', 'Ben Hogan', 'Bridgestone', 'MacGregor', 'Lynx', 'Top Flite', 'Yonex', 'Sub 70', 'Other'];
const CLOTHING_BRANDS = ['Nike', 'Adidas', 'Under Armour', 'Puma', 'FootJoy', 'Galvin Green', 'J.Lindeberg', 'TravisMathew', 'Peter Millar', 'Castore', 'G/FORE', 'Lyle & Scott', 'Glenmuir', 'Oscar Jacobson', 'Calvin Klein Golf', 'Hugo Boss', 'Lacoste', 'Ralph Lauren', 'Titleist Apparel', 'Callaway Apparel', 'Ping Apparel', 'Malbon Golf', 'Daily Sports', 'Other'];
const SHOES_BRANDS = ['FootJoy', 'Ecco', 'Nike', 'Adidas', 'Puma', 'Under Armour', 'New Balance', 'Skechers', 'G/FORE', 'Duca del Cosma', 'True Linkswear', 'Callaway', 'Cobra', 'Sqairz', 'Other'];
const BALLS_BRANDS = ['Titleist', 'TaylorMade', 'Callaway', 'Bridgestone', 'Srixon', 'Vice Golf', 'Snell Golf', 'OnCore', 'Cut Golf', 'Wilson', 'Volvik', 'Top Flite', 'Kirkland Signature', 'Mizuno', 'Honma', 'Other'];
const ACCESSORIES_BRANDS = ['Titleist', 'TaylorMade', 'Callaway', 'Ping', 'Cobra', 'Sun Mountain', 'Bushnell', 'Garmin', 'Motocaddy', 'PowaKaddy', 'Big Max', 'Clicgear', 'Vessel', 'Ogio', 'Jones Golf', 'Other'];
const TRAINING_AIDS_BRANDS = ['SuperSpeed Golf', 'Orange Whip', 'SKLZ', 'Tour Striker', 'PuttOUT', 'Perfect Practice', 'Eyeline Golf', 'Rukket Sports', 'Callaway', 'Arccos', 'Shot Scope', 'Other'];
const SHAFT_BRANDS = ['Fujikura', 'Mitsubishi Chemical', 'Project X', 'True Temper', 'KBS', 'Nippon', 'Graphite Design', 'Aldila', 'UST Mamiya', 'LA Golf', 'AutoFlex', 'Aerotech', 'Other'];
const GRIP_BRANDS = ['Golf Pride', 'SuperStroke', 'Lamkin', 'Winn', 'Iomic', 'Pure Grips', 'JumboMax', 'Karma', 'Other'];

// ─── v2.0 Design Tokens ──────────────────────────────────────

const TEXT_PRIMARY = '#06070A';
const TEXT_BODY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';
const BORDER = '#E5E7EB';
const BORDER_HOVER = '#D1D5DB';
const BRAND_GREEN = '#1DC690';
const SURFACE_HOVER = '#FAFAF8';

// ─── Helpers (preserved) ─────────────────────────────────────

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
      return SHAFT_BRANDS;
    default: return [];
  }
}

// ─── Sub-components ──────────────────────────────────────────

interface FilterGroupProps {
  title: string;
  defaultOpen?: boolean;
  summary?: string;
  children: React.ReactNode;
}

/**
 * Collapsible filter group — Golf Clubs 4 Cash style.
 * Click the header to expand/collapse.
 */
function FilterGroup({ title, defaultOpen = false, summary, children }: FilterGroupProps) {
  // Auto-open if there's an active summary (active filter)
  const [open, setOpen] = useState(defaultOpen || !!summary);

  return (
    <div style={{ borderBottom: `1px solid ${BORDER}` }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3 transition-colors"
        style={{
          fontFamily: 'var(--font-sans)',
          color: TEXT_PRIMARY,
          fontWeight: 700,
          fontSize: '0.9rem',
          letterSpacing: '-0.005em',
        }}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {title}
          {!open && summary && (
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                fontSize: '0.75rem',
                color: BRAND_GREEN,
              }}
            >
              · {summary}
            </span>
          )}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: 'transform 150ms',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            color: TEXT_MUTED,
          }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full transition-colors"
      style={{
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        fontSize: '0.78rem',
        padding: '5px 11px',
        backgroundColor: active ? BRAND_GREEN : '#FFFFFF',
        color: active ? '#FFFFFF' : TEXT_PRIMARY,
        border: active ? `1px solid ${BRAND_GREEN}` : `1px solid ${BORDER}`,
        letterSpacing: '-0.005em',
      }}
    >
      {label}
    </button>
  );
}

interface CheckboxListProps {
  options: string[];
  selected: string | undefined;
  onChange: (v: string | undefined) => void;
  searchable?: boolean;
}

/**
 * Checkbox list with optional search — for long brand lists.
 * Single-select for now (matches the existing single-brand filter on backend).
 */
function CheckboxList({ options, selected, onChange, searchable = false }: CheckboxListProps) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, search]);

  return (
    <div>
      {searchable && options.length > 8 && (
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-2 rounded-lg text-sm"
          style={{
            fontFamily: 'var(--font-sans)',
            border: `1px solid ${BORDER}`,
            padding: '8px 12px',
            color: TEXT_PRIMARY,
            backgroundColor: '#FFFFFF',
          }}
        />
      )}
      <div
        className="space-y-1 max-h-[260px] overflow-y-auto pr-1"
        style={{ scrollbarWidth: 'thin' }}
      >
        {filtered.length === 0 && (
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.78rem',
              color: TEXT_MUTED,
              padding: '8px 0',
            }}
          >
            No matches
          </p>
        )}
        {filtered.map((opt) => {
          const isSelected = selected === opt;
          return (
            <label
              key={opt}
              className="flex items-center gap-2 cursor-pointer rounded px-1 py-1 transition-colors"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                color: TEXT_PRIMARY,
                fontWeight: isSelected ? 700 : 500,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLLabelElement).style.backgroundColor = SURFACE_HOVER;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLLabelElement).style.backgroundColor = 'transparent';
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onChange(isSelected ? undefined : opt)}
                style={{
                  accentColor: BRAND_GREEN,
                  width: 16,
                  height: 16,
                  cursor: 'pointer',
                }}
              />
              <span className="flex-1">{opt}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────

interface FilterSidebarProps {
  params: Record<string, string | undefined>;
  onFilterChange: (key: string, value: string | undefined) => void;
  onClearAll: () => void;
  showCategoryFilter?: boolean;
}

export function FilterSidebar({
  params,
  onFilterChange,
  onClearAll,
  showCategoryFilter = false,
}: FilterSidebarProps) {
  const category = params.category;
  const subcategory = params.subcategory;

  const subcategories = getSubcategoriesForCategory(category);
  const brands = getBrandsForCategory(category, subcategory);

  const isClubs = category === 'Clubs';
  const isClothing = category === 'Clothing';
  const isShoes = category === 'Shoes';

  const showGender = isClubs || isClothing || isShoes;
  const showClubFilters = isClubs;
  const showSizeFilters = isClothing || isShoes;

  // Count active filters for header
  const activeCount = Object.entries(params).filter(([k, v]) => k !== 'category' && v).length;

  // Friendly summary for collapsed groups
  const priceSummary = (() => {
    if (params.minPrice && params.maxPrice) return `£${params.minPrice}–£${params.maxPrice}`;
    if (params.minPrice) return `£${params.minPrice}+`;
    if (params.maxPrice) return `Up to £${params.maxPrice}`;
    return undefined;
  })();
  const conditionSummary = params.condition
    ? `${CONDITION_OPTIONS.find((c) => String(c.value) === params.condition)?.label}+`
    : undefined;

  return (
    <aside className="w-full">
      {/* Header */}
      <div
        className="flex items-center justify-between py-3"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: '1rem',
            color: TEXT_PRIMARY,
            letterSpacing: '-0.01em',
          }}
        >
          Filters
        </h3>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '0.78rem',
              color: BRAND_GREEN,
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category */}
      {showCategoryFilter && (
        <FilterGroup
          title="Category"
          summary={category ? CATEGORY_FILTERS.find((c) => c.db === category)?.display : undefined}
        >
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_FILTERS.map((c) => (
              <Pill
                key={c.db}
                label={c.display}
                active={params.category === c.db}
                onClick={() => onFilterChange('category', params.category === c.db ? undefined : c.db)}
              />
            ))}
          </div>
        </FilterGroup>
      )}

      {/* Subcategory */}
      {subcategories.length > 0 && (
        <FilterGroup title="Subcategory" summary={subcategory}>
          <div className="flex flex-wrap gap-1.5">
            {subcategories.map((s) => (
              <Pill
                key={s}
                label={s}
                active={params.subcategory === s}
                onClick={() => onFilterChange('subcategory', params.subcategory === s ? undefined : s)}
              />
            ))}
          </div>
        </FilterGroup>
      )}

      {/* Price Range */}
      <FilterGroup title="Price" summary={priceSummary}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span
              className="absolute left-2.5 top-1/2 -translate-y-1/2"
              style={{ fontSize: '0.75rem', color: TEXT_MUTED }}
            >
              £
            </span>
            <input
              type="number"
              placeholder="Min"
              value={params.minPrice || ''}
              onChange={(e) => onFilterChange('minPrice', e.target.value || undefined)}
              className="w-full rounded-lg text-sm"
              style={{
                height: '36px',
                fontFamily: 'var(--font-sans)',
                border: `1px solid ${BORDER}`,
                paddingLeft: 22,
                paddingRight: 8,
                color: TEXT_PRIMARY,
              }}
            />
          </div>
          <span className="self-center" style={{ color: TEXT_MUTED }}>–</span>
          <div className="relative flex-1">
            <span
              className="absolute left-2.5 top-1/2 -translate-y-1/2"
              style={{ fontSize: '0.75rem', color: TEXT_MUTED }}
            >
              £
            </span>
            <input
              type="number"
              placeholder="Max"
              value={params.maxPrice || ''}
              onChange={(e) => onFilterChange('maxPrice', e.target.value || undefined)}
              className="w-full rounded-lg text-sm"
              style={{
                height: '36px',
                fontFamily: 'var(--font-sans)',
                border: `1px solid ${BORDER}`,
                paddingLeft: 22,
                paddingRight: 8,
                color: TEXT_PRIMARY,
              }}
            />
          </div>
        </div>
      </FilterGroup>

      {/* Condition */}
      <FilterGroup title="Condition" summary={conditionSummary}>
        <div className="flex flex-wrap gap-1.5">
          {CONDITION_OPTIONS.map((c) => {
            const isActive = params.condition === String(c.value);
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => onFilterChange('condition', isActive ? undefined : String(c.value))}
                className="rounded-full transition-opacity"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  padding: '5px 11px',
                  backgroundColor: c.bg,
                  color: '#FFFFFF',
                  opacity: isActive ? 1 : 0.4,
                  border: 'none',
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      {/* Brand */}
      {brands.length > 0 && (
        <FilterGroup title="Brand" summary={params.brand}>
          <CheckboxList
            options={brands}
            selected={params.brand}
            onChange={(v) => onFilterChange('brand', v)}
            searchable
          />
        </FilterGroup>
      )}

      {/* Gender */}
      {showGender && (
        <FilterGroup title="Gender" summary={params.gender}>
          <div className="flex flex-wrap gap-1.5">
            {GENDER.map((g) => (
              <Pill
                key={g}
                label={g}
                active={params.gender === g}
                onClick={() => onFilterChange('gender', params.gender === g ? undefined : g)}
              />
            ))}
          </div>
        </FilterGroup>
      )}

      {/* Club-specific filters */}
      {showClubFilters && (
        <>
          <FilterGroup title="Shaft Flex" summary={params.shaftFlex}>
            <div className="flex flex-wrap gap-1.5">
              {SHAFT_FLEX.map((f) => (
                <Pill
                  key={f}
                  label={f}
                  active={params.shaftFlex === f}
                  onClick={() => onFilterChange('shaftFlex', params.shaftFlex === f ? undefined : f)}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Shaft Material" summary={params.shaftMaterial}>
            <div className="flex flex-wrap gap-1.5">
              {SHAFT_MATERIAL.map((m) => (
                <Pill
                  key={m}
                  label={m}
                  active={params.shaftMaterial === m}
                  onClick={() => onFilterChange('shaftMaterial', params.shaftMaterial === m ? undefined : m)}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Dexterity" summary={params.dexterity}>
            <div className="flex flex-wrap gap-1.5">
              {DEXTERITY.map((d) => (
                <Pill
                  key={d}
                  label={d}
                  active={params.dexterity === d}
                  onClick={() => onFilterChange('dexterity', params.dexterity === d ? undefined : d)}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Grip Size" summary={params.gripSize} defaultOpen={false}>
            <div className="flex flex-wrap gap-1.5">
              {GRIP_SIZE.map((g) => (
                <Pill
                  key={g}
                  label={g}
                  active={params.gripSize === g}
                  onClick={() => onFilterChange('gripSize', params.gripSize === g ? undefined : g)}
                />
              ))}
            </div>
          </FilterGroup>

          {subcategory === 'Putters' && (
            <FilterGroup title="Head Type" summary={params.headType}>
              <div className="flex flex-wrap gap-1.5">
                {PUTTER_HEAD_TYPE.map((h) => (
                  <Pill
                    key={h}
                    label={h}
                    active={params.headType === h}
                    onClick={() => onFilterChange('headType', params.headType === h ? undefined : h)}
                  />
                ))}
              </div>
            </FilterGroup>
          )}

          {subcategory === 'Irons' && (
            <FilterGroup
              title="Iron Numbers"
              summary={params.setMakeup ? `${params.setMakeup.split(',').filter(Boolean).length} selected` : undefined}
            >
              <div className="flex flex-wrap gap-1.5">
                {IRON_NUMBERS.map((n) => {
                  const current = (params.setMakeup || '').split(',').filter(Boolean);
                  const isActive = current.includes(n);
                  return (
                    <Pill
                      key={n}
                      label={n}
                      active={isActive}
                      onClick={() => {
                        const updated = isActive ? current.filter((c) => c !== n) : [...current, n];
                        onFilterChange('setMakeup', updated.length > 0 ? updated.join(',') : undefined);
                      }}
                    />
                  );
                })}
              </div>
            </FilterGroup>
          )}
        </>
      )}

      {/* Size filters (Clothing / Shoes) */}
      {showSizeFilters && (
        <>
          <FilterGroup title="Size" summary={params.size}>
            <div className="flex flex-wrap gap-1.5">
              {(isShoes ? SHOE_SIZES : CLOTHING_SIZES).map((s) => (
                <Pill
                  key={s}
                  label={s}
                  active={params.size === s}
                  onClick={() => onFilterChange('size', params.size === s ? undefined : s)}
                />
              ))}
            </div>
          </FilterGroup>

          {isClothing && (subcategory === 'Trousers' || subcategory === 'Shorts') && (
            <FilterGroup title="Waist" summary={params.waist} defaultOpen={false}>
              <div className="flex flex-wrap gap-1.5">
                {WAIST_SIZES.map((w) => (
                  <Pill
                    key={w}
                    label={w}
                    active={params.waist === w}
                    onClick={() => onFilterChange('waist', params.waist === w ? undefined : w)}
                  />
                ))}
              </div>
            </FilterGroup>
          )}

          {isClothing && subcategory === 'Gloves' && (
            <FilterGroup title="Glove Size" summary={params.gloveSize} defaultOpen={false}>
              <div className="flex flex-wrap gap-1.5">
                {GLOVE_SIZES.map((g) => (
                  <Pill
                    key={g}
                    label={g}
                    active={params.gloveSize === g}
                    onClick={() => onFilterChange('gloveSize', params.gloveSize === g ? undefined : g)}
                  />
                ))}
              </div>
            </FilterGroup>
          )}
        </>
      )}
    </aside>
  );
}
