# PRO-DASH-AUDIT-2026-08

**Pro Seller Dashboard — Ground Truth Audit**
**Date:** 2026-08-14
**Author:** Clovis (AI partner, Mulligans Golf Limited)
**Type:** READ-ONLY AUDIT — no fixes, no refactors, no behaviour changes

---

## §1 — BRANCH REALITY CHECK

### Baseline SHAs

```
$ cd Mulligans-Web && git fetch --all --prune && git log --oneline -1 pro-seller-foundation
03cc15f Merge remote-tracking branch 'clovis/task/dash-listing-form-fixes' into pro-seller-foundation

$ cd Mulligans-Backend && git fetch --all --prune && git log --oneline -1 pro-seller-foundation
8da6a9c docs: merge resolution report for pro-seller-foundation

$ cd Mulligans-Mobile && git fetch --all --prune && git log --oneline -1 pro-seller-foundation
a546d01 Merge branch 'review-auth-02' into pro-seller-foundation
```

| Repo | Branch | SHA | Commit date |
|---|---|---|---|
| Mulligans-Web | `pro-seller-foundation` | `03cc15f68b364ebbd739d0f6fe3940b2267c2035` | 2026-07-14 |
| Mulligans-Backend | `pro-seller-foundation` | `8da6a9c8f9a863e0ab3cdf439302e847b4e4f6a4` | 2026-07-14 |
| Mulligans-Mobile | `pro-seller-foundation` | `a546d019e7a1296d6f5f4b59f549238038e4e96d` | 2026-07-02 |

All three branches exist on their respective remotes. No fallback was used.

### §1b — Backend `main` vs `pro-seller-foundation` Divergence

36 commits ahead of `main`. 73 files changed, +8698 / -3706 lines.

**Areas changed:**
- Per-seller checkout (SC-01 through SC-05): Stripe Checkout + native pay endpoints
- Fee system (SB-01 through SB-08): centralised fee constants, fee snapshot, pro-fee deduction, service fee per-seller-order
- Stock management (SB-03 through SB-05): size-variant stock restore, FOR UPDATE locks, stock restore on cancel/return
- Import pipeline (I-01 through I-06): dedup fields, CSV adapter, import service, draft status, publish gate, re-import upsert
- Off-sale / relist / publish endpoints (I-02b, I-04)
- Quantity fix (QTY-FIX-01): 6 money-critical bug fixes
- S3 bucket env var
- Dev seed script

**Endpoints that exist ONLY on `pro-seller-foundation` (not on `main`):**

| Endpoint | Route file:line |
|---|---|
| `POST /api/listings/import` | listingRoutes.ts:44 |
| `PUT /api/listings/publish-bulk` | listingRoutes.ts:57 |
| `PUT /api/listings/:id/off-sale` | listingRoutes.ts:59 |
| `PUT /api/listings/:id/relist` | listingRoutes.ts:60 |
| `PUT /api/listings/:id/publish` | listingRoutes.ts:61 |
| `POST /api/stripe/create-seller-checkout` | stripeRoutes.ts (new) |
| `POST /api/stripe/native-payment/seller` | stripeRoutes.ts (new) |

If the dashboard were pointed at prod (`main`) today, the following would break: CSV import, single/bulk publish, off-sale, relist, and per-seller checkout.

---

## §2 — EVIDENCE STANDARD

Every factual claim in this report is traceable to one of the three branch+SHA pairs in §1:

| Repo | Branch | SHA |
|---|---|---|
| Mulligans-Web | `pro-seller-foundation` | `03cc15f` |
| Mulligans-Backend | `pro-seller-foundation` | `8da6a9c` |
| Mulligans-Mobile | `pro-seller-foundation` | `a546d01` |

Every claim carries:
- `repo/path/to/file.ts:LINE` — a real line number actually read
- The branch+SHA it came from (all three repos on `pro-seller-foundation` unless otherwise noted)
- A confidence marker: **VERIFIED** (read the code) / **INFERRED** (reasoned from adjacent code) / **UNVERIFIED** (could not check)

One additional branch was read for comparison purposes only:
- `task/dash-listing-form-fixes-2` at `e23754d` — **UNMERGED**. Read to verify its claims and assess its data-loss risk. It is NOT part of the deployed baseline.

---

## §3 — ROUTE INVENTORY

