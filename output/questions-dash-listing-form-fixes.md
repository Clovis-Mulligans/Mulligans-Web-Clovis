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

### Potentially mismatched (out of scope — flagged only)

| Function | Route | Declared return | Concern |
|----------|-------|-----------------|---------|
| `markListingOffSale` | `PUT /api/listings/:id/off-sale` | `Listing` | **Route does not exist in backend** (`listingRoutes.ts` has no `/off-sale` path). This would 404. If the route is added later, need to check whether it wraps in `{ listing: ... }`. |
| `relistListing` | `PUT /api/listings/:id/relist` | `Listing` | **Route does not exist in backend.** Same concern as above. |
| `publishListing` | `PUT /api/listings/:id/publish` | `PublishListingResponse` | **Route does not exist in backend.** Added in I-05 brief but no corresponding backend route found. |
| `publishListingsBulk` | `PUT /api/listings/publish-bulk` | `PublishListingsBulkResponse` | **Route does not exist in backend.** Same as above. |

**Note:** These four functions were added in previous briefs (I-04, I-05) as client stubs for planned backend endpoints. They are not called in any critical flow today. When the backend routes are added, the response envelope shape must be verified and unwrapping applied if needed.

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
