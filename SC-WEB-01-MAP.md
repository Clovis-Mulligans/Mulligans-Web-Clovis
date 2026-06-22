# SC-WEB-01 — Web Checkout Map for Split-Checkout Conversion

**Branch:** `task/sc-web-01-map` off `clovis/pro-seller-foundation` (`4a54786`)
**Repo:** `Mulligans-Web`
**Date:** 2026-06-22

---

## 1. Cart Page + Checkout Components

### Cart page
**File:** `apps/web/src/app/cart/page.tsx`

**Already grouped by seller.** The cart renders each seller as a `SellerCard`:

```typescript
// cart/page.tsx:235-237
{cart!.sellers.map((seller, idx) => (
  <SellerCard
    key={seller.seller_id}
```

Each `SellerCard` (defined at line 354) receives the full `CartSeller` object including `seller_id`, `shipping_cost`, and `items[]`. Layout is a two-column CSS grid (`cart-grid`, line 201): seller cards on the left, a sticky `OrderSummary` panel on the right.

### Checkout page
**File:** `apps/web/src/app/checkout/page.tsx`

A separate pre-payment review page. Loads the cart via `getCart()`, flattens all items across sellers (line 68: `cart.sellers.flatMap(...)`), shows them with the backend `summary` totals, and has a single "Pay now" button calling the same `createCartCheckout()` endpoint. **This is a duplicate path** — same flow as the cart page's checkout button.

### Cart preview (navbar dropdown)
**File:** `apps/web/src/components/CartPreview.tsx`

Navbar cart-icon dropdown. Groups items by seller. Has a "Checkout" link at line 427 that navigates to `/checkout`, plus a "View bag" link at line 447 that navigates to `/cart`. This is the **only link to `/checkout`** in the codebase (confirmed via `grep -rn '"/checkout"' apps/web/src/`).

### Order confirmation
**File:** `apps/web/src/app/order-confirmation/page.tsx`

Stripe redirects here after successful payment. Fetches recent purchases via `getMyRecentPurchases()` (line 19) and displays them. No cart interaction — purely a post-payment confirmation view.

---

## 2. Current Checkout Call

**Single combined checkout.** Both the cart page and checkout page call the same function:

```typescript
// apps/web/src/lib/cart-api.ts:122-123
export async function createCartCheckout(): Promise<CheckoutSession> {
  return authFetch('/api/stripe/create-cart-checkout', { method: 'POST' });
}
```

**Cart page handler** (`cart/page.tsx:130-143`):
```typescript
const handleCheckout = async () => {
  if (!isAuthenticated) {
    router.push('/login?redirect=/cart');
    return;
  }
  setCheckingOut(true);
  try {
    const session = await createCartCheckout();
    window.location.href = session.url;  // Full redirect to Stripe Hosted Checkout
  } catch (err) {
    console.error('Checkout failed:', err);
    setCheckingOut(false);
  }
};
```

**Checkout page handler** (`checkout/page.tsx:44-56`): identical pattern — `createCartCheckout()` then `window.location.href = session.url`.

**One button, one grand total, one combined Stripe session for all sellers.** This is what we're replacing with per-seller.

---

## 3. Types — CartSeller / CartResponse

**File:** `apps/web/src/lib/cart-api.ts` — the web app defines its own types and `authFetch` helper, **bypassing the shared `packages/api-client/` entirely**.

### CartSeller (`cart-api.ts:38-49`)
```typescript
export interface CartSeller {
  seller_id: string;                         // ← per-seller checkout key
  seller_name: string;
  seller_avatar: string | null;
  seller_rating: number;
  seller_is_verified_seller_seller: boolean;
  items: CartItem[];
  subtotal: number;
  shipping_cost: number;                     // ← per-seller shipping from backend
  is_pro_store: boolean;
  pro_store_name: string | null;
}
```

All fields needed for per-seller checkout are present: `seller_id` to pass to the endpoint, `shipping_cost` for display, `items[]` for fee calculation.

### CartItem (`cart-api.ts:51-73`)
```typescript
export interface CartItem {
  id: string; listing_id: string; title: string; price: number;
  quantity: number; selected_size: string | null; line_total: number;
  available_stock: number; shipping_cost: number; image_url: string | null;
  parcel_size: string; added_at: string; expires_at: string;
  is_available: boolean; in_other_carts: boolean;
  offer_id: string | null; offer_price: number | null; offer_expires_at: string | null;
  condition_overall: number | null; brand: string | null; model: string | null;
}
```

Includes `offer_price` (needed for fee calculation) and `quantity`.

### CartResponse (`cart-api.ts:85-90`)
```typescript
export interface CartResponse {
  sellers: CartSeller[];
  summary: CartSummary;
  warnings: { listing_id: string; message: string }[];
  unavailable_items: { listing_id: string; title: string; message: string }[];
}
```

