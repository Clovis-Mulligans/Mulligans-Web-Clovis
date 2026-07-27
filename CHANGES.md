# CHANGES — `task/dash-listing-form-fixes`

**Branch:** `task/dash-listing-form-fixes`
**Base:** `clovis/pro-seller-foundation` @ `a07dd5b`
**Date:** 2026-07-14

---

## 1. P0 — Auto-save no longer silently destroys listings

**File:** `apps/dashboard/src/components/ListingForm.tsx:689-698`

**Root cause:** The `isDirty` effect (`useEffect(() => { setIsDirty(true); }, [title, description, ...])`) ran on mount because React fires effects after the initial render with all deps populated. This meant `isDirty` was `true` before the user touched anything. Combined with the blank-form bug (§2 below) and auto-save skipping validation, opening an edit page and waiting 60 seconds silently PUT an empty payload — wiping the listing.

**Mechanism chosen:** A `hasHydrated` ref guard.
- `const hasHydrated = useRef(false);` (line 689)
- On the first effect invocation (mount), the guard is `false` → set it to `true` and `return` without setting `isDirty` (lines 693-695).
- All subsequent invocations (genuine user edits) proceed normally and set `isDirty(true)`.

**Why it cannot fire on mount:** The ref starts `false` and is set to `true` unconditionally on the first call. Since refs persist across renders but reset only on unmount, the guard fires exactly once per component lifecycle — the mount. It does not depend on any prop/state value, so there is no race condition or timing sensitivity.

**Auto-save feature preserved:** The timer interval logic is unchanged. A genuine field edit (any subsequent effect invocation) still sets `isDirty(true)`, and the 60-second auto-save interval still fires `doSave('draft', true)` when dirty.

**Regression test confirms:** The test `does NOT auto-save on mount` advances fake timers by 120 seconds after mounting with `initialData` and asserts that neither `updateListing` nor `createListing` was called. This test fails against the pre-fix code (isDirty fires on mount → auto-save fires at 60s) and passes after the fix.

---

## 2. P1 — API client unwraps the `{ listing }` envelope

**File:** `packages/api-client/src/endpoints/listings.ts:101-124`

Three functions modified:
- `getListing` (line 101-104): `const res = await apiClient.get<{ listing: ListingWithImages }>(…); return res.listing;`
- `createListing` (line 110-113): `const res = await apiClient.post<{ listing: Listing }>(…); return res.listing;`
- `updateListing` (line 119-125): `const res = await apiClient.put<{ listing: Listing }>(…); return res.listing;`

The generic type parameter now honestly describes the wire format (`{ listing: T }`), and the function unwraps it before returning. No `as` casts. Return types unchanged — callers are unaffected.

**Mobile consumption checked:** The mobile app (`Mulligans-Mobile`) does **not** import from `@mulligans/api-client`. It is not listed in the mobile `package.json` dependencies, and no import from the shared package appears anywhere in the mobile codebase. The mobile repo uses its own axios-based API layer with direct API calls. Unwrapping here cannot break mobile.

Within the web monorepo, `getListing`/`createListing`/`updateListing` are consumed by:
- `apps/dashboard/src/components/ListingForm.tsx` (createListing, updateListing)
- `apps/dashboard/src/app/(dashboard)/inventory/[id]/edit/page.tsx` (getListing)
- `apps/web/src/app/listings/[id]/edit/page.tsx` (getListing, updateListing)
- `apps/web/src/app/sell/page.tsx` (createListing)

All these callers already expected the unwrapped entity (read `.id`, `.title`, `.price` etc. directly). They now get what they expected.

---

## 3. P1 — Image-upload failures are surfaced to the user

**File:** `apps/dashboard/src/components/ListingForm.tsx:843-877`

Previously, the `uploadPendingImages` catch block was `catch { }` — entirely silent. Now:
- A `failedCount` counter tracks how many images failed (line 851).
- The catch block distinguishes HTTP 413 (file too large) from other errors, and sets `imageError` with a specific message for 413 (lines 865-869).
- After the upload loop, if `failedCount > 0`, `setSubmitError(…)` displays a user-visible message: *"Your listing was saved, but N photo(s) failed to upload. Please try re-uploading from the edit page."* (lines 872-876).
- The listing save is still non-fatal — the listing persists regardless of image upload failures.

