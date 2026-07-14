# Questions & Findings — `task/dash-listing-form-fixes-2`

## 1. Security Scan

### Reviewed files

| File | Concern | Status |
|------|---------|--------|
| `apps/dashboard/src/components/ListingForm.tsx` | Spec key changes are data-mapping only — no new user input surfaces or injections. `generateKey()` fallback uses `crypto.getRandomValues()` (CSPRNG). No raw error objects reflected to DOM. | Clean |
| `packages/api-client/src/endpoints/listings.ts` | `uploadListingImage` now throws `ApiError` matching the `importListingsCsv` pattern. Error body is parsed from JSON but never rendered raw in UI. | Clean |

### No security issues found in the changes.

---

## 2. §1 — Backend route verification (the original claims were correct)

The follow-up brief (§1) asserted that `markOffSale`, `relistListing`, `publishListing`, and `publishListingsBulk` handlers exist in the backend at specific line numbers. **This assertion is incorrect.** Full verification:

1. Fetched `Mulligans-Backend`, checked out `feature/pro-store-foundation`.
2. Read `src/controllers/listingController.ts` (1342 lines) — no `markOffSale`, `relist`, `publishListing`, or `publishListingsBulk` handlers.
3. Read `src/routes/listingRoutes.ts` — no `/off-sale`, `/relist`, `/publish`, or `/publish-bulk` routes.
4. Switched to `main` — re-read `listingController.ts` (1405 lines) — still no handlers.
5. `grep -r` across entire backend `src/` — zero matches for these function names.

The line numbers cited in the brief (1288, 1355, 1402, 1456) do not correspond to these handlers on any branch.

The original `output/questions-dash-listing-form-fixes.md` has been updated with this verified finding. See that file for the full correction.

---

## 3. §2 — Unwrap check for the four endpoints

Since the four backend handlers do not exist, there is nothing to unwrap. The api-client functions are client stubs that would 404 at runtime. No code changes needed.

**Call sites verified:** All four functions are imported and called in `apps/dashboard/src/app/(dashboard)/inventory/page.tsx` (lines 11-14, 749, 760, 771, 783). These calls will fail at runtime until the backend routes are implemented.

---

## 4. Specification key mismatches flagged (fields mobile does not have)

The following dashboard fields have **no equivalent in mobile**. They are kept in the dashboard UI but are not required by `validate()`, since mobile does not collect them. If mobile-created listings are edited in the dashboard, these fields will be blank (not data loss — the data was never there).

### Clubs
| Dashboard field | Dashboard key | Mobile equivalent | Notes |
|----------------|--------------|-------------------|-------|
| Grip | `grip` | None | Mobile does not collect a freetext grip field |
| Year | `year` | None | Mobile does not collect year |
| Shaft Material | `shaftMaterial` | Present for Irons/Wedges only | Mobile collects this for some sub-types, not all. Dashboard shows it for all clubs but no longer requires it. |

### Shafts, Grips & Heads
| Dashboard field | Dashboard key | Mobile equivalent | Notes |
|----------------|--------------|-------------------|-------|
| Shaft Weight | `shaftWeight` | None | Mobile does not collect shaft weight |
| Grip Material | `gripMaterial` | None | Mobile does not collect grip material |

### Shoes
| Dashboard field | Dashboard key | Mobile equivalent | Notes |
|----------------|--------------|-------------------|-------|
| Width | `width` | None | Mobile does not have a shoe width field |
| Spikes (was "Type") | `spikes` | `spikes` (Yes/No) | Key now matches mobile. Dashboard previously used `shoe_type` with values Spiked/Spikeless/Waterproof; now uses `spikes` with Yes/No to match mobile |

### Balls
| Dashboard field | Dashboard key | Mobile equivalent | Notes |
|----------------|--------------|-------------------|-------|
| Quantity | `quantity` (in specs) | `quantity` (top-level) | Mobile sends quantity as a top-level field, not in specifications. Dashboard keeps it in specs. Validation no longer requires it. |

### Training Aids
| Dashboard field | Dashboard key | Mobile equivalent | Notes |
|----------------|--------------|-------------------|-------|
| Type | `training_type` | None | Mobile has no specification fields for Training Aids. Field kept but not required. |

### Everything Else
| Dashboard field | Dashboard key | Mobile equivalent | Notes |
|----------------|--------------|-------------------|-------|
| Item Name | `item_name` | None | Mobile has no specification fields for Everything Else. Field kept but not required. |

---

## 5. Option value mismatches between mobile and dashboard

These are dropdown option values that now match mobile but differ from previous dashboard values. Existing dashboard-created listings using the old values will show blank in the affected dropdowns.

| Field | Old dashboard values | New values (matching mobile) |
|-------|---------------------|------------------------------|
| Dexterity | `Right-Handed`, `Left-Handed` | `Right Handed`, `Left Handed` |
| Gender | `Men's`, `Women's`, `Unisex`, `Junior` | `Male`, `Female`, `Junior` |
| Shaft Flex | Missing `Wedge` and `Junior` | Added `Wedge`, `Junior` |
| Club Type (subcategory) | `Driver`, `Fairway Wood`, `Hybrid`, `Iron Set`, `Single Iron`, `Wedge`, `Putter`, `Chipper` | `Drivers`, `Fairway Woods`, `Hybrids`, `Irons`, `Wedges`, `Putters` |
| Shoe Type → Spikes | `Spiked`, `Spikeless`, `Waterproof` | `Yes`, `No` |

**Impact:** At pre-launch stage, very few dashboard-created listings exist. Mobile-created listings (the majority) will now display correctly. This is the intended trade-off per the brief's direction to align the dashboard to mobile.

---

## 6. Question: `Unisex` gender option

Mobile does not have a `Unisex` option for gender (only `Male`, `Female`, `Junior`). The dashboard previously had `Unisex`. This has been removed to match mobile. If `Unisex` needs to be supported, it should be added to mobile first.

---

## 7. Question: Clothing sub-category values

Dashboard clothing sub-categories: `Top`, `Bottom`, `Outerwear`, `Base Layer`, `Headwear`, `Glove`.
Mobile clothing sub-categories: `Tops`, `Trousers`, `Shorts`, `Jackets`, `Gloves`, `Headwear`.

These values differ. The dashboard's sub-category dropdown was NOT changed in this task because the brief only specified fixing specification KEY names (snake_case → camelCase) and top-level field locations. Sub-category VALUES are a separate alignment task. Flagged for follow-up.