### CartSummary (`cart-api.ts:75-83`)
```typescript
export interface CartSummary {
  items_total: number; base_shipping: number; insurance_premium: number;
  insured_shipping_total: number; buyer_protection_fee: number;
  grand_total: number; item_count: number;
}
```

### CheckoutSession (`cart-api.ts:107-120`)
```typescript
export interface CheckoutSession {
  sessionId: string;
  url: string;
  summary: {
    itemCount: number; totalQuantity: number;
    itemsTotal: string; baseShipping: string; insurancePremium: string;
    insuredShippingTotal: string; platformFee: string; grandTotal: string;
  };
}
```

### Shared api-client package (STALE — not used for cart)
`packages/api-client/src/types/cart.ts` defines a flat `CartResponse { items[], total, itemCount }` — this is the legacy type and is **not imported** by the consumer web app. The web app uses its own seller-grouped types in `lib/cart-api.ts`. The type reconcile is a known cleanup item but is **not blocking** per-seller checkout.

**Bottom line:** `seller_id` is already available per group. No backend or type changes needed to start per-seller checkout.

---

## 4. Stripe Flow

**Pattern: Stripe Hosted Checkout (server-managed redirect). No client-side Stripe.js.**

1. User clicks "Proceed to checkout" (cart page) or "Pay now" (checkout page)
2. Frontend POSTs to `/api/stripe/create-cart-checkout` via `authFetch`
3. Backend creates a Stripe Checkout Session, returns `{ sessionId, url, summary }`
4. Frontend does `window.location.href = session.url` — **full-page redirect** to Stripe's hosted page
5. After payment, Stripe redirects to the success URL (configured backend-side)
6. Success page is `/order-confirmation` which fetches recent purchases

**No `@stripe/stripe-js`, no Payment Elements, no card inputs on any web page.** Pure hosted redirect. No Apple Pay / Google Pay on web.

**Success URL:** Configured in the backend Stripe session creation (not visible in frontend code). Redirects to `/order-confirmation`.

**Cancel URL:** Configured backend-side. Likely redirects to `/cart`.

---

## 5. Fee Display Bug

### The bug — £0.99 per item instead of per seller-order

The Mulligans fee model charges **£0.99 once per seller-order** (per checkout). The web UI applies it **per item x quantity**, over-charging the displayed total.

### Location 1: Cart page order summary (`cart/page.tsx:183-185`)

```typescript
const buyerProtectionFee = availableItems.reduce((sum, item) => {
  const raw = Number(item.offer_price ?? item.price);
  return sum + (raw * 0.075 + 0.99) * item.quantity;  // ← BUG: £0.99 per item * quantity
}, 0);
```

This iterates over ALL items across ALL sellers. The `+ 0.99` is inside the per-item loop and multiplied by `item.quantity`. For a cart with Seller A (2 items, qty 1 each) and Seller B (1 item, qty 3), this produces:

- **Currently displays:** `0.99 * 1 + 0.99 * 1 + 0.99 * 3 = £4.95` service fee component
- **Correct (per seller-order):** `0.99 + 0.99 = £1.98` (one per seller, regardless of item count)

### Location 2: Cart page per-item buyer price (`cart/page.tsx:518`)

```typescript
const buyerPrice = raw * 1.075 + 0.99;
```

This shows per-item "buyer price" in the item card. It adds £0.99 to every individual item's displayed price. **This is a display convenience** — it's what a single-item checkout would cost — but in a multi-item seller order, the actual £0.99 is shared. Whether to change this is a design decision (see Open Question c).

### Location 3: CartPreview fee calculation (`CartPreview.tsx:149-151`)

```typescript
const fees = allItems.reduce((sum, item) => {
  const raw = Number(item.offer_price ?? item.price);
  return sum + (raw * 0.075 + 0.99) * (item.quantity || 1);  // ← same bug
}, 0);
```

Same per-item £0.99 multiplication in the navbar cart preview's total.

### Location 4: CartPreview per-item helper (`CartPreview.tsx:57-59`)

```typescript
function buyerPriceFor(item: CartLineItem): number {
  const raw = Number(item.offer_price ?? item.price);
  return raw * 1.075 + 0.99;  // ← same per-item £0.99
}
```

Used to display individual item prices in the preview dropdown.

### What the correct per-seller-order calculation should be

For each seller group:
```
sellerItemsTotal = sum of (item.offer_price ?? item.price) * item.quantity for all items in seller
sellerProtectionFee = sellerItemsTotal * 0.075 + 0.99   // £0.99 ONCE per seller
```

For the combined total across all sellers:
```
totalProtectionFee = sum of each seller's (sellerItemsTotal * 0.075 + 0.99)
```

This matches the backend's `calculateBuyerFees()` which applies £0.99 per seller-order, not per item.

### Impact

