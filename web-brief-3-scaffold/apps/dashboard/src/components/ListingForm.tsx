'use client';

import React, { useState, useEffect, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createListing,
  updateListing,
  uploadListingImage,
  deleteListingImage,
} from '@mulligans/api-client';
import type { ListingWithImages } from '@mulligans/api-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListingFormProps {
  initialData?: ListingWithImages | null;
  isEditing?: boolean;
}

interface ImageSlot {
  /** Stable key for React list rendering */
  key: string;
  /** Existing image id (already uploaded) */
  id?: string;
  /** Remote URL for existing images */
  url?: string;
  /** Local blob URL for previewing new uploads */
  preview?: string;
  /** File object waiting to be uploaded after listing is created/saved */
  file?: File;
  /** s3_key for existing images (needed for deletes) */
  s3_key?: string;
}

interface FormErrors {
  [key: string]: string;
}

type ParcelSizeKey = 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL' | 'OVERSIZED' | 'OWN';

interface ParcelSizeOption {
  key: ParcelSizeKey;
  name: string;
  weight: string;
  price: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PARCEL_SIZES: ParcelSizeOption[] = [
  { key: 'SMALL', name: 'Small', weight: 'up to 2kg', price: '£3.49' },
  { key: 'MEDIUM', name: 'Medium', weight: 'up to 5kg', price: '£5.99' },
  { key: 'LARGE', name: 'Large', weight: 'up to 10kg', price: '£9.99' },
  { key: 'XL', name: 'Extra Large', weight: 'up to 15kg', price: '£14.99' },
  { key: 'OVERSIZED', name: 'Oversized', weight: 'any size', price: '£19.99' },
  { key: 'OWN', name: 'Own Carrier', weight: '', price: '' },
];

const CATEGORIES = [
  'Clubs',
  'Shafts, Grips & Heads',
  'Clothing',
  'Shoes',
  'Accessories',
  'Balls',
  'Training Aids',
  'Everything Else',
];

const CONDITIONS = [
  { value: 'New', label: 'New', desc: 'Unused, in original packaging' },
  { value: 'Like New', label: 'Like New', desc: 'Used once or twice, no visible wear' },
  { value: 'Very Good', label: 'Very Good', desc: 'Light use, minor cosmetic marks only' },
  { value: 'Good', label: 'Good', desc: 'Normal use, some visible wear but fully functional' },
  { value: 'Fair', label: 'Fair', desc: 'Heavy use, cosmetic wear, fully functional' },
];

const SHAFT_FLEX_OPTIONS = ['Extra Stiff', 'Stiff', 'Regular', 'Senior', 'Ladies'];
const SHAFT_MATERIAL_OPTIONS = ['Steel', 'Graphite'];
const DEXTERITY_OPTIONS = ['Right-Handed', 'Left-Handed'];
const GENDER_OPTIONS = ["Men's", "Women's", 'Unisex', 'Junior'];

// ---------------------------------------------------------------------------
// Shared input style helpers
// ---------------------------------------------------------------------------

const inputClass =
  'w-full rounded-[8px] border border-[#E0E0D8] bg-white px-[14px] py-3 text-[0.9rem] text-[#0D0D0D] placeholder-[#ADADAD] outline-none transition-all focus:border-[#1DC690] focus:shadow-[0_0_0_3px_rgba(29,198,144,0.12)]';

const selectClass =
  'w-full rounded-[8px] border border-[#E0E0D8] bg-white px-[14px] py-3 text-[0.9rem] text-[#0D0D0D] outline-none appearance-none transition-all focus:border-[#1DC690] focus:shadow-[0_0_0_3px_rgba(29,198,144,0.12)]';

const labelClass = 'block text-[0.85rem] font-semibold text-[#0D0D0D] mb-1';

const helperClass = 'mt-1 text-[0.78rem] text-[#6B6B6B]';

const errorClass = 'mt-1 text-[0.78rem] text-[#E53E3E]';

const cardClass =
  'bg-white rounded-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-5 mb-4';

// ---------------------------------------------------------------------------
// Small reusable sub-components
// ---------------------------------------------------------------------------

function RequiredAsterisk() {
  return <span className="text-[#E53E3E] ml-0.5">*</span>;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className={errorClass}>{msg}</p>;
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      {/* Custom caret */}
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]">
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
          <path d="M1 1l5 5 5-5" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// Condition tooltip component
function ConditionTooltip({ desc }: { desc: string }) {
  return (
    <div className="absolute left-0 bottom-full mb-1 z-10 w-56 rounded-[8px] bg-[#1C4670] px-3 py-2 text-[0.75rem] text-white shadow-lg pointer-events-none">
      {desc}
      <div className="absolute left-3 top-full border-4 border-transparent border-t-[#1C4670]" />
    </div>
  );
}

// iOS-style toggle
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1DC690] focus:ring-offset-2"
      style={{ backgroundColor: checked ? '#1DC690' : '#D1D5DB' }}
    >
      <span
        className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  );
}

