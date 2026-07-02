# PRO-IMPORT-I-04: Dashboard — off-sale + relist buttons

Branch: `task/pro-import-i04-dash-button` from `clovis/pro-seller-foundation`

## Files changed

| File | Change |
|---|---|
| `packages/api-client/src/types/listing.ts` | Added `'off_sale'` to `ListingStatus` union type |
| `packages/api-client/src/endpoints/listings.ts` | Added `markListingOffSale(id)` and `relistListing(id)` functions |
| `packages/api-client/src/index.ts` | Re-exported `markListingOffSale` and `relistListing` |
| `apps/dashboard/src/app/(dashboard)/inventory/page.tsx` | Added `off_sale` status pill (purple), filter tab, "Mark sold elsewhere" button (active listings), "Relist" button (off_sale listings), display label formatting |

## UI behaviour

- **Active listings** context menu gains "Mark sold elsewhere" (purple text, X icon). Calls `PUT /api/listings/:id/off-sale`. On 409 (active order or wrong status), shows alert with the server error message.
- **Off-sale listings** context menu gains "Relist" (green text, refresh icon). Calls `PUT /api/listings/:id/relist`. On 409 (Stripe not active or wrong status), shows alert with the server error message.
- Status pill for `off_sale` uses the offers-purple colour (`#7C5CBF`) per brand palette.
- "Off Sale" tab added to quick-filter pills.
- "Mark as Sold" button hidden for off_sale listings (already off the market).

## Deploy notes

1. Must deploy backend first (new endpoints required)
2. Standard `npm run build` for dashboard — no env changes needed
