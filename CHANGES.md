# PRO-IMPORT-I-05: Dashboard Wizard → Real Backend Pipeline + Draft Publish Actions

**Branch:** `task/pro-import-i05-wizard`
**Base:** `clovis/pro-seller-foundation` @ `e81ca7f`
**Date:** 2026-07-03

---

## Investigation Findings

### 1. Wizard Map (`apps/dashboard/src/app/(dashboard)/inventory/import/page.tsx`)

**Before:** 1321-line monolithic `'use client'` component containing a 3-step wizard:

| Step | Purpose | Implementation |
|------|---------|---------------|
| 1. Upload CSV | Parse & validate CSV client-side | Hand-rolled CSV parser (`parseCSV`, `splitCSVLine`), client-side validation against hardcoded categories/conditions/shipping |
| 2. Assign Images | Per-listing image upload UI | Left panel listing list, right panel drop zone, `Map<number, File[]>` for images, blob URL previews |
| 3. Review & Publish | Select rows, toggle Draft/Active, import | Sequential `for` loop: `createListing()` per row + `uploadListingImage()` per image |

**State management:** All local React `useState`. No context, no URL state, no persistence.

**Import execution:** Sequential N+1 HTTP requests (1 `POST /api/listings` per row + 1 `POST /images` per image). For 50 listings with 3 images each = 200 sequential requests. No batch endpoint, no retry, no error recovery.

### 2. Latent Bugs Found (5 total)

| # | Bug | Location | Severity |
|---|-----|----------|----------|
| 1 | **Draft status silently ignored** — wizard sends `status: 'draft'` but backend `POST /api/listings` hardcodes `status: 'active'`. The Draft/Active toggle in Step 3 is completely non-functional. All imports go live immediately. | import/page.tsx:645 vs backend listingController | CRITICAL |
| 2 | **Parcel size case mismatch** — `SHIPPING_MAP` produces `'SMALL'`, `'MEDIUM'` etc (uppercase). Backend Zod validation expects `'small'`, `'medium'` (lowercase). Every import would fail validation. | import/page.tsx:57-64 | HIGH |
| 3 | **Category string mismatch** — `'Shafts Grips & Heads'` (no comma) vs backend Zod enum `'Shafts, Grips & Heads'` (WITH comma). Same mismatch also on inventory page filter (line 834). | import/page.tsx:29, inventory/page.tsx:834 | HIGH |
| 4 | **Subcategory not sent as top-level field** — Backend requires `subcategory: z.string().min(1).max(100)` as a top-level field. Wizard puts it into the `specifications` JSON object instead. | import/page.tsx:626 | HIGH |
| 5 | **`auto_decline_threshold` dead column** — Present in CSV template header but never read, validated, or sent to the backend. Misleads users who fill it in. | import/page.tsx:67 | LOW |

### 3. Test Tooling

- **vitest** v4.1.9 installed as root devDependency
- One vitest config at `apps/web/vitest.config.ts` (environment: node)
- One existing test file: `apps/web/src/__tests__/sellerCheckout.test.ts`
- **No jest, no react-testing-library, no test scripts in dashboard or api-client**
- Dashboard has no test infrastructure — component/UI tests are not feasible without RTL
- Tests scoped to: API client endpoint functions (vitest, same pattern as existing)

### 4. Inventory Page Data Flow

- Fetches via `getMyListings()` → `GET /api/users/my-listings` with filters
- Status tabs: all, active, draft, paused, sold, off_sale
- Row selection persists across pagination (Set<string> of IDs)
- Bulk action bar: Pause, Resume, Edit Price, Discount, Delete
- Per-row context menu: Edit, Pause/Resume, Mark as Sold, Mark sold elsewhere (I-04), Relist (I-04), Duplicate (disabled), Delete
- Off-sale/Relist use `markListingOffSale`/`relistListing` from I-04 additions

### 5. Phantom Status Vocabulary (Out of Scope — noted only)

