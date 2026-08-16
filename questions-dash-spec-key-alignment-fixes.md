# Questions — `task/dash-spec-key-alignment-fixes`

## Security Scan Findings

1. **`optionsWithCurrent` injects stored values into the DOM.** Confirmed safe: all option rendering uses React JSX (`<option value={...}>{...}</option>`), which auto-escapes HTML entities. No `dangerouslySetInnerHTML` anywhere in ListingForm.tsx. A malicious stored value like `<script>alert(1)</script>` would render as escaped text in the dropdown, never executed.

2. **No auth bypass.** No changes to middleware, auth provider, or route guards. The `is_pro_store` enforcement gap (identified in audit `8bcdb73`) remains unaddressed — separate concern.

3. **No input validation regression.** `validate()` maintains all previously-required fields per category. The balls quantity validation now checks `readSpec(specs, 'packSize', 'quantity')` instead of top-level `quantity` state.

4. **No data leakage.** `specsToCanonical` now takes `category` as a parameter (scoping the key map) but the same field set is sent. No new fields exposed.

## Mobile Ball-Quantity / Stock Finding (§4.2)

**Finding:** Mobile `sell.tsx` at `a546d01` writes ball pack size to top-level `quantity` (line 1019: `quantity: parseInt(quantity) || 1`). This is the same `listings.quantity` field (`schema.prisma:98`, `Int @default(1)`) that drives stock management — oversell locks, cancel/return stock restore, and CSV delta-method reconciliation.

**Impact:** A mobile-listed box of 12 balls has `quantity: 12`, meaning the platform believes the seller has 12 units in stock. One box could be sold 12 times.

**Recommendation for Harry:** Mobile should write ball pack size to `specifications.packSize` (or a new top-level field that is NOT `quantity`) and default `quantity` to `1` for Balls, matching all other categories. The dashboard now writes `packSize` into specs and does not touch top-level `quantity`.

**DO NOT fix on mobile.** This is flagged only for Harry's review.

## Product Decisions Needed (not applied — handled by `optionsWithCurrent`)

### Gender: "Unisex"
- **Production data:** Unknown count, but `"Unisex"` was a dashboard option. Likely exists on some listings.
- **Current behavior:** Renders as `Unisex (existing)` in dropdown. Value preserved on save. Seller can see and re-select it.
- **Question:** Should `"Unisex"` be added back to `GENDER_OPTIONS_MOBILE` as a permanent option? Mobile does not offer it.

### Grip size: "Oversize"
- **Production data:** Unknown count. Dashboard previously offered `"Oversize"`.
- **Current behavior:** Renders as `Oversize (existing)`. Preserved on save.
- **Question:** Is `"Oversize"` equivalent to mobile's `"Jumbo"`? If so, a normalizer could map it. If not, it should remain display-preserved.

### Clothing subcategory: legacy values ("Top", "Bottom", "Outerwear", etc.)
- **Production data:** 26 clothing listings in prod. Some likely use old taxonomy.
- **Current behavior:** Old values (e.g. `"Top"`) render as `Top (existing)`. Preserved on save.
- **Question:** No automatic migration possible — `"Top"` could be polo, hoodie, or base layer. Should Harry manually recategorize these, or should the old values be kept as valid options alongside mobile's list?

### Shoe type: "Waterproof"
- **Production data:** Unknown count. Old dashboard offered `"Waterproof"`.
- **Current behavior:** `shoe_type: "Waterproof"` is preserved as-is in specs. NOT mapped to `spikes`. Renders in spikes dropdown as `Waterproof (existing)`.
- **Question:** Should waterproof be a separate boolean field (e.g. `isWaterproof`)? Or should it remain in `shoe_type` for legacy data only?

### Dexterity: other variants
- **Production data:** 8 listings with `"Right Hand"`, 2 with `"Left Hand"`.
- **Applied normalizer:** `"Right Hand"` → `"Right Handed"`, `"Left Hand"` → `"Left Handed"`. These are unambiguous synonyms.
- **No normalizer applied for:** `"Right-Handed"` / `"Left-Handed"` (hyphenated). These render as `Right-Handed (existing)` via `optionsWithCurrent`. The brief says production has 0 hyphenated values, so this is a non-issue for now, but the `optionsWithCurrent` mechanism handles it gracefully if any appear.

## Items Not Verified

1. **Live browser testing.** Changes validated via typecheck + 31 unit tests only. Dev server not started. The form should be tested with real mobile-created listing data before deploying.

2. **Auto-save error surfacing.** Not addressed by this brief (same as previous). Auto-save at line ~855 still swallows API errors silently.