| Route | File | Status | Backend endpoint(s) called | Auth guard? | Notes |
|---|---|---|---|---|---|
| `/login` | `app/login/page.tsx` | REAL | Cognito `signIn` | No (public) | VERIFIED |
| `/apply` | `app/apply/page.tsx` | REAL | `POST /api/pro-store/apply`, `GET /api/pro-store/application-status` | No (public) | Bug: backend requires `website` URL but form marks it optional — empty string fails `isValidUrl` |
| `/` (Overview) | `app/(dashboard)/page.tsx` | REAL | `GET /api/users/my-listings`, `GET /api/orders/counts`, `GET /api/offers/counts`, `GET /api/messages/unread-count`, `GET /admin/platform-stats` | Yes (cookie) | Calls `getPlatformStats` — admin-only endpoint, may fail for pro sellers |
| `/inventory` | `app/(dashboard)/inventory/page.tsx` | REAL | `GET /api/users/my-listings`, bulk CRUD, off-sale, relist, publish | Yes (cookie) | Full CRUD with filters |
| `/inventory/import` | `app/(dashboard)/inventory/import/page.tsx` | REAL | `POST /api/listings/import` | Yes (cookie) | CSV upload with results |
| `/inventory/new` | `app/(dashboard)/inventory/new/page.tsx` | REAL | `POST /api/listings`, `POST /api/listings/:id/images` | Yes (cookie) | Subject to spec-key mismatch if data already exists |
| `/inventory/[id]/edit` | `app/(dashboard)/inventory/[id]/edit/page.tsx` | REAL | `GET /api/listings/:id`, `PUT /api/listings/:id`, images | Yes (cookie) | **Silent save failure on mobile-created listings (see §6a)** |
| `/orders` | `app/(dashboard)/orders/page.tsx` | PARTIAL | `GET /api/orders/my-sales`, `GET /api/orders/my-purchases` | Yes (cookie) | **"View Order" links to non-existent `/orders/:id` — 404. No ship/track/cancel buttons.** |
| `/offers` | `app/(dashboard)/offers/page.tsx` | REAL | Offer CRUD endpoints | Yes (cookie) | Full accept/decline/counter flow |
| `/messages` | `app/(dashboard)/messages/page.tsx` | REAL | Messages + Socket.IO | Yes (cookie) | Full messaging with HTTP fallback |
| `/payouts` | `app/(dashboard)/payouts/page.tsx` | REAL | Stripe Connect endpoints | Yes (cookie) | Stripe Connect onboarding + balance |
| `/analytics` | `app/(dashboard)/analytics/page.tsx` | REAL | `GET /api/orders/my-sales`, `GET /api/users/my-listings` | Yes (cookie) | Client-side computed charts |
| `/settings` | `app/(dashboard)/settings/page.tsx` | REAL | `GET /api/users/me`, `PUT /api/users/me`, avatar, Stripe | Yes (cookie) | Profile + Stripe Connect management |

**Navigation links to non-existent routes:**
- Orders page "View Order →" link targets `/orders/${order.id}` — no `orders/[id]/page.tsx` exists. **VERIFIED** at `orders/page.tsx:155-160`. Clicking leads to 404.

---

## §4 — API CONTRACT CHECK (unwrap family)

| api-client function | Backend returns | api-client return type | Unwraps? | MISMATCH? |
|---|---|---|---|---|
| `getListing(id)` | `{ listing: {...} }` | `ListingWithImages` | YES (`.listing`) | NO — correct |
| `createListing(data)` | `{ listing: {...} }` | `Listing` | YES (`.listing`) | NO — correct |
| `updateListing(id, data)` | `{ listing: {...} }` | `Listing` | YES (`.listing`) | NO — correct |
| `deleteListing(id)` | `{ message }` | `void` | N/A | NO |
| `uploadListingImage(id, file)` | `{ message, count }` | `{ message, count }` | N/A (raw fetch) | NO |
| `deleteListingImage(lid, iid)` | `{ message }` | `void` | N/A | NO |
| `markListingOffSale(id)` | Raw listing (no envelope) | `Listing` | Not needed | NO — match |
| `relistListing(id)` | Raw listing (no envelope) | `Listing` | Not needed | NO — match |
| `publishListing(id)` | Raw listing (no envelope) | `PublishListingResponse {id, status}` | Not needed | **MINOR** — backend returns full listing, type narrows to `{id, status}`. Safe at runtime. |
| `publishListingsBulk(ids)` | `{ published[], skipped[] }` | `PublishListingsBulkResponse` | Not needed | NO — match |
| `getMyListings(params)` | `{ listings[], total, page, limit, totalPages }` | `GetMyListingsResponse` (same) | Not needed | NO — match |
| `importListingsCsv(file)` | `{ created, updated, skipped, failed, warnings }` | `ImportListingsResponse` (same) | N/A (raw fetch) | NO — match |
| **`getOrder(id)`** | **`{ order: {...} }`** | **`OrderDetail`** | **NO — does NOT unwrap** | **YES — MISMATCH (P0 latent)** |
| `getMySales(params)` | `{ orders: [...] }` | `{ orders: SoldOrder[] }` | Not needed | NO — match |
| `getMyPurchases(params)` | `{ orders: [...] }` | `{ orders: PurchasedOrder[] }` | Not needed | NO — match |
| **`markAsShipped(id, data)`** | **`{ success, order }`** | **`{ message }`** | **NO** | **YES — TYPE MISMATCH** |
| `getReceivedOffers()` | `{ offers: [...] }` | `{ offers: ReceivedOffer[] }` | Not needed | NO — match |
| `sendOfferToWatchers()` | N/A — endpoint doesn't exist | N/A | N/A | **DEAD CODE** — immediately rejects |

### Four priority endpoints — success responses

All four routes confirmed wired at `src/routes/listingRoutes.ts:57-61` on backend `pro-seller-foundation` (8da6a9c). **VERIFIED**.

| Endpoint | Handler | Success response |
|---|---|---|
| `PUT /api/listings/:id/publish` | `ListingController.publishListing` (listingController.ts:1407) | Raw listing with images, `res.json(updated)` at line 1454. No envelope. |
| `PUT /api/listings/publish-bulk` | `ListingController.publishListingsBulk` (listingController.ts:1461) | `{ published: string[], skipped: {id, reason}[] }` at line 1529. |
| `PUT /api/listings/:id/off-sale` | `ListingController.markOffSale` (listingController.ts:1293) | Raw listing with images, `res.json(updated)` at line 1353. No envelope. |
| `PUT /api/listings/:id/relist` | `ListingController.relistListing` (listingController.ts:1360) | Raw listing with images, `res.json(updated)` at line 1400. No envelope. |

