# CHANGES — `task/dash-listing-form-fixes-2`

**Branch:** `task/dash-listing-form-fixes-2`
**Base:** `clovis/pro-seller-foundation` @ `03cc15f`
**Date:** 2026-07-14

---

## 1. P0 — Dashboard now reads mobile's camelCase specification keys (§2b)

**File:** `apps/dashboard/src/components/ListingForm.tsx`

### Root cause

The dashboard's `ListingForm` read all specification fields using snake_case keys (`specs.club_type`, `specs.shaft_flex`, `specs.shaft_material`, `specs.lie_angle`, `specs.grip_size`, `specs.shaft_length`, `specs.shaft_weight`, `specs.grip_material`, `specs.shoe_type`, `specs.training_type`, `specs.item_name`). The mobile app writes camelCase keys (`shaftFlex`, `shaftMaterial`, `lieAngle`, `gripSize`, etc.). Result: every specification field rendered blank when editing a mobile-created listing, and saving that listing destroyed all specification data.

Additionally, `brand`, `model`, and `subcategory` are **top-level listing fields** (present in the Prisma schema alongside `title`/`price`), but the dashboard read them from `specs.brand`/`specs.model`/`specs.subcategory`. Mobile writes them top-level. Opening a mobile-created listing and saving it destroyed brand, model, and subcategory.

### What changed

**Specification key renames (every read AND write updated):**

| Category | Old dashboard key | New key (matches mobile) |
|----------|------------------|-------------------------|
| Clubs | `club_type` | `subcategory` (top-level) |
| Clubs | `shaft_flex` | `shaftFlex` |
| Clubs | `shaft_material` | `shaftMaterial` |
| Clubs | `lie_angle` | `lieAngle` |
| Clubs | `shaft_length` | `length` |
| Shafts | `shaft_flex` | `shaftFlex` |
| Shafts | `shaft_material` | `shaftMaterial` |
| Shafts | `shaft_length` | `shaftLength` |
| Shafts | `shaft_weight` | `shaftWeight` |
| Grips | `grip_size` | `gripSize` |
| Grips | `grip_material` | `gripMaterial` |
| Club Heads | `club_type` | `clubType` |
| Clothing | `colour` | `color` |
| Shoes | `size` | `shoeSize` |
| Shoes | `shoe_type` | `spikes` |

**Top-level field handling:**