// Status pill toggle: Draft | Active
function StatusToggle({
  value,
  onChange,
}: {
  value: 'draft' | 'active';
  onChange: (v: 'draft' | 'active') => void;
}) {
  return (
    <div className="flex rounded-[8px] border border-[#E0E0D8] overflow-hidden text-[0.82rem] font-semibold w-full">
      {(['draft', 'active'] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="flex-1 py-2 transition-colors capitalize"
          style={{
            backgroundColor: value === s ? (s === 'active' ? '#1DC690' : '#9CA3AF') : 'transparent',
            color: value === s ? '#fff' : '#6B6B6B',
          }}
        >
          {s === 'draft' ? 'Draft' : 'Active'}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category-specific field sections
// ---------------------------------------------------------------------------

type Specs = Record<string, string | number | boolean | undefined>;

function ClubFields({
  specs,
  onSpecChange,
  errors,
}: {
  specs: Specs;
  onSpecChange: (key: string, value: string | number) => void;
  errors: FormErrors;
}) {
  const clubType = specs.club_type as string | undefined;
  const showLoft = ['Driver', 'Fairway Wood', 'Hybrid', 'Wedge', 'Putter'].includes(clubType ?? '');
  const showLieAngle = ['Iron Set', 'Single Iron', 'Wedge', 'Putter'].includes(clubType ?? '');

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-[#F0F0EA]">
      {/* Club Type */}
      <div>
        <label className={labelClass}>Club Type <RequiredAsterisk /></label>
        <SelectWrapper>
          <select
            className={selectClass}
            value={(specs.club_type as string) ?? ''}
            onChange={(e) => onSpecChange('club_type', e.target.value)}
          >
            <option value="">Select club type</option>
            {['Driver', 'Fairway Wood', 'Hybrid', 'Iron Set', 'Single Iron', 'Wedge', 'Putter', 'Chipper'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </SelectWrapper>
        <FieldError msg={errors['specs.club_type']} />
      </div>

      {/* Brand + Model */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Brand <RequiredAsterisk /></label>
          <input className={inputClass} placeholder="e.g. Titleist" value={(specs.brand as string) ?? ''} onChange={(e) => onSpecChange('brand', e.target.value)} />
          <FieldError msg={errors['specs.brand']} />
        </div>
        <div>
          <label className={labelClass}>Model <RequiredAsterisk /></label>
          <input className={inputClass} placeholder="e.g. TSR2" value={(specs.model as string) ?? ''} onChange={(e) => onSpecChange('model', e.target.value)} />
          <FieldError msg={errors['specs.model']} />
        </div>
      </div>

      {/* Dexterity */}
      <div>
        <label className={labelClass}>Dexterity <RequiredAsterisk /></label>
        <SelectWrapper>
          <select className={selectClass} value={(specs.dexterity as string) ?? ''} onChange={(e) => onSpecChange('dexterity', e.target.value)}>
            <option value="">Select dexterity</option>
            {DEXTERITY_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </SelectWrapper>
        <FieldError msg={errors['specs.dexterity']} />
      </div>

      {/* Loft */}
      {showLoft && (
        <div>
          <label className={labelClass}>Loft (°)</label>
          <input className={inputClass} type="number" min="0" max="90" step="0.5" placeholder="e.g. 10.5" value={(specs.loft as string) ?? ''} onChange={(e) => onSpecChange('loft', e.target.value)} />
        </div>
      )}

      {/* Lie Angle */}
      {showLieAngle && (
        <div>
          <label className={labelClass}>Lie Angle (°)</label>
          <input className={inputClass} type="number" min="0" max="90" step="0.5" placeholder="e.g. 62" value={(specs.lie_angle as string) ?? ''} onChange={(e) => onSpecChange('lie_angle', e.target.value)} />
        </div>
      )}

      {/* Shaft Flex + Material */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Shaft Flex <RequiredAsterisk /></label>
          <SelectWrapper>
            <select className={selectClass} value={(specs.shaft_flex as string) ?? ''} onChange={(e) => onSpecChange('shaft_flex', e.target.value)}>
              <option value="">Select flex</option>
              {SHAFT_FLEX_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </SelectWrapper>
          <FieldError msg={errors['specs.shaft_flex']} />
        </div>
        <div>
          <label className={labelClass}>Shaft Material <RequiredAsterisk /></label>
          <SelectWrapper>
            <select className={selectClass} value={(specs.shaft_material as string) ?? ''} onChange={(e) => onSpecChange('shaft_material', e.target.value)}>
              <option value="">Select material</option>
              {SHAFT_MATERIAL_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </SelectWrapper>
          <FieldError msg={errors['specs.shaft_material']} />
        </div>
      </div>

      {/* Optional: Length, Grip, Year */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Shaft Length (in)</label>
          <input className={inputClass} type="number" step="0.5" placeholder="e.g. 45" value={(specs.shaft_length as string) ?? ''} onChange={(e) => onSpecChange('shaft_length', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Grip</label>
          <input className={inputClass} placeholder="e.g. Golf Pride" value={(specs.grip as string) ?? ''} onChange={(e) => onSpecChange('grip', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Year</label>
          <input className={inputClass} type="number" min="1980" max={new Date().getFullYear() + 1} placeholder="e.g. 2023" value={(specs.year as string) ?? ''} onChange={(e) => onSpecChange('year', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function ShaftGripHeadFields({
  specs,
  onSpecChange,
  errors,
}: {
  specs: Specs;
  onSpecChange: (key: string, value: string | number) => void;
  errors: FormErrors;
}) {
  const sub = specs.subcategory as string | undefined;

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-[#F0F0EA]">
      <div>
        <label className={labelClass}>Sub-category <RequiredAsterisk /></label>
        <SelectWrapper>
          <select className={selectClass} value={sub ?? ''} onChange={(e) => onSpecChange('subcategory', e.target.value)}>
            <option value="">Select sub-category</option>
            {['Shaft', 'Grip', 'Club Head'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </SelectWrapper>
        <FieldError msg={errors['specs.subcategory']} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Brand <RequiredAsterisk /></label>
          <input className={inputClass} placeholder="e.g. KBS" value={(specs.brand as string) ?? ''} onChange={(e) => onSpecChange('brand', e.target.value)} />
          <FieldError msg={errors['specs.brand']} />
        </div>
        <div>
          <label className={labelClass}>Model <RequiredAsterisk /></label>
          <input className={inputClass} placeholder="e.g. Tour 90" value={(specs.model as string) ?? ''} onChange={(e) => onSpecChange('model', e.target.value)} />
          <FieldError msg={errors['specs.model']} />
        </div>
      </div>

      {sub === 'Shaft' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Flex <RequiredAsterisk /></label>
              <SelectWrapper>
                <select className={selectClass} value={(specs.shaft_flex as string) ?? ''} onChange={(e) => onSpecChange('shaft_flex', e.target.value)}>
                  <option value="">Select flex</option>
                  {SHAFT_FLEX_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </SelectWrapper>
            </div>
            <div>
              <label className={labelClass}>Material <RequiredAsterisk /></label>
              <SelectWrapper>
                <select className={selectClass} value={(specs.shaft_material as string) ?? ''} onChange={(e) => onSpecChange('shaft_material', e.target.value)}>
                  <option value="">Select material</option>
                  {SHAFT_MATERIAL_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </SelectWrapper>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Length (in)</label>
              <input className={inputClass} type="number" step="0.5" placeholder="e.g. 45" value={(specs.shaft_length as string) ?? ''} onChange={(e) => onSpecChange('shaft_length', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Weight (g)</label>
              <input className={inputClass} type="number" placeholder="e.g. 95" value={(specs.shaft_weight as string) ?? ''} onChange={(e) => onSpecChange('shaft_weight', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {sub === 'Grip' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Size</label>
            <SelectWrapper>
              <select className={selectClass} value={(specs.grip_size as string) ?? ''} onChange={(e) => onSpecChange('grip_size', e.target.value)}>
                <option value="">Select size</option>
                {['Undersize', 'Standard', 'Midsize', 'Oversize'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </SelectWrapper>
          </div>
          <div>
            <label className={labelClass}>Material</label>
            <input className={inputClass} placeholder="e.g. Rubber" value={(specs.grip_material as string) ?? ''} onChange={(e) => onSpecChange('grip_material', e.target.value)} />
          </div>
        </div>
      )}

      {sub === 'Club Head' && (
        <div>
          <label className={labelClass}>Club Type</label>
          <SelectWrapper>
            <select className={selectClass} value={(specs.club_type as string) ?? ''} onChange={(e) => onSpecChange('club_type', e.target.value)}>
              <option value="">Select club type</option>
              {['Driver', 'Fairway Wood', 'Hybrid', 'Iron', 'Wedge', 'Putter'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </SelectWrapper>
        </div>
      )}
    </div>
  );
}

function ClothingFields({ specs, onSpecChange, errors }: { specs: Specs; onSpecChange: (k: string, v: string) => void; errors: FormErrors }) {
  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-[#F0F0EA]">
      <div>
        <label className={labelClass}>Sub-category <RequiredAsterisk /></label>
        <SelectWrapper>
          <select className={selectClass} value={(specs.subcategory as string) ?? ''} onChange={(e) => onSpecChange('subcategory', e.target.value)}>
            <option value="">Select sub-category</option>
            {['Top', 'Bottom', 'Outerwear', 'Base Layer', 'Headwear', 'Glove'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </SelectWrapper>
        <FieldError msg={errors['specs.subcategory']} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Brand <RequiredAsterisk /></label>
          <input className={inputClass} placeholder="e.g. FootJoy" value={(specs.brand as string) ?? ''} onChange={(e) => onSpecChange('brand', e.target.value)} />
          <FieldError msg={errors['specs.brand']} />
        </div>
        <div>
          <label className={labelClass}>Size <RequiredAsterisk /></label>
          <input className={inputClass} placeholder="e.g. M, L, XL" value={(specs.size as string) ?? ''} onChange={(e) => onSpecChange('size', e.target.value)} />
          <FieldError msg={errors['specs.size']} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Gender <RequiredAsterisk /></label>
          <SelectWrapper>
            <select className={selectClass} value={(specs.gender as string) ?? ''} onChange={(e) => onSpecChange('gender', e.target.value)}>
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </SelectWrapper>
          <FieldError msg={errors['specs.gender']} />
        </div>
        <div>
          <label className={labelClass}>Colour</label>
          <input className={inputClass} placeholder="e.g. Navy Blue" value={(specs.colour as string) ?? ''} onChange={(e) => onSpecChange('colour', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function ShoesFields({ specs, onSpecChange, errors }: { specs: Specs; onSpecChange: (k: string, v: string) => void; errors: FormErrors }) {
  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-[#F0F0EA]">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Brand <RequiredAsterisk /></label>
          <input className={inputClass} placeholder="e.g. FootJoy" value={(specs.brand as string) ?? ''} onChange={(e) => onSpecChange('brand', e.target.value)} />
          <FieldError msg={errors['specs.brand']} />
        </div>
        <div>
          <label className={labelClass}>Size (UK) <RequiredAsterisk /></label>
          <input className={inputClass} placeholder="e.g. 9" value={(specs.size as string) ?? ''} onChange={(e) => onSpecChange('size', e.target.value)} />
          <FieldError msg={errors['specs.size']} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Width</label>
          <SelectWrapper>
            <select className={selectClass} value={(specs.width as string) ?? ''} onChange={(e) => onSpecChange('width', e.target.value)}>
              <option value="">Select width</option>
              {['Standard', 'Wide', 'Narrow'].map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </SelectWrapper>
        </div>
        <div>
          <label className={labelClass}>Type <RequiredAsterisk /></label>
          <SelectWrapper>
            <select className={selectClass} value={(specs.shoe_type as string) ?? ''} onChange={(e) => onSpecChange('shoe_type', e.target.value)}>
              <option value="">Select type</option>
              {['Spiked', 'Spikeless', 'Waterproof'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </SelectWrapper>
          <FieldError msg={errors['specs.shoe_type']} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Gender <RequiredAsterisk /></label>
        <SelectWrapper>
          <select className={selectClass} value={(specs.gender as string) ?? ''} onChange={(e) => onSpecChange('gender', e.target.value)}>
            <option value="">Select gender</option>
            {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </SelectWrapper>
        <FieldError msg={errors['specs.gender']} />
      </div>
    </div>
  );
}

function AccessoriesFields({ specs, onSpecChange, errors }: { specs: Specs; onSpecChange: (k: string, v: string) => void; errors: FormErrors }) {
  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-[#F0F0EA]">
      <div>
        <label className={labelClass}>Sub-category <RequiredAsterisk /></label>
        <SelectWrapper>
          <select className={selectClass} value={(specs.subcategory as string) ?? ''} onChange={(e) => onSpecChange('subcategory', e.target.value)}>
            <option value="">Select sub-category</option>
            {['Bag', 'Trolley', 'Rangefinder', 'GPS Device', 'Umbrella', 'Headcover', 'Training Aid', 'Other'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </SelectWrapper>
        <FieldError msg={errors['specs.subcategory']} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Brand <RequiredAsterisk /></label>
          <input className={inputClass} placeholder="e.g. Callaway" value={(specs.brand as string) ?? ''} onChange={(e) => onSpecChange('brand', e.target.value)} />
          <FieldError msg={errors['specs.brand']} />
        </div>
        <div>
          <label className={labelClass}>Model</label>
          <input className={inputClass} placeholder="Optional" value={(specs.model as string) ?? ''} onChange={(e) => onSpecChange('model', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function BallsFields({ specs, onSpecChange, errors }: { specs: Specs; onSpecChange: (k: string, v: string) => void; errors: FormErrors }) {
  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-[#F0F0EA]">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Brand <RequiredAsterisk /></label>
          <input className={inputClass} placeholder="e.g. Titleist" value={(specs.brand as string) ?? ''} onChange={(e) => onSpecChange('brand', e.target.value)} />
          <FieldError msg={errors['specs.brand']} />
        </div>
        <div>
          <label className={labelClass}>Model <RequiredAsterisk /></label>
          <input className={inputClass} placeholder="e.g. Pro V1" value={(specs.model as string) ?? ''} onChange={(e) => onSpecChange('model', e.target.value)} />
          <FieldError msg={errors['specs.model']} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Quantity <RequiredAsterisk /></label>
        <SelectWrapper>
          <select className={selectClass} value={(specs.quantity as string) ?? ''} onChange={(e) => onSpecChange('quantity', e.target.value)}>
            <option value="">Select quantity</option>
            {['Single', 'Sleeve (3)', 'Half Dozen', 'Dozen', 'Box (15)', 'Other'].map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        </SelectWrapper>
        <FieldError msg={errors['specs.quantity']} />
      </div>
    </div>
  );
}

function TrainingAidsFields({ specs, onSpecChange, errors }: { specs: Specs; onSpecChange: (k: string, v: string) => void; errors: FormErrors }) {
  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-[#F0F0EA]">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Brand <RequiredAsterisk /></label>
          <input className={inputClass} placeholder="e.g. Arccos" value={(specs.brand as string) ?? ''} onChange={(e) => onSpecChange('brand', e.target.value)} />
          <FieldError msg={errors['specs.brand']} />
        </div>
        <div>
          <label className={labelClass}>Type <RequiredAsterisk /></label>
          <input className={inputClass} placeholder="e.g. Swing Trainer" value={(specs.training_type as string) ?? ''} onChange={(e) => onSpecChange('training_type', e.target.value)} />
          <FieldError msg={errors['specs.training_type']} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Model</label>
        <input className={inputClass} placeholder="Optional" value={(specs.model as string) ?? ''} onChange={(e) => onSpecChange('model', e.target.value)} />
      </div>
    </div>
  );
}

function EverythingElseFields({ specs, onSpecChange, errors }: { specs: Specs; onSpecChange: (k: string, v: string) => void; errors: FormErrors }) {
  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-[#F0F0EA]">
      <div>
        <label className={labelClass}>Item Name <RequiredAsterisk /></label>
        <input className={inputClass} placeholder="Describe the item" value={(specs.item_name as string) ?? ''} onChange={(e) => onSpecChange('item_name', e.target.value)} />
        <FieldError msg={errors['specs.item_name']} />
      </div>
      <div>
        <label className={labelClass}>Brand</label>
        <input className={inputClass} placeholder="Optional" value={(specs.brand as string) ?? ''} onChange={(e) => onSpecChange('brand', e.target.value)} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateKey() {
  return Math.random().toString(36).slice(2);
}

function conditionValueToNumber(cond: string): number {
  const map: Record<string, number> = { New: 5, 'Like New': 4, 'Very Good': 3, Good: 2, Fair: 1 };
  return map[cond] ?? 3;
}

function numberToConditionValue(n: number | null | undefined): string {
  const map: Record<number, string> = { 5: 'New', 4: 'Like New', 3: 'Very Good', 2: 'Good', 1: 'Fair' };
  return n != null ? (map[n] ?? 'Very Good') : '';
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function ListingForm({ initialData, isEditing = false }: ListingFormProps) {
  const router = useRouter();

  // ---- Form state ----
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [condition, setCondition] = useState(numberToConditionValue(initialData?.condition_overall));
  const [price, setPrice] = useState(initialData?.price ? parseFloat(initialData.price).toFixed(2) : '');
  const [acceptOffers, setAcceptOffers] = useState(initialData?.is_negotiable ?? false);
  const [autoDeclineBelow, setAutoDeclineBelow] = useState(
    (initialData?.specifications as Specs)?.auto_decline_below
      ? String((initialData.specifications as Specs).auto_decline_below)
      : ''
  );
  const [parcelSize, setParcelSize] = useState<ParcelSizeKey | ''>(
    (initialData?.parcel_size as ParcelSizeKey) ?? ''
  );
  const [status, setStatus] = useState<'draft' | 'active'>(
    (initialData?.status as 'draft' | 'active') ?? 'draft'
  );
  const [specs, setSpecs] = useState<Specs>(() => {
    const s = (initialData?.specifications as Specs) ?? {};
    // Remove non-spec keys
    const { auto_decline_below: _adb, ...rest } = s;
    void _adb;
    return rest;
  });

  // ---- Image state ----
  const [images, setImages] = useState<ImageSlot[]>(() => {
    if (!initialData?.images?.length) return [];
    return initialData.images
      .sort((a, b) => a.display_order - b.display_order)
      .map((img) => ({
        key: img.id,
        id: img.id,
        url: img.image_url,
        s3_key: img.s3_key,
      }));
  });
  const [imageError, setImageError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- UI state ----
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [conditionTooltip, setConditionTooltip] = useState('');
  const [savedListingId, setSavedListingId] = useState<string | null>(initialData?.id ?? null);

  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const draftFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mark dirty on any field change
  useEffect(() => { setIsDirty(true); }, [title, description, category, condition, price, acceptOffers, autoDeclineBelow, parcelSize, specs]);

  // Auto-save every 60s if dirty
  useEffect(() => {
    autoSaveTimer.current = setInterval(async () => {
      if (!isDirty) return;
      await doSave('draft', true);
    }, 60_000);
    return () => { if (autoSaveTimer.current) clearInterval(autoSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, title, description, category, condition, price, acceptOffers, autoDeclineBelow, parcelSize, specs]);

  // ---- Spec change helper ----
  const handleSpecChange = useCallback((key: string, value: string | number) => {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ---- Image handling ----
  const addFiles = useCallback((files: File[]) => {
    const remaining = 4 - images.length;
    if (remaining <= 0) {
      setImageError('Maximum 4 photos allowed.');
      return;
    }
    const toAdd = files.slice(0, remaining);
    if (files.length > remaining) {
      setImageError(`Only ${remaining} more photo${remaining === 1 ? '' : 's'} can be added.`);
    } else {
      setImageError('');
    }
    const newSlots: ImageSlot[] = toAdd.map((file) => ({
      key: generateKey(),
      preview: URL.createObjectURL(file),
      file,
    }));
    setImages((prev) => [...prev, ...newSlots]);
    setIsDirty(true);
  }, [images.length]);

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) addFiles(files);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (files.length) addFiles(files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const removeImage = async (slot: ImageSlot) => {
    // If it's an existing image and we have a listing id, delete it
    if (slot.id && savedListingId) {
      try {
        await deleteListingImage(savedListingId, slot.id);
      } catch {
        // Non-fatal: continue removing from UI
      }
    }
    if (slot.preview) URL.revokeObjectURL(slot.preview);
    setImages((prev) => prev.filter((s) => s.key !== slot.key));
    setIsDirty(true);
  };

  // ---- Validation ----
  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!title.trim()) errs.title = 'Title is required.';
    if (!description.trim()) errs.description = 'Description is required.';
    if (!category) errs.category = 'Category is required.';
    if (!condition) errs.condition = 'Condition is required.';
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) errs.price = 'A valid price is required.';
    if (!parcelSize) errs.parcelSize = 'Select a parcel size.';

    // Category-specific required fields
    if (category === 'Clubs') {
      if (!specs.club_type) errs['specs.club_type'] = 'Club type is required.';
      if (!specs.brand) errs['specs.brand'] = 'Brand is required.';
      if (!specs.model) errs['specs.model'] = 'Model is required.';
      if (!specs.dexterity) errs['specs.dexterity'] = 'Dexterity is required.';
      if (!specs.shaft_flex) errs['specs.shaft_flex'] = 'Shaft flex is required.';
      if (!specs.shaft_material) errs['specs.shaft_material'] = 'Shaft material is required.';
    }
    if (category === 'Shafts, Grips & Heads') {
      if (!specs.subcategory) errs['specs.subcategory'] = 'Sub-category is required.';
      if (!specs.brand) errs['specs.brand'] = 'Brand is required.';
      if (!specs.model) errs['specs.model'] = 'Model is required.';
    }
    if (category === 'Clothing') {
      if (!specs.subcategory) errs['specs.subcategory'] = 'Sub-category is required.';
      if (!specs.brand) errs['specs.brand'] = 'Brand is required.';
      if (!specs.size) errs['specs.size'] = 'Size is required.';
      if (!specs.gender) errs['specs.gender'] = 'Gender is required.';
    }
    if (category === 'Shoes') {
      if (!specs.brand) errs['specs.brand'] = 'Brand is required.';
      if (!specs.size) errs['specs.size'] = 'Size is required.';
      if (!specs.shoe_type) errs['specs.shoe_type'] = 'Type is required.';
      if (!specs.gender) errs['specs.gender'] = 'Gender is required.';
    }
    if (category === 'Accessories') {
      if (!specs.subcategory) errs['specs.subcategory'] = 'Sub-category is required.';
      if (!specs.brand) errs['specs.brand'] = 'Brand is required.';
    }
    if (category === 'Balls') {
      if (!specs.brand) errs['specs.brand'] = 'Brand is required.';
      if (!specs.model) errs['specs.model'] = 'Model is required.';
      if (!specs.quantity) errs['specs.quantity'] = 'Quantity is required.';
    }
    if (category === 'Training Aids') {
      if (!specs.brand) errs['specs.brand'] = 'Brand is required.';
      if (!specs.training_type) errs['specs.training_type'] = 'Type is required.';
    }
    if (category === 'Everything Else') {
      if (!specs.item_name) errs['specs.item_name'] = 'Item name is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ---- Build payload ----
  const buildPayload = (overrideStatus?: 'draft' | 'active') => {
    const specsWithOffers: Specs = { ...specs };
    if (acceptOffers && autoDeclineBelow) {
      specsWithOffers.auto_decline_below = parseFloat(autoDeclineBelow);
    }
    return {
      title: title.trim(),
      description: description.trim(),
      category,
      price: parseFloat(price) || 0,
      condition_overall: conditionValueToNumber(condition),
      is_negotiable: acceptOffers,
      parcel_size: parcelSize || undefined,
      subcategory: (specs.subcategory as string) || undefined,
      specifications: specsWithOffers,
      status: overrideStatus ?? status,
    };
  };

  // ---- Upload pending images ----
  const uploadPendingImages = async (listingId: string) => {
    const pending = images.filter((s) => s.file);
    for (const slot of pending) {
      if (!slot.file) continue;
      try {
        const result = await uploadListingImage(listingId, slot.file);
        setImages((prev) =>
          prev.map((s) =>
            s.key === slot.key
              ? { ...s, id: result.id, url: result.image_url, preview: undefined, file: undefined }
              : s
          )
        );
        if (slot.preview) URL.revokeObjectURL(slot.preview);
      } catch {
        // Non-fatal image upload failure — listing still created
      }
    }
  };

  // ---- Core save function ----
  const doSave = async (overrideStatus?: 'draft' | 'active', isAutoSave = false): Promise<boolean> => {
    if (!isAutoSave && !validate()) return false;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const payload = buildPayload(overrideStatus);

      let listingId = savedListingId;
      if (isEditing && listingId) {
        await updateListing(listingId, payload);
      } else if (listingId) {
        // Re-save existing unsaved draft
        await updateListing(listingId, payload);
      } else {
        const created = await createListing(payload);
        listingId = created.id;
        setSavedListingId(listingId);
      }

      // Upload any pending images
      if (listingId) {
        await uploadPendingImages(listingId);
      }

      setIsDirty(false);

      if (isAutoSave) {
        setDraftSaved(true);
        if (draftFadeTimer.current) clearTimeout(draftFadeTimer.current);
        draftFadeTimer.current = setTimeout(() => setDraftSaved(false), 3000);
        return true;
      }

      // Redirect after manual publish/update
      router.push('/inventory');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setSubmitError(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => doSave('draft');
  const handlePublish = () => doSave(status === 'active' ? 'active' : 'active');
  const handleUpdate = () => doSave(status);

  // ---- Render category-specific fields ----
  const renderCategoryFields = () => {
    switch (category) {
      case 'Clubs':
        return <ClubFields specs={specs} onSpecChange={handleSpecChange} errors={errors} />;
      case 'Shafts, Grips & Heads':
        return <ShaftGripHeadFields specs={specs} onSpecChange={handleSpecChange} errors={errors} />;
      case 'Clothing':
        return <ClothingFields specs={specs} onSpecChange={handleSpecChange} errors={errors} />;
      case 'Shoes':
        return <ShoesFields specs={specs} onSpecChange={handleSpecChange} errors={errors} />;
      case 'Accessories':
        return <AccessoriesFields specs={specs} onSpecChange={handleSpecChange} errors={errors} />;
      case 'Balls':
        return <BallsFields specs={specs} onSpecChange={handleSpecChange} errors={errors} />;
      case 'Training Aids':
        return <TrainingAidsFields specs={specs} onSpecChange={handleSpecChange} errors={errors} />;
      case 'Everything Else':
        return <EverythingElseFields specs={specs} onSpecChange={handleSpecChange} errors={errors} />;
      default:
        return null;
    }
  };

  // ---- Render ----
  return (
    <div className="font-[var(--font-sans)]">
      {/* ---- Page header ---- */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/inventory"
            className="flex items-center gap-1.5 text-[#1DC690] text-[0.88rem] font-semibold hover:underline"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="#1DC690" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Inventory
          </Link>
          <span className="text-[#D0D0C8]">/</span>
          <h1 className="text-[1.25rem] font-bold text-[#0D0D0D]">
            {isEditing ? 'Edit Listing' : 'New Listing'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Draft saved indicator */}
          <span
            className="flex items-center gap-1.5 text-[0.8rem] text-[#1DC690] font-semibold transition-opacity duration-500"
            style={{ opacity: draftSaved ? 1 : 0 }}
            aria-live="polite"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l3.5 3.5L12 4" stroke="#1DC690" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Draft saved
          </span>

          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="h-8 rounded-[8px] border border-[#E0E0D8] bg-transparent px-4 text-[0.82rem] font-semibold text-[#6B6B6B] hover:bg-[#F5F5F0] transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>

          {/* Primary CTA */}
          <button
            type="button"
            onClick={isEditing ? handleUpdate : handlePublish}
            disabled={isSubmitting}
            className="h-[48px] rounded-[10px] bg-[#1DC690] px-6 text-[0.9rem] font-bold text-white hover:bg-[#18b07e] transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : isEditing ? 'Update Listing' : 'Publish Listing'}
          </button>
        </div>
      </div>

      {/* ---- Global submit error ---- */}
      {submitError && (
        <div className="mb-4 rounded-[8px] border border-[#FEB2B2] bg-[#FFF5F5] px-4 py-3 text-[0.88rem] text-[#E53E3E]">
          {submitError}
        </div>
      )}

      {/* ---- Two-column layout ---- */}
      <div className="flex gap-6 items-start">

        {/* ======== LEFT COLUMN (65%) ======== */}
        <div className="flex-[65] min-w-0">

          {/* SECTION 1 — Listing Details */}
          <div className={cardClass}>
            <h2 className="text-[0.95rem] font-bold text-[#0D0D0D] mb-4">Listing Details</h2>

            {/* Title */}
            <div className="mb-4">
              <label className={labelClass}>Title <RequiredAsterisk /></label>
              <input
                className={inputClass}
                placeholder="e.g. Titleist TSR2 Driver — Stiff Shaft — Very Good"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <p className={helperClass}>Required format: [Brand] [Category] [Model] — [Key Spec] — [Condition]</p>
              <FieldError msg={errors.title} />
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>Description <RequiredAsterisk /></label>
              <textarea
                className={`${inputClass} min-h-[100px] resize-y`}
                placeholder="Describe the item — condition, history, included accessories, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              <FieldError msg={errors.description} />
            </div>
          </div>

          {/* SECTION 2 — Item Information */}
          <div className={cardClass}>
            <h2 className="text-[0.95rem] font-bold text-[#0D0D0D] mb-4">Item Information</h2>

            {/* Category */}
            <div className="mb-4">
              <label className={labelClass}>Category <RequiredAsterisk /></label>
              <SelectWrapper>
                <select
                  className={selectClass}
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSpecs({}); // reset specs on category change
                  }}
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </SelectWrapper>
              <FieldError msg={errors.category} />
            </div>

            {/* Category-specific fields — transition wrapper */}
            <div
              style={{
                maxHeight: category ? '2000px' : '0',
                opacity: category ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.35s ease, opacity 0.2s ease',
              }}
            >
              {renderCategoryFields()}
            </div>

            {/* Condition */}
            <div className="mt-4">
              <label className={labelClass}>Condition <RequiredAsterisk /></label>
              <SelectWrapper>
                <select
                  className={selectClass}
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  onFocus={() => {
                    const found = CONDITIONS.find((c) => c.value === condition);
                    setConditionTooltip(found?.desc ?? '');
                  }}
                  onBlur={() => setConditionTooltip('')}
                >
                  <option value="">Select condition</option>
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </SelectWrapper>
              {/* Condition tooltip */}
              {conditionTooltip && (
                <div className="relative mt-1">
                  <ConditionTooltip desc={conditionTooltip} />
                </div>
              )}
              {/* Condition descriptions list */}
              <div className="mt-2 space-y-0.5">
                {CONDITIONS.map((c) => (
                  <div
                    key={c.value}
                    className="flex items-baseline gap-1.5 text-[0.76rem]"
                    style={{ color: condition === c.value ? '#1DC690' : '#6B6B6B' }}
                  >
                    <span className="font-semibold">{c.label}:</span>
                    <span>{c.desc}</span>
                  </div>
                ))}
              </div>
              <FieldError msg={errors.condition} />
            </div>
          </div>

          {/* SECTION 3 — Pricing */}
          <div className={cardClass}>
            <h2 className="text-[0.95rem] font-bold text-[#0D0D0D] mb-4">Pricing</h2>

            {/* Price */}
            <div className="mb-5">
              <label className={labelClass}>Price <RequiredAsterisk /></label>
              <div className="relative">
                <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[1.1rem] font-bold text-[#1DC690]">£</span>
                <input
                  className={`${inputClass} pl-8 text-[1.1rem] font-bold text-[#1DC690]`}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <p className={helperClass}>You receive this amount. No seller fees.</p>
              <FieldError msg={errors.price} />
            </div>

            {/* Accept Offers toggle */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[0.88rem] font-semibold text-[#0D0D0D]">Accept Offers</p>
                <p className={helperClass}>Buyers can send you offers below your asking price</p>
              </div>
              <Toggle checked={acceptOffers} onChange={setAcceptOffers} />
            </div>

            {/* Auto-decline field — shown when acceptOffers is on */}
            <div
              style={{
                maxHeight: acceptOffers ? '120px' : '0',
                opacity: acceptOffers ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.3s ease, opacity 0.2s ease',
              }}
            >
              <div>
                <label className={labelClass}>Auto-decline offers below</label>
                <div className="relative">
                  <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[0.9rem] font-bold text-[#1DC690]">£</span>
                  <input
                    className={`${inputClass} pl-8`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={autoDeclineBelow}
                    onChange={(e) => setAutoDeclineBelow(e.target.value)}
                  />
                </div>
                <p className={helperClass}>Offers below this amount will be automatically declined. Leave blank to review all offers.</p>
              </div>
            </div>
          </div>

          {/* SECTION 4 — Shipping */}
          <div className={cardClass}>
            <h2 className="text-[0.95rem] font-bold text-[#0D0D0D] mb-4">Shipping</h2>
            <label className={`${labelClass} mb-3`}>Parcel Size <RequiredAsterisk /></label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PARCEL_SIZES.map((opt) => {
                const selected = parcelSize === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setParcelSize(opt.key)}
                    className="flex items-center justify-between rounded-[8px] px-4 py-3 text-left transition-all"
                    style={{
                      border: selected ? '2px solid #1DC690' : '1px solid #E0E0D8',
                      backgroundColor: selected ? 'rgba(29,198,144,0.04)' : '#fff',
                    }}
                  >
                    <div>
                      <p className="text-[0.88rem] font-bold text-[#0D0D0D]">{opt.name}</p>
                      {opt.weight && (
                        <p className="text-[0.76rem] text-[#6B6B6B] mt-0.5">{opt.weight}</p>
                      )}
                      {opt.key === 'OWN' && (
                        <p className="text-[0.76rem] text-[#6B6B6B] mt-0.5">I&apos;ll arrange my own shipping</p>
                      )}
                    </div>
                    {opt.price && (
                      <span className="text-[0.9rem] font-bold text-[#1DC690] ml-3 whitespace-nowrap">{opt.price}</span>
                    )}
                  </button>
                );
              })}
            </div>
            <FieldError msg={errors.parcelSize} />
          </div>
        </div>

        {/* ======== RIGHT COLUMN (35%) — sticky ======== */}
        <div className="flex-[35] min-w-0">
          <div className="sticky top-[100px] space-y-4">

            {/* Image upload panel */}
            <div className={cardClass}>
              <h2 className="text-[0.95rem] font-bold text-[#0D0D0D] mb-4">Photos</h2>

              {/* Drop zone — only show if < 4 images */}
              {images.length < 4 && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-[10px] py-6 transition-colors"
                  style={{
                    border: `2px dashed ${isDragOver ? '#18b07e' : '#1DC690'}`,
                    backgroundColor: isDragOver ? 'rgba(29,198,144,0.08)' : 'rgba(29,198,144,0.04)',
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="mb-2">
                    <rect width="36" height="36" rx="18" fill="rgba(29,198,144,0.1)" />
                    <path d="M18 12v12M12 18h12" stroke="#1DC690" strokeWidth="2" strokeLinecap="round" />
                    <path d="M9 26s1.5-3 4-3c1.5 0 2.5 1 3 1.5S17.5 26 19 26c2.5 0 4-3 4-3" stroke="#1DC690" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p className="text-[0.88rem] font-semibold text-[#1DC690]">Click to upload or drag and drop</p>
                  <p className="text-[0.8rem] text-[#6B6B6B] mt-0.5">Up to 4 photos</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />

              {/* Image grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {images.map((slot, idx) => (
                    <div key={slot.key} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slot.preview ?? slot.url ?? ''}
                        alt={`Photo ${idx + 1}`}
                        className="w-full aspect-square object-cover rounded-[8px] bg-[#F0F0EA]"
                      />
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => removeImage(slot)}
                        className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#E53E3E] text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        aria-label="Remove photo"
                      >
                        ×
                      </button>
                      {/* Cover label */}
                      {idx === 0 && (
                        <span className="block text-center text-[0.72rem] font-semibold text-[#1DC690] mt-1">
                          Cover photo
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {imageError && <p className={`${errorClass} mt-2`}>{imageError}</p>}
            </div>

            {/* Publish controls */}
            <div className={cardClass}>
              <h2 className="text-[0.95rem] font-bold text-[#0D0D0D] mb-3">Status</h2>
              <StatusToggle value={status} onChange={setStatus} />

              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="w-full h-[44px] rounded-[10px] border border-[#E0E0D8] bg-transparent text-[0.88rem] font-semibold text-[#6B6B6B] hover:bg-[#F5F5F0] transition-colors disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={isEditing ? handleUpdate : handlePublish}
                  disabled={isSubmitting}
                  className="w-full h-[50px] rounded-[10px] bg-[#1DC690] text-[0.9rem] font-bold text-white hover:bg-[#18b07e] transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving…' : isEditing ? 'Update Listing' : 'Publish Listing'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