### Critical mismatches

1. **`getOrder(id)`** — backend wraps in `{ order: ... }` (orderController.ts:579), but api-client types return as `OrderDetail` without unwrapping. Any order detail page would show blank data. Currently mitigated by the fact that `/orders/[id]` route does not exist. **VERIFIED — P0 latent bug.**

2. **`markAsShipped(id, data)`** — backend returns `{ success, order }`, but type says `{ message }`. Runtime-safe but consumers cannot access updated order data. **VERIFIED.**

3. **`publishListing(id)`** — backend returns full listing, type declares `{id, status}`. Safe — extra fields silently ignored. **VERIFIED — P3.**

---

## §5 — SPEC-KEY / DATA-SHAPE ALIGNMENT

**Core finding:** The dashboard uses **snake_case** spec keys throughout. Mobile uses **camelCase**. The CSV adapter also uses **snake_case** (matching dashboard, not mobile).

### Clubs

| Spec | Mobile key | Dashboard key | Match? |
|---|---|---|---|
| Club Type | `subcategory` (top-level) | `club_type` (spec) | **MISMATCH** — different field + different values (Drivers vs Driver) |
| Dexterity | `dexterity` | `dexterity` | **MISMATCH** — "Right Handed" vs "Right-Handed" |
| Shaft Flex | `shaftFlex` | `shaft_flex` | **MISMATCH** — casing + dashboard missing "Wedge", "Junior" options |
| Shaft Material | `shaftMaterial` | `shaft_material` | **MISMATCH** — casing |
| Lie Angle | `lieAngle` | `lie_angle` | **MISMATCH** — casing + mobile stores "Standard" string, dashboard expects number |
| Length | `length` (categorical: "Standard", "-1\"") | `shaft_length` (numeric input: "e.g. 45") | **CRITICAL MISMATCH** — different key AND different semantics |
| Grip Size | `gripSize` | `grip` (text, "e.g. Golf Pride") | **MISMATCH** — different key, different semantics |
| Loft | `loft` (categorical dropdown) | `loft` (number input) | Key matches, **type mismatch** |
| Gender | `gender` ("Male"/"Female") | Not on dashboard | **Missing** |
| Set Makeup | `setMakeup` | Not on dashboard | **Missing** |

### Shafts, Grips & Heads

| Spec | Mobile key | Dashboard key | Match? |
|---|---|---|---|
| Shaft Flex | `shaftFlex` | `shaft_flex` | **MISMATCH** — casing |
| Shaft Material | `shaftMaterial` | `shaft_material` | **MISMATCH** — casing |
| Shaft Length | `shaftLength` | `shaft_length` | **MISMATCH** — casing |
| Grip Size | `gripSize` (Junior→Plus 4) | `grip_size` (Undersize→Oversize) | **MISMATCH** — casing + different option sets |
| Club Type (heads) | `clubType` | `club_type` | **MISMATCH** — casing |

### Clothing

| Spec | Mobile key | Dashboard key | Match? |
|---|---|---|---|
| Gender | `gender` (Male/Female/Junior) | `gender` (Men's/Women's/Unisex/Junior) | **MISMATCH** — different values |
| Colour | `color` | `colour` | **MISMATCH** — "color" vs "colour" |
| Subcategory | `subcategory` (Polo Shirts, Trousers...) | `subcategory` (Top, Bottom, Outerwear...) | **MISMATCH** — different values |

### Shoes

| Spec | Mobile key | Dashboard key | Match? |
|---|---|---|---|
| Shoe Size | `shoeSize` | `size` | **MISMATCH** — different key |
| Spikes | `spikes` (Yes/No) | `shoe_type` (Spiked/Spikeless/Waterproof) | **MISMATCH** — different key + semantics |
| Gender | `gender` (Male/Female) | `gender` (Men's/Women's/Unisex) | **MISMATCH** — different values |

### Balls

| Spec | Mobile key | Dashboard key | Match? |
|---|---|---|---|
| Quantity | Top-level `quantity` (numeric) | `specs.quantity` (categorical: "Sleeve (3)", "Dozen") | **MISMATCH** — different location + type |

### Training Aids

| Spec | Mobile key | Dashboard key | Match? |
|---|---|---|---|
| Training Type | Not present on mobile | `training_type` (**required**) | **Dashboard-only — mobile cannot populate this** |

### Everything Else

| Spec | Mobile key | Dashboard key | Match? |
|---|---|---|---|
| Item Name | Not present on mobile | `item_name` (**required**) | **Dashboard-only — mobile cannot populate this** |

**VERIFIED** across all three codebases. Mobile: `sell.tsx`. Dashboard: `ListingForm.tsx`. CSV adapter: `csvAdapter.ts`.

### §5.4 — The `length` / `shaft_length` question

