# Questions — Web Returns & Links

## Mobile Returns Contract (as read)

### Wizard Steps

| Step | Title | What the user does |
|------|-------|--------------------|
| 1 — Details | Return Shipment Details | Reviews item, reason, parcel size, who pays. Clicks "Get Shipping Options" |
| 2 — Service | Select Shipping Service | Picks a tracked rate card. Sees cost/refund impact. Clicks "Review" |
| 3 — Review | Review & Confirm | Confirms summary. Clicks "Create Label" |
| 4 — Success | Return Label Created! | Prints label, finds drop-off, or defers shipping |

### Endpoints used by mobile

| Endpoint | Method | Request body | Called in |
|----------|--------|-------------|----------|
| `/api/returns/:id` | GET | — | On mount (loads return data) |
| `/api/returns/rates` | POST | `{ returnId }` | Step 1 → 2 transition |
| `/api/returns/purchase-label/buyer` | POST | `{ returnId, rateId }` | Step 3 → 4 (buyer pays) |
| `/api/returns/purchase-label/seller` | POST | `{ returnId, rateId, paymentMethodId }` | Step 3 → 4 (seller pays) |
| `/api/returns/mark-shipped` | POST | `{ returnId }` | Used by ReturnStatusCard |
| `/api/returns/confirm-delivered` | POST | `{ returnId }` | Used by seller after delivery |
| `/api/returns/create` | POST | `{ orderId, reason, disputeId? }` | Dispute flow creates return |
| `/api/returns/seller-status/:orderId` | GET | — | Checks seller Stripe readiness |

All verified against `returnRoutes.ts` — every endpoint exists and is wired with `authenticateToken` middleware.

### Return statuses handled by mobile

| Status | Buyer copy | Seller copy |
|--------|-----------|-------------|
| `pending` / `approved` (with label) | "Return your item" + label button | "Return approved" |
| `awaiting_address` | "Return approved — waiting for seller's address" | "Return approved" |
| `pending` / `approved` (no label) | "Return your item — arrange your return label" | "Return approved" |
| `label_created` | "Return your item" + label button | "Return incoming" |
| `shipped` | "Return on its way" | "Return on its way to you" |
| `delivered` / `refund_processing` | "Return delivered — refund within 3 days" | "Return delivered — check item" |
| `completed` | "Return complete — refund processed" | "Return complete — refund sent to buyer" |
| `cancelled` | "Return cancelled — deadline passed" | "Return cancelled — payment released" |

---

## QR-Code Field Finding

**`qr_code_url` and `qr_code_expires_at` do NOT exist in the backend.** Confirmed by:

1. Grepping the entire `src/` directory of Mulligans-Backend — zero matches
2. Reading `returnController.ts` `getReturnRequest` handler — neither field is returned
3. Checking `schema.prisma` — no such column on `return_requests`

**Decision:** QR drop-off path **omitted** from the web returns wizard. The "Show QR Code at Shop" button that mobile renders when `qr_code_url` is present will never trigger. Building a button backed by a field that doesn't exist would reproduce exactly the broken-link pattern this brief is eliminating.

**Blocked on backend:** If QR drop-off is wanted for web, the backend needs:
- `qr_code_url` and `qr_code_expires_at` columns on `return_requests`
- The `getReturnRequest` handler needs to return them
- Shippo label creation needs to request QR codes from supported carriers (Evri)

---

## Security Scan

| Category | Finding |
|----------|---------|
| XSS | No raw HTML rendered. All user content (item title, reason, tracking number) goes through JSX auto-escaping |
| Auth bypass | Returns page requires authentication — redirects to `/login?redirect=` if no token. Backend enforces buyer/seller check on every endpoint |
| Data leakage | No sensitive data exposed. Seller address is only shown as city + partial postcode (controlled by backend) |
| Input validation | All inputs validated server-side. Client sends returnId and rateId (both opaque IDs). No free-text user input on this page |
| CSRF | Using Bearer token auth (not cookies), CSRF not applicable |
| Rate limiting | No client-side rate limiting. Backend doesn't appear to have it on return routes either — worth adding server-side |

---

## Discrepancies & Notes

1. **`who_pays_return` field**: Mobile accesses `returnData.who_pays_return` but the backend schema column is `paid_by`. The web page checks both to be safe.

2. **`durationTerms` field**: Backend rates response doesn't include this field (mobile type has it as optional). No impact — mobile handles its absence too.

---

## ADDENDUM: Seller-Pays Returns — Step 1 Investigation (2026-07-27)

### 1a. Backend seller-label handler findings

