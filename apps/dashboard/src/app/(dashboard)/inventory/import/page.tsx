'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { importListingsCsv } from '@mulligans/api-client';
import type {
  ImportListingsResponse,
  ImportCreatedItem,
  ImportUpdatedItem,
  ImportSkippedItem,
  ImportFailedItem,
} from '@mulligans/api-client';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const SKIP_REASON_LABELS: Record<string, string> = {
  active_order: 'Has an active order',
  removed: 'Removed by Mulligans',
  size_variant_unsupported: "Size-variant listings can't be re-imported yet",
};

// ---------------------------------------------------------------------------
// Inline SVG helpers
// ---------------------------------------------------------------------------

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

function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#278AB0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function IconWarning() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Drop Zone
// ---------------------------------------------------------------------------

interface DropZoneProps {
  onFiles: (files: File[]) => void;
}

function DropZone({ onFiles }: DropZoneProps) {
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
      <span className="text-[#ADADAD] text-[0.8rem] mt-1">CSV files only, max 5MB, up to 200 rows</span>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
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
// Results sections
// ---------------------------------------------------------------------------

function CreatedSection({ items }: { items: ImportCreatedItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <IconCheck />
        <h3 className="text-[0.95rem] font-bold" style={{ color: '#1DC690' }}>
          {items.length} listing{items.length !== 1 ? 's' : ''} created
        </h3>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <table className="w-full text-[0.85rem]" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F4F4F0' }}>
              <th className="text-left px-4 py-2.5 font-semibold uppercase text-[0.72rem]" style={{ color: '#6B6B6B', borderBottom: '1px solid #E0E0D8' }}>Title</th>
              <th className="text-left px-4 py-2.5 font-semibold uppercase text-[0.72rem]" style={{ color: '#6B6B6B', borderBottom: '1px solid #E0E0D8' }}>SKU</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #E0E0D8' }}>
                <td className="px-4 py-2.5 font-medium" style={{ color: '#0D0D0D' }}>{item.title}</td>
                <td className="px-4 py-2.5" style={{ color: '#6B6B6B' }}>{item.external_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UpdatedSection({ items }: { items: ImportUpdatedItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <IconRefresh />
        <h3 className="text-[0.95rem] font-bold" style={{ color: '#278AB0' }}>
          {items.length} listing{items.length !== 1 ? 's' : ''} updated
        </h3>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <table className="w-full text-[0.85rem]" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F4F4F0' }}>
              <th className="text-left px-4 py-2.5 font-semibold uppercase text-[0.72rem]" style={{ color: '#6B6B6B', borderBottom: '1px solid #E0E0D8' }}>Title</th>
              <th className="text-left px-4 py-2.5 font-semibold uppercase text-[0.72rem]" style={{ color: '#6B6B6B', borderBottom: '1px solid #E0E0D8' }}>SKU</th>
              <th className="text-left px-4 py-2.5 font-semibold uppercase text-[0.72rem]" style={{ color: '#6B6B6B', borderBottom: '1px solid #E0E0D8' }}>Changed Fields</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #E0E0D8' }}>
                <td className="px-4 py-2.5 font-medium" style={{ color: '#0D0D0D' }}>
                  {item.title}
                  {item.reactivated && (
                    <span
                      className="ml-2 text-[0.7rem] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(29,198,144,0.15)', color: '#1DC690' }}
                    >
                      Reactivated
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5" style={{ color: '#6B6B6B' }}>{item.external_id}</td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {item.changed_fields.map((field) => (
                      <span
                        key={field}
                        className="text-[0.72rem] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(39,138,176,0.12)', color: '#278AB0' }}
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SkippedSection({ items }: { items: ImportSkippedItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <IconWarning />
        <h3 className="text-[0.95rem] font-bold" style={{ color: '#F59E0B' }}>
          {items.length} row{items.length !== 1 ? 's' : ''} skipped
        </h3>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <table className="w-full text-[0.85rem]" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F4F4F0' }}>
              <th className="text-left px-4 py-2.5 font-semibold uppercase text-[0.72rem]" style={{ color: '#6B6B6B', borderBottom: '1px solid #E0E0D8' }}>Row</th>
              <th className="text-left px-4 py-2.5 font-semibold uppercase text-[0.72rem]" style={{ color: '#6B6B6B', borderBottom: '1px solid #E0E0D8' }}>SKU</th>
              <th className="text-left px-4 py-2.5 font-semibold uppercase text-[0.72rem]" style={{ color: '#6B6B6B', borderBottom: '1px solid #E0E0D8' }}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #E0E0D8' }}>
                <td className="px-4 py-2.5" style={{ color: '#0D0D0D' }}>{item.row}</td>
                <td className="px-4 py-2.5" style={{ color: '#6B6B6B' }}>{item.external_id}</td>
                <td className="px-4 py-2.5" style={{ color: '#F59E0B' }}>
                  {SKIP_REASON_LABELS[item.reason] ?? item.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FailedSection({ items }: { items: ImportFailedItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E53E3E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <h3 className="text-[0.95rem] font-bold" style={{ color: '#E53E3E' }}>
          {items.length} row{items.length !== 1 ? 's' : ''} failed
        </h3>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <table className="w-full text-[0.85rem]" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F4F4F0' }}>
              <th className="text-left px-4 py-2.5 font-semibold uppercase text-[0.72rem]" style={{ color: '#6B6B6B', borderBottom: '1px solid #E0E0D8' }}>Row</th>
              <th className="text-left px-4 py-2.5 font-semibold uppercase text-[0.72rem]" style={{ color: '#6B6B6B', borderBottom: '1px solid #E0E0D8' }}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #E0E0D8' }}>
                <td className="px-4 py-2.5" style={{ color: '#0D0D0D' }}>{item.row}</td>
                <td className="px-4 py-2.5" style={{ color: '#E53E3E' }}>{item.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WarningsSection({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="mt-4">
      <h3 className="text-[0.9rem] font-bold mb-2" style={{ color: '#F59E0B' }}>
        Warnings
      </h3>
      <div
        className="rounded-xl p-4"
        style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}
      >
        <ul className="list-disc pl-4 space-y-1">
          {warnings.map((w, i) => (
            <li key={i} className="text-[0.85rem]" style={{ color: '#6B6B6B' }}>{w}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function ImportCSVPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportListingsResponse | null>(null);

  function handleFiles(files: File[]) {
    const file = files[0];
    if (!file) return;

    setError('');
    setResult(null);

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Only CSV files are supported for v1. XLSX import is coming soon.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 5MB.`);
      return;
    }

    setCsvFile(file);
  }

  function handleRemoveFile() {
    setCsvFile(null);
    setError('');
    setResult(null);
  }

  async function handleUpload() {
    if (!csvFile) return;

    setUploading(true);
    setError('');

    try {
      const response = await importListingsCsv(csvFile);
      setResult(response);
    } catch (err: any) {
      const serverMsg = err?.data?.error || err?.data?.message || err?.message;
      setError(serverMsg || 'Import failed. Please check your CSV and try again.');
    } finally {
      setUploading(false);
    }
  }

  const hasResults = result !== null;
  const totalProcessed = hasResults
    ? result.created.length + result.updated.length + result.skipped.length + result.failed.length
    : 0;

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

      {/* ------------------------------------------------------------------ */}
      {/* UPLOAD STAGE                                                        */}
      {/* ------------------------------------------------------------------ */}
      {!hasResults && (
        <div>
          {/* What happens next card */}
          <div
            className="mt-6 rounded-xl p-6"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            <h2 className="text-[1rem] font-bold" style={{ color: '#0D0D0D' }}>
              What happens when you import
            </h2>
            <ul className="mt-3 space-y-2 text-[0.9rem]" style={{ color: '#6B6B6B' }}>
              <li className="flex items-start gap-2">
                <span style={{ color: '#1DC690', fontWeight: 600 }}>1.</span>
                Your CSV is uploaded to the server and validated row by row.
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#1DC690', fontWeight: 600 }}>2.</span>
                New listings are created as <strong style={{ color: '#0D0D0D' }}>drafts</strong>. Re-imported SKUs are updated with your latest data.
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#1DC690', fontWeight: 600 }}>3.</span>
                You&apos;ll see a full results breakdown — created, updated, skipped, and any errors.
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#1DC690', fontWeight: 600 }}>4.</span>
                Publish your drafts from the Inventory page when you&apos;re ready.
              </li>
            </ul>
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
              Upload your CSV
            </h2>

            <div className="mt-4">
              <DropZone onFiles={handleFiles} />
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
                    — {(csvFile.size / 1024).toFixed(0)} KB
                  </span>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="text-[0.85rem] font-semibold"
                  style={{ color: '#E53E3E' }}
                >
                  Remove
                </button>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div
                className="mt-4 px-4 py-3 rounded-lg border-l-4"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.08)',
                  borderLeftColor: '#E53E3E',
                }}
              >
                <span className="font-semibold text-[0.9rem]" style={{ color: '#E53E3E' }}>
                  {error}
                </span>
              </div>
            )}
          </div>

          {/* Upload button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!csvFile || uploading}
              className="font-bold text-[0.95rem] h-[48px] px-6 rounded-[10px] text-white transition-opacity"
              style={{
                backgroundColor: '#1DC690',
                opacity: !csvFile || uploading ? 0.5 : 1,
                cursor: !csvFile || uploading ? 'not-allowed' : 'pointer',
              }}
            >
              {uploading ? 'Importing…' : 'Import CSV'}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* UPLOADING OVERLAY                                                   */}
      {/* ------------------------------------------------------------------ */}
      {uploading && (
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
              Importing your listings…
            </p>
            <p className="text-[0.85rem]" style={{ color: '#6B6B6B' }}>
              This may take a moment. Please do not close this page.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* RESULTS SCREEN                                                      */}
      {/* ------------------------------------------------------------------ */}
      {hasResults && (
        <div>
          {/* Summary banner */}
          <div
            className="mt-6 rounded-xl p-5"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            <h2 className="text-[1.1rem] font-bold" style={{ color: '#0D0D0D' }}>
              Import Complete
            </h2>
            <p className="text-[0.9rem] mt-1" style={{ color: '#6B6B6B' }}>
              {totalProcessed} row{totalProcessed !== 1 ? 's' : ''} processed from{' '}
              <strong style={{ color: '#0D0D0D' }}>{csvFile?.name}</strong>
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-3 mt-4">
              {result.created.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(29,198,144,0.12)' }}>
                  <span className="text-[0.85rem] font-semibold" style={{ color: '#1DC690' }}>
                    {result.created.length} created
                  </span>
                </div>
              )}
              {result.updated.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(39,138,176,0.12)' }}>
                  <span className="text-[0.85rem] font-semibold" style={{ color: '#278AB0' }}>
                    {result.updated.length} updated
                  </span>
                </div>
              )}
              {result.skipped.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.12)' }}>
                  <span className="text-[0.85rem] font-semibold" style={{ color: '#F59E0B' }}>
                    {result.skipped.length} skipped
                  </span>
                </div>
              )}
              {result.failed.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
                  <span className="text-[0.85rem] font-semibold" style={{ color: '#E53E3E' }}>
                    {result.failed.length} failed
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Detail sections */}
          <CreatedSection items={result.created} />
          <UpdatedSection items={result.updated} />
          <SkippedSection items={result.skipped} />
          <FailedSection items={result.failed} />
          <WarningsSection warnings={result.warnings} />

          {/* Actions */}
          <div className="mt-8 flex items-center gap-4">
            <Link
              href="/inventory?status=draft"
              className="font-bold text-[0.95rem] h-[48px] px-6 rounded-[10px] text-white inline-flex items-center justify-center"
              style={{ backgroundColor: '#1DC690' }}
            >
              View Drafts in Inventory
            </Link>
            <button
              onClick={() => {
                setCsvFile(null);
                setResult(null);
                setError('');
              }}
              className="font-bold text-[0.9rem] h-[44px] px-5 rounded-[10px] transition-colors"
              style={{
                border: '1px solid #E0E0D8',
                color: '#6B6B6B',
                background: '#FFFFFF',
              }}
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