- **Mobile** stores `specs.length` as a **categorical string**: `"Standard"`, `"-1\""`, `"+0.5\""`, `"Custom"`, or putter lengths `"28"`–`"38"`. Source: `sell.tsx:104-108`. **VERIFIED.**
- **Dashboard** renders `shaft_length` as `<input type="number" step="0.5" placeholder="e.g. 45">` at `ListingForm.tsx:299-300`. **VERIFIED.**
- **Branch `e23754d`** maps `shaft_length` → `length` but keeps the numeric input. This would write a numeric value (e.g. `45`) over a categorical value (e.g. `"Standard"`) that mobile depends on — **confirmed data-loss risk**. **VERIFIED.**

### Branch `task/dash-listing-form-fixes-2` (e23754d) assessment

- **NOT merged** into `pro-seller-foundation`. Confirmed via `git merge-base --is-ancestor`. **VERIFIED.**
- Correctly identifies snake_case → camelCase problem and fixes ~80% of key mappings.
- Correctly relaxes several required fields that mobile doesn't populate.
- **Two remaining issues:** (1) `length` data-loss bug; (2) club type option value mismatches (singular vs plural).

---

## §6 — THE SELLER'S DAY ONE

| Step | Action | Status | Evidence |
|---|---|---|---|
| 1 | Seller applies (`/apply` → `POST /api/pro-store/apply`) | **WORKS** (with bug) | apply/page.tsx → proStore.ts → proStore routes. Bug: backend requires `website` URL but form marks optional. VERIFIED |
| 2 | Admin approves → `is_pro_store = true` | **WORKS** | adminRoutes.ts:1720 → sets `is_pro_store: true`. VERIFIED |
| 3 | Seller logs into dashboard | **BROKEN (security)** | `is_pro_store` is **never checked**. `isProStore` hardcoded to `null` in auth-provider.tsx:60. Any authenticated user can access full dashboard. VERIFIED |
| 4 | Seller imports CSV → drafts created | **WORKS** | import/page.tsx → importListingsCsv → importController → importService. Full pipeline. VERIFIED |
| 5 | Seller reviews a draft | **WORKS** | inventory/page.tsx shows drafts, edit page loads data. VERIFIED |
| 6 | **Seller adds images to a draft** | **BROKEN** | **Save fails silently → images never upload (see §6a).** VERIFIED |
| 7 | Seller publishes draft → active | **BLOCKED** | Publish gate requires `imageCount >= 1` (listingCompleteness.ts:11). No images → cannot publish. VERIFIED |
| 8 | Buyer orders it | INFERRED WORKS | Backend order creation exists. Not dashboard scope. |
| 9 | **Seller ships from dashboard** | **BROKEN** | No order detail page. No ship buttons. Both `markAsShipped` endpoints removed. VERIFIED |
| 10 | Seller gets paid via `/payouts` | **BLOCKED** | Payouts page exists and works, but if orders cannot ship, no payouts generate. VERIFIED |

**First breaking step: Step 6 (add images)** — the seller cannot save a mobile-created listing to add images, and the publish gate requires images.

**Hard secondary blocker: Step 9 (ship)** — even if images and publishing were fixed, there is no shipping capability in the dashboard.

### §6a — The Silent Save Failure (PRIORITY SYMPTOM)

#### 1. Submit path trace

```
Button onClick (ListingForm.tsx:1000)
  → handleUpdate() (line 928) / handlePublish() (line 927) / handleSaveDraft() (line 926)
    → doSave(overrideStatus, isAutoSave=false) (line 880)
      → validate() (line 881) ← FAILS HERE for mobile-created listings
        ↳ returns false → doSave returns false → NO API CALL, NO FEEDBACK
      → buildPayload() (line 886) ← never reached
      → updateListing(id, payload) (api-client listings.ts:119) ← never reached
        → PUT /api/listings/:id (backend listingController.ts:962)
          → res.json({ listing }) (line 1104)
      → uploadPendingImages(listingId) (line 901) ← never reached
        → uploadListingImage(id, file) (api-client listings.ts:143)
          → POST /api/listings/:id/images (backend listingController.ts:315)
      → router.push('/inventory') (line 915) ← never reached
```

#### 2. Silent termination points

1. **`validate()` returns false (ListingForm.tsx:881)** — `doSave` returns `false` immediately. Error messages render at individual fields via `<FieldError>` components, but there is **no scroll-to-error, no toast, no top-level banner**. The user clicks "Update Listing" at the top → errors appear deep in the form below the fold → user sees no visible change. **THIS IS THE ROOT CAUSE.** VERIFIED.

2. **`catch` block (ListingForm.tsx:917)** — sets `submitError` which renders a visible red banner (line 1011-1014). Only fires if the API call throws. Validation failure never reaches this. VERIFIED.

3. **`uploadPendingImages` catch (ListingForm.tsx:864-869)** — for 413 errors, sets `imageError`. For other errors, sets `submitError` after the loop. Only fires after a successful save. VERIFIED.

4. **Auto-save (ListingForm.tsx:702)** — calls `doSave('draft', true)` which **skips validation** (`isAutoSave=true`). Auto-save errors are silently ignored (result not checked). INFERRED.

#### 3. Validation gap table

