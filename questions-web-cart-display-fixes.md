# Questions — web-cart-display-fixes

**Branch:** `task/web-cart-display-fixes`
**Date:** 2026-07-27

---

## Q1: Insurance field existed server-side

**Answer:** Yes. `cartController.ts:251-256` computes and returns `insurance_premium` and `insured_shipping_total` in the `summary` object. The `CartSummary` type in `cart-api.ts:75-83` already includes these fields. No backend changes were needed — this was a pure display fix.

---

## Q2: `create-seller-checkout` endpoint does not exist on the backend

**Finding:** The web's `createSellerCheckout()` function (`cart-api.ts:126-131`) calls `/api/stripe/create-seller-checkout`, but this route does NOT exist in the backend's `stripeRoutes.ts`. Only `/api/stripe/create-cart-checkout` is registered.

**Impact:** The per-seller Checkout button on the cart page would 404 at runtime. This predates this brief — it was present on the `pro-seller-foundation` branch before these changes.

**Recommendation:** Either add the `create-seller-checkout` backend endpoint, or switch the web cart to use the cart-wide `create-cart-checkout` endpoint. This is out of scope for Brief B (web display only).

---

## Q3: Overlap with Brief D components

The `OrderSummary` component added in this brief renders a cart-level fee breakdown. If Brief D touches the cart page or fee display components, it should build on top of these changes (sequential, per the brief's sequencing note). No component naming conflicts — `OrderSummary` is a local function inside `cart/page.tsx`, not an exported shared component.

---

## Security scan

### XSS risks
No user-generated content is rendered unsafely. All values (prices, counts) are numbers formatted via `fp()` → `£${n.toFixed(2)}`. No `dangerouslySetInnerHTML`.

### Auth bypass risks
Cart page has auth gate (`useAuth` + redirect to `/login?redirect=/cart`). The `getCart()` API call includes the auth token. No changes to auth flow.

### Data leakage
`OrderSummary` displays only the fee summary returned by the server — no additional data exposed. No sensitive fields added or logged.

### Input validation
No user inputs added. All displayed values come from the server's `getCart()` response, which is computed server-side.

### CSRF considerations
No state-changing requests added. Existing checkout flow (POST to Stripe) unchanged.

### Rate limiting
No new API calls introduced. Same `getCart()` fetch on mount as before.

### Discrepancies between brief and code

1. **Brief checklist says "no fontWeight: 700"** — but `web-standards.md` v2.0 explicitly allows weight 700 for prices, titles, key values. The v2.0 standard supersedes the brief's checklist (which uses v1.0 values). All weight 700 usages follow the v2.0 spec.

2. **Brief checklist says "border-top: 1px solid #E0E0E0"** — but `web-standards.md` v2.0 specifies `#E5E7EB` for borders. Used `#E5E7EB` per the standard.

3. **Per-seller checkout buttons call a non-existent backend endpoint** — see Q2 above.
