'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Upload, X, Loader2, AlertCircle, Check,
  ChevronLeft, ChevronRight, GripVertical,
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
import {
  getModelsFor, hasModelsFor,
  getShaftBrands, getShaftModels, hasShaftModels,
} from '@/lib/models';
import {
  getListing, updateListing, uploadListingImage, deleteListingImage,
  type UpdateListingData, type ListingImage,
} from '@mulligans/api-client';

/* ───────────────────────── Constants ───────────────────────── */

const CLOUDFRONT_BASE = 'https://d1bhj4xuvi3dve.cloudfront.net/';
const MAX_IMAGES = 5;

const PALETTE = {
  card: '#FFFFFF',
  green: '#1DC690',
  blue: '#278AB0',
  textDark: '#111827',
  textMid: '#374151',
  textLight: '#6B7280',
  border: '#E0E0E0',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  inputBg: '#FFFFFF',
  selectedBg: '#ECFDF5',
};

/* ───────────────────────── Types ───────────────────────── */

type Specifications = Record<string, unknown>;

interface EditFormState {
  title: string;
  description: string;
  location: string;
  brand: string;
  brandIsOther: boolean;
  customBrand: string;
  model: string;
  modelIsOther: boolean;
  customModel: string;
  shaftBrand: string;
  shaftBrandIsOther: boolean;
  customShaftBrand: string;
  shaftModel: string;
  shaftModelIsOther: boolean;
  customShaftModel: string;
  specs: Specifications;
  conditionOverall: number;
  conditionHead: number;
  conditionShaft: number;
  conditionGrip: number;
  quantity: number;
  sizeQuantities: Record<string, number>;
  price: string;
  isNegotiable: boolean;
  parcelSize: ParcelOption['id'] | '';
}

function emptyForm(): EditFormState {
  return {
    title: '',
    description: '',
    location: '',
    brand: '',
    brandIsOther: false,
    customBrand: '',
    model: '',
    modelIsOther: false,
    customModel: '',
    shaftBrand: '',
    shaftBrandIsOther: false,
    customShaftBrand: '',
    shaftModel: '',
    shaftModelIsOther: false,
    customShaftModel: '',
    specs: {},
    conditionOverall: 3,
    conditionHead: 3,
    conditionShaft: 3,
    conditionGrip: 3,
    quantity: 1,
    sizeQuantities: {},
    price: '',
    isNegotiable: true,
    parcelSize: '',
  };
}

/* ───────────────────────── Helpers ───────────────────────── */

function buildImageUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith('http')) return key;
  return `${CLOUDFRONT_BASE}${key}`;
}

function shaftCascadeApplies(category: string, subcategory: string | null | undefined): boolean {
  if (category === 'Clubs') return true;
  if (category === 'Shafts, Grips & Heads' && subcategory === 'Shafts') return true;
  return false;
}

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

/* ───────────────────────── Page ───────────────────────── */

