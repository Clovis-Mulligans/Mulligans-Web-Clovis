# Web/Mobile Parity Audit — Mulligans Golf

**Date:** 2026-07-25
**Author:** Clovis (AI partner)
**Type:** Investigation — read-only audit, no code changes
**Brief:** BRIEF-2-audit-web-parity.md

---

## Verification

```
Mulligans-Web (upstream/main):  4a547862ab42eb20be4f0dca1cd950ddb5050baf
Mulligans-Mobile (origin/main): 9e6c8b8054b62b92b2cde875fda8ae0b6d0d0ba0
```

Both repos accessible. Web repo is a monorepo with three packages:
- `apps/web/` — Next.js consumer app (buyer + seller)
- `apps/dashboard/` — Next.js seller dashboard (separate app, Cognito auth)
- `packages/api-client/` + `packages/ui/` — shared libraries

Mobile repo is a single Expo/React Native app.

---

## Full Parity Table

Mobile is the reference implementation. Where the web consumer app and dashboard together cover a feature, both are noted.

### Buyer Journey

| Feature / Flow | Mobile | Web | Parity | Notes / Severity |
|---|---|---|---|---|
| Home page / feed | Infinite-scroll listings feed, category chips, Chip AI banner, pull-to-refresh | Hero banner, app-store badges, brand-logo wall (placeholder boxes), FeaturedListings (pro-store only, cap 15), "Recently Listed" (10 items). No infinite scroll | **Partial** | Different content strategy — web is marketing-first, mobile is browse-first. `Try Chip →` renders as non-clickable `<span>` (dead CTA). No empty state for Recently Listed |
| Search autocomplete | Debounced live suggestions via `/search/suggestions` (brand/category/subcategory/listing/user types) | Plain submit-only input — `getSearchSuggestions()` exists in API client but is never called | **Missing** | Medium — search UX significantly weaker on web |
| Search history | Persisted recent searches (max 10, individually removable via AsyncStorage) | None | **Missing** | Low-medium |
| Search results | Infinite scroll, 3 sort options | Click-to-load-more, 4 sort options (adds "Most Popular") | **Full** | UX difference (pagination style) but functionally equivalent |
| Category drill-down | Dedicated subcategory screen with all sub-options | Subcategory only exists as filter pills within search | **Partial** | Low |
| Filter: core club specs | Brand→model cascade from equipment DB, shaft flex/material, dexterity, grip size, iron set-makeup, putter head+type | Brand (static hardcoded list, no model cascade), shaft flex/material, dexterity, grip size, iron numbers, head type | **Partial** | Medium — no model cascade, static brands instead of equipment DB |
| Filter: loft/lie/length | Full UI controls, dynamic by subcategory | Fields are in the API whitelist and types but **zero rendered UI** — only settable by hand-editing URL params | **Missing** | Medium — these are Mulligans' competitive advantage filters |
| Filter: keyword search | Per-category placeholder text, inline keyword input | Not present | **Missing** | Medium |
| Filter: Shoes | Full coverage (spikes, colour, etc.) | Missing Spikes/Color filters | **Partial** | Low |
| Filter: Accessories | Bag type, headcover type, tee material/style, slope adjust | No filter UI at all for accessories category | **Missing** | Low-medium |
| Filter: Shafts/Grips | Full filter set | No filter UI at all | **Missing** | Low |
| Filter: Clothing | Size, gender, waist, etc. | Size, gender, waist, glove size — comparable | **Full** | — |
| Listing detail: images | Paging carousel, blurhash placeholders, pinch-zoom full-screen, SOLD dark overlay | Gallery with lightbox + keyboard nav + thumbnails. No pinch-zoom, no SOLD overlay, plain `<img>` (no lazy-loading) | **Partial** | Low-medium — SOLD overlay absence means sold items look active |
| Listing detail: quantity selector | Full quantity stepper bounded by stock | Hardcodes `quantity: 1` — no selector UI | **Missing** | Medium — multi-quantity items can't be bought in bulk on web |
| Listing detail: Buy Now / Add to Cart | Both available | Both available | **Full** | — |
| Listing detail: Make Offer | Quick-discount pills, live fee breakdown (offer + protection + shipping = total), 3-offer cap counter | Offer modal works but **no fee breakdown** — shows raw offer amount only | **Partial** | Medium — buyer can't see true cost before offering |
| Listing detail: Apple Pay / Google Pay | Native in-app payment flow via `@stripe/stripe-react-native` | Not present — no `@stripe/*` package in web `package.json` | **Missing** | Medium — convenience payment path absent |
| Listing detail: Ask Chip | Category-gated AI-caddy button + chat modal (clubs only) | Not present | **Missing** | Medium — key differentiator absent from web |
| Listing detail: Share | Native share sheet | Not present | **Missing** | Low — easy to add |
| Listing detail: Postage Info modal | Dedicated modal with shipping details | Shipping shown as brief inline block only | **Partial** | Low |
| Listing detail: Consumer Protection modal | Dedicated modal explaining buyer protection | Policy lives on disconnected static page `/buyer-protection` — no in-context modal | **Partial** | Low |
| Listing detail: Pro-Seller badge | `is_pro_seller` rendered with badge | `is_pro_seller` read from data but **never rendered** | **Missing** | Low |
| Listing detail: SOLD state | Dark overlay on images, disabled buy buttons | No SOLD overlay — sold items visually identical to active ones | **Missing** | Medium — confusing UX |
| Offers: manage (buyer) | Two-tab screen (Received/Made), full status handling, "New Offer" re-offer after declined counter, direct "Add to Cart" from accepted offer, nav badge with offer count | `/offers` page with tabs, status handling. No "New Offer" after decline (must go back to listing), accepted offers show "Buy Now" link (not direct add-to-cart), **no offer-count badges in nav** | **Partial** | Medium |
| Cart: quantity editing | Full quantity stepper bounded by stock, per-item | **No quantity editing at all** — `cart-api.ts` has no `updateCartItemQuantity` | **Missing** | **High** — can't adjust quantities after adding |
| Cart: offer countdown | Live urgency-colored countdown timer for offer-accepted items | Static badge only — no countdown despite `offer_expires_at` being typed | **Missing** | Medium — offer-accepted items could silently expire |
| Cart: demand warnings | "In demand" / other-carts warning banner | Not present despite `in_other_carts` being typed | **Missing** | Low |
| Cart: price summary | Server-sourced `cart.summary` (items, buyer protection, insured shipping incl. 1.25% insurance premium, total) | **Client-side recomputed** — never reads `cart.summary`, shipping total **omits insurance premium** | **Broken** | **High** — price shown to buyer may be wrong |
| Cart: pre-checkout validation | `validateCart()` call before proceeding | Not present — relies on stale client-cached availability flags | **Missing** | Medium — could proceed with out-of-stock items |
| Cart: Clear All | Available with confirm dialog | `clearCart()` function exists but is dead code — unreachable from UI | **Missing** | Low |
| Cart: Apple Pay / Google Pay | `PlatformPayButton` alongside card button | Not present | **Missing** | Medium |
| Cart: nav badge | Cart icon with live item count in header | Persistent navbar cart icon with count + hover preview (CartPreview) | **Full** | Reverse gap — web cart UX arguably better |
| Checkout: card payment | Validate → Stripe Checkout session → redirect to hosted payment page | Same flow — real parity on the card path | **Full** | — |
| Checkout: Apple Pay / Google Pay | Native payment intent → in-app confirm → fulfil | Not present | **Missing** | Medium |
| Checkout: pricing | Centralized `lib/pricing.ts` with NaN/negative guards | Formula duplicated inline in 3+ places, no NaN guards | **Partial** | Medium — risk of calculation drift |
| Order list (buyer) | Tabs, filters, per-card "new" highlight | List with filters, status badges | **Full** | — |
| Order detail (buyer) | Escrow status, refund/dispute/insurance cards, tracking with copy, timeline, action bar | Comparable or richer — adds summary-stats strip, "next action" pills | **Full** | Reverse gap — web order detail is arguably more complete |
| Review (post-purchase) | Star rating + text review flow | Same flow | **Full** | — |
| Dispute / report issue | 1-5 required photos, `willingToReturn` confirmation toggle for full refund/return requests | Photos **optional**, no `willingToReturn` flag sent | **Partial** | Medium — weaker dispute evidence on web |
| Return-label purchase | 4-step wizard: rates → label purchase → QR code → print → drop-off finder | **Buttons exist on order detail linking to `/orders/return/[id]` — route does not exist (404)** | **Broken** | **Critical** — dead link in a revenue/support-critical flow |
| Return status tracking | Return status card with timeline | Not present anywhere on web | **Missing** | High |
| Favourites: toggle | App-wide `FavoritesContext` (Set of IDs), optimistic toggle, guest → AuthPrompt | Per-component independent `checkFavourite` calls (no shared context). Guest → hard redirect to `/login` | **Partial** | Low |
| Favourites: detail page heart | Reads `is_favourite` field correctly | **Bug:** reads `(res as any).isFavorited` instead of `is_favourite` — heart never shows correct state on load | **Broken** | **Medium-High** — favourited items always appear un-favourited until manually toggled |
| Favourites: list page | Pull-to-refresh, empty state + "Browse Listings" CTA, SOLD overlay | Search/sort (extra functionality), but dead code block `{false && (...)}` left in page | **Partial** | Low — web has extra features but also dead code |