The **displayed** total on the cart page is higher than the **actual** Stripe charge (because the checkout page and Stripe session use the backend-computed fee, which is correct). Users see a bigger number than they'll actually pay. Not a financial risk (they're charged correctly), but a trust/UX issue — the cart preview over-estimates what checkout will charge.

---

## 6. The Combined `/checkout` Page

**File:** `apps/web/src/app/checkout/page.tsx`

A separate review-before-payment page. Its flow:
1. Auth gate (redirect to login if not authenticated, line 19-23)
2. Load cart via `getCart()` (line 26-42)
3. Flatten all items across sellers (line 68)
4. Display items + backend `summary` totals
5. Single "Pay now" button → `createCartCheckout()` → `window.location.href = session.url` (line 44-56)

**What links to it:**
- `CartPreview.tsx:427` — the "Checkout" button in the navbar cart preview dropdown. **This is the only link.** No other page, component, or route links to `/checkout`.

The checkout page duplicates the cart page's checkout logic. For per-seller conversion, it either needs to be converted to per-seller too (showing individual seller sections each with their own pay button) or removed/redirected.

---

## 7. CartPreview Component

**File:** `apps/web/src/components/CartPreview.tsx`

A navbar dropdown that appears on hover/click of the cart icon. It:
- Loads the cart via `getCart()` (line 77)
- Groups items by seller (renders `sellers.map(...)` at line 239)
- Shows per-seller sections with items, seller name, and badges
- Computes a combined total at lines 142-154 (with the same £0.99-per-item bug, see section 5)
- Has two action links:
  - "Checkout" → `/checkout` (line 427) — currently goes to the combined checkout page
  - "View bag" → `/cart` (line 447) — goes to the cart page