export default function EditListingPage() {
  const params = useParams() as { id: string };
  const listingId = params.id;
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<'not_owner' | 'not_editable' | 'fetch_failed' | null>(null);
  const [listingCategory, setListingCategory] = useState('');
  const [listingSubcategory, setListingSubcategory] = useState('');
  const [form, setForm] = useState<EditFormState>(emptyForm);
  const [formReady, setFormReady] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [images, setImages] = useState<ListingImage[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [toast, setToast] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null!);

  /* Auth gate */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/login?redirect=/listings/${listingId}/edit`);
    }
  }, [authLoading, isAuthenticated, router, listingId]);

  /* Fetch listing */
  useEffect(() => {
    if (!isAuthenticated || !listingId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await getListing(listingId);
        const d = (res as any)?.listing ?? (res as any)?.data?.listing ?? (res as any)?.data ?? res;
        if (cancelled) return;

        if (d.seller_id !== user?.id) {
          setPageError('not_owner');
          setLoading(false);
          return;
        }

        if (!['active', 'draft'].includes(d.status)) {
          setPageError('not_editable');
          setLoading(false);
          return;
        }

        setListingCategory(d.category || '');
        setListingSubcategory(d.subcategory || '');
        setImages(
          [...(d.images || [])].sort(
            (a: ListingImage, b: ListingImage) => (a.display_order ?? 0) - (b.display_order ?? 0),
          ),
        );
        populateForm(d);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setPageError('fetch_failed');
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, listingId, user?.id]);

  function populateForm(d: any) {
    const specs: Specifications = (typeof d.specifications === 'object' && d.specifications)
      ? { ...d.specifications }
      : {};

    if (!Object.keys(specs).length && Array.isArray(d.listing_attributes)) {
      for (const attr of d.listing_attributes) {
        if (attr.key === 'setMakeup') {
          if (!Array.isArray(specs.setMakeup)) specs.setMakeup = [];
          (specs.setMakeup as string[]).push(attr.value);
        } else {
          specs[attr.key] = attr.value;
        }
      }
    }

    const category = d.category || '';
    const subcategory = d.subcategory || '';
    const brands = getBrandsFor(category, subcategory);
    const brandInList = brands.includes(d.brand || '');

    let modelInList = false;
    let modelVal = d.model || '';
    if (brandInList && d.brand && hasModelsFor(category, subcategory, d.brand)) {
      const models = getModelsFor(category, subcategory, d.brand);
      modelInList = models.includes(modelVal);
    }

    let shaftBrandVal = (specs.shaftBrand as string) || '';
    let shaftBrandIsOther = false;
    let customShaftBrandVal = '';
    let shaftModelVal = (specs.shaftModel as string) || '';
    let shaftModelIsOther = false;
    let customShaftModelVal = '';

    if (shaftCascadeApplies(category, subcategory) && shaftBrandVal) {
      const clubSub = category === 'Clubs' ? subcategory : null;
      const shaftBrands = getShaftBrands(clubSub);
      if (shaftBrands.includes(shaftBrandVal)) {
        shaftBrandIsOther = false;
      } else {
        shaftBrandIsOther = true;
        customShaftBrandVal = shaftBrandVal;
        shaftBrandVal = 'Other';
      }

      if (shaftModelVal && !shaftBrandIsOther && hasShaftModels(shaftBrandVal, clubSub)) {
        const shaftModels = getShaftModels(shaftBrandVal, clubSub);
        if (shaftModels.includes(shaftModelVal)) {
          shaftModelIsOther = false;
        } else {
          shaftModelIsOther = true;
          customShaftModelVal = shaftModelVal;
          shaftModelVal = 'Other';
        }
      }
    }

    const cleanSpecs = { ...specs };
    delete cleanSpecs.shaftBrand;
    delete cleanSpecs.shaftModel;
    const sizeQty = (cleanSpecs.sizeQuantities as Record<string, number>) || {};
    delete cleanSpecs.sizeQuantities;

    const priceRaw = d.price != null ? String(d.price) : '';
    const priceNum = parseFloat(priceRaw);

    setForm({
      title: d.title || '',
      description: d.description || '',
      location: d.location || '',
      brand: brandInList ? (d.brand || '') : '',
      brandIsOther: !brandInList && !!d.brand,
      customBrand: !brandInList ? (d.brand || '') : '',
      model: modelInList ? modelVal : (!brandInList ? '' : modelVal),
      modelIsOther: !modelInList && !!modelVal && brandInList && hasModelsFor(category, subcategory, d.brand || ''),
      customModel: (!modelInList && brandInList && hasModelsFor(category, subcategory, d.brand || '')) ? modelVal : '',
      shaftBrand: shaftBrandIsOther ? 'Other' : shaftBrandVal,
      shaftBrandIsOther,
      customShaftBrand: customShaftBrandVal,
      shaftModel: shaftModelIsOther ? 'Other' : shaftModelVal,
      shaftModelIsOther,
      customShaftModel: customShaftModelVal,
      specs: cleanSpecs,
      conditionOverall: d.condition_overall ?? 3,
      conditionHead: d.condition_head ?? 3,
      conditionShaft: d.condition_shaft ?? 3,
      conditionGrip: d.condition_grip ?? 3,
      quantity: d.quantity ?? 1,
      sizeQuantities: sizeQty,
      price: !isNaN(priceNum) ? String(priceNum) : '',
      isNegotiable: d.is_negotiable ?? true,
      parcelSize: d.parcel_size || '',
    });
    setFormReady(true);
  }

  /* ───── Derived ───── */
  const subcategories = useMemo(
    () => (listingCategory ? SUBCATEGORIES[listingCategory] || [] : []),
    [listingCategory],
  );
  const specFields = useMemo<SpecField[]>(
    () => specFieldsFor(listingCategory, listingSubcategory),
    [listingCategory, listingSubcategory],
  );
  const brandList = useMemo(
    () => getBrandsFor(listingCategory, listingSubcategory),
    [listingCategory, listingSubcategory],
  );
  const isClubs = listingCategory === 'Clubs';
  const isVariableSize = (
    (listingCategory === 'Clothing' && listingSubcategory !== 'Gloves' && form.specs.size === 'Various') ||
    (listingCategory === 'Shoes' && form.specs.shoeSize === 'Various')
  );
  const variantSizes = useMemo(
    () => variantSizesFor(listingCategory, listingSubcategory),
    [listingCategory, listingSubcategory],
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

  /* ───── Validation ───── */
  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (form.title.trim().length < 3) e.title = 'Title must be at least 3 characters';
    if (form.title.length > 200) e.title = 'Title must be 200 characters or fewer';
    if (form.description.trim().length < 10) e.description = 'Description must be at least 10 characters';
    if (form.description.length > 5000) e.description = 'Description must be 5000 characters or fewer';
    const effectiveBrand = form.brandIsOther ? form.customBrand.trim() : form.brand;
    if (!effectiveBrand) e.brand = 'Pick a brand';
    if (isVariableSize) {
      if (totalQuantity < 1) e.quantity = 'Add quantity for at least one size';
    } else if (form.quantity < 1) {
      e.quantity = 'Quantity must be at least 1';
    }
    if (isNaN(priceNum) || priceNum < 0.5) e.price = 'Price must be at least 0.50';
    else if (priceNum > 50_000) e.price = 'Price must be 50,000 or less';
    if (!form.parcelSize) e.parcelSize = 'Pick a parcel size';
    return e;
  }

  /* ───── Image handlers ───── */
  async function handleNewImages(files: FileList | File[]) {
    const arr = Array.from(files);
    const slotsLeft = MAX_IMAGES - images.length;
    if (slotsLeft <= 0) return;
    const toAdd = arr.slice(0, slotsLeft);

    for (const file of toAdd) {
      setUploadingCount(c => c + 1);
      try {
        const resized = await resizeImage(file);
        await uploadListingImage(listingId, resized.file);
        const res = await getListing(listingId);
        const d = (res as any)?.listing ?? (res as any)?.data?.listing ?? (res as any)?.data ?? res;
        setImages(
          [...(d.images || [])].sort(
            (a: ListingImage, b: ListingImage) => (a.display_order ?? 0) - (b.display_order ?? 0),
          ),
        );
      } catch {
        showToast('Failed to upload image');
      } finally {
        setUploadingCount(c => c - 1);
      }
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!confirm('Remove this photo?')) return;
    try {
      await deleteListingImage(listingId, imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch {
      showToast('Failed to remove image');
    }
  }

  /* ───── Submit ───── */
  function handleSaveClick() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setShowConfirm(true);
  }

  async function handleConfirmSave() {
    setShowConfirm(false);
    setSubmitting(true);
    setErrors({});

    try {
      const effectiveBrand = form.brandIsOther ? form.customBrand.trim() : form.brand;
      const specifications: Specifications = { ...form.specs };
      if (isVariableSize) specifications.sizeQuantities = form.sizeQuantities;

      if (shaftCascadeApplies(listingCategory, listingSubcategory)) {
        const effectiveShaftBrand = form.shaftBrandIsOther ? form.customShaftBrand.trim() : form.shaftBrand;
        const effectiveShaftModel = form.shaftModelIsOther ? form.customShaftModel.trim() : form.shaftModel;
        if (effectiveShaftBrand) specifications.shaftBrand = effectiveShaftBrand;
        if (effectiveShaftModel && effectiveShaftModel !== 'Other') specifications.shaftModel = effectiveShaftModel;
      }

      const payload: UpdateListingData = {
        title: form.title.trim(),
        description: form.description.trim(),
        brand: effectiveBrand || undefined,
        model: (form.modelIsOther ? form.customModel.trim() : form.model.trim()) || undefined,
        price: priceNum,
        location: form.location.trim() || 'UK',
        is_negotiable: form.isNegotiable,
        parcel_size: form.parcelSize || undefined,
        shipping_cost: selectedParcel?.price,
        quantity: isVariableSize ? totalQuantity : form.quantity,
        specifications: Object.keys(specifications).length ? specifications : undefined,
      };

      if (isClubs) {
        payload.condition_head = form.conditionHead;
        payload.condition_shaft = form.conditionShaft;
        payload.condition_grip = form.conditionGrip;
      } else {
        payload.condition_overall = form.conditionOverall;
      }

      await updateListing(listingId, payload);
      showToast('Listing updated');
      setTimeout(() => router.push(`/listings/${listingId}`), 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setErrors({ submit: `Failed to save: ${msg}` });
      setSubmitting(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  /* ───── Loading / auth gate ───── */
  if (authLoading || (!isAuthenticated && !pageError)) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} color={PALETTE.green} className="animate-spin" />
      </div>
    );
  }

  /* ───── Loading skeleton ───── */
  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', padding: '24px 16px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              style={{
                backgroundColor: '#F7F7F5',
                borderRadius: 14,
                height: i === 1 ? 80 : i === 4 ? 200 : 140,
                marginBottom: 16,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>
    );
  }

  /* ───── Error states ───── */
  if (pageError === 'not_owner') {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', padding: '24px 16px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <ErrorCard
            title="Access Denied"
            message="You can only edit your own listings."
            linkHref="/"
            linkLabel="Go home"
          />
        </div>
      </div>
    );
  }

  if (pageError === 'not_editable') {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', padding: '24px 16px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <ErrorCard
            title="Not Editable"
            message="This listing cannot be edited in its current state."
            linkHref={`/listings/${listingId}`}
            linkLabel="View listing"
          />
        </div>
      </div>
    );
  }

  if (pageError === 'fetch_failed') {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', padding: '24px 16px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <ErrorCard
            title="Something went wrong"
            message="Could not load this listing. Please try again."
            linkHref="/"
            linkLabel="Go home"
          />
        </div>
      </div>
    );
  }

  if (!formReady) return null;

  /* ───── Render ───── */
  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', padding: '24px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Back link */}
        <Link
          href={`/listings/${listingId}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: PALETTE.blue, fontWeight: 600,
            textDecoration: 'none', marginBottom: 16,
          }}
        >
          <ArrowLeft size={16} /> Back to listing
        </Link>

        <PageHeader title="Edit Listing" />

        {/* Toast */}
        {toast && (
          <div style={toastStyle}>
            <Check size={16} />
            <span>{toast}</span>
          </div>
        )}

        {/* Photos */}
        <div style={cardStyle}>
          <SectionLabel>Photos</SectionLabel>
          <p style={{ fontSize: 13, color: PALETTE.textLight, margin: '0 0 16px' }}>
            {MAX_IMAGES - images.length - uploadingCount > 0
              ? `Add up to ${MAX_IMAGES} photos. The first photo is your main image.`
              : 'Maximum photos reached.'}
          </p>

          {images.length + uploadingCount < MAX_IMAGES && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); }}
              onDrop={e => {
                e.preventDefault();
                if (e.dataTransfer.files?.length) handleNewImages(e.dataTransfer.files);
              }}
              style={dropzoneStyle}
            >
              <Upload size={28} color={PALETTE.textMid} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 14, color: PALETTE.textDark, fontWeight: 600 }}>
                Drag photos here or click to browse
              </div>
              <div style={{ fontSize: 12, color: PALETTE.textLight, marginTop: 4 }}>
                JPEG, PNG, HEIC, WebP
                {' '}&middot; {MAX_IMAGES - images.length - uploadingCount} slot{MAX_IMAGES - images.length - uploadingCount === 1 ? '' : 's'} left
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                multiple
                onChange={e => {
                  if (e.target.files) handleNewImages(e.target.files);
                  e.target.value = '';
                }}
                style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
              />
            </div>
          )}

          {(images.length > 0 || uploadingCount > 0) && (
            <div style={{
              marginTop: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 12,
            }}>
              {images.map((img, idx) => (
                <div key={img.id} style={imageThumbWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={buildImageUrl(img.s3_key) || buildImageUrl(img.image_url) || ''}
                    alt={`Photo ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {idx === 0 && (
                    <span style={mainBadge}>Main</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.id)}
                    aria-label="Remove image"
                    style={removeImageBtn}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {Array.from({ length: uploadingCount }).map((_, i) => (
                <div key={`uploading-${i}`} style={{
                  ...imageThumbWrap,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: '#F3F4F6',
                }}>
                  <Loader2 size={24} color={PALETTE.green} className="animate-spin" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Basics */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <SectionLabel>Basics</SectionLabel>

          <Row2>
            <Field label="Category">
              <div style={readOnlyFieldStyle}>
                {listingCategory || '-'}
              </div>
            </Field>
            <Field label="Subcategory">
              <div style={readOnlyFieldStyle}>
                {listingSubcategory || '-'}
              </div>
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
              placeholder="Describe your item — condition, why you're selling, any wear/damage..."
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
        </div>

        {/* Details & Specifications */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <SectionLabel>Details &amp; Specifications</SectionLabel>

          <Field label="Brand" required error={errors.brand}>
            <SearchableCombobox
              options={brandList}
              value={form.brand}
              placeholder="Search brands..."
              onChange={(v) => setForm(f => ({
                ...f,
                brand: v,
                brandIsOther: v === 'Other',
                customBrand: v === 'Other' ? f.customBrand : '',
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

          <ModelField
            form={form}
            setForm={setForm}
            category={listingCategory}
            subcategory={listingSubcategory}
          />

          {shaftCascadeApplies(listingCategory, listingSubcategory) && (
            <ShaftCascade
              form={form}
              setForm={setForm}
              category={listingCategory}
              subcategory={listingSubcategory}
            />
          )}

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
                  onChange={(v) => setForm(f => ({ ...f, specs: { ...f.specs, [field.key]: v } }))}
                  onToggleMulti={(opt) => {
                    setForm(f => {
                      const cur = Array.isArray(f.specs[field.key]) ? (f.specs[field.key] as string[]) : [];
                      const next = cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt];
                      return { ...f, specs: { ...f.specs, [field.key]: next } };
                    });
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Condition & Quantity */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <SectionLabel>Condition</SectionLabel>
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

          <SectionLabel style={{ marginTop: 32 }}>Quantity</SectionLabel>

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
                >-</button>
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
        </div>

        {/* Price & Shipping */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <SectionLabel>Price</SectionLabel>
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
                {form.isNegotiable ? 'Yes -- buyers can negotiate' : 'No -- fixed price only'}
              </span>
            </label>
          </Field>

          <SectionLabel style={{ marginTop: 32 }}>Shipping</SectionLabel>
          <p style={{ fontSize: 13, color: PALETTE.textLight, margin: '0 0 12px' }}>
            Pick a parcel size -- shipping cost is set automatically.
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
                    textAlign: 'left' as const,
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
                    <span style={{ fontSize: 14, fontWeight: 600, color: PALETTE.textDark }}>{p.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: PALETTE.green }}>
                      £{p.price.toFixed(2)}
                    </span>
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
        </div>

        {/* Submit error */}
        {errors.submit && (
          <div style={{ ...errorBoxStyle, marginTop: 16 }}>
            <AlertCircle size={16} />
            <span>{errors.submit}</span>
          </div>
        )}

        {/* Save button */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={submitting || uploadingCount > 0}
            style={ctaButtonStyle(submitting || uploadingCount > 0)}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>Save Changes</>
            )}
          </button>
        </div>

      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div style={overlayStyle} onClick={() => setShowConfirm(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: PALETTE.textDark, margin: '0 0 8px' }}>
              Save Changes?
            </h3>
            <p style={{ fontSize: 14, color: PALETTE.textMid, margin: '0 0 24px', lineHeight: 1.5 }}>
              Update your listing with these changes? Your listing will remain active.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                style={btnSecondary}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                style={ctaButtonStyle(false)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submitting overlay */}
      {submitting && (
        <div style={overlayStyle}>
          <div style={{ textAlign: 'center', color: PALETTE.textDark }}>
            <Loader2 size={36} color={PALETTE.green} className="animate-spin" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 600 }}>Saving changes...</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Sub-components ───────────────────────── */

function ErrorCard({
  title, message, linkHref, linkLabel,
}: { title: string; message: string; linkHref: string; linkLabel: string }) {
  return (
    <div style={{
      ...cardStyle,
      textAlign: 'center' as const,
      padding: 40,
      marginTop: 40,
    }}>
      <AlertCircle size={40} color={PALETTE.error} style={{ marginBottom: 16 }} />
      <h2 style={{ fontSize: 20, fontWeight: 600, color: PALETTE.textDark, margin: '0 0 8px' }}>
        {title}
      </h2>
      <p style={{ fontSize: 14, color: PALETTE.textMid, margin: '0 0 20px' }}>
        {message}
      </p>
      <Link href={linkHref} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        color: PALETTE.blue, fontWeight: 600, fontSize: 14,
        textDecoration: 'none',
      }}>
        <ArrowLeft size={16} /> {linkLabel}
      </Link>
    </div>
  );
}

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h2 style={{
      fontSize: 11,
      fontWeight: 600,
      color: PALETTE.blue,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
      margin: '0 0 16px',
      ...style,
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
          <span key={n} style={{ flex: 1, textAlign: 'center' as const }}>
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
          <option value="">Select...</option>
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
  form, setForm, category, subcategory,
}: {
  form: EditFormState;
  setForm: React.Dispatch<React.SetStateAction<EditFormState>>;
  category: string;
  subcategory: string;
}) {
  const effectiveBrand = form.brandIsOther ? form.customBrand.trim() : form.brand;
  const showDropdown = !!effectiveBrand && !form.brandIsOther && hasModelsFor(category, subcategory, effectiveBrand);
  const models = useMemo(
    () => (showDropdown ? getModelsFor(category, subcategory, effectiveBrand) : []),
    [showDropdown, category, subcategory, effectiveBrand],
  );

  if (showDropdown) {
    return (
      <Field label="Model" hint="Optional -- pick from the list or choose Other">
        <SearchableCombobox
          options={models}
          value={form.model}
          placeholder="Search models..."
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

  return (
    <Field label="Model" hint="Optional -- but helps buyers find your item">
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

function ShaftCascade({
  form, setForm, category, subcategory,
}: {
  form: EditFormState;
  setForm: React.Dispatch<React.SetStateAction<EditFormState>>;
  category: string;
  subcategory: string;
}) {
  const clubSub = category === 'Clubs' ? subcategory : null;
  const shaftBrandList = useMemo(() => getShaftBrands(clubSub), [clubSub]);
  const effectiveShaftBrand = form.shaftBrandIsOther ? form.customShaftBrand.trim() : form.shaftBrand;
  const showModelDropdown = !!effectiveShaftBrand && !form.shaftBrandIsOther && hasShaftModels(effectiveShaftBrand, clubSub);
  const shaftModelList = useMemo(
    () => (showModelDropdown ? getShaftModels(effectiveShaftBrand, clubSub) : []),
    [showModelDropdown, effectiveShaftBrand, clubSub],
  );

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 16,
      marginBottom: 16,
    }}>
      <Field label="Shaft Brand" hint="Optional">
        <SearchableCombobox
          options={shaftBrandList}
          value={form.shaftBrand}
          placeholder="Search shaft brands..."
          onChange={(v) => setForm(f => ({
            ...f,
            shaftBrand: v,
            shaftBrandIsOther: v === 'Other',
            customShaftBrand: v === 'Other' ? f.customShaftBrand : '',
            shaftModel: '',
            shaftModelIsOther: false,
            customShaftModel: '',
          }))}
        />
        {form.shaftBrandIsOther && (
          <input
            type="text"
            value={form.customShaftBrand}
            onChange={e => setForm(f => ({ ...f, customShaftBrand: e.target.value.slice(0, 100) }))}
            placeholder="Enter shaft brand"
            style={{ ...inputStyle, marginTop: 8 }}
            maxLength={100}
          />
        )}
      </Field>

      {showModelDropdown ? (
        <Field label="Shaft Model" hint="Optional">
          <SearchableCombobox
            options={shaftModelList}
            value={form.shaftModel}
            placeholder="Search shaft models..."
            onChange={(v) => setForm(f => ({
              ...f,
              shaftModel: v,
              shaftModelIsOther: v === 'Other',
              customShaftModel: v === 'Other' ? f.customShaftModel : '',
            }))}
          />
          {form.shaftModelIsOther && (
            <input
              type="text"
              value={form.customShaftModel}
              onChange={e => setForm(f => ({ ...f, customShaftModel: e.target.value.slice(0, 100) }))}
              placeholder="Enter shaft model"
              style={{ ...inputStyle, marginTop: 8 }}
              maxLength={100}
            />
          )}
        </Field>
      ) : (
        <Field label="Shaft Model" hint="Optional">
          <input
            type="text"
            value={form.shaftModel}
            onChange={e => setForm(f => ({
              ...f,
              shaftModel: e.target.value.slice(0, 100),
              shaftModelIsOther: false,
              customShaftModel: '',
            }))}
            placeholder="e.g. Ventus TR Blue 6S"
            style={inputStyle}
            maxLength={100}
          />
        </Field>
      )}
    </div>
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
        placeholder={placeholder || 'Search...'}
        style={inputStyle}
      />
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          marginTop: 4, backgroundColor: '#fff',
          border: `1px solid ${PALETTE.border}`, borderRadius: 8,
          maxHeight: 240, overflowY: 'auto', zIndex: 10,
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
                display: 'block', width: '100%', textAlign: 'left' as const,
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

/* ───────────────────────── Styles ───────────────────────── */

const cardStyle: React.CSSProperties = {
  backgroundColor: PALETTE.card,
  borderRadius: 14,
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
  boxSizing: 'border-box' as const,
};

const readOnlyFieldStyle: React.CSSProperties = {
  padding: '12px',
  borderRadius: 8,
  fontSize: 14,
  color: PALETTE.textLight,
  backgroundColor: '#F7F7F5',
  border: 'none',
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

function ctaButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    height: 46,
    padding: '0 24px',
    borderRadius: 12,
    border: 'none',
    backgroundColor: disabled ? '#9ca3af' : PALETTE.green,
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}

const btnSecondary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 46,
  padding: '0 20px',
  borderRadius: 12,
  border: `1px solid ${PALETTE.border}`,
  backgroundColor: '#fff',
  color: PALETTE.textMid,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const stepperBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 8,
  border: `1px solid ${PALETTE.border}`,
  backgroundColor: '#fff',
  color: PALETTE.textDark,
  fontSize: 18,
  fontWeight: 600,
  cursor: 'pointer',
};

const dropzoneStyle: React.CSSProperties = {
  position: 'relative',
  border: `2px dashed ${PALETTE.border}`,
  borderRadius: 12,
  padding: 32,
  textAlign: 'center' as const,
  cursor: 'pointer',
  backgroundColor: '#FAFAF7',
  transition: 'all 0.15s',
};

const imageThumbWrap: React.CSSProperties = {
  position: 'relative',
  aspectRatio: '1 / 1',
  borderRadius: 8,
  overflow: 'hidden',
  backgroundColor: '#F3F4F6',
  border: `1px solid ${PALETTE.border}`,
};

const mainBadge: React.CSSProperties = {
  position: 'absolute',
  top: 6,
  left: 6,
  backgroundColor: PALETTE.green,
  color: '#fff',
  fontSize: 10,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 999,
};

const removeImageBtn: React.CSSProperties = {
  position: 'absolute',
  top: 6,
  right: 6,
  backgroundColor: 'rgba(239,68,68,0.85)',
  color: '#fff',
  border: 'none',
  width: 24,
  height: 24,
  borderRadius: 999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const toastStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  backgroundColor: '#ECFDF5',
  color: '#065F46',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #A7F3D0',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 16,
};

const errorBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  backgroundColor: PALETTE.errorBg,
  color: PALETTE.error,
  padding: '12px 14px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(255,255,255,0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 14,
  padding: 24,
  maxWidth: 420,
  width: '90%',
  border: `1px solid ${PALETTE.border}`,
};