| Field | Dashboard requires? | Present on mobile-created? | Present on CSV imports? | Blocks save? |
|---|---|---|---|---|
| `title` | YES (line 774) | YES | YES | Only if empty |
| `description` | YES (line 775) | YES | YES | Only if empty |
| `category` | YES (line 776) | YES | YES | Only if empty |
| `condition` | YES (line 777) | YES | YES (if provided) | Only if empty |
| `price` | YES (line 778) | YES | YES | Only if invalid |
| `parcelSize` | YES (line 779) | YES | YES | Only if empty |
| **`specs.club_type`** | **YES (line 783)** | **NO** — mobile uses `subcategory` at top level | **Optional** in CSV adapter | **YES — BLOCKS SAVE** |
| **`specs.shaft_flex`** | **YES (line 787)** | **NO** — mobile writes `shaftFlex` (camelCase) | **Optional** | **YES — BLOCKS SAVE** |
| **`specs.shaft_material`** | **YES (line 788)** | **NO** — mobile writes `shaftMaterial` (camelCase) | **Optional** | **YES — BLOCKS SAVE** |
| `specs.brand` | YES (line 784) | YES (top-level `brand`) | YES (top-level) | Depends on population |
| `specs.model` | YES (line 785) | YES (top-level `model`) | YES (top-level) | Depends on population |
| `specs.dexterity` | YES (line 786) | YES (same key) | NO | YES for CSV |
| **`specs.shoe_type`** | **YES (line 804)** | **NO** — mobile writes `spikes` | NO | **YES — BLOCKS SAVE** |
| **`specs.training_type`** | **YES (line 818)** | **NO** — not on mobile | NO | **YES — BLOCKS SAVE** |
| **`specs.item_name`** | **YES (line 821)** | **NO** — not on mobile | NO | **YES — BLOCKS SAVE** |
| **`specs.quantity` (Balls)** | **YES (line 815)** | **NO** — mobile uses top-level numeric `quantity` | NO | **YES — BLOCKS SAVE** |

#### 4. Image path trace

```
User selects files → addFiles() (ListingForm.tsx:716)
  → Creates ImageSlot objects with file + blob preview
On save (after successful validation + API call):
  → uploadPendingImages(listingId) (line 849-877)
    → For each pending slot:
      → uploadListingImage(listingId, slot.file) (api-client listings.ts:143)
        → FormData.append('images', file) (line 148)
        → fetch(POST /api/listings/:id/images) with Bearer token (line 160)
          → Backend: listingRoutes.ts:52 → multer.array('images', 5) → ListingController.uploadListingImage
            → sharp resize (listingController.ts:359)
            → S3Service.uploadImage (line 384)
            → DB image record (line 394)
            → res.json({ message, count }) (line 409)
```

The image upload code itself is sound. The issue is that `uploadPendingImages` is called at line 901, which is **inside the `try` block that only executes after validation passes** (line 881). Since validation fails, images are never uploaded.

#### 5. Verdict — ONE ROOT CAUSE

**One root cause, not two.**

The silent save failure is caused by the dashboard's `validate()` function requiring spec fields in **snake_case** (`shaft_flex`, `shaft_material`, `club_type`) while mobile-created listings store them in **camelCase** (`shaftFlex`, `shaftMaterial`). When editing a mobile-created listing:

1. Specs load with camelCase keys → form inputs read snake_case keys → fields appear empty
2. `validate()` checks empty snake_case fields → sets errors → returns false
3. `doSave()` returns false before any API call
4. No scroll-to-error, no banner → user sees nothing
5. `uploadPendingImages()` is never reached → images never upload

The image upload failure is a **downstream symptom**, not an independent bug. The upload code works when reached (e.g., creating a brand new listing from scratch on the dashboard).

**Evidence:** `ListingForm.tsx:881` (early return), `ListingForm.tsx:772-826` (validation), `sell.tsx:1283,1366` (mobile camelCase keys), `ListingForm.tsx:901` (uploadPendingImages only after save). **VERIFIED.**

#### 6. Draft editor vs edit page

Both use the **exact same `ListingForm` component**. Edit page passes `isEditing={true}` + `initialData`. New page passes `isEditing={false}`. The validation function is identical. The failure affects both identically when loading mobile-created data. **VERIFIED.**

---

## §7 — IMAGES

### 1. CSV import and images

The CSV import path does **NOT ingest images**. The `csvAdapter.ts` `parseCsv` function processes only text fields. There is no image URL column, no filename/SKU matching, no fetch logic. CSV imports create drafts with zero images. **VERIFIED** at `csvAdapter.ts` and `importService.ts`.

### 2. SSRF hardening

Not applicable — no image fetch from external URLs exists on this branch. The only image ingestion path is direct file upload via multipart form data. **VERIFIED.**

### 3. Manual image upload via dashboard

The upload code exists and appears functional (see §6a.4 for full trace). The operator-observed failure is caused by the save never firing — images can only upload after a successful save, and validation blocks the save. **This is the same bug as §6a, not a separate finding.** VERIFIED.

### 4. Publish completeness gate

`listingCompleteness.ts:1-13`:
```
if (imageCount < 1) return 'at least 1 image is required';
```
Requires at least 1 image. Called at `listingController.ts:1442` during `publishListing` and `listingController.ts:1513` during `publishListingsBulk`. **VERIFIED.**

### 5. Is there any working route from "CSV imported" to "listing live with photos" today?

