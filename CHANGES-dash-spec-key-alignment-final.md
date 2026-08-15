# CHANGES — `task/dash-spec-key-alignment-final`

## Baseline SHAs

| Repo | Branch | SHA |
|---|---|---|
| Mulligans-Web | `task/dash-spec-key-alignment-fixes` | `4ca1852` |
| Mulligans-Backend | `pro-seller-foundation` | `8da6a9c` |
| Mulligans-Mobile | `pro-seller-foundation` | `a546d01` |

Branched from `4ca1852` as required.

## Confirmation

- Mobile: UNTOUCHED
- Backend: UNTOUCHED
- `apps/web`: UNTOUCHED
- `packages/api-client`: UNTOUCHED

## Files Changed

| File | Reason |
|---|---|
| `apps/dashboard/src/components/ListingForm.tsx` | §3.1: remove clubType from Clubs key map + explicit delete; §3.2: BallsFields pack-size existing-value display; §3.3: data-field on parcelSize |
| `apps/dashboard/src/__tests__/ListingForm.test.tsx` | 6 new tests (Club Head canonicalization, CSV/mobile club no spec club-type, balls existing packSize, parcelSize scroll) |

## Category Key Maps (as implemented)

### Clubs
```ts
// Clubs stores club type in top-level subcategory, not in specifications
'Clubs': [
  ['shaftFlex', 'shaft_flex'],
  ['shaftMaterial', 'shaft_material'],
  ['lieAngle', 'lie_angle'],
  ['length', 'shaft_length'],
  ['gripSize', 'grip'],
],
```
**No `clubType`/`club_type` mapping.** `specsToCanonical` explicitly deletes both keys from the result when `category === 'Clubs'`. Club type is written to top-level `subcategory` via the `clubType` component state and `normalizeClubType`.

### Shafts, Grips & Heads
```ts
'Shafts, Grips & Heads': [
  ['shaftFlex', 'shaft_flex'],
  ['shaftMaterial', 'shaft_material'],
  ['shaftLength', 'shaft_length'],
  ['shaftWeight', 'shaft_weight'],
  ['gripSize', 'grip_size'],
  ['gripMaterial', 'grip_material'],
  ['clubType', 'club_type'],  // Retained — for Club Head subcategory
],
```

## Clubs Save: No Club-Type Key in Specifications

Confirmed. After §3.1:
- A CSV club listing with `specifications.club_type: "Driver"` saves as `subcategory: "Drivers"` (top-level, normalized) with NO `clubType` or `club_type` in `specifications`.
- A mobile club listing saves identically — `subcategory: "Drivers"` top-level, clean `specifications`.
- A Club Head listing (`Shafts, Grips & Heads` category) still correctly maps `club_type` → `clubType` in `specifications`.

## Missing `data-field` Attributes Found (§3.3)

Checked every key written into `errs` in `validate()`:

| Error key | `data-field` present? |
|---|---|
| `title` | Yes |
| `description` | Yes |
| `category` | Yes |
| `condition` | Yes |
| `price` | Yes |
| `parcelSize` | **Added in this change** |
| `specs.clubType` | Yes |
| `specs.brand` | Yes |
| `specs.model` | Yes |
| `specs.dexterity` | Yes |
| `specs.shaftFlex` | Yes |
| `specs.shaftMaterial` | Yes |
| `specs.subcategory` | Yes |
| `specs.size` | Yes |
| `specs.gender` | Yes |
| `specs.shoeSize` | Yes |
| `specs.packSize` | Yes |

**No other missing attributes found.** All validation error keys have matching `[data-field]` elements.

## Test Output (verbatim)

```
$ npx vitest run apps/dashboard/src/__tests__/ --config apps/dashboard/vitest.config.ts

 RUN  v4.1.9 /Users/clovis/clovis-workspace/Mulligans-Web/apps/dashboard

 Test Files  1 passed (1)
      Tests  37 passed (37)
   Start at  21:35:21
   Duration  927ms
```

## Typecheck Output (verbatim)

```
$ npx tsc --noEmit -p apps/dashboard
(no output — clean)
```