### Seller Journey

| Feature / Flow | Mobile | Web (Consumer) | Web (Dashboard) | Parity | Notes / Severity |
|---|---|---|---|---|---|
| Create listing | Full form with equipment DB (brand→model cascade), shaft/head/grip condition split, size variants, quantity, multi-photo upload with reorder, draft persistence | `/sell` page — functional form with photo upload, condition, pricing, shipping options | `inventory/new` — `ListingForm.tsx` is a separately-written, weaker component: no equipment DB, no shaft cascade, no head/shaft/grip condition split, no quantity/size-variant support | **Partial** | Medium — dashboard form (the pro-seller tool) is weaker than mobile |
| Edit listing | Full edit with all create-listing fields | `/listings/[id]/edit` — functional | Dashboard `inventory/[id]/edit` — same weaker `ListingForm` | **Partial** | Same gap as create |
| Delete listing | Available on listing detail | Available on edit page | Available on inventory page | **Full** | — |
| Photo upload | Multi-photo with reorder (drag) | Multi-photo with reorder | Multi-photo, no reorder | **Partial** | Dashboard lacks photo reorder |
| Drafts | Local draft persistence | Draft persistence (localStorage) | No drafts | **Partial** | Dashboard has no draft support |
| Bulk / CSV import | N/A | N/A | `inventory/import` — CSV upload with column mapping, preview, validation | **N/A** | Dashboard-only feature (appropriate). **Bug:** writes parcel sizes in uppercase (`SMALL`) while all other paths use lowercase (`small`) — data inconsistency |
| Listing management / inventory | Profile page shows own listings | Profile page shows own listings | Full inventory page with search, filters, status tabs, bulk selection bar | **Full** | Dashboard has richer inventory management (appropriate) |
| Bulk actions (pause/resume/mark-sold/price/delete) | N/A | N/A | UI fully built — but **backend routes don't exist** (`PATCH /api/listings/bulk`, `POST /api/listings/bulk-delete` — explicit TODO in api-client) | **Broken** | **Critical** — every bulk/status action in dashboard silently fails |
| Single-row pause/resume/mark-sold | Available | Available | Same broken bulk endpoints | **Broken** | **Critical** — individual status actions also fail |
| Sale notifications | Push + in-app | In-app (notifications page) | No notifications feature at all | **Partial** | Medium — dashboard sellers get no sale alerts |
| Shipping label generation | Full flow: rates → label purchase → QR code → print | `/orders/[id]/ship` — functional | **No order-detail route exists** — "View Order" links 404 | **Partial** | **Critical** for dashboard — sellers can't ship from dashboard |
| Sending address / shipping info | Dedicated `shipping-info.tsx` screen | Part of settings page | No equivalent found | **Partial** | Low |
| Drop-off finder | `dropoff-finder.tsx` — carrier drop-off location finder | Not present | Not present | **Missing** | Low |
| Stripe Connect onboarding | `connect-complete.tsx` callback handling | No equivalent | Dashboard `apply` page handles Stripe setup | **Partial** | Non-pro sellers on web have **no Stripe path at all** |
| Balance / wallet | `balance.tsx` — current balance view | Not present | Not present | **Missing** | **High** — web sellers can't see their balance |
| Earnings view | `earnings.tsx` — 5-period earnings (today/week/month/year/all) | Profile shows Today only | `payouts/page.tsx` — exists but "View Order" links from it 404 | **Partial** | Medium |
| Payout status | In earnings/balance screens | Not present for non-pro | Dashboard payouts page (links broken) | **Partial** | Medium |
| Seller profile | Profile tab with active/sold listings, stats | User profile page with listings, basic stats | No seller-facing profile view | **Partial** | Low |
| Shop policies (delivery/returns/cancellation) | Settable in profile, shown on user about page | Not present | Not present | **Missing** | Medium — buyers can't see seller policies on web |
| Reviews (seller) | Reviews screen showing received reviews | `/user/[userId]/reviews` — functional | No reviews view | **Full** (consumer) | Dashboard lacks reviews |
| Pro-seller storefront | Not present on mobile | Full storefront: `/stores/[slug]` with banner, colours, logo, featured/pinned listings, `StorePageClient.tsx` | Settings page for pro-store customization | **Reverse gap** | Web is ahead — pro storefronts are web-only |
| Analytics | Flat seller stats on profile | Basic seller stats on profile | Full analytics page with charted KPIs (`analytics/page.tsx`) | **Reverse gap** | Dashboard analytics exceeds mobile |
| Offers management (seller) | Received offers with accept/decline/counter | Received offers with accept/decline/counter | Received offers + "Send Offer to Watchers" — **but this is a stub** (always Promise.rejects, modal says "backend endpoint not built yet") | **Partial** | Medium — stub feature visible to pro sellers |
| Auto-decline threshold | Not present | Not present | Full UI with toggle + slider — **but explicitly a stub** ("coming soon, preference saved but not activated") | **Broken** | Low-medium — user configures something that does nothing |