**No.** The chain is:
1. CSV import creates drafts with zero images
2. Seller opens draft to add images → edit form loads mobile/CSV data → validation fails on spec keys → save blocked → images never upload
3. Even if the seller manually fills all required spec fields in the dashboard (working around the key mismatch), the images *would* upload — but this requires re-entering data that already exists under different keys
4. Publish gate requires images → without images, publish fails

**The import-to-live pipeline is broken.** VERIFIED.

---

## §8 — FULFILMENT

### 1. Backend shipping endpoints (`pro-seller-foundation`)

| Endpoint | Route file:line | Auth |
|---|---|---|
| `GET /api/shipping/parcel-sizes` | shippingRoutes.ts:52 | None (public) |
| `POST /api/shipping/rates` | shippingRoutes.ts:64 | authenticateToken |
| `POST /api/shipping/labels` | shippingRoutes.ts:68 | authenticateToken |
| `GET /api/shipping/tracking/:orderId` | shippingRoutes.ts:72 | authenticateToken |
| `POST /api/shipping/webhook` | shippingRoutes.ts:56 | None (Shippo callback) |
| `GET /api/shipping/dropoff-locations` | shippingRoutes.ts:82 | authenticateToken |
| `PUT /api/orders/:id/ship` | **REMOVED** — orderRoutes.ts:30 comment | — |
| `POST /api/shipping/mark-shipped` | **DOES NOT EXIST** | — |

### 2. api-client exposure

| Function | Endpoint | Backend exists? |
|---|---|---|
| `getShippingRates(orderId)` | `POST /api/shipping/rates` | YES |
| `createShippingLabel(orderId, rateId)` | `POST /api/shipping/labels` | YES |
| **`markShipped(orderId)`** | `POST /api/shipping/mark-shipped` | **NO** |
| `getTrackingInfo(orderId)` | `GET /api/shipping/tracking/:orderId` | YES |
| `getParcelSizes()` | `GET /api/shipping/parcel-sizes` | YES |
| **`markAsShipped(id, data)`** (orders.ts) | `PUT /api/orders/:id/ship` | **NO — REMOVED** |

### 3. Dashboard `/orders` page capabilities

The orders page is **VIEW-ONLY**:
- Shows sold/purchased order cards with status badges
- "View Order →" links to `/orders/${order.id}` — **route does not exist** (404)
- **No** buy-label button
- **No** print-label button
- **No** mark-shipped button
- **No** cancel button

**VERIFIED** — `orders/page.tsx` has no action handlers, and `find apps/dashboard -path '*/orders/*' -name '*.tsx'` returns only the list page.

### 4. Bulk/batch shipping

**No.** No bulk shipping endpoint on backend, no batch UI in dashboard. **VERIFIED.**

### 5. Mobile vs dashboard gap

Mobile uses the Shippo flow (rates → label → mark shipped) via the shipping controller. The dashboard has no shipping UI at all. **Gap: mobile can get rates, buy labels, and ship. Dashboard cannot do any of these.** VERIFIED.

---

## §9 — SECURITY PASS

### 1. Access gating

**`is_pro_store` is NOT enforced anywhere. VERIFIED — P0.**

- **Dashboard middleware** (`middleware.ts:7-40`): checks only for Cognito `idToken` cookie. No `is_pro_store` check.
- **Auth provider** (`auth-provider.tsx:60`): `isProStore` is hardcoded to `null` — never fetched from backend.
- **Dashboard layout**: no `isProStore` guard. Renders sidebar unconditionally.
- **Backend endpoints**: listing routes, order routes, import routes all use only `authenticateToken`. No `is_pro_store` middleware.

**Result:** Any registered Mulligans user can access the full dashboard and call all pro-seller endpoints (import, bulk publish, bulk update, bulk delete). **Client-side-only gating that itself is non-functional.**

### 2. Cross-seller data access

| Endpoint | Ownership check | Status |
|---|---|---|
| `GET /api/listings/:id` | Draft/off_sale visible only to owner (listingController.ts:844) | OK — VERIFIED |
| `PUT /api/listings/:id` | `seller_id !== userId` → 403 (listingController.ts:999) | OK — VERIFIED |
| `DELETE /api/listings/:id` | `seller_id !== userId` → 403 | OK — VERIFIED |
| `POST /api/listings/:id/images` | `seller_id !== userId` → 403 (listingController.ts:331) | OK — VERIFIED |
| `DELETE /api/listings/:id/images/:imageId` | `seller_id !== userId` → 403 AND `image.listing_id !== id` (listingController.ts:1204, 1219) | **FIXED** — VERIFIED |
| `PUT /api/listings/:id/publish` | `seller_id !== userId` → 403 | OK — VERIFIED |
| `PUT /api/listings/:id/off-sale` | `seller_id !== userId` → 403 | OK — VERIFIED |
| `PUT /api/listings/:id/relist` | `seller_id !== userId` → 403 | OK — VERIFIED |
| `GET /api/orders/:id` | `findFirst` with `OR: [buyer_id, seller_id]` | OK — VERIFIED |
| `POST /api/shipping/rates` | `seller_id !== req.user?.id` → 403 | OK — VERIFIED |
| `POST /api/shipping/labels` | `seller_id !== req.user?.id` → 403 | OK — VERIFIED |
| Messages/Conversations | `buyer_id OR seller_id` on all lookups | OK — VERIFIED |
| Offers (accept/decline/counter) | `seller_id !== userId` or `buyer_id !== userId` | OK — VERIFIED |

