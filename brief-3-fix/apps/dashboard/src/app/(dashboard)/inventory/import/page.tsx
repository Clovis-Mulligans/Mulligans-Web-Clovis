'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createListing, uploadListingImage } from '@mulligans/api-client';
import type { CreateListingData } from '@mulligans/api-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ParsedRow = Record<string, string>;

type ErrorRow = {
  row: number;
  column: string;
  issue: string;
};

type RowStatus = 'draft' | 'active';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_CATEGORIES = [
  'Clubs',
  'Shafts Grips & Heads',
  'Clothing',
  'Shoes',
  'Accessories',
  'Balls',
  'Training Aids',
  'Everything Else',
];

const VALID_CONDITIONS = ['New', 'Like New', 'Very Good', 'Good', 'Fair'];
const VALID_SHIPPING = ['Small', 'Medium', 'Large', 'Extra Large', 'Oversized', 'Own Carrier'];

const CONDITION_COLOURS: Record<string, string> = {
  New: '#1DC690',
  'Like New': '#278AB0',
  'Very Good': '#2A9DBF',
  Good: '#F59E0B',
  Fair: '#9CA3AF',
};

const CONDITION_TO_NUMBER: Record<string, number> = {
  New: 5,
  'Like New': 4,
  'Very Good': 3,
  Good: 2,
  Fair: 1,
};

const SHIPPING_MAP: Record<string, { parcel_size: string; shipping_cost: number }> = {
  Small: { parcel_size: 'SMALL', shipping_cost: 3.49 },
  Medium: { parcel_size: 'MEDIUM', shipping_cost: 4.99 },
  Large: { parcel_size: 'LARGE', shipping_cost: 6.99 },
  'Extra Large': { parcel_size: 'EXTRA_LARGE', shipping_cost: 9.99 },
  Oversized: { parcel_size: 'OVERSIZED', shipping_cost: 14.99 },
  'Own Carrier': { parcel_size: 'SMALL', shipping_cost: 0 },
};

const CSV_TEMPLATE_HEADER =
  'title,description,category,condition,price,shipping_option,brand,model,club_type,shaft_flex,shaft_material,loft,lie_angle,shaft_length,dexterity,size,gender,colour,subcategory,accepts_offers,auto_decline_threshold';

// ---------------------------------------------------------------------------
// CSV Parser — handles quoted fields with embedded commas
// ---------------------------------------------------------------------------

