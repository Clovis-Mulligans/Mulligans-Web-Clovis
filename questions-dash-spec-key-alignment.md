# Questions — `task/dash-spec-key-alignment`

## Security Scan Findings

1. **No XSS introduced.** All new option values are hardcoded string arrays rendered via React JSX (auto-escaped). No `dangerouslySetInnerHTML`, no user-controlled HTML. The `readSpec` helper reads from the existing specs object and returns primitive values only.

2. **No auth bypass.** No changes to middleware, auth provider, or route guards. The `is_pro_store` enforcement gap (identified in audit `8bcdb73`) is not addressed by this brief and remains.

3. **No input validation regression.** `validate()` still requires all previously-required fields for each category. Two fields were made optional (`training_type`, `item_name`) but both are documented and reversible. The `spikes` field for Shoes was made optional (was `shoe_type`, required) — see question below.

4. **No data leakage.** The `buildPayload` function sends the same field set as before, with canonical camelCase keys. No new fields exposed.

## Mapping Uncertainties

### 1. `"Unisex"` gender option (Clothing and Shoes)

**Dashboard had:** `"Men's"`, `"Women's"`, `"Unisex"`, `"Junior"`
**Mobile has:** `"Male"`, `"Female"`, `"Junior"` (sell.tsx:1248-1252, 1717-1721)

Mobile does not offer `"Unisex"`. I dropped it from the dashboard dropdown to match mobile. **Should we keep `"Unisex"` as a dashboard-only option?** If so, it needs to be added back to `GENDER_OPTIONS_MOBILE` (renamed appropriately).

**Risk of dropping:** Any existing listing with `gender: "Unisex"` will show a blank gender dropdown when edited. The value is still stored and passed through on save, but the user can't see or re-select it.

### 2. `shoe_type` → `spikes` semantics (§5.4)

**Dashboard had:** `shoe_type` with values `"Spiked"`, `"Spikeless"`, `"Waterproof"` (required)
**Mobile has:** `spikes` with values `"Yes"`, `"No"` (sell.tsx:1756-1760)

Per brief §5.4: "Do not silently map them." I aligned to mobile's `spikes` (Yes/No) and made it not required.

**Question for Harry:** Should waterproof be a **separate boolean field** (e.g. `isWaterproof`)? Or should we drop it? The current implementation drops it — existing listings with `shoe_type: "Waterproof"` will have that value preserved in specs but the dropdown won't show it.

### 3. Clothing subcategory value migration

**Dashboard had:** `"Top"`, `"Bottom"`, `"Outerwear"`, `"Base Layer"`, `"Headwear"`, `"Glove"`
**Mobile has:** `"Jackets"`, `"Polo Shirts"`, `"Trousers"`, `"Shorts"`, `"Hoodies"`, `"Knitwear"`, `"Gilets"`, `"Mid-Layers"`, `"Waterproofs"`, `"Hats & Caps"`, `"Sunglasses"`, `"Gloves"`, `"Other"`

These are completely different taxonomies. Existing dashboard-created clothing listings with `subcategory: "Top"` will show a blank dropdown. The value is preserved on save but can't be re-selected. **No automatic migration is possible** — `"Top"` could be a polo shirt, hoodie, or base layer.

### 4. Grip size — `"Oversize"` dropped

**Dashboard had:** `"Undersize"`, `"Standard"`, `"Midsize"`, `"Oversize"`
**Mobile has:** `"Junior"`, `"Undersize"`, `"Standard"`, `"Midsize"`, `"Jumbo"`, `"Plus 4"`

`"Oversize"` doesn't exist on mobile. Existing listings with `gripSize: "Oversize"` will show a blank dropdown. Mobile's `"Jumbo"` may be the intended equivalent but I did not map them — the brief says "losing information is worse than lacking a field."

### 5. Dexterity hyphen — existing data

Dexterity values changed from `"Right-Handed"` → `"Right Handed"`. Existing dashboard-created listings with the hyphenated value will show a blank dropdown. The `readSpec` helper preserves the value for validation (it's truthy), so saves still work, but the UI won't display the selection. A one-time data migration or a normalizer in the spec initializer could fix this.

## Items Not Verified

1. **Live browser testing.** The brief does not specify a running dev server. Changes are validated via typecheck and unit tests only. I could not verify the actual UI renders correctly in a browser. The dev server should be started and the form tested with real mobile-created listing data.

2. **Auto-save error surfacing.** Brief §5.8.4 says "do not let auto-save silently swallow API errors." The current auto-save code at line 704 calls `await doSave('draft', true)` without checking the return value. I left the validation skip as-is (per brief: "Leave the validation skip as-is, deliberate") but did not add non-intrusive error surfacing for API failures during auto-save. This would require a separate toast/notification component that doesn't exist in the dashboard currently. **Flagging as not addressed.**

3. **CSV adapter alignment.** The backend `csvAdapter.ts` uses snake_case keys. The `specsToCanonical` function in the dashboard will convert any snake_case keys from CSV imports to camelCase on save. This means the first dashboard save of a CSV-imported listing will "heal" its keys to camelCase. The CSV adapter itself is not modified (out of scope per brief §2). A separate brief handles the CSV adapter.