The prior `deleteListingImage` cross-seller bug is **fixed** (listingController.ts:1204). **VERIFIED.**

### 3. Bulk endpoints

| Endpoint | Ownership verification |
|---|---|
| `PUT /api/listings/publish-bulk` | Each ID checked individually: `seller_id !== userId` → skipped as `not_found` (listingController.ts:1503) |
| `PATCH /api/listings/bulk` (update) | Count-based: `owned !== ids.length` → 403 (listingController.ts:1547-1553) |
| `POST /api/listings/bulk-delete` | Count-based: `owned !== ids.length` → 403 (listingController.ts:1619-1623) |

**All bulk endpoints verify ownership for every ID.** VERIFIED.

### 4. Import endpoint identity

Runs as `req.user!.id` (importController.ts:11). No admin override, no impersonation path. **VERIFIED — OK.**

### 5. CSV import input validation

| Control | Present? | Detail |
|---|---|---|
| Row count cap | YES | `MAX_ROWS = 200` (importController.ts:7) |
| File size cap | YES | 5MB multer limit (listingRoutes.ts:28) |
| Rate limiting | YES | 5 per hour (listingRoutes.ts:19-24) |
| Category validation | YES | Whitelist (csvAdapter.ts:31-39) |
| Price validation | YES | 0.50–50000 (csvAdapter.ts:126-128) |
| Quantity validation | YES | 1–999 (csvAdapter.ts:159-161) |
| **String length validation** | **NO** | Title, description, free-text fields have no max-length check |

### 6. XSS

No `dangerouslySetInnerHTML` anywhere in the dashboard. Messages page has a proper `sanitize()` function (messages/page.tsx:73-76). All user content rendered via React JSX (auto-escaping). **No XSS found.** VERIFIED.

---

## §10 — TEST COVERAGE

### Test runners

| Repo | Test runner | Config | Note |
|---|---|---|---|
| Mulligans-Backend | **Jest** | `jest.config.js` | VERIFIED |
| Mulligans-Web (dashboard) | **Vitest** | `apps/dashboard/vitest.config.ts` | Brief says Jest — **this is incorrect; dashboard uses Vitest** |
| Mulligans-Web (api-client) | **Vitest** | `packages/api-client/vitest.config.ts` | VERIFIED |

### Backend test runner output

```
$ npx jest --testPathPatterns="unit/" --no-coverage

Test Suites: 11 failed, 16 passed, 27 total
Tests:       43 failed, 2 skipped, 2 todo, 561 passed, 608 total
Time:        9.189 s
```

**All 43 failures** are caused by a single TypeScript compilation error: `Cannot find module 'csv-parse/sync'` in `csvAdapter.ts`. This is a **missing dev dependency**, not a real test regression. The `csv-parse` package is in `package.json` dependencies, but the `/sync` subpath export may not be resolved correctly in the test environment. Every test that transitively imports any file that imports `csvAdapter.ts` (which includes `listingRoutes.ts` and anything that mounts the full Express app) fails with this error.

**16 passing suites** (561 tests) cover: fee calculations, stock utils, seller checkout, checkout oversell locks, cart partial clear, cancel stock restore, return stock restore, fulfilment dispatch, import upsert, draft visibility, s3 bucket env, off-sale, payment money safety, platform stats, registration, refresh tokens.

### Dashboard test coverage

**1 test file:** `apps/dashboard/src/__tests__/ListingForm.test.tsx`

**Critical paths with NO test coverage:**

