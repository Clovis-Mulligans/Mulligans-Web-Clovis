'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check, ChevronLeft, ChevronRight, Upload, X, GripVertical, Loader2,
  AlertCircle, Save, Trash2, Pencil,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import PageHeader from '@/components/PageHeader';
import { CONDITION_COLOURS } from '@/lib/constants';
import {
  CATEGORIES, SUBCATEGORIES, PARCEL_SIZES, CONDITION_LABELS,
  specFieldsFor, variantSizesFor, calculateBuyerPrice,
  type SpecField, type ParcelOption,
} from '@/lib/listingCategories';
import { getBrandsFor } from '@/lib/brands';
import { getModelsFor, hasModelsFor } from '@/lib/models';
import {
  createListing, uploadListingImage,
  type CreateListingData,
} from '@mulligans/api-client';

/* ───────────────────────── Types ───────────────────────── */

type Specifications = Record<string, unknown>;

interface FormState {
  // Step 1
  category: string;
  subcategory: string;
  title: string;
  description: string;
  location: string;
  // Step 2
  brand: string;
  brandIsOther: boolean;
  customBrand: string;
  model: string;
  modelIsOther: boolean;
  customModel: string;
  specs: Specifications;
  // Step 3
  conditionOverall: number;
  conditionHead: number;
  conditionShaft: number;
  conditionGrip: number;
  quantity: number;
  sizeQuantities: Record<string, number>;
  // Step 4 — File objects don't survive JSON serialisation; persisted as
  // dataURLs in localStorage and rehydrated below.
  images: { id: string; file: File | null; previewUrl: string; name: string }[];
  // Step 5
  price: string;
  isNegotiable: boolean;
  parcelSize: ParcelOption['id'] | '';
}

const DRAFT_KEY = 'mulligans_draft_listing';
const AUTOSAVE_INTERVAL_MS = 30_000;
const MAX_IMAGES = 5;

const PALETTE = {
  bg: '#EAEAE0',
  card: '#FFFFFF',
  green: '#1DC690',
  blue: '#278AB0',
  textDark: '#111827',
  textMid: '#374151',
  textLight: '#6B7280',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  inputBg: '#FFFFFF',
  selectedBg: '#ECFDF5',
};

const STEP_LABELS = ['Basics', 'Details', 'Condition', 'Photos', 'Price & Shipping'];

/* ───────────────────────── Initial state ───────────────────────── */

function initialState(defaultLocation: string): FormState {
  return {
    category: '',
    subcategory: '',
    title: '',
    description: '',
    location: defaultLocation || 'UK',
    brand: '',
    brandIsOther: false,
    customBrand: '',
    model: '',
    modelIsOther: false,
    customModel: '',
    specs: {},
    conditionOverall: 3,
    conditionHead: 3,
    conditionShaft: 3,
    conditionGrip: 3,
    quantity: 1,
    sizeQuantities: {},
    images: [],
    price: '',
    isNegotiable: true,
    parcelSize: '',
  };
}

/* ───────────────────────── Page ───────────────────────── */

