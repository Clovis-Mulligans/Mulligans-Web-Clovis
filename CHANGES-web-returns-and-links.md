# CHANGES — Web Returns & Links

**Branch:** `task/web-returns-and-links`
**Base:** `clovis/pro-seller-foundation` @ `03cc15f`
**web-standards.md version:** v2.0 (30 April 2026)
**Max font-weight rule:** 700 is allowed for page titles, card titles, prices, key data values (v2.0 rule). Body text stays 400–500.

---

## PART 1 — Web Returns Page (new)

### Files created

| File | Purpose |
|------|---------|
| `apps/web/src/app/orders/return/[id]/page.tsx` | 4-step return wizard mirroring mobile |
| `packages/api-client/src/endpoints/returns.ts` | API functions for return endpoints |
| `packages/api-client/src/index.ts` | Added return exports (types + endpoints) |

### What was built

A 4-step wizard matching mobile's returns flow:

1. **Details** — shows item to return (image, title, price), return reason, seller address status, parcel size, who-pays info. CTA: "Get Shipping Options". Disabled with "Waiting for Seller" if `sellerHasAddress` is false.

2. **Service** — shows cost summary with refund/deduction breakdown, rate cards with carrier, service, price, estimated delivery. Cards are selectable with green border. Drop-off point links shown for supported carriers. CTA: "Review".

3. **Review** — confirms item, service, delivery estimate, cost breakdown with total refund. Info box explains who covers shipping. CTA: "Create Label".

4. **Success** — animated success icon, tracking card (carrier + tracking number with copy button), Print Label link, Find Drop-off Point link (if carrier supported), "I'll ship later" link back to order, 7-day reminder.

### Endpoints verified against `returnRoutes.ts`

| Endpoint | Route line | Verified |
|----------|-----------|----------|
| `GET /api/returns/:returnId` | `router.get('/:returnId', ...)` | Yes |
| `POST /api/returns/rates` | `router.post('/rates', ...)` | Yes |
| `POST /api/returns/purchase-label/buyer` | `router.post('/purchase-label/buyer', ...)` | Yes |
| `POST /api/returns/purchase-label/seller` | `router.post('/purchase-label/seller', ...)` | Yes |
| `POST /api/returns/mark-shipped` | `router.post('/mark-shipped', ...)` | Yes |

### QR-code finding

**NOT PRESENT.** `qr_code_url` and `qr_code_expires_at` do not exist in the backend — not in the Prisma schema, not in the controller, not anywhere in `src/`. QR drop-off path is omitted from the web wizard. See `questions-web-returns-and-links.md` for full details.

### Guards

- Auth gate: redirects to `/login?redirect=/orders/return/<id>` if unauthenticated
- 404 guard: if `getReturnRequest` fails (no return exists, wrong user), shows "Return Not Found" empty state card — does not crash
- Label already exists: if `return_label_url` is set on load, wizard skips directly to Success step

### Reachability

The two order-detail buttons at lines 2551 and 2634 (`/orders/return/${returnRequestId}`) now resolve to this page.

### Styling (web-standards.md v2.0 compliance)

- White `#FFFFFF` page background
- Card borders `#E5E7EB`, border-radius 16, padding 20px 22px
- `CARD_SHADOW` token on all cards
- Section labels: 12px uppercase `#278AB0`, letter-spacing 0.10em
- Weight 700: page title (32px), item titles, prices, data values
- Weight 400–500: body text, labels
- Status colours from standards (green/blue tints)
- Literal `£` throughout (no `£`)
- Max-width 1200px (secondary page)
- Lucide-react icons only, with `| string` size typing

---

## PART 2 — Three Broken Link Fixes

### Fix 1: Message counterparty (order detail)

| | |
|---|---|
| **File** | `apps/web/src/app/orders/[id]/page.tsx:434` |
| **Was** | `router.push(\`/messages/${conversationId}\`)` |
| **Now** | `router.push(\`/messages?id=${conversationId}\`)` |
| **Verified** | `apps/web/src/app/messages/page.tsx:442` reads `searchParams.get('id')` |

### Fix 2: Item link (order detail)

