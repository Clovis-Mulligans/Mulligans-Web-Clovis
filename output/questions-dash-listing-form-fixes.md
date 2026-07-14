# Questions & Findings — `task/dash-listing-form-fixes`

## 1. Security Scan

### Reviewed files

| File | Concern | Status |
|------|---------|--------|
| `packages/api-client/src/endpoints/listings.ts` | Returns inner object from API response — no new surface area. Generic types are now honest. | Clean |
| `apps/dashboard/src/components/ListingForm.tsx` | `crypto.randomUUID()` replaces `Math.random()` — improvement. Image error messages use controlled strings, not raw error objects. No user input reflected into HTML unsanitised. | Clean |
| `packages/api-client/src/client.ts` | Unchanged. Bearer token from localStorage sent in Authorization header over HTTPS. No new exposure. | Clean |

### No security issues found in the changes.

---

## 2. Other endpoints with potentially mismatched return types

The brief asked to grep the api-client listings file for other endpoints whose declared return type may not match the backend's actual response shape.

### Confirmed correct

| Function | Declared type | Backend response | Match? |
|----------|--------------|------------------|--------|
| `getMyListings` | `GetMyListingsResponse { listings: [...], total, page, limit, totalPages }` | `res.json({ listings: [...], total, ... })` (no `listing` wrapper) | Yes |
| `getSellerListings` | `{ listings: ListingWithSeller[]; total: number }` | `res.json({ listings })` | Yes |
| `deleteListing` | `void` | `res.json({ message: 'Listing deleted successfully' })` | Acceptable (void ignores the body) |
| `deleteListingImage` | `void` | `res.json({ message: 'Image deleted successfully' })` | Acceptable |

### Endpoints with no matching backend handler

**Correction (2026-07-14, `task/dash-listing-form-fixes-2`):** The original table below was verified by re-reading the backend. The claim that these four routes do not exist **was correct all along**, despite the follow-up brief (§1) asserting otherwise. Here is what was verified and how:

**Verification method:**
1. Fetched `Mulligans-Backend` repo, checked out `feature/pro-store-foundation` (the active backend branch).
2. Read `src/controllers/listingController.ts` in full (1342 lines). Searched for `markOffSale`, `relist`, `publishListing`, `publishListingsBulk` — no handler functions found.
3. Read `src/routes/listingRoutes.ts` in full — no `/off-sale`, `/relist`, `/publish`, or `/publish-bulk` routes.
4. Switched to `main` branch and re-read `listingController.ts` (1405 lines) — still no handlers.
5. Ran `grep -r 'markOffSale\|relistListing\|publishListing\|publishListingsBulk' src/` across the entire backend `src/` — zero matches.

**Conclusion:** These four functions exist in `packages/api-client/src/endpoints/listings.ts` as client stubs, but the corresponding backend handlers and routes have not been implemented on any branch. The line numbers cited in the follow-up brief (1288, 1355, 1402, 1456) do not correspond to these handlers on either `feature/pro-store-foundation` or `main`.

| Function | Route | Declared return | Status |
|----------|-------|-----------------|--------|
| `markListingOffSale` | `PUT /api/listings/:id/off-sale` | `Listing` | **No backend handler.** Client stub only. |
| `relistListing` | `PUT /api/listings/:id/relist` | `Listing` | **No backend handler.** Client stub only. |
| `publishListing` | `PUT /api/listings/:id/publish` | `PublishListingResponse` | **No backend handler.** Client stub only. |
| `publishListingsBulk` | `PUT /api/listings/publish-bulk` | `PublishListingsBulkResponse` | **No backend handler.** Client stub only. |

**Call sites:** These four functions ARE imported and called in `apps/dashboard/src/app/(dashboard)/inventory/page.tsx` (lines 11-14, 749, 760, 771, 783). These calls would produce 404 errors at runtime. When the backend routes are added, the response envelope shape must be verified and unwrapping applied if needed.

---

## 3. Dev dependency additions (flagged per brief rules)

The following devDependencies were added to write the required tests. They are not shipped to production.

| Package | Why needed |
|---------|-----------|
| `@testing-library/react` | Render React components in tests |
| `@testing-library/dom` | Peer dependency of @testing-library/react |
| `@testing-library/user-event` | Simulate user interactions |
| `@testing-library/jest-dom` | DOM assertion matchers |
| `jsdom` | Vitest jsdom environment for component tests |
| `@vitejs/plugin-react` | JSX transform (dashboard tsconfig uses `jsx: 'preserve'`) |

These fill a gap noted in the I-05 CHANGES.md: *"No jest, no react-testing-library, no test scripts in dashboard or api-client."* Dashboard component tests are now feasible.

---

## 4. Web app (`apps/web`) also uses these api-client functions

The unwrap fix also affects `apps/web`:
- `apps/web/src/app/listings/[id]/edit/page.tsx` imports `getListing` and `updateListing`
- `apps/web/src/app/sell/page.tsx` imports `createListing`

These callers already expected the unwrapped entity (they read `.id`, `.title`, `.price` directly). The fix corrects the data they receive. No code changes needed in those files.