### Account & Cross-Cutting

| Feature / Flow | Mobile | Web | Parity | Notes / Severity |
|---|---|---|---|---|
| Sign up | Name/email/phone(optional)/password, 5-rule password checklist, SMS consent, marketing opt-in | Name/email/password only — **no phone, no SMS consent, no marketing opt-in**, password validation is length>=8 only (4 rules missing). Uses raw `fetch` bypassing shared api-client | **Partial** | Medium — signup data collection weaker |
| Login | Email + password → token | Email + password → token. Adds `?redirect=` support | **Full** | — |
| Auth: token storage | `expo-secure-store` (keychain), axios interceptors auto-clear on 401, retry on timeout | **Plain `localStorage`** (XSS-exposed), **no interceptor layer** — expired token leaves UI silently "logged in" until full reload | **Partial** | **High** — security gap (localStorage) + broken session expiry handling |
| Auth: middleware | N/A (app-level) | **No edge middleware** — all protected pages gate client-side via `useEffect` (page shell flashes before redirect, no protection with JS disabled) | **Partial** | Medium — dashboard has proper edge middleware, consumer app doesn't |
| Auth: dead code | — | `apps/web/src/lib/auth.ts` (Cognito/Amplify) is imported by nothing — dead code. `messages/page.tsx` imports `fetchAuthSession` from `aws-amplify/auth` directly against presumably unconfigured Amplify | **Broken** | Low-medium — potential runtime error on `/messages` |
| Forgot password | 6-digit code UI (auto-advancing boxes), resend button, full password checklist | Link-based (expects `token` URL param), no resend option, length>=8 only | **Partial** | Low-medium — different mechanism (code vs link) |
| Email verification | 6-digit code entry screen, calls verify endpoint | **No code-entry field, never calls verify endpoint** — only shows "Resend Email" | **Broken** | **Critical** — web users may have no way to complete signup if backend sends codes |
| Onboarding | Intro screens, interests/sizing/handicap capture | Not present. Orphaned image assets in `public/onboarding/` suggest planned but never built | **Missing** | Medium — no personalisation capture on web |
| Interests & sizes | Dedicated `interests-sizes.tsx` screen | Part of web settings page (consolidated) | **Full** | — |
| Edit profile | Dedicated `edit-profile.tsx` screen | Part of web settings page (consolidated) | **Full** | Reasonable consolidation |
| Profile (own) | Full profile with given-reviews tab, 5-period earnings cycling | No given-reviews tab, Today earnings only. **Reverse:** web has response rate, avg dispatch time, "Specialises in" tags, Pro Store badge | **Partial** | Low — trade-offs in both directions |
| User profile (others) | Full profile + Sold tab + About/Shop Policies page + "Browse by section" category cards | Profile + reviews. **No Sold tab, no About/Shop Policies page, no category cards** | **Partial** | Medium — shop policies are important for buyer trust |
| User profile: Report/Block | Available inside chat only | Available directly on profile page | **Reverse gap** | Web is ahead |
| Messaging / chat | REST-only, no realtime, no typing indicators. `socket.io-client` declared but unused. Offer-in-chat explicitly removed | **Full Socket.IO with typing indicators, working offer-in-chat rendering** | **Reverse gap** | Web messaging is significantly ahead of mobile |
| Notifications: list | Activity tab with category/type/routing logic | Notifications page — near line-for-line port | **Full** | — |
| Notifications: nav badges | Bottom tab with unread count, profile tab with orders+offers count, Stripe Connect incomplete alert dot | **No badges anywhere** — notification icon and all nav links are badge-less, no seller-payout nudge | **Missing** | Medium — users don't know they have unread items |
| Push notifications | Expo Push + Firebase | N/A (web-appropriate) | **N/A** | — |
| ATT / tracking consent | `useMetaTracking.ts` | N/A (mobile-specific) | **N/A** | Web has **zero analytics/tracking at all** — no Meta Pixel, GA, gtag. Can't measure ad ROI or funnel completion |
| Settings | Dedicated screen + privacy settings + change password | Consolidated single-page with tabs — reasonable. **Broken links:** `/help`, `/legal/terms`, `/legal/privacy` all 404 | **Partial** | Medium — broken links, but feature consolidation is fine |
| Help centre | 51 articles, structured categories, dedicated screens | **Not present at all.** Only trace is a dead `/help` link and a bare `mailto:` in Settings | **Missing** | **High** — no self-service support on web |
| Contact support | Structured contact form | Bare `mailto:` link | **Missing** | Medium |
| Feedback form | Structured `feedback.tsx` screen | Not present | **Missing** | Low |
| Legal pages | 2 documents (Terms, Privacy) via dynamic `[slug]` route | 5 documents (Terms, Privacy, Buyer Protection, Prohibited Items, Acceptable Use) + `/legal` hub index with versioned markdown | **Reverse gap** | Web has more comprehensive legal coverage |
| Chip AI caddy | Full feature: 10-step questionnaire (handicap/dexterity/height/goals/budget/brand), 14-slot virtual bag with gap analysis, swing-data logging, rate-limited chat (30 msgs/day), conversation history, inline listing recommendations | **Not present at all.** `ChipFitterBanner.tsx` links to `/chip` which doesn't exist — dead link live in production on `/search` and category pages | **Missing** | **High** — major differentiator absent from web, with a broken link pointing to it |
| Download / app promotion page | N/A | `/download` page — minimal (H1 + copy + AppStoreBadges). No OS-detect, no screenshots. QR in footer points to Linktree not direct link | **N/A** | Web-only, functional but thin |
| Layout: navigation | 5-tab bottom nav with badge counts | Navbar with responsive hamburger, footer with links. **5+ broken footer links** (`/sell/how-it-works`, `/sell/guide`, `/sell/pro-shops`, `/support/help`, `/support/contact`) | **Partial** | Medium — broken links in footer |

