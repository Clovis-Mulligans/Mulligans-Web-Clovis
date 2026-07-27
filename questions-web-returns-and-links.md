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

2. **Seller label purchase**: The seller endpoint requires a `paymentMethodId` (Stripe payment method). Mobile presumably collects this; the web wizard currently passes an empty string for seller-pays flows. This needs a payment method selector if seller-pays return labels are used on web. Currently buyer-pays is the common path.

3. **`durationTerms` field**: Backend rates response doesn't include this field (mobile type has it as optional). No impact — mobile handles its absence too.