The inventory page and `ListingStatus` type include statuses the backend never sets:
- `paused` — tab exists, bulk action exists, but no backend lifecycle sets this
- `suspended` — in `ListingStatus` union, no UI for it
- `inactive` — in `ListingStatus` union, no UI for it

These are harmless empty tabs but may confuse pro sellers. Not fixed per brief scope.

---

## Implementation Notes

### 1. API Client Additions (`packages/api-client`)

| Function | Route | Pattern |
|----------|-------|---------|
| `importListingsCsv(file: File)` | `POST /api/listings/import` | Raw `fetch` with `FormData` (field name `file`). Same pattern as `uploadListingImage` — `apiClient` can't handle multipart. Throws `ApiError` on failure. |
| `publishListing(id: string)` | `PUT /api/listings/:id/publish` | `apiClient.put` with empty body. Follows I-04 pattern (markListingOffSale, relistListing). |
| `publishListingsBulk(listing_ids: string[])` | `PUT /api/listings/publish-bulk` | `apiClient.put` with `{ listing_ids }` body. |

Types added to `types/listing.ts`: `ImportListingsResponse`, `ImportCreatedItem`, `ImportUpdatedItem`, `ImportSkippedItem`, `ImportFailedItem`, `PublishListingResponse`, `PublishListingsBulkResponse`, `PublishBulkSkippedItem`.

All types and functions exported from `index.ts`.

### 2. Wizard Replacement (`apps/dashboard/inventory/import/page.tsx`)

**Deleted entirely:** client-side CSV parser, validator, `VALID_CATEGORIES`/`VALID_CONDITIONS`/`VALID_SHIPPING` constants, `SHIPPING_MAP`, `CONDITION_TO_NUMBER`, `CSV_TEMPLATE_HEADER`, `StepIndicator`, `ConditionPill`, image assignment UI, review table, row status toggles, sequential per-row `createListing` loop, `uploadListingImage` calls.

**New flow:**
1. Upload screen — file select (.csv only, ≤5MB client-side check), "what happens next" explainer
2. Server-side processing — loading overlay while `importListingsCsv(file)` runs
3. Results screen — renders ALL response arrays:
   - Created (count + table with title, SKU)
   - Updated (table with title, SKU, changed_fields chips, reactivated marker)
   - Skipped (table with row number, SKU, human-readable reason)
   - Failed (table with row number, reason)
   - Warnings (bulleted list)
4. Actions: "View Drafts in Inventory" (deep-links to `?status=draft`), "Import Another File"

**XLSX handling:** If a non-CSV file is selected, a friendly message is shown: "Only CSV files are supported for v1. XLSX import is coming soon."

**Image assignment:** Removed. The backend import pipeline creates drafts. Images are uploaded separately via the existing edit flow. The "what happens next" explainer makes this clear.

### Skip Reason Label Mapping

| Server reason | User-facing label |
|---------------|-------------------|
| `active_order` | Has an active order |
| `removed` | Removed by Mulligans |
| `size_variant_unsupported` | Size-variant listings can't be re-imported yet |
| Any other | Passed through as-is |

### 3. Draft Publish Actions (Inventory Page)

**Per-row:** "Publish" action in context menu for `draft` listings. Calls `publishListing(id)`. On 409, surfaces the server's error reason via `alert()` (parity with I-04 off-sale/relist pattern).

**Bulk:** "Publish Selected" button in the bulk action bar, visible only when the Draft status tab is active. Calls `publishListingsBulk(ids)`. Shows partial-success result via `alert()`: "Published N listings. M skipped:" with up to 5 reasons listed.

**Deep-linking:** Inventory page now reads `?status=draft` from the URL on mount to initialise the status filter tab. Uses `window.location.search` directly (not `useSearchParams`) to avoid Next.js 14 Suspense boundary requirement.

### 4. Auth Robustness Fix (`apps/dashboard/src/lib/auth-provider.tsx`)