**File:** `Mulligans-Backend/src/controllers/returnController.ts:693-909`
**Route:** `POST /api/returns/purchase-label/seller` (returnRoutes.ts:35, behind `authenticateToken`)

**Is `paymentMethodId` required?**
Yes — functionally required. The handler destructures `{ returnId, rateId, paymentMethodId }` from `req.body` (line 695) but only validates `returnId` and `rateId` are present (lines 697-701). `paymentMethodId` is never checked. It is passed directly to:

```
stripe.paymentIntents.create({
  amount: labelCostPence,
  currency: 'gbp',
  payment_method: paymentMethodId,   // <-- must be a real pm_xxx ID
  confirm: true,
  automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
  metadata: { type: 'return_label', return_id, order_id, paid_by: 'seller' },
});
```
(Lines 768-783)

**What does it do with `paymentMethodId`?**
Charges the seller immediately — `confirm: true` means the PaymentIntent is created and confirmed in one step. No separate confirmation flow. The charge goes against the **platform Stripe account** (no `stripeAccount` or `transfer_data` parameter), not the seller's Connect account.

**What happens with empty string or undefined?**
- Empty string `""`: Stripe rejects it as an invalid payment method ID
- `undefined` (missing from body): Stripe cannot confirm without a payment method (no `customer` field to fall back on)
- Both cases: the Stripe error bubbles to the generic catch-all (lines 905-908), returning a raw 500 with the Stripe error message

**What does it return on success?**
HTTP 200: `{ success: true, data: { trackingNumber, trackingUrl, labelUrl, carrier, labelCost, paidBy: 'seller', message } }`

**No fallback mechanism exists.** No Connect balance deduction, no saved default card lookup, no deduct-from-payout. A valid `pm_xxx` Stripe payment method ID is the only path.

### 1b. How mobile handles seller-pays returns

**File:** `Mulligans-Mobile/app/orders/return/[id].tsx:203-246`

**Mobile does NOT collect a payment method for seller-pays returns.**

The `handlePurchaseLabel` function (line 203) selects the endpoint based on `returnData.who_pays_return` (line 211), but sends **identical bodies** for both buyer and seller paths:

```
const response = await api.post(endpoint, {
  returnId: id,
  rateId: selectedRate.id,
});
```
(Lines 215-217)

No `paymentMethodId` field is included. There is no Stripe PaymentSheet, no saved card selector, no payment method collection UI anywhere in the mobile return flow. The only Stripe payment UI in the mobile app is in the checkout flow (cart.tsx / ListingDetail.tsx), using `PlatformPayButton` for Apple Pay/Google Pay — none of which is wired into returns.

The seller enters the flow from the sold-order detail screen (`app/orders/sold/[id].tsx:523`), which navigates to the same return wizard. The wizard shows "Seller Pays" UI copy but never prompts for payment details.

### Decision gate: STOPPED

**Neither decision-gate branch from the brief applies cleanly.** The brief anticipated two cases:

1. "Backend doesn't need a card" → small fix, send what mobile sends
2. "Backend needs a card, mobile uses Stripe sheet" → web needs Stripe Elements, stop and report

**The actual situation is a third case: the backend requires a real `paymentMethodId`, but mobile doesn't collect or send one either.** Seller-pays return labels are broken on **both** platforms. The flow will fail at the Stripe API level with either an "invalid payment method" or "cannot confirm without payment method" error.

**This is not a web-only gap — it's a platform-wide incomplete feature.**

### Options for Harry

**Option A — Backend fix (smallest scope):**
Change the backend seller handler to charge the seller via their Stripe Connect account balance or default payment method, removing the need for the client to collect and send a `paymentMethodId`. This would fix both mobile and web simultaneously with zero frontend changes. Whether this is viable depends on how seller Stripe Connect accounts are set up (do they have a default payment method? Can we charge their Connect balance?).

**Option B — Collect payment method on both platforms:**
Add Stripe payment collection UI to both mobile (React Native Stripe PaymentSheet) and web (Stripe Elements). This is significant new work on both platforms — estimated medium-large scope for web (new Stripe Elements integration on a single page), plus equivalent mobile work.

**Option C — Defer seller-pays returns:**
If seller-pays returns are not yet needed (no real orders have triggered this path), leave the flow as-is and prioritise it when needed. The buyer-pays path works correctly on both platforms.

**My recommendation:** Option A if architecturally feasible (one backend change, both platforms fixed). Otherwise Option C unless seller-pays returns are actively needed. Option B is the most work and touches the most code across both repos.

**Waiting for direction before writing any code.**
