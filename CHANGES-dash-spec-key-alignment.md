# CHANGES — `task/dash-spec-key-alignment`

## Baseline SHAs

| Repo | Branch | SHA |
|---|---|---|
| Mulligans-Web | `pro-seller-foundation` | `d2b6298` |
| Mulligans-Backend | `pro-seller-foundation` | `8da6a9c` |
| Mulligans-Mobile | `pro-seller-foundation` | `a546d01` |

## Confirmation

- Mobile: UNTOUCHED
- Backend: UNTOUCHED
- `apps/web`: UNTOUCHED
- `packages/api-client`: UNTOUCHED

## Files Changed

| File | Reason |
|---|---|
| `apps/dashboard/src/components/ListingForm.tsx` | Core fix: tolerant-read helper, camelCase canonical write, option value alignment, validation visibility, `length` dropdown, `quantity` numeric, `spikes` alignment, club type normalization |
| `apps/dashboard/src/__tests__/ListingForm.test.tsx` | Tests: readSpec helper, mobile/CSV/incomplete fixture validation, payload camelCase assertion, quantity numeric, subcategory top-level |

## Full Key Mapping Table (re-derived from mobile `sell.tsx` at `a546d01`)

| Category | Dashboard key (before) | Mobile key (canonical, after) | Notes |
|---|---|---|---|
| Clubs | `club_type` (in specs) | top-level `subcategory` | Now stored as top-level `subcategory` in payload; read falls back to `specs.club_type` |
| Clubs | `shaft_flex` | `shaftFlex` | Casing fix |
| Clubs | `shaft_material` | `shaftMaterial` | Casing fix |
| Clubs | `lie_angle` | `lieAngle` | Casing fix + changed to categorical dropdown (Standard, 54-66) |
| Clubs | `shaft_length` (numeric input) | `length` (categorical dropdown) | Changed input type to `<select>` with mobile's categorical options |
| Clubs | `grip` (text input) | `gripSize` (dropdown) | Changed to dropdown with mobile's grip size options |
| Clubs | Dexterity `"Right-Handed"` | `"Right Handed"` | Removed hyphen to match mobile |
| Clubs | Club type `"Driver"` (singular) | `"Drivers"` (plural) | Normalizer maps singular → plural for existing data |
| Shafts | `shaft_flex` | `shaftFlex` | Casing fix |
| Shafts | `shaft_material` | `shaftMaterial` | Casing fix |
| Shafts | `shaft_length` (numeric input) | `shaftLength` (categorical dropdown) | Changed to dropdown |
| Grips | `grip_size` (Undersize/Standard/Midsize/Oversize) | `gripSize` (Junior/Undersize/Standard/Midsize/Jumbo/Plus 4) | Casing + options aligned to mobile |
| Heads | `club_type` | `clubType` | Casing fix; options kept singular per mobile's Heads spec |
| Clothing | `colour` | `color` | Spelling changed to match mobile |
| Clothing | Gender `"Men's"/"Women's"/"Unisex"` | `"Male"/"Female"/"Junior"` | Values aligned to mobile |
| Clothing | Subcategory `"Top"/"Bottom"/...` | `"Polo Shirts"/"Trousers"/...` | Options aligned to mobile's 13-item list |
| Shoes | `size` (text input) | `shoeSize` (dropdown, 4-13 + Various) | Key change + changed to dropdown |
| Shoes | `shoe_type` (Spiked/Spikeless/Waterproof) | `spikes` (Yes/No) | Different key + semantics aligned to mobile |
| Shoes | Gender `"Men's"/"Women's"/"Unisex"` | `"Male"/"Female"/"Junior"` | Values aligned to mobile |
| Balls | `specs.quantity` (categorical string) | top-level `quantity` (number) | Moved to top-level numeric field; UI keeps dropdown resolving to number |
| Training Aids | `training_type` (REQUIRED) | `trainingType` (optional) | See assumption below |
| Everything Else | `item_name` (REQUIRED) | `itemName` (optional) | See assumption below |
| Shaft Flex options | Missing `"Wedge"` and `"Junior"` | Added both | Mobile has 7 options, dashboard had 5 |

## Additional mappings found (not in brief)

| Key | Source | Notes |
|---|---|---|
| `shaftWeight` / `shaft_weight` | Shafts category | Added to tolerant-read key map |
| `gripMaterial` / `grip_material` | Grips category | Added to tolerant-read key map |
| `normalizeClubType()` | Club type singular→plural mapper | Needed for CSV/dashboard-created data that uses singular values |

## Deviations from Brief

1. **Lie angle options**: Brief §5.2 only specifies length options. Mobile uses `'Standard'` plus numeric strings `'54'`-`'66'` for lie angle (sell.tsx:101). I changed the dashboard lie angle from a numeric `<input>` to a `<select>` with these exact mobile options — matching the categorical pattern, not inventing values.

2. **Shaft Flex `"Wedge"` option order**: Mobile defines the order as `'Extra Stiff', 'Stiff', 'Regular', 'Senior', 'Wedge', 'Ladies', 'Junior'` (sell.tsx:133). I matched this exactly.

3. **Shoes `spikes` field**: Per brief §5.4, aligned to mobile's Yes/No. Made it NOT required (brief says "do not silently map them"). Waterproof question raised in questions file.

## `training_type` / `item_name` Assumption (§5.6)

**ASSUMPTION:** Both `training_type` (Training Aids) and `item_name` (Everything Else) have been made **optional**. Mobile does not collect either field — `renderSpecificationFields` in sell.tsx has no Balls/Training Aids/Everything Else sections (verified at a546d01). Requiring fields on the dashboard that mobile cannot populate recreates exactly the divergence that caused this bug.

**To reverse:** Change the `validate()` function to add back the checks:
```
if (category === 'Training Aids') {
  if (!readSpec(specs, 'trainingType', 'training_type')) errs['specs.trainingType'] = 'Type is required.';
}
if (category === 'Everything Else') {
  if (!readSpec(specs, 'itemName', 'item_name')) errs['specs.itemName'] = 'Item name is required.';
}
```

## Test Output (verbatim)

```
$ npx vitest run apps/dashboard/src/__tests__/ --config apps/dashboard/vitest.config.ts

 RUN  v4.1.9 /Users/clovis/clovis-workspace/Mulligans-Web/apps/dashboard

 Test Files  1 passed (1)
      Tests  17 passed (17)
   Start at  20:51:37
   Duration  538ms
```

## Typecheck Output (verbatim)

```
$ npx tsc --noEmit -p apps/dashboard
(no output — clean)
```