**For per-seller conversion:** The preview does NOT need per-seller checkout buttons (it's a quick-look dropdown, not a payment surface). It needs:
1. Its "Checkout" link changed to point to `/cart` instead of `/checkout` (since `/checkout` is being removed)
2. Optionally: fix the fee total display (same £0.99 bug)

---

## 8. Overlap Check

### Mark-shipped button removal
**No overlap.** The consumer web app (`apps/web/`) has no "mark shipped" functionality — that exists only in the pro-seller dashboard (`apps/dashboard/`). Per-seller checkout changes touch only `apps/web/`.

### CartResponse type reconciliation
**Flagged but NOT blocking.** The shared `packages/api-client/` has a stale flat `CartResponse` type, but the web app **does not use it** — it has its own seller-grouped types in `lib/cart-api.ts`. The reconcile is an independent cleanup task. The new `createSellerCheckout()` function will be added to `lib/cart-api.ts` alongside the existing cart functions, with no dependency on the api-client package.

---

---

# PROPOSED PLAN — for Harry review

## Approach: Per-seller Checkout on Cart Page (mirror mobile SC-06)

### Summary
One implementation brief (SC-WEB-02) to convert the web cart to per-seller checkout, mirroring the proven mobile pattern. All backend endpoints already exist and are tested (SC-01 through SC-05).

### Changes

**1. Add `createSellerCheckout()` to `lib/cart-api.ts`**
```typescript
export async function createSellerCheckout(sellerId: string): Promise<CheckoutSession> {
  return authFetch('/api/stripe/create-seller-checkout', {
    method: 'POST',
    body: JSON.stringify({ seller_id: sellerId }),
  });
}
```
Uses the existing `authFetch` helper and existing per-seller endpoint. Response matches `CheckoutSession` (session ID + Stripe URL).

**2. Per-seller checkout button on each SellerCard**
Each seller block gets its own "Checkout" button calling `createSellerCheckout(seller.seller_id)`. On success: `window.location.href = session.url` (same Stripe hosted redirect pattern as current). While one seller is checking out, all other sellers' buttons are disabled.

**3. Per-seller fee breakdown in each SellerCard**
Replace the combined `OrderSummary` sidebar with a per-seller total inside each seller card:
- Items (N): `sum of (offer_price ?? price) * quantity`
- Buyer Protection: `sellerItemsTotal * 0.075 + 0.99` (one £0.99 per seller — the correct formula)
- Insured Shipping: `seller.shipping_cost + sellerItemsTotal * 0.0125`
- Seller Total

This matches the mobile layout from SC-06 and fixes the £0.99-per-item display bug by construction.

**4. Remove combined OrderSummary + combined checkout button**
The right-hand `OrderSummary` panel and the combined "Proceed to checkout" button are removed. Each seller is an independent checkout unit.

**5. Handle the `/checkout` page (remove or redirect to `/cart`)**
The separate checkout page becomes unnecessary — per-seller checkout happens directly from the cart page. Either delete the route or make it redirect to `/cart`. See Open Question (a).

**6. Per-seller success handling (Stripe redirect flow)**
Web uses full-page Stripe redirect (not in-app state like mobile), so the flow is:
- User clicks per-seller checkout → Stripe redirect → payment → Stripe redirects to `/order-confirmation`
- `/order-confirmation` already shows recent purchases, works for per-seller orders
- If other sellers remain in the bag, the cart badge in the navbar shows the remaining count
- Optionally: add a "Return to bag — you have N items from other sellers" banner on `/order-confirmation`. See Open Question (b).

**7. Update CartPreview's checkout link**
Change `CartPreview.tsx:427` from `href="/checkout"` to `href="/cart"`. The preview is a quick-look — it doesn't need per-seller buttons, just a link to the cart where checkout happens. Optionally fix the fee total display.

### What does NOT change
- Cart item cards (styling, images, remove button, offer display)
- Seller card header (avatar, name, badges, rating)
- Cart loading / empty states
- Auth flow
- Backend (all endpoints exist from SC-01/SC-02)
- Order confirmation page (already works per-order)
- CartPreview's item display and seller grouping

### Brief count: ONE (SC-WEB-02)
Cart page rewrite + checkout page removal + CartPreview link + API function. Similar scope to mobile SC-06 (which was one brief). The web version is simpler: no Apple Pay, no in-app state tracking, just Stripe hosted redirect.

---

## Open Questions for Harry

### (a) Remove `/checkout` page entirely, or keep as redirect?

The `/checkout` page (`apps/web/src/app/checkout/page.tsx`) is a separate pre-payment review page. With per-seller checkout, its single combined "Pay now" button no longer makes sense. Two options:

- **Remove entirely and redirect `/checkout` to `/cart`** — matches mobile parity (no separate checkout page), cleaner. The only link to it (CartPreview's "Checkout" button) would be updated to point to `/cart`.
- **Convert to per-seller too** — show per-seller review sections each with their own Pay button. More work, little benefit since the cart page already shows everything.

**Recommendation:** Remove and redirect. The cart page becomes the single checkout surface, same as mobile.

### (b) Return-to-bag banner on order confirmation?

After paying one seller, the user lands on `/order-confirmation` via Stripe redirect. If they had items from other sellers, those are still in the bag. Should `/order-confirmation` show a banner like "You have N items from other sellers still in your bag — return to bag"?

- **Yes** — makes the multi-seller flow obvious. One conditional check (fetch cart count or pass seller count via URL param).
- **No** — rely on the cart badge count in the navbar. Users who look at the badge will see they still have items.

**Recommendation:** Add the banner. It's a small addition and prevents users from forgetting they have more sellers to pay.

### (c) Fix the £0.99 fee display bug — and confirm the correct per-item display

The cart page currently applies `(price * 0.075 + 0.99) * quantity` per item (see Section 5 above). The `0.99` should be per seller-order, not per item. The per-seller conversion naturally fixes this in the seller-level totals (each seller gets one `+ 0.99`).

However, the per-item "buyer price" shown on individual item cards (`cart/page.tsx:518`: `raw * 1.075 + 0.99`) also adds £0.99 to each item. This is technically what a single-item checkout would cost, but in a multi-item seller order, the actual £0.99 is shared.

Questions:
- **Confirm the seller-level fix:** For per-seller totals, the calculation should be `sellerItemsTotal * 0.075 + 0.99` (one £0.99 per seller, matching the backend). Correct?
- **Per-item display choice:** Should individual item cards show `price * 1.075 + 0.99` (what a single-item checkout would cost) or `price * 1.075` (just the 7.5% markup, with the £0.99 shown separately in the seller total)? The first is simpler for users to understand per item; the second is more accurate but the numbers won't add up to the seller total intuitively.

**Recommendation:** Fix the seller-level total to be correct (`+ 0.99` once per seller). Keep the per-item display as `price * 1.075 + 0.99` since it's a useful "what this item costs you" shorthand, but add a note like "incl. fees" to signal it's approximate. This matches how Depop shows per-item buyer prices.

### (d) CartPreview scope — per-seller totals in dropdown?

The CartPreview navbar dropdown currently shows a combined total (with the same fee bug). For SC-WEB-02, should it:

- **Keep combined total** — just fix the fee bug and change the "Checkout" link to `/cart`. Simple.
- **Show per-seller sub-totals** — each seller section in the preview shows its own total. More informative but heavier for a quick-look dropdown.
- **Remove total entirely** — just show items grouped by seller with a "View bag to checkout" prompt. Cleanest.

**Recommendation:** Keep it simple — show grouped items with a single "View bag" link. The preview is for glancing, not for payment decisions. Fix the fee bug if keeping the total, or remove the total line and just show "N items from M sellers — view bag".

---

## Confirmation

**This is a report-only deliverable.** The only file added is this `SC-WEB-01-MAP.md` at the repo root. No code files changed.