- `brand`: Now read from `initialData?.brand` (top-level, with fallback to `specs.brand` for backward compat). Sent as top-level `brand` in `buildPayload()`. Stripped from `specifications` object.
- `model`: Same pattern. Also duplicated INTO `specifications` (matching mobile's behavior).
- `subcategory`: Same pattern. For Clubs, this replaces the old `specs.club_type`.

**Option value alignment with mobile:**

| Field | Old values | New values |
|-------|-----------|------------|
| Dexterity | `Right-Handed`, `Left-Handed` | `Right Handed`, `Left Handed` |
| Gender | `Men's`, `Women's`, `Unisex`, `Junior` | `Male`, `Female`, `Junior` |
| Shaft Flex | 5 options | 7 options (added `Wedge`, `Junior`) |
| Club Type | 8 options (singular) | 6 options (plural, matching mobile subcategories) |
| Shoe Type | `Spiked`/`Spikeless`/`Waterproof` | `Yes`/`No` (now "Spikes" field) |

**Validation relaxed to match mobile:**

- `shaft_material` (Clubs): no longer required (mobile only requires it for some sub-types)
- `shoe_type`/`spikes` (Shoes): no longer required
- `quantity` (Balls): no longer required (mobile sends quantity top-level, not in specs)
- `training_type` (Training Aids): no longer required (mobile has no spec fields for Training Aids)
- `item_name` (Everything Else): no longer required (mobile has no spec fields for Everything Else)

### How mobile spec keys were verified

Read the following files in `Mulligans-Mobile` (branch `android-fixes`):
- `app/(tabs)/sell.tsx` — the create-listing form, maps all specification fields by category
- `app/edit-listing/[id].tsx` — the edit-listing form, reads existing specifications
- `constants/categories.ts` — category/subcategory definitions

Every key in the comparison table was taken from mobile's actual code. Fields the dashboard has but mobile does not are flagged in `output/questions-dash-listing-form-fixes-2.md` §4.

---

## 2. §1 — Corrected the original questions file

**File:** `output/questions-dash-listing-form-fixes.md`

The follow-up brief asserted that `markOffSale`, `relistListing`, `publishListing`, and `publishListingsBulk` handlers exist in the backend at specific line numbers. **This assertion is incorrect.**

Verification: read `Mulligans-Backend/src/controllers/listingController.ts` on both `feature/pro-store-foundation` (1342 lines) and `main` (1405 lines). Also read `src/routes/listingRoutes.ts`. Also ran `grep -r` across entire backend `src/`. **No handlers or routes exist for these four functions on any branch.**

The original questions file's claim that these routes do not exist **was correct**. The file has been updated with a detailed verification methodology section explaining exactly what was read and what was found.

---

## 3. §2 — Four endpoint unwrap check: nothing to unwrap

Since the four backend handlers (`markOffSale`, `relistListing`, `publishListing`, `publishListingsBulk`) do not exist, there is no response to unwrap. The api-client functions are client stubs. No code changes needed.

**Call sites verified:** all four are called from `apps/dashboard/src/app/(dashboard)/inventory/page.tsx` (lines 749, 760, 771, 783). These would 404 at runtime.

---

## 4. §3 — `uploadListingImage` now throws `ApiError` (413 branch is reachable)

**File:** `packages/api-client/src/endpoints/listings.ts:166-169`

**Option taken:** Preferred (make the throw match `importListingsCsv`).

The `uploadListingImage` function previously threw a plain `Error` on failure:
```ts
throw new Error(`Image upload failed: ${response.statusText}`);
```

Now throws `ApiError` with the HTTP status code, matching the pattern already used by `importListingsCsv` in the same file:
```ts
let data: unknown;
try { data = await response.json(); } catch { /* not JSON */ }
const { ApiError } = await import('../client');
throw new ApiError(response.status, response.statusText, data);
```

The 413 branch in `ListingForm.tsx:uploadPendingImages` (which checks `err instanceof Error && 'status' in err`) is now genuinely reachable.

**Call sites checked:**
- `apps/dashboard/src/components/ListingForm.tsx:855` — already checks for `status` property, now works
- `apps/web/src/app/sell/page.tsx:383` — bare `await`, no status check, no breakage
- `apps/web/src/app/listings/[id]/edit/page.tsx:398` — inside try/catch with generic error handling, no breakage

No caller depends on the previous plain-`Error` behavior.

---

## 5. §4 — `crypto.randomUUID()` is SSR-safe

**File:** `apps/dashboard/src/components/ListingForm.tsx:615-625`

`generateKey()` now checks `globalThis.crypto?.randomUUID` before calling it. Fallback builds a v4 UUID from `crypto.getRandomValues()` (available in all modern browsers and Node.js 15+, which is below Next.js's minimum). No new dependency added. No `Math.random()`.

**Checked for existing UUID util:** `grep -r 'randomUUID\|uuid\|nanoid' packages/ apps/` — no shared UUID utility exists in the monorepo.

---

## Tests

### api-client (4 tests) — run: `npx vitest run --config packages/api-client/vitest.config.ts`

| Test | What it verifies |
|------|-----------------|
| getListing unwraps | (unchanged from previous branch) |
| createListing unwraps | (unchanged) |
| updateListing unwraps | (unchanged) |
| **uploadListingImage throws ApiError with status** | Mock fetch returns 413 → thrown error has `status: 413` and `statusText: 'Payload Too Large'` |

### ListingForm (7 tests) — run: `npx vitest run --config apps/dashboard/vitest.config.ts`

| Test | What it verifies |
|------|-----------------|
| **renders populated fields from mobile-shaped Clubs listing** | Given camelCase specs + top-level `brand: 'TaylorMade'`, `subcategory: 'Drivers'`: brand input shows "TaylorMade", club type shows "Drivers", dexterity shows "Right Handed", shaft flex shows "Stiff", model shows "Qi4D (2026)", loft shows "8". **Fails before fix** (all fields blank), **passes after.** |
| **round-trip: changing only title preserves all specs** | Load full Clubs listing → change only title → click Update → `updateListing` payload has: `brand: 'TaylorMade'`, `subcategory: 'Drivers'` (top-level); `specs.shaftFlex: 'Stiff'`, `specs.dexterity: 'Right Handed'`, `specs.loft: '8'`, `specs.lieAngle: 'Standard'`, etc. (all preserved); `specs.brand` and `specs.subcategory` are `undefined` (correctly extracted to top level). **Fails before fix** (specs empty, brand/subcategory missing), **passes after.** |
| **renders Shafts listing with camelCase specs** | Non-Clubs category: Shaft with `shaftFlex: 'Stiff'`, `shaftMaterial: 'Steel'`, `shaftLength: '37'` — all fields populated, round-trip preserves values |
| does NOT auto-save on mount | (unchanged — still verifies P0 regression guard) |
| auto-saves after genuine edit | (unchanged) |
| surfaces image-upload failures | (updated: no longer fills in item_name since it's not required for Everything Else) |
| **413 from image upload shows size-specific message** | Mock `uploadListingImage` rejects with `{ status: 413 }` → DOM contains "too large to upload" with the filename |

---

## Files changed

| File | Change |
|------|--------|
| `apps/dashboard/src/components/ListingForm.tsx` | Fix spec keys to camelCase, read brand/model/subcategory from top-level, relax validation to match mobile, fix `generateKey()` SSR guard |
| `packages/api-client/src/endpoints/listings.ts` | `uploadListingImage` throws `ApiError` instead of plain `Error` |
| `apps/dashboard/src/__tests__/ListingForm.test.tsx` | 7 tests: mobile-shaped fixture, populated fields, round-trip data-loss guard, Shafts category, 413 error |
| `packages/api-client/src/__tests__/listings.test.ts` | 1 new test: uploadListingImage ApiError |
| `output/questions-dash-listing-form-fixes.md` | Corrected §1: backend route claims verified as correct, detailed methodology added |
| `output/questions-dash-listing-form-fixes-2.md` | NEW: security scan, flagged fields mobile doesn't have, option value mismatches |
| `CHANGES.md` | This file |