| | |
|---|---|
| **File** | `apps/web/src/app/orders/[id]/page.tsx:1083` |
| **Was** | `href={\`/listing/${order.listing_id}\`}` |
| **Now** | `href={\`/listings/${order.listing_id}\`}` |
| **Verified** | `apps/web/src/app/listings/[id]/page.tsx` exists |

### Fix 3: Profile link (order detail + reviews page)

| | |
|---|---|
| **File 1** | `apps/web/src/app/orders/[id]/page.tsx:1493` |
| **File 2** | `apps/web/src/app/user/[userId]/reviews/page.tsx:240` |
| **Was** | `href={\`/profile/${id}\`}` |
| **Now** | `href={\`/user/${id}\`}` |
| **Verified** | `apps/web/src/app/user/[userId]/page.tsx` exists; no `/profile/[id]` route exists |

---

## Tests

**File:** `apps/web/src/__tests__/returnPage.test.ts`

| # | Test | Asserts |
|---|------|---------|
| 1 | getReturnRequest endpoint | Calls `GET /api/returns/:id` with auth header |
| 2 | getReturnRequest response | Returns full data structure with all fields |
| 3 | Missing return (404) | Throws ApiError with status 404 |
| 4 | getReturnShippingRates | Calls `POST /api/returns/rates` with `{ returnId }` |
| 5 | purchaseReturnLabelBuyer | Calls `POST /api/returns/purchase-label/buyer` with `{ returnId, rateId }` |
| 6 | purchaseReturnLabelBuyer response | Returns trackingNumber, labelUrl, labelCost, newRefundAmount |
| 7 | purchaseReturnLabelSeller | Calls `POST /api/returns/purchase-label/seller` with `{ returnId, rateId, paymentMethodId }` |
| 8 | Link fix: messages | Asserts `/messages?id=<id>` format (query param, not path) |
| 9 | Link fix: listings | Asserts `/listings/<id>` (plural) |
| 10 | Link fix: profile | Asserts `/user/<id>` (not `/profile/`) |
| 11 | Return data schema | Fixture has all required fields |
| 12 | QR fields absent | `qr_code_url` and `qr_code_expires_at` are undefined |

### Test + typecheck results

```
$ npx tsc --noEmit -p apps/web
(clean — no errors)

$ npx vitest run apps/web/src/__tests__/ --config apps/web/vitest.config.ts
 Test Files  3 passed (3)
      Tests  25 passed (25)
   Duration  188ms
```

---

## Changed files

| File | Change |
|------|--------|
| `apps/web/src/app/orders/return/[id]/page.tsx` | **NEW** — returns wizard |
| `apps/web/src/app/orders/[id]/page.tsx` | Fixed 3 broken links (lines 434, 1083, 1493) |
| `apps/web/src/app/user/[userId]/reviews/page.tsx` | Fixed profile link (line 240) |
| `packages/api-client/src/endpoints/returns.ts` | **NEW** — return API functions |
| `packages/api-client/src/index.ts` | Added return type + endpoint exports |
| `apps/web/src/__tests__/returnPage.test.ts` | **NEW** — 12 test cases |
| `CHANGES-web-returns-and-links.md` | This file |
| `questions-web-returns-and-links.md` | Mobile contract + QR finding + security scan |

No backend files changed. No dashboard files changed.

---

## ADDENDUM: Seller-Pays Investigation (2026-07-27)

### Step 1 finding — STOPPED AT DECISION GATE

Seller-pays return labels are broken on **both** platforms, not just web:

- **Backend** (`returnController.ts:768`) requires a real Stripe `paymentMethodId` — charges seller immediately via `stripe.paymentIntents.create` with `confirm: true`
- **Web** (`return/[id]/page.tsx:258`) passes empty string `''` — Stripe rejects it
- **Mobile** (`return/[id].tsx:215`) doesn't send `paymentMethodId` at all — arrives as `undefined`, Stripe rejects it
- **No fallback** in the backend — no Connect balance, no saved card lookup, no deduct-from-payout

**No code changes made.** Full findings and three options written to `questions-web-returns-and-links.md`. Waiting for Harry's direction before proceeding.