function parseCSV(text: string): ParsedRow[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const results: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCSVLine(line);
    const row: ParsedRow = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] ?? '').trim();
    });
    results.push(row);
  }

  return results;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateRows(rows: ParsedRow[]): {
  valid: ParsedRow[];
  errors: ErrorRow[];
} {
  const valid: ParsedRow[] = [];
  const errors: ErrorRow[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // +2: 1-indexed, skipping header
    let rowHasError = false;

    const addError = (column: string, issue: string) => {
      errors.push({ row: rowNum, column, issue });
      rowHasError = true;
    };

    if (!row['title'] || !row['title'].trim()) {
      addError('title', 'Title is required');
    }
    if (!row['description'] || !row['description'].trim()) {
      addError('description', 'Description is required');
    }
    if (!row['category'] || !VALID_CATEGORIES.includes(row['category'])) {
      addError('category', `Must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }
    if (!row['condition'] || !VALID_CONDITIONS.includes(row['condition'])) {
      addError('condition', `Must be one of: ${VALID_CONDITIONS.join(', ')}`);
    }
    const price = parseFloat(row['price']);
    if (!row['price'] || isNaN(price) || price <= 0) {
      addError('price', 'Must be a positive number');
    }
    if (!row['shipping_option'] || !VALID_SHIPPING.includes(row['shipping_option'])) {
      addError('shipping_option', `Must be one of: ${VALID_SHIPPING.join(', ')}`);
    }

    if (!rowHasError) {
      valid.push(row);
    }
  });

  return { valid, errors };
}

// ---------------------------------------------------------------------------
// Inline SVG helpers
// ---------------------------------------------------------------------------

function IconDownload() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconUploadCloud() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#1DC690"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m16 16-4-4-4 4" />
    </svg>
  );
}

function IconCamera({ hasImages }: { hasImages: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={hasImages ? '#1DC690' : '#ADADAD'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#6B6B6B"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg
      className="animate-spin"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#1DC690"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current }: { current: number }) {
  const steps = ['Upload CSV', 'Assign Images', 'Review & Publish'];

  return (
    <div className="flex items-center justify-center gap-0 mt-6">
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isCompleted = stepNum < current;
        const isActive = stepNum === current;

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: isCompleted || isActive ? '#1DC690' : '#FFFFFF',
                  border: isCompleted || isActive ? 'none' : '2px solid #E0E0D8',
                }}
              >
                {isCompleted ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span
                    className="text-[0.7rem] font-bold"
                    style={{ color: isActive ? '#FFFFFF' : '#ADADAD' }}
                  >
                    {stepNum}
                  </span>
                )}
              </div>
              {/* Label */}
              <span
                className="text-[0.85rem] mt-1 whitespace-nowrap"
                style={{
                  color: isActive || isCompleted ? '#1DC690' : '#ADADAD',
                  fontWeight: isActive || isCompleted ? 600 : 400,
                }}
              >
                {label}
              </span>
            </div>

            {/* Connector line (not after last step) */}
            {idx < steps.length - 1 && (
              <div
                className="h-[2px] w-[80px] mx-2 mb-5"
                style={{ backgroundColor: isCompleted ? '#1DC690' : '#E0E0D8' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Condition Pill
// ---------------------------------------------------------------------------

function ConditionPill({ condition }: { condition: string }) {
  const colour = CONDITION_COLOURS[condition] ?? '#9CA3AF';
  return (
    <span
      className="text-white text-[0.72rem] font-semibold px-2 py-0.5"
      style={{ backgroundColor: colour, borderRadius: 999 }}
    >
      {condition}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Upload Drop Zone (reusable)
// ---------------------------------------------------------------------------

interface DropZoneProps {
  accept: string;
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  subText: string;
}

function DropZone({ accept, onFiles, multiple = false, subText }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files);
    },
    [onFiles]
  );

  return (
    <div
      className="rounded-[10px] py-12 flex flex-col items-center justify-center cursor-pointer transition-colors"
      style={{
        border: `2px dashed ${dragOver ? '#1DC690' : '#1DC690'}`,
        backgroundColor: dragOver ? 'rgba(29,198,144,0.10)' : 'rgba(29,198,144,0.04)',
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <IconUploadCloud />
      <span className="text-[#1DC690] font-semibold text-[0.9rem] mt-3">
        Click to upload or drag and drop
      </span>
      <span className="text-[#ADADAD] text-[0.8rem] mt-1">{subText}</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function ImportCSVPage() {
  const router = useRouter();

  // Step tracking
  const [step, setStep] = useState(1);

  // Step 1 state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [validRows, setValidRows] = useState<ParsedRow[]>([]);
  const [errorRows, setErrorRows] = useState<ErrorRow[]>([]);

  // Step 2 state
  const [selectedListingIndex, setSelectedListingIndex] = useState(0);
  const [listingImages, setListingImages] = useState<Map<number, File[]>>(new Map());
  const [imagePreviewUrls, setImagePreviewUrls] = useState<Map<number, string[]>>(new Map());
  const [imageError, setImageError] = useState('');

  // Step 3 state
  const [checkedRows, setCheckedRows] = useState<Set<number>>(new Set());
  const [rowStatuses, setRowStatuses] = useState<Map<number, RowStatus>>(new Map());

  // Import state
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(
    null
  );

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((urls) => {
        urls.forEach((url) => URL.revokeObjectURL(url));
      });
    };
  }, [imagePreviewUrls]);

  // ---------------------------------------------------------------------------
  // CSV download
  // ---------------------------------------------------------------------------

  function handleDownloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE_HEADER + '\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mulligans-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------------------------------------------------------------------------
  // CSV upload & parse
  // ---------------------------------------------------------------------------

  function handleCSVFiles(files: File[]) {
    const file = files[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      const { valid, errors } = validateRows(rows);
      setParsedRows(rows);
      setValidRows(valid);
      setErrorRows(errors);
    };
    reader.readAsText(file);
  }

  function handleRemoveCSV() {
    setCsvFile(null);
    setParsedRows([]);
    setValidRows([]);
    setErrorRows([]);
  }

  // ---------------------------------------------------------------------------
  // Step 2 — image assignment
  // ---------------------------------------------------------------------------

  function handleImageFiles(files: File[], listingIdx: number) {
    setImageError('');
    const current = listingImages.get(listingIdx) ?? [];
    const combined = [...current, ...files];
    if (combined.length > 4) {
      setImageError('Maximum 4 photos per listing');
      return;
    }

    // Create preview URLs
    const newUrls = files.map((f) => URL.createObjectURL(f));
    const currentUrls = imagePreviewUrls.get(listingIdx) ?? [];
    const updatedUrls = [...currentUrls, ...newUrls];

    setListingImages((prev) => {
      const next = new Map(prev);
      next.set(listingIdx, combined);
      return next;
    });
    setImagePreviewUrls((prev) => {
      const next = new Map(prev);
      next.set(listingIdx, updatedUrls);
      return next;
    });
  }

  function handleRemoveImage(listingIdx: number, imageIdx: number) {
    setListingImages((prev) => {
      const next = new Map(prev);
      const files = [...(prev.get(listingIdx) ?? [])];
      files.splice(imageIdx, 1);
      next.set(listingIdx, files);
      return next;
    });
    setImagePreviewUrls((prev) => {
      const next = new Map(prev);
      const urls = [...(prev.get(listingIdx) ?? [])];
      URL.revokeObjectURL(urls[imageIdx]);
      urls.splice(imageIdx, 1);
      next.set(listingIdx, urls);
      return next;
    });
  }

  // ---------------------------------------------------------------------------
  // Step transitions
  // ---------------------------------------------------------------------------

  function goToStep2() {
    setSelectedListingIndex(0);
    setImageError('');
    setStep(2);
  }

  function goToStep3() {
    const allIndices = new Set(validRows.map((_, i) => i));
    setCheckedRows(allIndices);
    const statuses = new Map<number, RowStatus>();
    validRows.forEach((_, i) => statuses.set(i, 'draft'));
    setRowStatuses(statuses);
    setStep(3);
  }

  // ---------------------------------------------------------------------------
  // Step 3 — checkbox toggles
  // ---------------------------------------------------------------------------

  function toggleRow(idx: number) {
    setCheckedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function selectAll() {
    setCheckedRows(new Set(validRows.map((_, i) => i)));
  }

  function deselectAll() {
    setCheckedRows(new Set());
  }

  function setRowStatus(idx: number, status: RowStatus) {
    setRowStatuses((prev) => {
      const next = new Map(prev);
      next.set(idx, status);
      return next;
    });
  }

  // ---------------------------------------------------------------------------
  // Import execution
  // ---------------------------------------------------------------------------

  async function handleImport() {
    const toImport = Array.from(checkedRows);
    if (toImport.length === 0) return;

    setImporting(true);
    setImportProgress({ current: 0, total: toImport.length });
    setImportResult(null);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < toImport.length; i++) {
      const idx = toImport[i];
      const row = validRows[idx];
      setImportProgress({ current: i + 1, total: toImport.length });

      try {
        const shipping = SHIPPING_MAP[row['shipping_option']] ?? SHIPPING_MAP['Small'];
        const status = rowStatuses.get(idx) ?? 'draft';

        // Build specifications object — only include non-empty values
        const specFields: Record<string, string> = {};
        const specKeys = [
          'club_type',
          'shaft_flex',
          'shaft_material',
          'loft',
          'lie_angle',
          'shaft_length',
          'dexterity',
          'size',
          'gender',
          'colour',
          'subcategory',
        ];
        specKeys.forEach((key) => {
          const val = row[key];
          if (val && val.trim()) specFields[key] = val.trim();
        });

        const data: CreateListingData = {
          title: row['title'],
          description: row['description'] || undefined,
          category: row['category'],
          brand: row['brand'] || undefined,
          model: row['model'] || undefined,
          price: parseFloat(row['price']),
          condition_overall: CONDITION_TO_NUMBER[row['condition']],
          is_negotiable: row['accepts_offers']?.toLowerCase() === 'true',
          parcel_size: shipping.parcel_size,
          shipping_cost: shipping.shipping_cost,
          specifications: Object.keys(specFields).length > 0 ? specFields : undefined,
          status: status,
          quantity: 1,
        };

        const listing = await createListing(data);

        // Upload images
        const images = listingImages.get(idx) ?? [];
        for (const file of images) {
          await uploadListingImage(listing.id, file);
        }

        success++;
      } catch {
        failed++;
      }
    }

    setImporting(false);
    setImportResult({ success, failed });

    if (failed === 0) {
      router.push(`/inventory?imported=true&count=${success}`);
    }
  }

  const checkedCount = checkedRows.size;
  const publishedCount = Array.from(checkedRows).filter(
    (i) => rowStatuses.get(i) === 'active'
  ).length;
  const draftCount = checkedCount - publishedCount;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Back link + Title */}
      <Link
        href="/inventory"
        className="text-[0.9rem] font-semibold"
        style={{ color: '#1DC690' }}
      >
        ← Inventory
      </Link>
      <h1
        className="text-[1.25rem] font-bold mt-1"
        style={{ color: '#0D0D0D' }}
      >
        Import Listings via CSV
      </h1>

      {/* Step Indicator */}
      <StepIndicator current={step} />

      {/* ------------------------------------------------------------------ */}
      {/* STEP 1 — UPLOAD CSV                                                 */}
      {/* ------------------------------------------------------------------ */}
      {step === 1 && (
        <div>
          {/* Template card */}
          <div
            className="mt-6 rounded-xl p-6"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            <h2 className="text-[1rem] font-bold" style={{ color: '#0D0D0D' }}>
              Download and complete the CSV template
            </h2>
            <p className="text-[0.9rem] mt-2" style={{ color: '#6B6B6B' }}>
              Fill in the template with your listing details. All columns in the first row describe
              the expected format.
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="mt-4 flex items-center gap-2 font-bold text-[0.85rem] px-5 h-[44px] rounded-[10px] transition-colors hover:bg-[#1C4670] hover:text-white"
              style={{
                border: '1px solid #1C4670',
                color: '#1C4670',
                borderRadius: 10,
              }}
            >
              <IconDownload />
              Download CSV Template
            </button>
          </div>

          {/* Upload card */}
          <div
            className="mt-4 rounded-xl p-6"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            <h2 className="text-[1rem] font-bold" style={{ color: '#0D0D0D' }}>
              Upload completed CSV
            </h2>

            <div className="mt-4">
              <DropZone
                accept=".csv"
                onFiles={handleCSVFiles}
                subText=".csv files only"
              />
            </div>

            {/* File info bar */}
            {csvFile && (
              <div
                className="mt-4 flex items-center justify-between px-4 py-3 rounded-lg"
                style={{ backgroundColor: '#F4F4F0' }}
              >
                <div className="flex items-center gap-2">
                  <IconFile />
                  <span className="text-[0.9rem] font-semibold" style={{ color: '#0D0D0D' }}>
                    {csvFile.name}
                  </span>
                  <span className="text-[0.85rem]" style={{ color: '#6B6B6B' }}>
                    — {parsedRows.length} row{parsedRows.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={handleRemoveCSV}
                  className="text-[0.85rem] font-semibold"
                  style={{ color: '#E53E3E' }}
                >
                  Remove
                </button>
              </div>
            )}

            {/* Validation results */}
            {csvFile && parsedRows.length > 0 && (
              <div>
                {errorRows.length === 0 ? (
                  <div
                    className="mt-4 px-4 py-3 rounded-lg border-l-4"
                    style={{
                      backgroundColor: 'rgba(29,198,144,0.08)',
                      borderLeftColor: '#1DC690',
                    }}
                  >
                    <span className="font-semibold" style={{ color: '#1DC690' }}>
                      ✓ {validRows.length} listing{validRows.length !== 1 ? 's' : ''} ready to
                      import
                    </span>
                  </div>
                ) : (
                  <div>
                    <div
                      className="mt-4 px-4 py-3 rounded-lg border-l-4"
                      style={{
                        backgroundColor: 'rgba(245,158,11,0.08)',
                        borderLeftColor: '#F59E0B',
                      }}
                    >
                      <span className="font-semibold" style={{ color: '#F59E0B' }}>
                        ⚠ {errorRows.length} row{errorRows.length !== 1 ? 's' : ''} have errors —
                        review below
                        {validRows.length > 0 && ` (${validRows.length} valid)`}
                      </span>
                    </div>

                    {/* Error table */}
                    <div
                      className="mt-4 rounded-xl overflow-hidden"
                      style={{
                        background: '#FFFFFF',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      }}
                    >
                      <table className="w-full text-[0.85rem]" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F4F4F0' }}>
                            <th
                              className="text-left px-4 py-3 font-semibold uppercase text-[0.72rem]"
                              style={{ color: '#6B6B6B', borderBottom: '1px solid #E0E0D8' }}
                            >
                              Row #
                            </th>
                            <th
                              className="text-left px-4 py-3 font-semibold uppercase text-[0.72rem]"
                              style={{ color: '#6B6B6B', borderBottom: '1px solid #E0E0D8' }}
                            >
                              Column
                            </th>
                            <th
                              className="text-left px-4 py-3 font-semibold uppercase text-[0.72rem]"
                              style={{ color: '#6B6B6B', borderBottom: '1px solid #E0E0D8' }}
                            >
                              Issue
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {errorRows.map((err, i) => (
                            <tr
                              key={i}
                              style={{ borderBottom: '1px solid #E0E0D8' }}
                            >
                              <td className="px-4 py-3" style={{ color: '#0D0D0D' }}>
                                {err.row}
                              </td>
                              <td className="px-4 py-3 font-medium" style={{ color: '#0D0D0D' }}>
                                {err.column}
                              </td>
                              <td className="px-4 py-3" style={{ color: '#6B6B6B' }}>
                                {err.issue}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Continue button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={goToStep2}
              disabled={validRows.length === 0}
              className="font-bold text-[0.95rem] h-[48px] px-6 rounded-[10px] text-white transition-opacity"
              style={{
                backgroundColor: '#1DC690',
                opacity: validRows.length === 0 ? 0.5 : 1,
                cursor: validRows.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Continue to Image Assignment →
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* STEP 2 — ASSIGN IMAGES                                              */}
      {/* ------------------------------------------------------------------ */}
      {step === 2 && (
        <div>
          <div className="flex gap-5 mt-6">
            {/* Left panel — listing list */}
            <div
              className="rounded-xl p-5 overflow-y-auto"
              style={{
                width: '35%',
                background: '#FFFFFF',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                maxHeight: 600,
              }}
            >
              <h2 className="text-[1rem] font-bold mb-3" style={{ color: '#0D0D0D' }}>
                Listings
              </h2>
              {validRows.map((row, idx) => {
                const images = listingImages.get(idx) ?? [];
                const isSelected = selectedListingIndex === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedListingIndex(idx);
                      setImageError('');
                    }}
                    className="cursor-pointer py-3 flex items-center justify-between transition-colors"
                    style={{
                      borderBottom: '1px solid #E0E0D8',
                      paddingLeft: isSelected ? 9 : 12,
                      paddingRight: 12,
                      borderLeft: isSelected ? '3px solid #1DC690' : '3px solid transparent',
                      backgroundColor: isSelected
                        ? 'rgba(29,198,144,0.06)'
                        : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F4F4F0';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    <span
                      className="text-[0.9rem] font-bold truncate"
                      style={{ color: '#0D0D0D', maxWidth: 200 }}
                    >
                      {row['title']}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <IconCamera hasImages={images.length > 0} />
                      <span className="text-[0.78rem]" style={{ color: '#6B6B6B' }}>
                        {images.length}/4
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right panel — image uploader */}
            <div
              className="flex-1 rounded-xl p-5"
              style={{
                background: '#FFFFFF',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}
            >
              {validRows[selectedListingIndex] ? (
                <>
                  <h2 className="text-[1rem] font-bold mb-4" style={{ color: '#0D0D0D' }}>
                    {validRows[selectedListingIndex]['title']}
                  </h2>

                  <DropZone
                    accept=".jpg,.jpeg,.png,.webp"
                    multiple
                    onFiles={(files) => handleImageFiles(files, selectedListingIndex)}
                    subText="Up to 4 photos per listing"
                  />

                  {imageError && (
                    <p className="text-[0.85rem] mt-2" style={{ color: '#E53E3E' }}>
                      {imageError}
                    </p>
                  )}

                  {/* Image thumbnails */}
                  {(imagePreviewUrls.get(selectedListingIndex) ?? []).length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {(imagePreviewUrls.get(selectedListingIndex) ?? []).map((url, imgIdx) => (
                        <div key={url} className="group relative">
                          <div
                            className="overflow-hidden"
                            style={{
                              borderRadius: 8,
                              backgroundColor: '#F4F4F0',
                              aspectRatio: '1',
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Preview ${imgIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {/* Delete button */}
                            <button
                              onClick={() => handleRemoveImage(selectedListingIndex, imgIdx)}
                              className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center text-white text-[0.7rem] opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{
                                backgroundColor: '#E53E3E',
                                borderRadius: '50%',
                              }}
                            >
                              ×
                            </button>
                          </div>
                          {imgIdx === 0 && (
                            <p
                              className="text-[0.72rem] font-medium mt-1"
                              style={{ color: '#1DC690' }}
                            >
                              Cover photo
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="mt-4 text-[0.78rem] italic" style={{ color: '#6B6B6B' }}>
                    Tip: name files with keywords matching your listing title for easier assignment
                  </p>
                </>
              ) : (
                <p className="text-[0.9rem]" style={{ color: '#6B6B6B' }}>
                  No listing selected
                </p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="font-bold text-[0.9rem] h-[44px] px-5 rounded-[10px] transition-colors"
              style={{
                border: '1px solid #E0E0D8',
                color: '#6B6B6B',
                background: '#FFFFFF',
              }}
            >
              ← Back
            </button>
            <button
              onClick={goToStep3}
              className="font-bold text-[0.95rem] h-[48px] px-6 rounded-[10px] text-white"
              style={{ backgroundColor: '#1DC690' }}
            >
              Continue to Review →
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* STEP 3 — REVIEW & PUBLISH                                           */}
      {/* ------------------------------------------------------------------ */}
      {step === 3 && (
        <div>
          {/* Summary line */}
          <p className="mt-6 text-[0.9rem]" style={{ color: '#6B6B6B' }}>
            {publishedCount} of {checkedCount} selected listings will be published.{' '}
            {draftCount} saved as drafts.
          </p>

          {/* Controls row */}
          <div className="mt-3 flex items-center gap-4">
            <button
              onClick={selectAll}
              className="font-semibold text-[0.85rem]"
              style={{ color: '#1DC690' }}
            >
              Select All
            </button>
            <span style={{ color: '#E0E0D8' }}>|</span>
            <button
              onClick={deselectAll}
              className="font-semibold text-[0.85rem]"
              style={{ color: '#1DC690' }}
            >
              Deselect All
            </button>
            <span className="text-[0.85rem]" style={{ color: '#6B6B6B' }}>
              {checkedCount} selected
            </span>
          </div>

          {/* Import error/partial result banner */}
          {importResult && importResult.failed > 0 && (
            <div
              className="mt-4 px-4 py-3 rounded-lg border-l-4 flex items-center justify-between"
              style={{
                backgroundColor: 'rgba(239,68,68,0.08)',
                borderLeftColor: '#E53E3E',
              }}
            >
              <span className="font-semibold text-[0.9rem]" style={{ color: '#E53E3E' }}>
                {importResult.success} listing{importResult.success !== 1 ? 's' : ''} imported
                successfully. {importResult.failed} failed.
              </span>
              <Link
                href="/inventory"
                className="font-semibold text-[0.85rem] ml-4"
                style={{ color: '#1DC690' }}
              >
                View Inventory
              </Link>
            </div>
          )}

          {/* Review table */}
          <div
            className="mt-4 rounded-xl overflow-hidden"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            <table className="w-full text-[0.85rem]" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F4F4F0' }}>
                  {['', 'Photo', 'Title', 'Category', 'Condition', 'Price', 'Images', 'Status'].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left font-semibold uppercase text-[0.72rem]"
                        style={{ color: '#6B6B6B', borderBottom: '1px solid #E0E0D8' }}
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {validRows.map((row, idx) => {
                  const images = listingImages.get(idx) ?? [];
                  const previewUrls = imagePreviewUrls.get(idx) ?? [];
                  const isChecked = checkedRows.has(idx);
                  const status = rowStatuses.get(idx) ?? 'draft';

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #E0E0D8' }}>
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRow(idx)}
                          className="accent-[#1DC690] w-4 h-4"
                        />
                      </td>

                      {/* Photo */}
                      <td className="px-4 py-3">
                        {previewUrls[0] ? (
                          <div
                            className="overflow-hidden"
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              backgroundColor: '#F4F4F0',
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewUrls[0]}
                              alt="Cover"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              backgroundColor: '#F4F4F0',
                            }}
                          />
                        )}
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3 font-bold" style={{ color: '#0D0D0D', maxWidth: 200 }}>
                        <span className="block truncate" style={{ maxWidth: 180 }}>
                          {row['title']}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 text-[0.85rem]" style={{ color: '#6B6B6B' }}>
                        {row['category']}
                      </td>

                      {/* Condition pill */}
                      <td className="px-4 py-3">
                        <ConditionPill condition={row['condition']} />
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 font-bold" style={{ color: '#1DC690' }}>
                        £{parseFloat(row['price']).toFixed(2)}
                      </td>

                      {/* Images */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <IconCamera hasImages={images.length > 0} />
                          <span className="text-[0.78rem]" style={{ color: '#6B6B6B' }}>
                            {images.length}
                          </span>
                        </div>
                      </td>

                      {/* Status toggle */}
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <button
                            onClick={() => setRowStatus(idx, 'draft')}
                            className="px-3 py-1 text-[0.75rem] font-semibold"
                            style={{
                              borderRadius: status === 'draft' ? '999px 0 0 999px' : '999px 0 0 999px',
                              backgroundColor:
                                status === 'draft' ? 'rgba(107,107,107,0.15)' : 'transparent',
                              color: status === 'draft' ? '#6B6B6B' : '#ADADAD',
                              border: '1px solid #E0E0D8',
                              borderRight: 'none',
                            }}
                          >
                            Draft
                          </button>
                          <button
                            onClick={() => setRowStatus(idx, 'active')}
                            className="px-3 py-1 text-[0.75rem] font-semibold"
                            style={{
                              borderRadius: '0 999px 999px 0',
                              backgroundColor: status === 'active' ? '#1DC690' : 'transparent',
                              color: status === 'active' ? '#FFFFFF' : '#ADADAD',
                              border: '1px solid #E0E0D8',
                              borderLeft: 'none',
                            }}
                          >
                            Active
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Navigation */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="font-bold text-[0.9rem] h-[44px] px-5 rounded-[10px]"
              style={{
                border: '1px solid #E0E0D8',
                color: '#6B6B6B',
                background: '#FFFFFF',
              }}
            >
              ← Back to Image Assignment
            </button>
            <button
              onClick={handleImport}
              disabled={checkedCount === 0 || importing}
              className="font-bold text-[0.95rem] h-[48px] px-6 rounded-[10px] text-white transition-opacity"
              style={{
                backgroundColor: '#1DC690',
                opacity: checkedCount === 0 ? 0.5 : 1,
                cursor: checkedCount === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Import {checkedCount} Listing{checkedCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* IMPORT LOADING OVERLAY                                              */}
      {/* ------------------------------------------------------------------ */}
      {importing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <div
            className="flex flex-col items-center gap-4 p-8"
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
              minWidth: 280,
            }}
          >
            <IconSpinner />
            <p className="font-bold text-[1rem]" style={{ color: '#0D0D0D' }}>
              Importing listings...
            </p>
            <p className="text-[0.9rem]" style={{ color: '#6B6B6B' }}>
              {importProgress.current} of {importProgress.total}
            </p>
            <p className="text-[0.85rem]" style={{ color: '#6B6B6B' }}>
              Please do not close this page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
