# CHANGES — web-cart-display-fixes

**Branch:** `task/web-cart-display-fixes`
**Base:** `upstream/pro-seller-foundation` @ `e1e4983`
**Scope:** `apps/web` only

---

## Item 1: Cart preview total may omit the insurance premium

**Verdict: PARTIAL**

The audit claimed the displayed cart total omits the insurance premium. In fact, the per-seller `SellerBreakdown` DID include insurance in the displayed total — but it computed insurance **client-side** using a hardcoded `INSURANCE_RATE = 0.0125` constant (`cart/page.tsx:309`), violating web-standards Part 3 ("all fees are computed server-side and the client only displays them").

The backend `getCart` (`cartController.ts:251-256`) already computes and returns all fee fields in `summary`:
- `summary.insurance_premium` (cartController.ts:279-292)
- `summary.insured_shipping_total`
- `summary.buyer_protection_fee`
- `summary.grand_total`
- `summary.item_count`

The `CartSummary` type in `cart-api.ts:75-83` already includes all these fields.

**Additional finding:** The per-seller buyer protection fee was computed as `sellerItemsTotal * 0.075 + 0.99` (flat £0.99 per seller, `cart/page.tsx:503`). The spec (`business-logic-v2.md`) defines it as `(itemsTotal x 0.075) + (totalItemCount x 0.99)` — £0.99 per item, not per seller. For single-item sellers these match, but for multi-item sellers the web understated the fee.

### Fix applied

1. **Removed client-side `INSURANCE_RATE` constant** (`cart/page.tsx:309`) — no insurance computation remains client-side.

2. **Simplified `SellerBreakdown`** (`cart/page.tsx:479-570`) — now shows only:
   - Per-seller items subtotal (sum of item prices x qty — display arithmetic, not fee computation)
   - Per-seller base shipping (from server's `seller.shipping_cost`)
   - Checkout button (unchanged)
   - **Removed:** client-side insurance, buyer protection fee, per-seller grand total

3. **Added `OrderSummary` component** (`cart/page.tsx:883-993`) — cart-level summary using server-provided `cart.summary` values:
   - Items (count): `summary.items_total`
   - Buyer Protection: `summary.buyer_protection_fee` (green shield icon)
   - Insured Shipping: `summary.insured_shipping_total` (blue shield icon)
   - Grand Total: `summary.grand_total`

4. **Rendered `OrderSummary`** between seller cards and BuyerProtectionPanel (`cart/page.tsx:218`).

### Totals computation sites enumerated

| Site | File:Line | What it computes | Source |
|------|-----------|-----------------|--------|
| `sellerItemCount` | cart/page.tsx:494-496 | Per-seller qty sum | Client arithmetic from server item data |
| `sellerItemsTotal` | cart/page.tsx:498-501 | Per-seller items subtotal | Client arithmetic from server item data |
| `sellerBaseShipping` | cart/page.tsx:502 | Per-seller shipping | Server `seller.shipping_cost` |
| `OrderSummary` items | cart/page.tsx:910-913 | Cart items total | Server `summary.items_total` |
| `OrderSummary` buyer protection | cart/page.tsx:924-927 | Cart buyer protection fee | Server `summary.buyer_protection_fee` |
| `OrderSummary` insured shipping | cart/page.tsx:947-950 | Cart insured shipping | Server `summary.insured_shipping_total` |
| `OrderSummary` grand total | cart/page.tsx:983-985 | Cart grand total | Server `summary.grand_total` |

### Reconciliation verification (canonical example from business-logic-v2.md §4.2)

| Component | Calculation | Amount |
|-----------|------------|--------|
| Items | £100.00 | £100.00 |
| Base shipping | £5.99 | £5.99 |
| Insurance premium | £100.00 x 0.0125 | £1.25 |
| Insured shipping | £5.99 + £1.25 | £7.24 |
| Platform fee | (£100.00 x 0.075) + (1 x £0.99) | £8.49 |
| **Grand total** | | **£115.73** |

The `OrderSummary` displays `summary.grand_total` from the server, which is computed with this exact formula. Test 3 in `sellerCheckout.test.ts` asserts this reconciliation.

### Label choice

Mobile uses "Insured Shipping" as a combined line for `insuredShippingTotal` (base + insurance). I matched this label in `OrderSummary`. This is spec-consistent per business-logic-v2.md: `insuredShipping = baseShipping + insurancePremium`.

---

## Item 2: Other cart/checkout display mismatches

### Buyer protection fee formula — **REAL** (now fixed)

**Was:** `sellerItemsTotal * 0.075 + 0.99` (`cart/page.tsx:503`) — £0.99 flat per seller.
**Spec:** `(itemsTotal x 0.075) + (totalItemCount x 0.99)` — £0.99 per item counting quantity.
**Fix:** Removed client-side computation entirely; `OrderSummary` displays `summary.buyer_protection_fee` from server, which uses the correct per-item formula (verified in `cartController.ts:255`).

### Quantity and line-item math — **FALSE**

Per-seller `sellerItemsTotal` correctly sums `(offer_price ?? price) * quantity` for each item (`cart/page.tsx:498-501`). This matches the backend's computation in `cartController.ts:240-245`.

### Shipping display — **FALSE**

Per-seller `sellerBaseShipping` reads directly from `seller.shipping_cost` (`cart/page.tsx:502`), which the backend computes as the highest-shipping item per seller plus `ceil(quantity / 5) * shipping_cost` for additional items (`cartController.ts:218-237`). Display matches server value.

### Fee shown in one place but omitted in another — **REAL** (now fixed)

Before fix: insurance was computed client-side in `SellerBreakdown` but NOT shown in any cart-level aggregate. There was no cart-level total at all — only per-seller totals.
After fix: `OrderSummary` shows the authoritative cart-level total with all fees from server, including insurance.

---

## Files changed

| File | Change |
|------|--------|
| `apps/web/src/app/cart/page.tsx` | Removed INSURANCE_RATE constant; simplified SellerBreakdown; added OrderSummary using server summary; added CartSummary import |
| `apps/web/src/__tests__/sellerCheckout.test.ts` | Replaced old per-seller fee tests with spec-based reconciliation tests; added CartSummary shape test; added canonical £115.73 test |

---

## Verification checklist

- [x] TypeScript compiles: `npx tsc --noEmit -p apps/web` — clean
- [x] Tests pass: `npx vitest run apps/web/src/__tests__/ --config apps/web/vitest.config.ts` — 25/25 pass
- [x] All changed paths under `apps/web/` (plus two per-brief output docs)
- [x] White page background (#FFFFFF) — confirmed
- [x] No #EAEAE0 ivory — confirmed (grep returns nothing)
- [x] fontWeight 700 used for prices, titles, key values per web-standards v2.0
- [x] Prices #1DC690 — confirmed
- [x] Data-row values right-aligned, weight 700 — confirmed
- [x] Total row `border-top: 1px solid #E5E7EB` — confirmed (OrderSummary)
- [x] **No amount sent to backend or Stripe was altered** — all changes are display-only; checkout flow unchanged
- [x] Literal £ used (not £) — confirmed
- [x] Section label: 12px uppercase #278AB0 letter-spacing 0.10em — confirmed (OrderSummary "ORDER SUMMARY")
- [x] Card border-radius 16, border #E5E7EB, CARD_SHADOW — confirmed (OrderSummary)
