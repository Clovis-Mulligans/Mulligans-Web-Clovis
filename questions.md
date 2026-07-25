# Questions — Web Parity Audit

**Date:** 2026-07-25
**Brief:** BRIEF-2-audit-web-parity.md

---

## Repo Access

Both repos were fully accessible:
- **Mulligans-Web** — read from `upstream/main` @ `4a54786`
- **Mulligans-Mobile** — read from `origin/main` @ `9e6c8b8`

Note: Mobile's working branch was `android-fixes` (not main). Some dashboard improvements (backend-driven CSV import pipeline, off-sale/relist buttons) exist on unmerged `pro-seller-foundation`-family branches in the web repo but are **not on `upstream/main`** and therefore not counted in this audit.

---

## Questions for HS

### 1. Email verification: codes or links?

The mobile app sends a 6-digit code to the verify endpoint. The web verify page has no code-entry field and never calls the endpoint — it only offers "Resend Email." The web forgot-password page expects a URL `?token=` param (link-based).

**Question:** Does the backend send different verification emails for web vs mobile? If it sends codes to everyone, web signup verification is broken. If it sends links with tokens, the verify page still needs to handle the token from the URL.

**My recommendation:** Check the email templates / Cognito config. This is potentially blocking all new web signups from completing verification.

### 2. Bulk listing endpoints — are they on a branch or truly unbuilt?

`packages/api-client/src/endpoints/listings.ts` has an explicit TODO saying `PATCH /api/listings/bulk` and `POST /api/listings/bulk-delete` don't exist in the backend. The dashboard UI calls these for every pause/resume/mark-sold/bulk action.

**Question:** Are these endpoints built on a backend branch that hasn't been merged, or are they genuinely unbuilt? If unbuilt, should the dashboard UI be hidden/disabled until they exist?

### 3. Cart pricing: should web read `cart.summary` from the server?

Mobile reads the server's `cart.summary` (which includes the 1.25% insurance premium in shipping). Web recomputes everything client-side and misses the insurance premium. This means the cart total shown to the buyer on web is potentially lower than what they'll actually pay at Stripe checkout.

**Question:** Is the Stripe checkout session created with the server-calculated total (correct) or the client-displayed total (possibly wrong)? If server-calculated, the buyer sees one price in cart and pays a different price at Stripe — a bad UX and possible compliance issue. If client-calculated, the insurance premium is being absorbed somewhere.

### 4. Stripe Connect for non-pro web sellers — intentional gap?

Mobile has `balance.tsx` and `earnings.tsx` for any seller. The web consumer app has no Stripe Connect onboarding, balance, or payout views. The dashboard handles this but is pro-seller only.

**Question:** Is it intentional that a non-pro seller who lists via the web consumer app has no way to set up Stripe Connect or view earnings on web? Or is the expectation that all web sellers eventually become pro sellers via the dashboard?

### 5. Chip AI caddy on web — planned?

Chip is a major mobile feature (fitting questionnaire, virtual bag, AI chat with listing recommendations). It's completely absent from web, but `ChipFitterBanner.tsx` actively links to `/chip` from search/category pages (dead link). 

**Question:** Is a web version of Chip planned? If not near-term, the dead link should be removed. If planned, is it on a roadmap?

### 6. Pro-seller storefront on mobile — planned?

The pro-seller storefront (`/stores/[slug]`) is fully built on web with banner, colours, logo, featured/pinned listings, and customisation settings in the dashboard. It doesn't exist on mobile at all.

**Question:** Is mobile pro-seller storefront on the roadmap? This is a "reverse gap" — web is ahead of mobile here.

### 7. Dashboard as a standalone app — is this the right architecture?

The dashboard is a completely separate Next.js app with its own auth (Cognito/Amplify), its own component set, and its own routing. It shares the API client package but not much else. This means:
- Sellers need to manage two separate sessions (consumer app for order fulfilment/shipping, dashboard for inventory/analytics)
- Order detail/shipping/disputes are only in the consumer app — dashboard links to them but they 404
- No notifications in dashboard
- Different visual styling

**Question:** Is the long-term plan to merge dashboard functionality into the consumer app (so sellers have one place to go), or to build out the dashboard as a complete standalone seller tool (which means duplicating order/shipping/dispute UI)?

### 8. Shared UI package — adoption plan?

`packages/ui/` has well-built components (Button, Card, Dialog, Input, Select, Table, Tabs, Avatar, Badge, etc.) but the web consumer app imports **zero** of them — only `globals.css`. All 23 web components are bespoke with inline styles. The `Dialog` component is built but used nowhere in either app (every modal is hand-rolled).

**Question:** Is there a plan to adopt the shared UI package in the consumer app? The current state means visual/behavioural drift between dashboard and consumer app will only grow over time.

---

## Ambiguous Items (noted but not blocking)

- **Mobile's `AdSlider.tsx`, `CategorySection.tsx`, and `ListingsFeed.tsx`** are fully built components that are imported by nothing on mobile's home screen. The actual home screen has its own inline implementation. Are these deprecated or planned for future use?
- **`apps/web/src/lib/auth.ts`** (Cognito/Amplify wiring) is imported by nothing. `messages/page.tsx` imports from `aws-amplify/auth` directly. Is the intent to move web auth to Cognito (matching dashboard), or is this dead code to clean up?
- **Mobile Chip `uploadSwingImage()`** is fully implemented in `hooks/useChip.ts` but never called from any UI. Planned feature or abandoned?