export default function SellPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [form, setForm] = useState<FormState>(() => initialState(''));
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null!);

  /* Auth gate */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/sell');
    }
  }, [authLoading, isAuthenticated, router]);

  /* Pre-fill location from user profile (one-shot, only if untouched) */
  useEffect(() => {
    if (user?.location && form.location === 'UK') {
      setForm(f => ({ ...f, location: user.location || 'UK' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* Restore draft on mount */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<FormState> & { _step?: number };
      if (parsed) {
        setForm(prev => ({
          ...prev,
          ...parsed,
          // images: rehydrate previewUrls only — files cannot persist
          images: (parsed.images || []).map(img => ({
            id: img.id, file: null, previewUrl: img.previewUrl, name: img.name,
          })),
        }));
        if (parsed._step) setStep(parsed._step);
        setDraftRestored(true);
        setTimeout(() => setDraftRestored(false), 4000);
      }
    } catch {
      // ignore — corrupt draft
    }
  }, []);

  /* Auto-save every 30s */
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const payload = JSON.stringify({ ...form, _step: step });
        // localStorage capacity ~5MB; truncate images if oversized
        if (payload.length < 4_000_000) {
          localStorage.setItem(DRAFT_KEY, payload);
          setLastSaved(new Date());
        }
      } catch {
        // quota exceeded — silently skip
      }
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [form, step]);

  /* Derived */
  const subcategories = useMemo(
    () => (form.category ? SUBCATEGORIES[form.category] || [] : []),
    [form.category],
  );
  const specFields = useMemo<SpecField[]>(
    () => specFieldsFor(form.category, form.subcategory),
    [form.category, form.subcategory],
  );
  const brandList = useMemo(
    () => getBrandsFor(form.category, form.subcategory),
    [form.category, form.subcategory],
  );
  const isClubs = form.category === 'Clubs';
  const isVariableSize = (
    (form.category === 'Clothing' && form.subcategory !== 'Gloves' && form.specs.size === 'Various') ||
    (form.category === 'Shoes' && form.specs.shoeSize === 'Various')
  );
  const variantSizes = useMemo(
    () => variantSizesFor(form.category, form.subcategory),
    [form.category, form.subcategory],
  );
  const totalQuantity = useMemo(() => {
    if (isVariableSize) {
      return Object.values(form.sizeQuantities).reduce((a, b) => a + (Number(b) || 0), 0);
    }
    return form.quantity;
  }, [isVariableSize, form.sizeQuantities, form.quantity]);

  const priceNum = parseFloat(form.price);
  const buyerPrice = !isNaN(priceNum) && priceNum > 0 ? calculateBuyerPrice(priceNum) : null;
  const selectedParcel = PARCEL_SIZES.find(p => p.id === form.parcelSize) || null;

  /* ───── Validation per step ───── */
  function validateStep(s: number): Record<string, string> {
    const e: Record<string, string> = {};
    if (s >= 1) {
      if (!form.category) e.category = 'Pick a category';
      if (!form.subcategory) e.subcategory = 'Pick a subcategory';
      if (form.title.trim().length < 3) e.title = 'Title must be at least 3 characters';
      if (form.title.length > 200) e.title = 'Title must be 200 characters or fewer';
      if (form.description.trim().length < 10) e.description = 'Description must be at least 10 characters';
      if (form.description.length > 5000) e.description = 'Description must be 5000 characters or fewer';
    }
    if (s >= 2) {
      const effectiveBrand = form.brandIsOther ? form.customBrand.trim() : form.brand;
      if (!effectiveBrand) e.brand = 'Pick a brand';
    }
    if (s >= 3) {
      if (isVariableSize) {
        if (totalQuantity < 1) e.quantity = 'Add quantity for at least one size';
      } else if (form.quantity < 1) {
        e.quantity = 'Quantity must be at least 1';
      }
    }
    if (s >= 4) {
      if (form.images.length < 1) e.images = 'Add at least one photo';
    }
    if (s >= 5) {
      if (isNaN(priceNum) || priceNum < 0.5) e.price = 'Price must be at least £0.50';
      else if (priceNum > 50_000) e.price = 'Price must be £50,000 or less';
      if (!form.parcelSize) e.parcelSize = 'Pick a parcel size';
    }
    return e;
  }

  function tryAdvance() {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length === 0) {
      setStep(s => Math.min(5, s + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function jumpToStep(target: number) {
    if (target <= step) {
      setStep(target);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* ───── Image handling ───── */
  async function processFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const slotsLeft = MAX_IMAGES - form.images.length;
    if (slotsLeft <= 0) return;
    const toAdd = arr.slice(0, slotsLeft);
    const processed = await Promise.all(toAdd.map(resizeImage));
    setForm(f => ({
      ...f,
      images: [
        ...f.images,
        ...processed.map((p, i) => ({
          id: `${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}`,
          file: p.file,
          previewUrl: p.dataUrl,
          name: p.file.name,
        })),
      ],
    }));
  }

  function removeImage(id: string) {
    setForm(f => ({ ...f, images: f.images.filter(img => img.id !== id) }));
  }

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= form.images.length) return;
    setForm(f => {
      const next = [...f.images];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return { ...f, images: next };
    });
  }

  /* ───── Submit ───── */
  async function handlePublish(asDraft: boolean) {
    // Validate everything (drafts skip image requirement)
    const lastStepToCheck = asDraft ? 2 : 5;
    let allErrors: Record<string, string> = {};
    for (let s = 1; s <= lastStepToCheck; s++) {
      allErrors = { ...allErrors, ...validateStep(s) };
    }
    if (asDraft) delete allErrors.images;
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      // jump to first failing step
      for (let s = 1; s <= 5; s++) {
        const e = validateStep(s);
        if (Object.keys(e).length > 0) { setStep(s); break; }
      }
      return;
    }

    setSubmitting(true);
    setSubmitProgress(asDraft ? 'Saving draft…' : 'Creating listing…');

    try {
      const effectiveBrand = form.brandIsOther ? form.customBrand.trim() : form.brand;
      const specifications: Specifications = { ...form.specs };
      if (isVariableSize) specifications.sizeQuantities = form.sizeQuantities;

      const payload: CreateListingData = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        subcategory: form.subcategory,
        brand: effectiveBrand || undefined,
        model: (form.modelIsOther ? form.customModel.trim() : form.model.trim()) || undefined,
        price: priceNum,
        location: form.location.trim() || 'UK',
        is_negotiable: form.isNegotiable,
        parcel_size: form.parcelSize || undefined,
        shipping_cost: selectedParcel?.price,
        quantity: isVariableSize ? totalQuantity : form.quantity,
        specifications: Object.keys(specifications).length ? specifications : undefined,
        status: asDraft ? 'draft' : 'active',
      };

      if (isClubs) {
        payload.condition_head = form.conditionHead;
        payload.condition_shaft = form.conditionShaft;
        payload.condition_grip = form.conditionGrip;
      } else {
        payload.condition_overall = form.conditionOverall;
      }

      const res = await createListing(payload);
      const listing = (res as any).listing || res;

      if (!asDraft && form.images.length > 0) {
        for (let i = 0; i < form.images.length; i++) {
          const img = form.images[i];
          if (!img.file) continue; // skipped — restored from draft without file
          setSubmitProgress(`Uploading image ${i + 1} of ${form.images.length}…`);
          await uploadListingImage(listing.id, img.file);
        }
      }

      localStorage.removeItem(DRAFT_KEY);
      router.push(asDraft ? '/profile?draft=saved' : `/listings/${listing.id}?published=1`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setErrors({ submit: `Failed to publish: ${msg}` });
      setSubmitting(false);
      setSubmitProgress('');
    }
  }

  function clearDraft() {
    if (!confirm('Clear this draft and start over?')) return;
    localStorage.removeItem(DRAFT_KEY);
    setForm(initialState(user?.location || 'UK'));
    setStep(1);
    setErrors({});
  }

  /* ───── Loading / auth gate ───── */
  if (authLoading || !isAuthenticated) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} color={PALETTE.green} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  /* ───── Render ───── */
  return (
    <div style={{ backgroundColor: PALETTE.bg, minHeight: '100vh', padding: '24px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <PageHeader
          title="List an Item"
          subtitle="Tell buyers about your item — it takes just a few minutes"
        />

        {draftRestored && (
          <div style={toastStyle}>
            <Save size={16} />
            <span>Draft restored from your last session</span>
          </div>
        )}

        <ProgressBar step={step} onJump={jumpToStep} />

        <div style={cardStyle}>
          {step === 1 && (
            <Step1Basics form={form} setForm={setForm} subcategories={subcategories} errors={errors} />
          )}
          {step === 2 && (
            <Step2Details
              form={form} setForm={setForm} brandList={brandList}
              specFields={specFields} errors={errors}
            />
          )}
          {step === 3 && (
            <Step3Condition
              form={form} setForm={setForm} isClubs={isClubs}
              isVariableSize={isVariableSize} variantSizes={variantSizes}
              totalQuantity={totalQuantity} errors={errors}
            />
          )}
          {step === 4 && (
            <Step4Photos
              form={form} fileInputRef={fileInputRef}
              onAdd={processFiles} onRemove={removeImage} onMove={moveImage}
              errors={errors}
            />
          )}
          {step === 5 && (
            <Step5PriceShipping
              form={form} setForm={setForm} buyerPrice={buyerPrice}
              selectedParcel={selectedParcel} errors={errors} onJump={setStep}
            />
          )}
        </div>

        {errors.submit && (
          <div style={{ ...errorBoxStyle, marginTop: 16 }}>
            <AlertCircle size={16} />
            <span>{errors.submit}</span>
          </div>
        )}

        {/* Nav buttons */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 20, gap: 12, flexWrap: 'wrap',
        }}>
          <button
            type="button"
            onClick={() => { setStep(s => Math.max(1, s - 1)); setErrors({}); }}
            disabled={step === 1 || submitting}
            style={btnSecondary(step === 1 || submitting)}
          >
            <ChevronLeft size={18} /> Back
          </button>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {step === 5 && (
              <button
                type="button"
                onClick={() => handlePublish(true)}
                disabled={submitting}
                style={btnSecondary(submitting)}
              >
                <Save size={16} /> Save as Draft
              </button>
            )}
            {step < 5 ? (
              <button
                type="button"
                onClick={tryAdvance}
                disabled={submitting}
                style={btnPrimary(submitting)}
              >
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handlePublish(false)}
                disabled={submitting}
                style={btnPrimary(submitting)}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    {submitProgress || 'Publishing…'}
                  </>
                ) : (
                  <>Publish Listing <Check size={18} /></>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Draft footer */}
        <div style={{
          marginTop: 24, display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', fontSize: 12, color: PALETTE.textLight,
        }}>
          <span>
            {lastSaved
              ? `Auto-saved as draft · Last saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Draft auto-saves every 30 seconds'}
          </span>
          <button type="button" onClick={clearDraft} style={linkBtn}>
            <Trash2 size={12} /> Clear draft
          </button>
        </div>
      </div>

      {submitting && (
        <div style={overlayStyle}>
          <div style={{ textAlign: 'center', color: PALETTE.textDark }}>
            <Loader2 size={36} color={PALETTE.green}
              style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 600 }}>{submitProgress}</div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ───────────────────────── Step 1: Basics ───────────────────────── */

function Step1Basics({
  form, setForm, subcategories, errors,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  subcategories: string[];
  errors: Record<string, string>;
}) {
  return (
    <>
      <SectionTitle>Basics</SectionTitle>
      <Row2>
        <Field label="Category" required error={errors.category}>
          <select
            value={form.category}
            onChange={e => setForm(f => ({
              ...f, category: e.target.value, subcategory: '', specs: {},
              brand: '', brandIsOther: false, customBrand: '',
              model: '', modelIsOther: false, customModel: '',
            }))}
            style={inputStyle}
          >
            <option value="">Choose a category…</option>
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Subcategory" required error={errors.subcategory}>
          <select
            value={form.subcategory}
            onChange={e => setForm(f => ({
              ...f, subcategory: e.target.value, specs: {},
              brand: '', brandIsOther: false, customBrand: '',
              model: '', modelIsOther: false, customModel: '',
            }))}
            disabled={!form.category}
            style={inputStyle}
          >
            <option value="">Choose a subcategory…</option>
            {subcategories.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
      </Row2>

      <Field label="Title" required error={errors.title} hint={`${form.title.length} / 200`}>
        <input
          type="text"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value.slice(0, 200) }))}
          placeholder="e.g. Titleist T100 Iron Set"
          style={inputStyle}
          maxLength={200}
        />
      </Field>

      <Field
        label="Description"
        required
        error={errors.description}
        hint={`${form.description.length} / 5000`}
      >
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value.slice(0, 5000) }))}
          placeholder="Describe your item — condition, why you're selling, any wear/damage…"
          rows={5}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 120, fontFamily: 'inherit' }}
          maxLength={5000}
        />
      </Field>

      <Field label="Location" hint="Pre-filled from your profile if available">
        <input
          type="text"
          value={form.location}
          onChange={e => setForm(f => ({ ...f, location: e.target.value.slice(0, 200) }))}
          placeholder="e.g. London, Manchester"
          style={inputStyle}
          maxLength={200}
        />
      </Field>
    </>
  );
}

/* ───────────────────────── Step 2: Details & Specs ───────────────────────── */

function Step2Details({
  form, setForm, brandList, specFields, errors,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  brandList: string[];
  specFields: SpecField[];
  errors: Record<string, string>;
}) {
  function setSpec(key: string, value: unknown) {
    setForm(f => ({ ...f, specs: { ...f.specs, [key]: value } }));
  }

  function toggleMulti(key: string, opt: string) {
    setForm(f => {
      const cur = Array.isArray(f.specs[key]) ? (f.specs[key] as string[]) : [];
      const next = cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt];
      return { ...f, specs: { ...f.specs, [key]: next } };
    });
  }

  return (
    <>
      <SectionTitle>Details &amp; Specifications</SectionTitle>

      <Field label="Brand" required error={errors.brand}>
        <SearchableCombobox
          options={brandList}
          value={form.brand}
          placeholder="Search brands…"
          onChange={(v) => setForm(f => ({
            ...f,
            brand: v,
            brandIsOther: v === 'Other',
            customBrand: v === 'Other' ? f.customBrand : '',
            // Brand changed → clear model
            model: '',
            modelIsOther: false,
            customModel: '',
          }))}
        />
        {form.brandIsOther && (
          <input
            type="text"
            value={form.customBrand}
            onChange={e => setForm(f => ({ ...f, customBrand: e.target.value.slice(0, 100) }))}
            placeholder="Enter brand name"
            style={{ ...inputStyle, marginTop: 8 }}
            maxLength={100}
          />
        )}
      </Field>

      <ModelField form={form} setForm={setForm} />


      {specFields.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}>
          {specFields.map(field => (
            <SpecFieldRender
              key={field.key}
              field={field}
              value={form.specs[field.key]}
              onChange={(v) => setSpec(field.key, v)}
              onToggleMulti={(opt) => toggleMulti(field.key, opt)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function SpecFieldRender({
  field, value, onChange, onToggleMulti,
}: {
  field: SpecField;
  value: unknown;
  onChange: (v: unknown) => void;
  onToggleMulti: (opt: string) => void;
}) {
  if (field.type === 'select') {
    return (
      <Field label={field.label}>
        <select value={(value as string) || ''} onChange={e => onChange(e.target.value)} style={inputStyle}>
          <option value="">Select…</option>
          {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </Field>
    );
  }
  if (field.type === 'buttons') {
    return (
      <Field label={field.label}>
        <ButtonRow
          options={field.options || []}
          value={value as string}
          onChange={onChange as (s: string) => void}
        />
      </Field>
    );
  }
  if (field.type === 'multiSelect') {
    const sel = Array.isArray(value) ? (value as string[]) : [];
    return (
      <Field label={field.label} hint="Select all that apply">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(field.options || []).map(o => {
            const active = sel.includes(o);
            return (
              <button
                key={o}
                type="button"
                onClick={() => onToggleMulti(o)}
                style={chipStyle(active)}
              >
                {o}
              </button>
            );
          })}
        </div>
      </Field>
    );
  }
  if (field.type === 'number') {
    return (
      <Field label={field.label}>
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={(value as string) || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          style={inputStyle}
        />
      </Field>
    );
  }
  return (
    <Field label={field.label}>
      <input
        type="text"
        value={(value as string) || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        style={inputStyle}
      />
    </Field>
  );
}

/* ───────────────────────── Step 3: Condition & Quantity ───────────────────────── */

function Step3Condition({
  form, setForm, isClubs, isVariableSize, variantSizes, totalQuantity, errors,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  isClubs: boolean;
  isVariableSize: boolean;
  variantSizes: string[];
  totalQuantity: number;
  errors: Record<string, string>;
}) {
  return (
    <>
      <SectionTitle>Condition</SectionTitle>
      {isClubs ? (
        <>
          <ConditionSlider
            label="Head"
            value={form.conditionHead}
            onChange={v => setForm(f => ({ ...f, conditionHead: v }))}
          />
          <ConditionSlider
            label="Shaft"
            value={form.conditionShaft}
            onChange={v => setForm(f => ({ ...f, conditionShaft: v }))}
          />
          <ConditionSlider
            label="Grip"
            value={form.conditionGrip}
            onChange={v => setForm(f => ({ ...f, conditionGrip: v }))}
          />
        </>
      ) : (
        <ConditionSlider
          label="Overall"
          value={form.conditionOverall}
          onChange={v => setForm(f => ({ ...f, conditionOverall: v }))}
        />
      )}

      <SectionTitle style={{ marginTop: 32 }}>Quantity</SectionTitle>

      {isVariableSize ? (
        <>
          <p style={{ fontSize: 13, color: PALETTE.textLight, margin: '0 0 12px' }}>
            Enter quantity per size (leave 0 for sizes you don&apos;t have).
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
            gap: 12,
          }}>
            {variantSizes.map(size => (
              <Field key={size} label={size}>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.sizeQuantities[size] ?? 0}
                  onChange={e => {
                    const n = Math.max(0, parseInt(e.target.value || '0', 10));
                    setForm(f => ({
                      ...f,
                      sizeQuantities: { ...f.sizeQuantities, [size]: isNaN(n) ? 0 : n },
                    }));
                  }}
                  style={inputStyle}
                />
              </Field>
            ))}
          </div>
          <p style={{ fontSize: 13, color: PALETTE.textMid, marginTop: 8 }}>
            Total: <strong>{totalQuantity}</strong>
          </p>
          {errors.quantity && <ErrorText>{errors.quantity}</ErrorText>}
        </>
      ) : (
        <Field label="How many do you have?" error={errors.quantity}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))}
              style={stepperBtn}
            >−</button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={999}
              value={form.quantity}
              onChange={e => {
                const n = parseInt(e.target.value || '1', 10);
                setForm(f => ({ ...f, quantity: isNaN(n) ? 1 : Math.min(999, Math.max(1, n)) }));
              }}
              style={{ ...inputStyle, width: 80, textAlign: 'center' }}
            />
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, quantity: Math.min(999, f.quantity + 1) }))}
              style={stepperBtn}
            >+</button>
          </div>
        </Field>
      )}
    </>
  );
}

function ConditionSlider({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  const colour = CONDITION_COLOURS[value] || CONDITION_COLOURS[3];
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: PALETTE.textDark }}>{label}</span>
        <span style={{
          backgroundColor: colour.bg, color: '#fff',
          padding: '4px 10px', borderRadius: 999,
          fontSize: 12, fontWeight: 600,
        }}>
          {colour.label}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        style={{ width: '100%', accentColor: PALETTE.green }}
      />
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: PALETTE.textLight, marginTop: 4,
      }}>
        {[1, 2, 3, 4, 5].map(n => (
          <span key={n} style={{ flex: 1, textAlign: 'center' }}>
            {CONDITION_LABELS[n]}
          </span>
        ))}
      </div>
      <p style={{ fontSize: 12, color: PALETTE.textLight, margin: '6px 0 0' }}>
        {colour.description}
      </p>
    </div>
  );
}

/* ───────────────────────── Step 4: Photos ───────────────────────── */

function Step4Photos({
  form, fileInputRef, onAdd, onRemove, onMove, errors,
}: {
  form: FormState;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onAdd: (files: FileList | File[]) => void;
  onRemove: (id: string) => void;
  onMove: (from: number, to: number) => void;
  errors: Record<string, string>;
}) {
  const [dragging, setDragging] = useState(false);
  const slotsLeft = MAX_IMAGES - form.images.length;

  return (
    <>
      <SectionTitle>Photos</SectionTitle>
      <p style={{ fontSize: 13, color: PALETTE.textLight, margin: '0 0 16px' }}>
        Add up to {MAX_IMAGES} photos. The first photo is your main image.
      </p>

      {slotsLeft > 0 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files?.length) onAdd(e.dataTransfer.files);
          }}
          style={{
            border: `2px dashed ${dragging ? PALETTE.green : PALETTE.borderStrong}`,
            borderRadius: 12,
            padding: 32,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: dragging ? PALETTE.selectedBg : '#FAFAF7',
            transition: 'all 0.15s',
          }}
        >
          <Upload size={28} color={PALETTE.textMid} style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 14, color: PALETTE.textDark, fontWeight: 600 }}>
            Drag photos here or click to browse
          </div>
          <div style={{ fontSize: 12, color: PALETTE.textLight, marginTop: 4 }}>
            JPEG, PNG, HEIC, WebP · {slotsLeft} slot{slotsLeft === 1 ? '' : 's'} left
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            multiple
            onChange={e => {
              if (e.target.files) onAdd(e.target.files);
              e.target.value = '';
            }}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {form.images.length > 0 && (
        <div style={{
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
        }}>
          {form.images.map((img, idx) => (
            <div key={img.id} style={{
              position: 'relative',
              aspectRatio: '1 / 1',
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: '#F3F4F6',
              border: `1px solid ${PALETTE.border}`,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previewUrl}
                alt={img.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {idx === 0 && (
                <span style={{
                  position: 'absolute', top: 6, left: 6,
                  backgroundColor: PALETTE.green, color: '#fff',
                  fontSize: 10, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 999,
                }}>Main</span>
              )}
              <button
                type="button"
                onClick={() => onRemove(img.id)}
                aria-label="Remove image"
                style={{
                  position: 'absolute', top: 6, right: 6,
                  backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
                  border: 'none', width: 24, height: 24, borderRadius: 999,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                backgroundColor: 'rgba(0,0,0,0.55)',
                display: 'flex', justifyContent: 'space-between',
                padding: '4px 6px',
              }}>
                <button
                  type="button"
                  onClick={() => onMove(idx, idx - 1)}
                  disabled={idx === 0}
                  style={tinyIconBtn(idx === 0)}
                  aria-label="Move left"
                >
                  <ChevronLeft size={14} />
                </button>
                <GripVertical size={14} color="#fff" />
                <button
                  type="button"
                  onClick={() => onMove(idx, idx + 1)}
                  disabled={idx === form.images.length - 1}
                  style={tinyIconBtn(idx === form.images.length - 1)}
                  aria-label="Move right"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {errors.images && <ErrorText style={{ marginTop: 12 }}>{errors.images}</ErrorText>}
    </>
  );
}

/* ───────────────────────── Step 5: Price & Shipping ───────────────────────── */

function Step5PriceShipping({
  form, setForm, buyerPrice, selectedParcel, errors, onJump,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  buyerPrice: number | null;
  selectedParcel: ParcelOption | null;
  errors: Record<string, string>;
  onJump: (s: number) => void;
}) {
  return (
    <>
      <SectionTitle>Price</SectionTitle>
      <Field label="Your price" required error={errors.price}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', color: PALETTE.textMid, fontWeight: 600,
          }}>£</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0.5}
            max={50000}
            value={form.price}
            onChange={e => {
              // Limit to 2 decimal places
              const v = e.target.value;
              if (/^\d{0,7}(\.\d{0,2})?$/.test(v) || v === '') {
                setForm(f => ({ ...f, price: v }));
              }
            }}
            placeholder="0.00"
            style={{ ...inputStyle, paddingLeft: 28 }}
          />
        </div>
      </Field>

      {buyerPrice !== null && (
        <p style={{ fontSize: 13, color: PALETTE.green, fontWeight: 600, marginTop: -8, marginBottom: 16 }}>
          Buyers will pay £{buyerPrice.toFixed(2)} (inc. buyer protection)
        </p>
      )}

      <Field label="Allow buyers to make offers?">
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.isNegotiable}
            onChange={e => setForm(f => ({ ...f, isNegotiable: e.target.checked }))}
            style={{ width: 18, height: 18, accentColor: PALETTE.green }}
          />
          <span style={{ fontSize: 14, color: PALETTE.textMid }}>
            {form.isNegotiable ? 'Yes — buyers can negotiate' : 'No — fixed price only'}
          </span>
        </label>
      </Field>

      <SectionTitle style={{ marginTop: 32 }}>Shipping</SectionTitle>
      <p style={{ fontSize: 13, color: PALETTE.textLight, margin: '0 0 12px' }}>
        Pick a parcel size — shipping cost is set automatically.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
      }}>
        {PARCEL_SIZES.map(p => {
          const selected = form.parcelSize === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setForm(f => ({ ...f, parcelSize: p.id }))}
              style={{
                textAlign: 'left',
                backgroundColor: selected ? PALETTE.selectedBg : '#fff',
                border: `2px solid ${selected ? PALETTE.green : PALETTE.border}`,
                borderRadius: 10,
                padding: 12,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'baseline', marginBottom: 4,
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: PALETTE.textDark }}>{p.name}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: PALETTE.green }}>£{p.price.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: 11, color: PALETTE.textLight, lineHeight: 1.3 }}>
                {p.description}
              </div>
            </button>
          );
        })}
      </div>
      {errors.parcelSize && <ErrorText style={{ marginTop: 8 }}>{errors.parcelSize}</ErrorText>}

      {selectedParcel && (
        <div style={{
          marginTop: 12, padding: 12, backgroundColor: '#F9FAFB',
          borderRadius: 8, fontSize: 13, color: PALETTE.textMid,
        }}>
          Shipping cost: <strong>£{selectedParcel.price.toFixed(2)}</strong> (locked to parcel size)
        </div>
      )}

      <SectionTitle style={{ marginTop: 32 }}>Review</SectionTitle>
      <div style={{
        backgroundColor: '#F9FAFB', borderRadius: 10, padding: 16,
        display: 'grid', gap: 10, fontSize: 13, color: PALETTE.textMid,
      }}>
        <ReviewRow label="Title" value={form.title} onEdit={() => onJump(1)} />
        <ReviewRow label="Category" value={`${form.category} › ${form.subcategory}`} onEdit={() => onJump(1)} />
        <ReviewRow
          label="Brand"
          value={(() => {
            const b = form.brandIsOther ? form.customBrand : form.brand;
            const m = form.modelIsOther ? form.customModel : form.model;
            return b + (m ? ` · ${m}` : '');
          })()}
          onEdit={() => onJump(2)}
        />
        <ReviewRow label="Photos" value={`${form.images.length} added`} onEdit={() => onJump(4)} />
        <ReviewRow
          label="Price"
          value={`£${form.price || '0.00'}${buyerPrice ? ` (buyer pays £${buyerPrice.toFixed(2)})` : ''}`}
          onEdit={() => onJump(5)}
        />
        <ReviewRow
          label="Shipping"
          value={selectedParcel ? `${selectedParcel.name} · £${selectedParcel.price.toFixed(2)}` : 'Not selected'}
          onEdit={() => onJump(5)}
        />
      </div>
    </>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <div>
        <div style={{ fontSize: 11, color: PALETTE.textLight, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 14, color: PALETTE.textDark, fontWeight: 500 }}>{value || '—'}</div>
      </div>
      <button type="button" onClick={onEdit} style={linkBtn}>
        <Pencil size={12} /> Edit
      </button>
    </div>
  );
}

/* ───────────────────────── Generic UI bits ───────────────────────── */

function ProgressBar({ step, onJump }: { step: number; onJump: (n: number) => void }) {
  return (
    <div style={{
      display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap',
    }}>
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const isCurrent = n === step;
        const isComplete = n < step;
        const clickable = n <= step;
        return (
          <button
            key={label}
            type="button"
            disabled={!clickable}
            onClick={() => onJump(n)}
            style={{
              flex: '1 1 130px',
              minWidth: 110,
              padding: '8px 12px',
              borderRadius: 999,
              border: `2px solid ${isComplete || isCurrent ? PALETTE.green : PALETTE.border}`,
              backgroundColor: isComplete ? PALETTE.green : isCurrent ? '#fff' : '#fff',
              color: isComplete ? '#fff' : isCurrent ? PALETTE.green : PALETTE.textLight,
              fontSize: 12,
              fontWeight: 600,
              cursor: clickable ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
          >
            {isComplete ? <Check size={14} /> : <span>{n}</span>}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h2 style={{
      fontSize: 18, fontWeight: 700, color: PALETTE.textDark,
      margin: '0 0 16px', ...style,
    }}>
      {children}
    </h2>
  );
}

function Field({
  label, required, error, hint, children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: PALETTE.textDark }}>
          {label}{required && <span style={{ color: PALETTE.error, marginLeft: 4 }}>*</span>}
        </label>
        {hint && <span style={{ fontSize: 11, color: PALETTE.textLight }}>{hint}</span>}
      </div>
      {children}
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

function ErrorText({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{
      color: PALETTE.error, fontSize: 12, margin: '6px 0 0',
      display: 'flex', alignItems: 'center', gap: 4, ...style,
    }}>
      <AlertCircle size={12} /> {children}
    </p>
  );
}

function Row2({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 16,
    }}>
      {children}
    </div>
  );
}

function ButtonRow({
  options, value, onChange,
}: { options: string[]; value?: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => {
        const active = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            style={chipStyle(active)}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function ModelField({
  form, setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const effectiveBrand = form.brandIsOther ? form.customBrand.trim() : form.brand;
  const showDropdown = !!effectiveBrand && !form.brandIsOther && hasModelsFor(form.category, form.subcategory, effectiveBrand);
  const models = useMemo(
    () => (showDropdown ? getModelsFor(form.category, form.subcategory, effectiveBrand) : []),
    [showDropdown, form.category, form.subcategory, effectiveBrand],
  );

  if (showDropdown) {
    return (
      <Field label="Model" hint="Optional — pick from the list or choose Other">
        <SearchableCombobox
          options={models}
          value={form.model}
          placeholder="Search models…"
          onChange={(v) => setForm(f => ({
            ...f,
            model: v,
            modelIsOther: v === 'Other',
            customModel: v === 'Other' ? f.customModel : '',
          }))}
        />
        {form.modelIsOther && (
          <input
            type="text"
            value={form.customModel}
            onChange={e => setForm(f => ({ ...f, customModel: e.target.value.slice(0, 100) }))}
            placeholder="Enter model name"
            style={{ ...inputStyle, marginTop: 8 }}
            maxLength={100}
          />
        )}
      </Field>
    );
  }

  // No model data for this combination — free text
  return (
    <Field label="Model" hint="Optional — but helps buyers find your item">
      <input
        type="text"
        value={form.model}
        onChange={e => setForm(f => ({ ...f, model: e.target.value.slice(0, 100), modelIsOther: false, customModel: '' }))}
        placeholder="e.g. T100, Stealth 2, Pro V1"
        style={inputStyle}
        maxLength={100}
      />
    </Field>
  );
}

function SearchableCombobox({
  options, value, onChange, placeholder,
}: { options: string[]; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(o => o.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={open ? query : value}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { setQuery(''); setOpen(true); }}
        placeholder={placeholder || 'Search…'}
        style={inputStyle}
      />
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          marginTop: 4, backgroundColor: '#fff',
          border: `1px solid ${PALETTE.border}`, borderRadius: 8,
          maxHeight: 240, overflowY: 'auto', zIndex: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>
          {filtered.length === 0 && (
            <div style={{ padding: 12, fontSize: 13, color: PALETTE.textLight }}>
              No matches
            </div>
          )}
          {filtered.map(o => (
            <button
              key={o}
              type="button"
              onClick={() => { onChange(o); setOpen(false); setQuery(''); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', backgroundColor: value === o ? PALETTE.selectedBg : '#fff',
                border: 'none', cursor: 'pointer', fontSize: 14, color: PALETTE.textDark,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F3F4F6'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = value === o ? PALETTE.selectedBg : '#fff'; }}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Helpers ───────────────────────── */

async function resizeImage(file: File): Promise<{ file: File; dataUrl: string }> {
  const MAX = 2000;
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const scale = Math.min(MAX / width, MAX / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          blob => {
            if (!blob) return reject(new Error('Resize failed'));
            const resized = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve({ file: resized, dataUrl });
          },
          'image/jpeg',
          0.85,
        );
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

/* ───────────────────────── Styles ───────────────────────── */

const cardStyle: React.CSSProperties = {
  backgroundColor: PALETTE.card,
  borderRadius: 12,
  padding: 24,
  border: `1px solid ${PALETTE.border}`,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  border: `1px solid ${PALETTE.border}`,
  borderRadius: 8,
  fontSize: 14,
  color: PALETTE.textDark,
  backgroundColor: PALETTE.inputBg,
  outline: 'none',
  boxSizing: 'border-box',
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 14px',
    borderRadius: 8,
    border: `1px solid ${active ? PALETTE.green : PALETTE.border}`,
    backgroundColor: active ? PALETTE.green : '#fff',
    color: active ? '#fff' : PALETTE.textMid,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  };
}

function btnPrimary(disabled: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '12px 20px', borderRadius: 8, border: 'none',
    backgroundColor: disabled ? '#9ca3af' : PALETTE.green,
    color: '#fff', fontSize: 14, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}

function btnSecondary(disabled: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '12px 20px', borderRadius: 8,
    border: `1px solid ${PALETTE.borderStrong}`,
    backgroundColor: '#fff', color: PALETTE.textMid,
    fontSize: 14, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  };
}

const stepperBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 8,
  border: `1px solid ${PALETTE.border}`,
  backgroundColor: '#fff', color: PALETTE.textDark,
  fontSize: 18, fontWeight: 700, cursor: 'pointer',
};

function tinyIconBtn(disabled: boolean): React.CSSProperties {
  return {
    background: 'transparent', border: 'none',
    color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
  };
}

const linkBtn: React.CSSProperties = {
  background: 'none', border: 'none',
  color: PALETTE.blue, fontSize: 12, fontWeight: 600,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
};

const toastStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  backgroundColor: '#ECFDF5', color: '#065F46',
  padding: '10px 14px', borderRadius: 8,
  border: `1px solid #A7F3D0`, fontSize: 13, fontWeight: 600,
  marginBottom: 16,
};

const errorBoxStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  backgroundColor: PALETTE.errorBg, color: PALETTE.error,
  padding: '12px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  backgroundColor: 'rgba(255,255,255,0.85)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
};
