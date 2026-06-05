# Add Memorabilia Category — Web (5 June 2026)

## Investigation Findings

**Mobile and web do NOT share a categories config.** They have independent copies:
- Mobile: `constants/categories.ts` (array of `{ name, displayName, icon, subcategories }`)
- Web sell form: `apps/web/src/lib/listingCategories.ts` (CATEGORIES array + SUBCATEGORIES record)
- Web browse/filter: `apps/web/src/components/FilterSidebar.tsx` (inline constants)
- Dashboard: `apps/dashboard/src/components/ListingForm.tsx` (inline constants)

These are separate tasks, not a single shared-config change.

## Files Modified

| File | Change |
|------|--------|
| `apps/web/src/lib/listingCategories.ts` | Added Memorabilia to CATEGORIES array and SUBCATEGORIES record |
| `apps/web/src/lib/constants.ts` | Added 'memorabilia' ↔ 'Memorabilia' slug mappings |
| `apps/web/src/lib/brands.ts` | Added Memorabilia + Everything Else → `['Other']` (free-text brand) |
| `apps/web/src/app/page.tsx` | Added Memorabilia to homepage category grid (references Memorabilia.png icon) |
| `apps/web/src/components/CategoryNav.tsx` | Added Memorabilia to top navigation bar |
| `apps/web/src/components/FilterSidebar.tsx` | Added Memorabilia to CATEGORY_FILTERS + MEMORABILIA_SUBS + getSubcategoriesForCategory() |
| `apps/dashboard/src/components/ListingForm.tsx` | Added Memorabilia to CATEGORIES + MemorabiliaFields component + validation + render switch |
| `apps/web/src/app/stores/[slug]/StorePageClient.tsx` | Added Memorabilia to store page category filter |

## Files NOT Modified (and why)

- `apps/web/src/lib/listingCategories.ts:specFieldsFor()` — Memorabilia has no category-specific spec fields (no loft/flex/size etc.). Returns `[]` via default case, which is correct.
- `apps/web/src/lib/models.ts` — No model database for Memorabilia. Model selector won't appear.
- `packages/api-client/` — No category-specific logic in the API client.

## Homepage Icon

Added `{ label: 'Memorabilia', slug: 'memorabilia', icon: '/icons/search-icons/Memorabilia.png' }` to the homepage grid. **Harry will need to add a `Memorabilia.png` icon file** to `apps/web/public/icons/search-icons/`. If missing, the Next.js Image component will show a broken image. The other categories have dedicated PNG icons in that directory.

## Security Scan

- **Server-side validation:** Category strings are validated by Zod enum on the backend. The web only sends strings that the backend accepts.
- **No XSS risk:** All category names are hardcoded string constants, never user-supplied content.
- **Rate limiting:** Existing 50 listings/hour rate limit is route-level, not category-level. No bypass possible by using the new category.
- **Brand input sanitisation:** Free-text brand input goes through the standard `z.string().max(100)` Zod validation on the backend.

## Assumptions

1. Subcategories 'Signed Items', 'Vintage', 'Other' are identical across backend, mobile, and web.
2. No spec fields needed for Memorabilia (no loft, shaft flex, size, etc.).
3. The `Memorabilia.png` icon for the homepage grid needs to be created/provided by Harry. All other categories have PNG icons at `apps/web/public/icons/search-icons/`.
4. The dashboard MemorabiliaFields component follows the same minimal pattern as EverythingElseFields — subcategory dropdown + optional brand text input.
