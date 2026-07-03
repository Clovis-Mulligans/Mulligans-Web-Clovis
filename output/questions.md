# PRO-IMPORT-I-05: Security Checklist & Questions for Harry

**Date:** 2026-07-03

---

## Security Checklist

### File Upload (importListingsCsv)
- [x] **File type validation:** Client-side `.csv` extension check before upload. Backend should also validate MIME type / content.
- [x] **File size limit:** Client enforces ≤5MB. Backend enforces ≤5MB per brief. Double enforcement is correct.
- [x] **Row count limit:** Backend enforces ≤200 rows per brief. No client-side enforcement needed (server is authoritative).
- [x] **No client-side CSV parsing:** All parsing/validation delegated to backend. No risk of client-side injection via CSV content.
- [x] **Auth token sent:** `Authorization: Bearer <token>` header included on upload request.
- [x] **FormData field name:** Uses `file` — must match backend multer config. Confirmed per I-06 spec.
- [x] **No SSRF risk:** File is uploaded directly to the API, not fetched from a URL.
- [x] **Error handling:** Server errors are caught and displayed. Error messages from the server are shown to the user — verify backend doesn't leak internal details in error messages.

### Publish Endpoints
- [x] **Authorization:** Both `publishListing` and `publishListingsBulk` use `apiClient.put` which attaches the Bearer token automatically via `getAuthToken()`.
- [x] **Bulk limit:** Backend enforces ≤500 listing_ids per bulk request. Frontend does not impose a limit — relies on server-side enforcement.
- [x] **409 handling:** Server rejection reasons (missing images, payout not ready) are surfaced via `alert()`. No sensitive data in these messages.
- [x] **No publish from results screen:** Product decision locked — publish is only from inventory page, never from import results.

### Auth Fix
- [x] **Zombie state prevented:** If Cognito session exists but `localStorage.mulligans_auth_token` is absent, user is treated as unauthenticated.
- [x] **No race condition:** The check happens synchronously after `getCurrentUser()` resolves, before setting `isAuthenticated: true`.
- [x] **Module-level `setTokenProvider` preserved:** Still registers the localStorage reader at import time. Component-body duplicate removed.

### General
- [x] **No new environment variables introduced.**
- [x] **No direct database access.**
- [x] **No new external service calls.**
- [x] **XSS risk:** All server-provided strings (titles, reasons, warnings) rendered as React text nodes — no `dangerouslySetInnerHTML`. Safe.

---

## Questions for Harry

### Q1: Category filter mismatch on inventory page
**Context:** The inventory page category dropdown (line 834) uses `'Shafts Grips & Heads'` (no comma). The backend Zod enum uses `'Shafts, Grips & Heads'` (WITH comma). This means filtering by this category on the inventory page sends the wrong string to the backend and returns no results.

**This was NOT fixed in I-05** because the inventory page layout is hands-off per CLAUDE.md. Should I fix just this one value, or do you want to handle it?

### Q2: `uploadDisputeImage` in api-client is broken
**Context:** During investigation, I found that `disputes.ts` line 103 passes `FormData` through `apiClient.post()`. The apiClient always calls `JSON.stringify(body)` and sets `Content-Type: application/json` — this will serialize `FormData` to `"{}"` and send it as JSON, not multipart. The other upload functions (images, avatar) correctly bypass apiClient and use raw `fetch`.

**Not fixed in I-05** (out of scope). Should I fix this in a follow-up?

### Q3: Bulk endpoints may not exist in backend
**Context:** The existing `bulkUpdateListings` and `bulkDeleteListings` functions in the api-client have a TODO comment: "These endpoints do not exist in the backend yet." The Pause, Resume, Edit Price, Discount, and Delete bulk actions on the inventory page all call these functions. If the backend endpoints don't exist, all bulk actions will 404.

**The new "Publish Selected" bulk action uses a DIFFERENT endpoint** (`PUT /api/listings/publish-bulk`) which does exist per I-02b. This is separate from the TODO bulk endpoints.

### Q4: Upload functions bypass tokenProvider
**All three raw-fetch upload functions** (`uploadListingImage`, `uploadAvatar` in settings.ts, `uploadAvatar` in users.ts) read the token directly from `localStorage.getItem('mulligans_auth_token')`, bypassing the `tokenProvider` mechanism. The new `importListingsCsv` follows this same pattern for consistency. If `setTokenProvider` is ever changed to return tokens from a different source (e.g., cookies, session storage), these upload functions would break silently.

**Not fixed in I-05** — flagging for awareness. A proper fix would be to make the upload functions call `getAuthToken()` (exported from client.ts) instead of reading localStorage directly.
