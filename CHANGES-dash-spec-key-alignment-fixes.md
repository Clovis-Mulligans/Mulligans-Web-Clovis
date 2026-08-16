# CHANGES — `task/dash-spec-key-alignment-fixes`

## Baseline SHAs

| Repo | Branch | SHA |
|---|---|---|
| Mulligans-Web | `task/dash-spec-key-alignment` | `7a1a21e` |
| Mulligans-Backend | `pro-seller-foundation` | `8da6a9c` |
| Mulligans-Mobile | `pro-seller-foundation` | `a546d01` |

Branched from `7a1a21e` as required.

## Confirmation

- Mobile: UNTOUCHED
- Backend: UNTOUCHED
- `apps/web`: UNTOUCHED
- `packages/api-client`: UNTOUCHED

## Files Changed

| File | Reason |
|---|---|
| `apps/dashboard/src/components/ListingForm.tsx` | §4.1: category-scoped key map; §4.2: balls packSize in specs; §4.3: data-field on all spec fields + DOM-order scroll; §4.4: optionsWithCurrent + normalizeDexterity |
| `apps/dashboard/src/__tests__/ListingForm.test.tsx` | 14 new tests (10 required + 3 optionsWithCurrent unit + 1 normalizeDexterity unit), 1 rewritten (balls) |

## Category-Scoped Key Map (as implemented, re-derived from `a546d01`)

```ts
const SPEC_KEY_MAP_BY_CATEGORY: Record<string, Array<[string, string]>> = {
  'Clubs': [
    ['shaftFlex', 'shaft_flex'],
    ['shaftMaterial', 'shaft_material'],
    ['lieAngle', 'lie_angle'],
    ['length', 'shaft_length'],
    ['gripSize', 'grip'],
    ['clubType', 'club_type'],
  ],
  'Shafts, Grips & Heads': [
    ['shaftFlex', 'shaft_flex'],
    ['shaftMaterial', 'shaft_material'],
    ['shaftLength', 'shaft_length'],
    ['shaftWeight', 'shaft_weight'],
    ['gripSize', 'grip_size'],
    ['gripMaterial', 'grip_material'],
    ['clubType', 'club_type'],
  ],
  'Clothing': [
    ['color', 'colour'],
  ],
  'Shoes': [
    ['shoeSize', 'size'],
    ['color', 'colour'],
    // spikes/shoe_type handled specially in specsToCanonical
  ],
  'Balls': [
    ['packSize', 'quantity'],
  ],
  'Training Aids': [
    ['trainingType', 'training_type'],
  ],
  'Everything Else': [
    ['itemName', 'item_name'],
  ],
};
```

**Key design decisions:**
- Clubs has `['length', 'shaft_length']` only. `shaftLength` is NOT in the Clubs map — it belongs to Shafts, Grips & Heads only. This prevents the `7a1a21e` bug where both `length` and `shaftLength` were written.
- Clothing has NO `shoeSize/size` mapping. `size` passes through untouched for Clothing. This fixes the P0 where `size: "M"` was being renamed to `shoeSize: "M"`.
- `spikes/shoe_type` is NOT in the key map. It's handled with special logic in `specsToCanonical`: only `"Spiked"` → `"Yes"` and `"Spikeless"` → `"No"`. Any other value (e.g. `"Waterproof"`) preserves `shoe_type` untouched and does not write `spikes`.

## Balls: No Top-Level Quantity

- **CONFIRMED:** `buildPayload` no longer writes `quantity` for any category.
- Pack size is stored as `specifications.packSize` (spec field, not stock field).
- `readSpec(specs, 'packSize', 'quantity')` handles tolerant read from both keys.
- On initialization, top-level `quantity` is seeded into `specs.packSize` for existing Ball listings.
- `specsToCanonical` maps `quantity` → `packSize` in the Balls category map.

## Select Elements Using `optionsWithCurrent`

| Component | Field(s) |
|---|---|
| ClubFields | clubType, dexterity, shaftFlex, shaftMaterial, lieAngle, length, gripSize |
| ShaftGripHeadFields | subcategory, shaftFlex, shaftMaterial, shaftLength, gripSize, clubType |
| ClothingFields | subcategory, gender |
| ShoesFields | shoeSize, width, spikes, gender |
| AccessoriesFields | subcategory |

Injected (unrecognised) values display with ` (existing)` suffix in the option text; the `value` attribute is always the raw stored string.

## `data-field` Attributes (for scroll-to-error)

Added to every spec field wrapper div in all category components:
- ClubFields: `specs.clubType`, `specs.brand`, `specs.model`, `specs.dexterity`, `specs.loft`, `specs.lieAngle`, `specs.shaftFlex`, `specs.shaftMaterial`, `specs.length`, `specs.gripSize`, `specs.year`
- ShaftGripHeadFields: `specs.subcategory`, `specs.brand`, `specs.model`, `specs.shaftFlex`, `specs.shaftMaterial`, `specs.shaftLength`, `specs.shaftWeight`, `specs.gripSize`, `specs.gripMaterial`, `specs.clubType`
- ClothingFields: `specs.subcategory`, `specs.brand`, `specs.size`, `specs.gender`, `specs.color`
- ShoesFields: `specs.brand`, `specs.shoeSize`, `specs.width`, `specs.spikes`, `specs.gender`
- AccessoriesFields: `specs.subcategory`, `specs.brand`, `specs.model`
- BallsFields: `specs.brand`, `specs.model`, `specs.packSize`
- TrainingAidsFields: `specs.brand`, `specs.trainingType`, `specs.model`
- EverythingElseFields: `specs.itemName`, `specs.brand`

First error is now selected in DOM order (querying all `[data-field]` elements) rather than object-key insertion order.

## Test Output (verbatim)

```
$ npx vitest run apps/dashboard/src/__tests__/ --config apps/dashboard/vitest.config.ts

 RUN  v4.1.9 /Users/clovis/clovis-workspace/Mulligans-Web/apps/dashboard

 Test Files  1 passed (1)
      Tests  31 passed (31)
   Start at  21:14:39
   Duration  963ms
```

## Typecheck Output (verbatim)

```
$ npx tsc --noEmit -p apps/dashboard
(no output — clean)
```