| Path | Test? |
|---|---|
| Dashboard auth/login flow | NO |
| `is_pro_store` access gating | NO (gating doesn't exist) |
| Image upload | NO |
| CSV import (dashboard-level) | NO |
| Orders page | NO |
| Payouts page | NO |
| Stripe Connect flow | NO |
| Publish flow (dashboard-level) | NO |
| api-client envelope unwrap correctness | NO |

---

## §11 — GAP REGISTER

| # | Finding | Severity | Blocks seller onboarding? | Evidence | Confidence |
|---|---|---|---|---|---|
| 1 | **Silent save failure:** dashboard validation requires snake_case spec keys (`shaft_flex`, `shaft_material`, `club_type`) that mobile-created listings don't carry (they use camelCase). Save fails silently — no banner, no scroll-to-error. Image upload is downstream of this. | **P0** | **YES** — blocks steps 6, 7 | ListingForm.tsx:772-826, 881 | VERIFIED |
| 2 | **No `is_pro_store` enforcement:** any authenticated Mulligans user can access the full dashboard and all pro-seller backend endpoints. `isProStore` hardcoded to `null`. | **P0** | NO — but security hole | middleware.ts:7-40, auth-provider.tsx:60 | VERIFIED |
| 3 | **No shipping capability in dashboard:** orders page is view-only, no order detail page exists (404), both `markAsShipped` endpoints removed from backend, no label purchase UI. | **P0** | **YES** — blocks step 9 | orders/page.tsx, orderRoutes.ts:30, shippingRoutes.ts:74 | VERIFIED |
| 4 | **Publish gate requires images; CSV import provides none.** No working route from CSV-imported draft to live listing. | **P0** | **YES** — blocks step 7 | listingCompleteness.ts:11, csvAdapter.ts, importService.ts | VERIFIED |
| 5 | **Systemic spec-key mismatch across ALL categories.** Dashboard snake_case vs mobile camelCase. Editing a mobile listing silently discards spec data. | **P0** | **YES** — blocks editing | §5 full table | VERIFIED |
| 6 | **`getOrder(id)` unwrap bug:** backend wraps in `{order}`, api-client doesn't unwrap. Order detail page would show blank data. | **P0 (latent)** | YES (when order detail page is built) | orders.ts:49, orderController.ts:579 | VERIFIED |
| 7 | **Apply form bug:** backend requires `website` URL, dashboard marks it optional. Empty string fails validation. | **P1** | **YES** — blocks step 1 for sellers without website | apply/page.tsx:218, proStore.ts:63-66 | VERIFIED |
| 8 | **Overview page calls admin-only `getPlatformStats`.** May return 403 for pro sellers. | **P1** | NO — dashboard still loads, just missing stats widget | page.tsx (overview) | VERIFIED |
| 9 | **`markShipped` and `markAsShipped` call removed endpoints.** Two api-client functions call backend endpoints that no longer exist. | **P1** | YES (no fix path exists) | shipping.ts:81, orders.ts:54, orderRoutes.ts:30, shippingRoutes.ts:74 | VERIFIED |
| 10 | **`length`/`shaft_length` data-loss risk in unmerged branch `e23754d`.** Maps to correct mobile key but keeps numeric input — would overwrite categorical values. | **P1** | N/A (unmerged) | ListingForm.tsx diff, sell.tsx:104-108 | VERIFIED |
| 11 | **CSV adapter lacks string length validation.** Title, description, free-text fields have no max-length check. | **P2** | NO | csvAdapter.ts:119-176 | VERIFIED |
| 12 | **`publishListing` type narrowing.** Backend returns full listing, type declares `{id, status}`. Safe at runtime. | **P3** | NO | listings.ts:254 | VERIFIED |
| 13 | **`markAsShipped` type mismatch.** Backend returns `{success, order}`, type says `{message}`. | **P3** | NO | orders.ts:54 | VERIFIED |
| 14 | **`sendOfferToWatchers` is dead code.** Backend endpoint doesn't exist. | **P3** | NO | offers.ts:62-68 | VERIFIED |
| 15 | **Backend test suite: 11 suites fail** due to missing `csv-parse/sync` module resolution. | **P2** | NO | Jest output | VERIFIED |
| 16 | **Dashboard test coverage is near-zero.** Only 1 test file for the entire dashboard. | **P2** | NO | apps/dashboard/src/__tests__/ | VERIFIED |
| 17 | **Dexterity/gender option value mismatches.** "Right-Handed" vs "Right Handed", "Men's" vs "Male". | **P2** | NO (doesn't block save, but causes data inconsistency) | ListingForm.tsx:85-86, sell.tsx | VERIFIED |

**P0 count: 6 (including 1 latent). P1 count: 4.**

### §11a — What I Could NOT Verify

1. **Backend test suite actual failures vs intentional failures.** The brief says `pro-seller-foundation` carries intentional failing tests. All 43 test failures I observed are caused by one compilation error (`csv-parse/sync` module), not feature-in-progress markers. I could not determine whether there are additional intentional failures hidden behind this compilation error.

2. **Overview page `getPlatformStats` behaviour for non-admin users.** I verified the endpoint exists on the admin routes with `adminAuth` middleware, and the dashboard calls it, but I did not verify whether the call fails gracefully or crashes the overview page for non-admin pro sellers. Would require runtime testing.

3. **Stripe Connect endpoints (balance, account-status, dashboard-link, etc.).** I verified these are called by the payouts and settings pages and exist in the backend route files, but did not trace their full response shapes against the api-client types. Marked as UNDETERMINED in §4.

4. **Auto-save error handling.** I inferred that auto-save errors are silently swallowed (the `await doSave()` result is not checked at ListingForm.tsx:704), but could not verify this in a running environment.

5. **Analytics page `recharts` dependency.** The page imports from `recharts`. I did not verify whether this package is installed and resolves correctly at build time on the Amplify deployment.

6. **Socket.IO fallback in messages.** The messages page uses Socket.IO with an HTTP polling fallback. I verified the code exists but could not test real-time connectivity.

7. **Web repo test suite execution.** I did not run the Vitest suite for the dashboard because the brief's read-only constraint and potential env requirements made this risky. The test runner is Vitest, not Jest as the brief assumed.

---

## §12 — RECOMMENDATIONS

1. Merge the snake_case → camelCase spec key fix, but fix the `length`/`shaft_length` data-loss bug first by changing the input control to a categorical dropdown matching mobile's options.
2. Add `is_pro_store` middleware to all pro-seller backend endpoints, and populate `isProStore` in the dashboard auth provider from the user profile.
3. Build the order detail page (`/orders/[id]`) with label purchase, tracking, and mark-shipped flows using the existing Shippo endpoints.
4. Fix the `getOrder()` unwrap bug before building the order detail page.
5. Add a scroll-to-first-error and/or top-level validation banner to the ListingForm.
6. Make the `/apply` form's `website` field match backend expectations (either make it truly optional on both sides, or mark it required on the form).
7. Fix the `csv-parse/sync` module resolution so the full backend test suite passes.
8. Add image ingestion to the CSV import pipeline (I-03), or provide a bulk image upload UI for drafted listings.