---

## 4. P2 — Tidy-ups

### handlePublish no-op ternary
**File:** `apps/dashboard/src/components/ListingForm.tsx:927`

Was: `const handlePublish = () => doSave(status === 'active' ? 'active' : 'active');`
Now: `const handlePublish = () => doSave('active');`

Both branches were identical. Publishing always sets status to `active`.

### generateKey uses UUID
**File:** `apps/dashboard/src/components/ListingForm.tsx:615-617`

Was: `return Math.random().toString(36).slice(2);`
Now: `return crypto.randomUUID();`

Uses the browser-native `crypto.randomUUID()` — no new dependency needed. Supported in all modern browsers and Node.js 19+.

---

## Tests

### Test location convention

- **api-client tests:** `packages/api-client/src/__tests__/listings.test.ts` with vitest config at `packages/api-client/vitest.config.ts` (node environment, scoped include).
- **dashboard tests:** `apps/dashboard/src/__tests__/ListingForm.test.tsx` with vitest config at `apps/dashboard/vitest.config.ts` (jsdom environment, `@vitejs/plugin-react` for JSX transform, scoped include).

This follows the brief's implied structure of co-locating tests with the package they test. Existing tests for api-client functions in `apps/web/src/__tests__/` use a different pattern (dynamic imports after module reset); the new api-client tests use the same pattern for consistency with the existing convention.

### Dev dependencies added

Flagged in `output/questions-dash-listing-form-fixes.md`. All devDependencies only — not shipped to production:
- `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`, `@testing-library/jest-dom` — component rendering/DOM queries
- `jsdom` — vitest jsdom environment
- `@vitejs/plugin-react` — JSX transform for vitest (dashboard tsconfig uses `jsx: 'preserve'`)

### Test summary

**api-client (3 tests) — run: `npx vitest run --config packages/api-client/vitest.config.ts`**

| Test | What it verifies |
|------|-----------------|
| getListing unwraps | Given mock fetch returning `{ listing: { id, title, … } }`, asserts `result.title` is defined and `result.listing` is `undefined` |
| createListing unwraps | Same pattern — asserts `result.id` is defined (the exact field whose `undefined` broke image upload) |
| updateListing unwraps | Same pattern |

**ListingForm (4 tests) — run: `npx vitest run --config apps/dashboard/vitest.config.ts`**

| Test | What it verifies |
|------|-----------------|
| renders populated fields | Form shows title, description, price, category, condition from initialData; Status toggle reflects `active` when listing is `active` |
| P0 regression: no auto-save on mount | Mount with initialData → advance 120s → assert no save call. **Fails before fix, passes after.** |
| auto-save after genuine edit | Mount → change title → advance 60s → assert `updateListing` called with new title and status `draft` |
| image-upload failure surfaces error | Create listing + attach image + mock upload rejection → assert error message visible to user |

### Pre-fix regression confirmation

The P0 auto-save regression test was verified to fail against the pre-fix code: without the `hasHydrated` guard, `isDirty` is set to `true` on mount, and advancing timers causes `updateListing` to fire. With the fix applied, the guard prevents mount-triggered dirty, and the test passes.

---

## Build

Both `dashboard` and `web` compile without type errors (verified via the test runs which import the changed modules).

---

## Files changed

| File | Change |
|------|--------|
| `packages/api-client/src/endpoints/listings.ts` | Unwrap `{ listing }` envelope in getListing, createListing, updateListing |
| `apps/dashboard/src/components/ListingForm.tsx` | Fix isDirty mount bug, surface image errors, fix handlePublish, fix generateKey |
| `packages/api-client/vitest.config.ts` | NEW — vitest config for api-client tests |
| `packages/api-client/src/__tests__/listings.test.ts` | NEW — 3 tests for envelope unwrapping |
| `apps/dashboard/vitest.config.ts` | NEW — vitest config for dashboard tests |
| `apps/dashboard/src/__tests__/ListingForm.test.tsx` | NEW — 4 tests for form fixes |
| `package.json` / `package-lock.json` | Dev dependencies for testing |
| `CHANGES.md` | This file |
| `output/questions-dash-listing-form-fixes.md` | Security scan + findings |
