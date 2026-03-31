Brief 3 is complete. Here's what was built.

## What's In This Delivery

**11 files changed, 4,798 lines added across the scaffold.**

### 1. Sidebar Correction (layout.tsx)
- Background changed from #06070A to #1C4670 (dark blue)
- Active nav item: 3px #1DC690 left border + rgba(29,198,144,0.1) background
- Inactive items: white/65 opacity, hover with white/8 bg
- ProStoreBadge added to sidebar footer (shield-check icon, "Verified Pro Store")
- Page header: white bg, #6B6B6B small-caps title, #E0E0D8 bottom border

### 2. Root Layout Fix
- Body background changed from #06070A to #EAEAE0 (ivory)

### 3. Inventory Page (1,769 lines)
Full inventory management screen:
- Status quick-filter pills (All/Active/Draft/Paused/Sold)
- Filter row: category, condition, price range, listing age, search
- Inventory table with all 9 columns (checkbox, photo, title+specs, condition pill, price, status pill, views, listed date, actions overflow menu)
- Alternating row colours, hover states, selection highlighting
- Skeleton loading state, empty state with CTAs
- Pagination (20 per page)
- Bulk action bar: floating #1C4670 bar with Pause/Resume/Delete
- Delete confirmation modal (single + bulk)

### 4. Listing Form (1,317 lines)
Shared component for create and edit:
- Two-column desktop layout (65/35 split)
- Category-conditional fields: all 8 categories with correct sub-fields matching the mobile app
- Image upload: drag-and-drop, 2x2 grid, max 4, cover photo label
- Auto-save as draft every 60 seconds (only when dirty)
- Parcel size radio-cards with prices
- Accept offers toggle with auto-decline threshold
- Condition descriptions on hover
- Status toggle (Draft/Active) + publish controls

### 5. CSV Import (1,329 lines)
Three-step flow:
- Step 1: CSV upload with client-side validation, template download, error table
- Step 2: Image assignment (split panel — listing list on left, upload zone on right)
- Step 3: Review table with per-row Draft/Active toggle, select all/deselect all

### 6. API Client (listings.ts, 189 lines)
Typed endpoint functions:
- getMyListings (maps to GET /api/users/my-listings)
- getListing, createListing, updateListing (uses PUT), deleteListing
- uploadListingImage, deleteListingImage
- bulkUpdateListings, bulkDeleteListings (with TODO — endpoints don't exist yet)

### 7. ProStoreBadge Update
- Now uses Lucide shield-check icon (14px, stroke 1.5)
- Sizes: sm and md only (removed lg)
- Montserrat 600, 0.7rem

### 8. CSV Template
Downloadable template with all columns and valid values in header descriptions.

---

## Missing Backend Endpoints (HS Action Required)

These endpoints need to be added before the dashboard goes live. Full suggested implementations are in output/questions.md.

1. **GET /api/users/my-listings** — exists but needs additional query params: category, condition, minPrice, maxPrice, search, sort
2. **PATCH /api/listings/bulk** — new endpoint for bulk status/price updates
3. **POST /api/listings/bulk-delete** — new endpoint for bulk soft-delete
4. **Note:** Backend uses PUT not PATCH for single listing updates — frontend matches this

---

## Verification Checklist

- [x] Sidebar background is #1C4670, not #06070A
- [x] Active nav item has #1DC690 left border
- [x] All prices shown in #1DC690
- [x] All condition grades shown as coloured pills (correct colours per design bible)
- [x] Page background is #EAEAE0 (ivory), not white
- [x] Cards are #FFFFFF on ivory
- [x] All typography is Montserrat
- [x] Image upload enforces max 4 photos with clear error
- [x] Bulk action bar appears only when rows selected
- [x] CSV import has all 3 steps with step indicator
- [x] Drafts excluded from public endpoints (backend enforces, frontend never calls public listing APIs for drafts)
- [x] Auto-save draft fires every 60 seconds on listing form
- [x] Conditional fields appear/disappear based on category
- [x] Auto-decline threshold field only visible when Accept Offers toggled on
- [x] ProStoreBadge component used in sidebar footer

**Not verified:** npm run build — the scaffold isn't set up as a runnable project yet (dependencies not installed). HS should run build after creating the repo.

---

## Design Decisions Made

1. **Overflow menu implementation** — Used a simple state-managed dropdown with click-outside-to-close, rather than importing a third-party dropdown library. Keeps deps minimal.
2. **CSV parser** — Hand-written parser that handles quoted fields with commas inside. No external library dependency.
3. **Listing age filter** — Applied client-side since the backend doesn't have a dedicated listing age query param. The filter narrows results after fetch.
4. **Bulk operations API shape** — Used POST for bulk-delete (to send request body with IDs) rather than DELETE with body, since some HTTP clients don't support DELETE with body.
5. **Image upload flow** — Images are uploaded after listing creation (not before), so a listing ID always exists when uploading. This matches the existing backend flow.
6. **Specifications JSON** — All category-specific fields are packed into the `specifications` JSON column on submit, matching the existing Prisma schema.

---

## What HS Needs To Do

1. Review the code in mulligans-clovis-output/output/web/scaffold/
2. Add the 3 missing backend endpoints (see output/questions.md for full implementations)
3. Extend GET /api/users/my-listings with additional filter params
4. Run npm run build once the repo is set up to verify compilation
5. The code is also in Google Drive at Clovis/Code/web-brief-3/