---

## Summary of Gaps by Severity

### Critical (broken — live users hit these today)

1. **Email verification broken on web** (`apps/web/src/app/verify-email/page.tsx`) — No code-entry field, never calls verify endpoint. If backend sends 6-digit codes (as mobile's flow implies), web signups cannot complete verification.

2. **Return-label flow is a dead link** (`apps/web/src/app/orders/[id]/page.tsx`) — "Pay for Return Label" / "Purchase Return Label" buttons link to `/orders/return/[id]` — that route does not exist. Confirmed via `git ls-tree`. Live 404 in a support-critical flow.

3. **Dashboard bulk listing actions call non-existent backend routes** (`packages/api-client/src/endpoints/listings.ts:175-190`) — `PATCH /api/listings/bulk` and `POST /api/listings/bulk-delete` have an explicit TODO: "These endpoints do not exist in the backend yet." Affects: pause, resume, mark-sold (single and bulk), bulk price/discount, bulk delete. All silently fail. This breaks the core workflow for Pro Sellers using the dashboard.

4. **Dashboard "View Order" links 404** (`apps/dashboard/src/app/(dashboard)/orders/page.tsx`) — Links to `/orders/${order.id}` but no order-detail route exists in the dashboard app. Sellers cannot ship, track, or respond to disputes from the dashboard.

5. **Cart price summary is wrong** (`apps/web/src/app/cart/page.tsx`) — Price is recomputed client-side, never reads `cart.summary` from the server. Shipping total omits the 1.25% insurance premium that mobile includes. Buyer sees incorrect total before checkout.

6. **Favourites field-name bug** (`apps/web/src/app/listings/[id]/ListingDetailClient.tsx:136-138`) — Reads `(res as any).isFavorited` but the real field is `is_favourite`. The `as any` cast hides the type error. Previously-favourited listings always render as un-hearted until manually toggled.

7. **SEO canonical tag bug** (`apps/web/src/app/layout.tsx`) — Root layout sets `alternates.canonical: 'https://www.mulligans.uk.com'`. Only the homepage overrides it. Every other page (including all listing detail pages) emits a canonical pointing to the homepage — telling Google every listing is a duplicate of the homepage. Critical for a marketplace that needs individual listings to rank.

8. **Chip dead link live in production** — `ChipFitterBanner.tsx` renders on `/search` and category pages with "Try Chip →" linking to `/chip` — route doesn't exist. Non-clickable `<span>` styled to look like a button on homepage.

### High (major missing features or significant broken behaviour)

9. **Chip AI caddy entirely absent from web** — Mobile's major differentiator (10-step fitting questionnaire, virtual bag, gap analysis, AI chat with listing recommendations) has zero web implementation.

10. **Help centre / support entirely absent from web** — 51 mobile help articles, structured contact-support form, and feedback form have no web equivalent. Only a dead `/help` link and a `mailto:`.

11. **Cart: no quantity editing** — No quantity selector on listing detail (hardcodes 1) or in cart. `cart-api.ts` has no `updateCartItemQuantity` function. Multi-quantity purchases impossible on web.

12. **Auth: token in plain localStorage** — Mobile uses `expo-secure-store` (keychain). Web stores token in `localStorage['mulligans_auth_token']` (XSS-exposed). No interceptor layer means expired tokens leave the UI silently "logged in."

13. **Non-pro sellers have no Stripe Connect / Balance / Payouts path on web** — Mobile has `balance.tsx` and `earnings.tsx`. Web consumer app has nothing. Dashboard is pro-seller only.

14. **Return status tracking absent from web** — No return-status card or timeline anywhere on web, even if a return were somehow initiated.

15. **No web analytics/tracking at all** — No Meta Pixel, GA, gtag anywhere in the web app. Cannot measure ad ROI or funnel completion on web.

### Medium (partial features, missing filters, UX gaps)

16. **Search: no autocomplete** — `getSearchSuggestions()` API exists but is never called from web UI.
17. **Search: competitive-advantage filters missing** — Loft, lie angle, length have API support but zero rendered UI on web. These are Mulligans' key differentiator vs eBay.
18. **Search: no keyword filter, no brand→model cascade** — Web uses static hardcoded brand arrays instead of the equipment DB.
19. **Search: missing category-specific filters** — Accessories, Shafts/Grips/Heads, and Shoes categories have incomplete or absent filter UIs.
20. **Listing detail: no SOLD overlay** — Sold items visually identical to active ones on web.
21. **Listing detail: no Apple Pay / Google Pay** — Entire native payment path absent.
22. **Offers: no fee breakdown in offer modal** — Buyer can't see true cost before making an offer.
23. **Offers: no re-offer after decline** — Must navigate back to listing manually.
24. **Offers: no nav badges** — No offer-count indicators anywhere in web navigation.
25. **Notifications: no nav badges** — No unread indicators on any nav element.
26. **Onboarding absent** — No first-run intro, interests/sizing/handicap capture on web.
27. **Signup: data collection weaker** — No phone, SMS consent, or marketing opt-in fields.
28. **User profiles: no Sold tab, no Shop Policies** — Buyers can't see seller policies on web.
29. **Dispute: weaker evidence** — Photos optional on web (required on mobile), no `willingToReturn` flag.
30. **Dashboard ListingForm is weaker** — No equipment DB, no shaft cascade, no condition split, no quantity/size variants. Pro sellers get a worse listing experience than mobile users.
31. **Dashboard has no notifications** — Pro sellers get no sale alerts in dashboard.
32. **Settings page: 3 broken links** — `/help`, `/legal/terms`, `/legal/privacy` all 404.
33. **Footer: 5 broken links** — `/sell/how-it-works`, `/sell/guide`, `/sell/pro-shops`, `/support/help`, `/support/contact`.
34. **Order confirmation: broken link** — "Learn more about Buyer Protection" links to `/help` instead of `/buyer-protection`.
35. **CSV import: case mismatch bug** — Writes parcel sizes as `SMALL` while all other paths use `small`.
36. **"Send Offer to Watchers" is a visible stub** — Modal explicitly says backend endpoint not built yet. `Promise.reject`s always.
37. **"Auto-Decline Threshold" is a visible stub** — Users can configure and save a setting that does nothing.
38. **`/listings` is a stub page** — Publicly reachable "coming in Brief 7" placeholder. Indexable by search engines.
39. **Cart: two parallel implementations** — `cart-api.ts` (local) vs `@mulligans/api-client` (shared) with different type shapes. Risk of price/behaviour drift.
40. **Cart shared types are stale** — `CartResponse`/`CartItem` in shared package don't match actual backend response shape.
41. **Web consumer app has no edge middleware** — All auth gating is client-side `useEffect`. Page shell flashes before redirect. Dashboard has proper edge middleware.
42. **Shared `packages/ui` unused by web consumer app** — Web imports only `globals.css`. All 23 components are bespoke with inline styles. Visual drift risk vs dashboard.
43. **Native `alert()`/`confirm()` mixed with custom modals** — ~8 instances across offers, messages, profile, settings pages.
44. **Search/category pages have no unique meta tags** — `'use client'` components with no `generateMetadata`. All share the generic site-wide title/description.
45. **Pro Store pages omitted from sitemap** — `/stores/[slug]` has full metadata support but isn't in `sitemap.ts`.
46. **No JSON-LD structured data** — No `Product`, `Organization`, or `BreadcrumbList` schema anywhere. Only OG product price/currency meta (insufficient for rich snippets).
47. **Profile page broken links** — Two `/profile/{id}` links should be `/user/{id}`.

### Low (minor or cosmetic)

48. Search: no search history on web.
49. Listing detail: no Share button.
50. Listing detail: no Postage Info modal (inline text only).
51. Listing detail: Pro-Seller badge not rendered despite data being available.
52. Cart: no "Clear All" button (function exists as dead code).
53. Cart: no offer-expiry countdown timer.
54. Cart: no "in demand" warning.
55. Cart: no pre-checkout `validateCart()` call.
56. Favourites: no shared context (each component independently checks).
57. Drop-off finder absent from web.
58. Feedback form absent from web.
59. Mobile profile: location hardcoded as "United Kingdom" instead of `userData.location`.
60. Mobile Chip: `uploadSwingImage()` fully implemented in `hooks/useChip.ts` but never called (dead code — no image-picker UI).
61. Download page is minimal (no OS-detect, no screenshots/feature list).
62. QR code in footer points to Linktree instead of direct/branded deep link.

---

## Reverse Gaps (Web has, Mobile lacks)

| Feature | Web | Mobile |
|---|---|---|
| **Messaging: realtime** | Full Socket.IO with typing indicators, working offer-in-chat rendering | REST-only, no realtime, `socket.io-client` declared but unused. Offer-in-chat explicitly removed |
| **Legal documents** | 5 formal policy docs (Terms, Privacy, Buyer Protection, Prohibited Items, Acceptable Use) with versioned markdown + hub index | 2 documents only (Terms, Privacy) |
| **Pro-seller storefront** | Fully built `/stores/[slug]` with banner, colours, logo, featured/pinned listings | Not present on mobile |
| **Dashboard analytics** | Charted KPIs with revenue/performance visualisation | Flat seller stats on profile only |
| **Report/Block from profile** | Available directly on user profile page | Available only inside chat |
| **Cart preview** | Persistent navbar cart icon with live count + hover dropdown preview | No top-level cart nav entry |
| **Favourites: search/sort** | Search + sort on favourites list page | Not present |
| **SEO pages** | `robots.ts`, `sitemap.ts`, meta tags (partial but present) | N/A (mobile-appropriate) |
| **Marketing homepage** | Hero banner, app-store badges, brand-logo wall, trust callouts | N/A (app-appropriate) |

---

## Broken / Half-Built on Web (things a live user can hit today)

These are **worse than missing** because they create confusion, broken flows, or incorrect information:

1. **Return-label buttons → 404** — Order detail renders action buttons for a route that doesn't exist.
2. **Email verification page** — Renders but can't actually verify (no code entry, no endpoint call).
3. **Dashboard bulk actions** — Full UI with buttons, modals, bulk bar — all silently fail because backend routes don't exist.
4. **Dashboard "View Order"** — Every order row has a "View Order →" link that 404s. Sellers can't view/ship/dispute from dashboard.
5. **Cart price summary** — Shows buyer a price that may exclude insurance premium. Wrong total displayed.
6. **Favourites heart on listing detail** — Field-name bug means it's always wrong on page load.
7. **Canonical tag** — Every listing page tells Google it's a duplicate of the homepage.
8. **"Try Chip →" dead CTA** — Renders as a non-clickable span on search/category pages, links to nonexistent `/chip` route.
9. **"Send Offer to Watchers"** — Live button in dashboard opens modal that says feature doesn't work.
10. **"Auto-Decline Threshold"** — Interactive settings UI that explicitly saves nothing ("coming soon").
11. **`/listings` stub** — Publicly reachable page saying "coming in Brief 7."
12. **Footer links** — 5 links to pages that don't exist.
13. **Settings links** — 3 links to wrong paths (404s).
14. **Order confirmation** — "Learn more" links to nonexistent `/help`.
15. **Dead auth code** — `apps/web/src/lib/auth.ts` (Cognito) imported by nothing. `messages/page.tsx` imports from `aws-amplify/auth` against possibly unconfigured Amplify.

---

## Cross-Reference with Brief 1 (Backend Money Path)

The following web frontend flows depend on backend behaviours that Brief 1 audits. This audit documents the **frontend** gap; see Brief 1 for the backend analysis:

- **Checkout / payment flow** — Web's card-via-Stripe path works end-to-end, but the pricing formula is duplicated inline without guards. Brief 1 covers the backend escrow and fee calculation logic.
- **Confirm receipt** — Web has this flow. Brief 1 covers the backend escrow release.
- **Dispute / report an issue** — Web's dispute form is weaker (optional photos, no `willingToReturn` flag). Brief 1 covers the backend dispute resolution and refund logic.
- **Returns** — Web's return-label flow is entirely broken (404). Brief 1 covers the backend return processing.
- **Buyer protection fee display** — Web duplicates the `price * 0.075 + 0.99` formula inline. Brief 1 covers whether the backend enforces this consistently.
- **Stripe Connect / payouts** — Web has no Stripe path for non-pro sellers. Brief 1 covers the backend payout flow.

---

## Suggested Parity Roadmap Ordering

Prioritised by: (1) fix broken things a live user hits today, (2) unblock core buyer/seller workflows, (3) fill major feature gaps, (4) polish and enhancement. This is input for HS's plan, not a recommendation to act unreviewed.

### Phase 1: Fix What's Broken (immediate — before promoting web to real users)

1. **Fix email verification** — Add code-entry field and wire to verify endpoint. Without this, new web signups may be stuck.
2. **Fix return-label flow** — Either build the `/orders/return/[id]` page or remove the dead buttons. Currently a 404 in a critical support flow.
3. **Fix cart price summary** — Read `cart.summary` from server instead of client-side recomputation. The buyer is seeing the wrong price.
4. **Fix favourites field-name bug** — Change `isFavorited` to `is_favourite` in `ListingDetailClient.tsx`.
5. **Fix canonical tags** — Each page needs its own `alternates.canonical`. Currently killing SEO for every listing page.
6. **Fix broken links** — Settings (3), footer (5), order confirmation (1), Chip banner. Quick wins.
7. **Remove/hide stubs** — `/listings` placeholder, "Send Offer to Watchers" modal, "Auto-Decline Threshold" — either build them or don't show them to users.

### Phase 2: Core Workflow Gaps (enables web as a real buyer/seller platform)

8. **Add cart quantity editing** — Quantity selector on listing detail and in cart.
9. **Build search autocomplete** — API already exists, just needs frontend wiring.
10. **Add competitive-advantage filters** — Loft, lie angle, length UI controls. This is Mulligans' key differentiator.
11. **Add keyword search filter** — Missing from web search entirely.
12. **Add nav badges** — Notification count, offer count, unread messages. Users need to know things need attention.
13. **Build Stripe Connect path for non-pro sellers on web** — Currently no way for a web-only seller to get paid.
14. **Wire dashboard order-detail route** — Or redirect dashboard order links to the consumer app's order pages. Sellers need to ship and respond to disputes.
15. **Build backend bulk endpoints** — Or disable the dashboard bulk-action UI until they exist.

### Phase 3: Major Feature Gaps (brings web to near-parity)

16. **Build Chip AI caddy for web** — Major differentiator, currently absent. Remove the dead link in the meantime.
17. **Build help centre for web** — 51 articles + structured support form. High-impact for user self-service.
18. **Add onboarding flow for web** — First-run personalisation.
19. **Strengthen signup** — Add phone field, marketing opt-in, full password rules.
20. **Improve auth security** — Move token to httpOnly cookie or at minimum add interceptor layer for expiry handling. Add edge middleware to consumer app.
21. **Add seller balance/earnings pages to web** — Mobile has these, web doesn't.
22. **Add shop policies to user profiles** — Buyers need to see seller delivery/returns/cancellation policies.
23. **Strengthen dispute flow** — Make photo evidence required, add `willingToReturn` flag.
24. **Add SOLD overlay** — Visual indicator that a listing is no longer available.

### Phase 4: Polish & Enhancement

25. **SEO improvements** — JSON-LD structured data, unique meta for search/category pages, pro store pages in sitemap.
26. **Consolidate pricing logic** — Single source of truth like mobile's `lib/pricing.ts`.
27. **Consolidate cart implementations** — One cart module, not two competing ones.
28. **Adopt shared UI package** — Web consumer app should use `@mulligans/ui` components instead of bespoke inline-styled ones.
29. **Fix cart shared types** — Align `packages/api-client` cart types with actual backend response shape.
30. **Replace native `alert()`/`confirm()`** — Use the `Dialog` component from `@mulligans/ui` (already built, never used).
31. **Add web analytics** — Meta Pixel, GA, or equivalent. Currently no way to measure anything on web.
32. **Equipment DB for dashboard ListingForm** — Pro sellers deserve the same brand→model cascade as mobile users.
33. **Improve search filters** — Brand→model cascade, accessories/shafts category filters, shoes missing filters.
34. **Apple Pay / Google Pay on web** — Via Stripe Payment Element (web-compatible).
35. **Misc mobile parity** — Share button, postage info modal, search history, listing quantity selector, offer fee breakdown, demand warnings, offer countdown.