**(a) Removed duplicate `setTokenProvider` call.** The module-level registration (line 26) is sufficient. The identical call inside the `AuthProvider` component body was removed — it ran on every render and overwrote the provider with an identical function.

**(b) Zombie state prevention.** After `getCurrentUser()` confirms a Cognito session exists, the provider now checks `localStorage.getItem('mulligans_auth_token')`. If the backend JWT is absent, the user is treated as unauthenticated (forces re-login). This prevents the state where the UI shows as authenticated but every API call 401s because the token provider returns null.

---

## Tests

**Framework:** vitest (existing root-level setup, `apps/web/vitest.config.ts`)
**File:** `apps/web/src/__tests__/importAndPublish.test.ts`
**Pattern:** Same as existing `sellerCheckout.test.ts` — stubs `fetch`/`localStorage`, dynamically imports the api-client function, asserts on URL, method, body shape, and return value.

| Test | What it verifies |
|------|-----------------|
| `importListingsCsv` sends multipart POST | URL is `/api/listings/import`, method is POST, Authorization header present, body is FormData with `file` field, response parsed correctly |
| `importListingsCsv` throws on server error | 400 response produces ApiError with status code |
| `publishListing` sends PUT | URL is `/api/listings/:id/publish`, method is PUT, response parsed |
| `publishListing` throws on 409 | 409 response (missing images) produces ApiError |
| `publishListingsBulk` sends PUT with listing_ids | URL is `/api/listings/publish-bulk`, body contains `{ listing_ids }`, partial-success response parsed correctly |

**Not tested (and why):**
- Dashboard UI components (no react-testing-library installed, no dashboard test config)
- Auth provider zombie state fix (requires browser environment + Cognito mock — not feasible without RTL/jsdom)
- End-to-end wizard flow (requires running backend)

**All 5 tests pass.** Run: `npx vitest run apps/web/src/__tests__/importAndPublish.test.ts`

---

## Out of Scope (per brief)

- XLSX import (friendly message shown if non-CSV selected)
- Image upload during import (I-03 scope; drafts can have images added via edit)
- Publish controls on the results screen (locked product decision — publish is a deliberate action from inventory)
- Phantom status vocabulary (`paused`/`suspended`/`inactive` tabs for statuses the backend never sets — listed above in investigation, not fixed)
- Toast/snackbar system (`alert()` parity with I-04 is acceptable)

---

## Manual Test Script for Harry

**Prerequisites:** Dashboard running locally against dev backend (`npm run dev` in `apps/dashboard`)

### Test 1: Upload seed CSV → 3 created
1. Prepare a 3-row CSV matching the backend import template
2. Navigate to `/inventory/import`
3. Upload the CSV → should see loading overlay → results screen showing "3 created"
4. Click "View Drafts in Inventory" → should land on inventory page with Draft tab active

### Test 2: Re-upload same CSV → 3 updated
1. Upload the same CSV again from `/inventory/import`
2. Results screen should show "3 updated" with changed_fields chips
3. If any row was reactivated, should see "Reactivated" badge

### Test 3: Publish a draft → expect 409 (missing images)
1. On inventory page, filter to Draft tab
2. Click ⋮ on a draft listing → click "Publish"
3. Should see alert: "Listing must have at least 1 image" (or similar 409 reason)

### Test 4: Auth zombie-state check
1. In dev tools, clear `localStorage.mulligans_auth_token` but keep Cognito cookies
2. Reload the dashboard
3. Should be redirected to login (not shown a logged-in UI with failing API calls)

### Test 5: XLSX rejection
1. On `/inventory/import`, try to upload a `.xlsx` file
2. Should see error: "Only CSV files are supported for v1. XLSX import is coming soon."

### Test 6: Oversize file rejection
1. Try to upload a CSV larger than 5MB
2. Should see error about max file size

---

## Build

```
npm run build
Tasks:    2 successful, 2 total
Cached:    0 cached, 2 total
```

Both `dashboard` and `web` builds green. No type errors.
