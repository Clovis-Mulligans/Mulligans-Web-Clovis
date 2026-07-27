# CHANGES — task/web-auth-ui-fixes

**Branch:** `task/web-auth-ui-fixes`
**Base:** `upstream/pro-seller-foundation` @ `03cc15f`

---

## Pass 1 (2026-07-26) — original brief items

### Item 1 — Email verification dead-ends signup

**Verdict: REAL (critical)**

**Evidence:**
- `apps/web/src/app/verify-email/page.tsx` (original): Says "We've sent a verification link... Click the link to activate your account" — no code input field, no submit handler.
- Backend `POST /api/auth/verify-email` (authRoutes.ts:203): Expects `{ email, code }`, validates a 6-digit code stored in DB.
- Email template `src/email-templates/verification-email.html`: Sends a 6-digit `{{code}}` with text "Enter this code in the app to verify your account." No clickable link.

**What changed:**
- Added code input field, submit handler calling the backend endpoint, success/error states, and kept the resend button.
- Updated copy from "verification link" to "verification code".

### Item 2 — Other auth-flow frontend gaps

- **Login**: FALSE — functional, correct endpoint wiring.
- **Signup**: FALSE — functional, all fields present.
- **Forgot-password**: REAL — same dead-end pattern as Item 1 (sends code, no place to enter it). Fixed with code-entry step.
- **Reset-password**: FALSE — functional once reached with correct params (gap was upstream).
- **`src/lib/auth.ts`**: FALSE — unused Amplify config, not a UI gap.

---

## Pass 2 (2026-07-27) — addendum items

### Addendum 1 — Remove reset code from URL

**DONE.**

**Problem:** `forgot-password/page.tsx:42` placed email and code into the URL query string via `router.push('/reset-password?email=...&token=...')`. These leak via the `Referer` header to third-party scripts (Meta pixel is live on this app) and appear as plaintext in CloudFront/Amplify access logs. The reset code is valid for 1 hour server-side.

**Grep confirmation:** Only `forgot-password/page.tsx` navigated to `/reset-password` with email/token params. `robots.ts:13` lists `/reset-password` as a disallow entry (no params). No other file navigates there.

**What changed:**
- `apps/web/src/app/forgot-password/page.tsx:39-44`: `handleSubmitCode` now stores both values in `sessionStorage` (`mulligans_reset_email`, `mulligans_reset_code`) and navigates to `/reset-password` with no query string.
- `apps/web/src/app/reset-password/page.tsx:11-12`: Reads `token` and `emailParam` from `sessionStorage` instead of `useSearchParams`. Removed `useSearchParams` and `Suspense` imports.
- `apps/web/src/app/reset-password/page.tsx:42-43`: Clears both `sessionStorage` keys on successful reset.
- The URL-param path is removed entirely — no fallback. Both emails send a 6-digit code only, no clickable link, so no legitimate traffic arrives with these params.

### Addendum 2 — Commit the @vitejs/plugin-react dependency

**Already committed.** `@vitejs/plugin-react` is present in the root `package.json` devDependencies (line 19: `"@vitejs/plugin-react": "^6.0.3"`) and in `package-lock.json` (resolved from npm registry). Both files exist on the base branch `upstream/pro-seller-foundation`. No action needed.

### Addendum 3 — Rename output docs and restore overwritten CHANGES.md

**DONE.**

- `CHANGES.md` → `CHANGES-web-auth-ui-fixes.md` (this file)
- `questions.md` → `questions-web-auth-ui-fixes.md`
- Original `CHANGES.md` restored from base commit (`git show upstream/pro-seller-foundation:CHANGES.md`). It documents `task/dash-listing-form-fixes` with unresolved items.

### Addendum 4 — Tests for forgot-password code step

**DONE.** `apps/web/src/__tests__/forgotPassword.test.ts` — 3 tests:

| Test | Assertion |
|------|-----------|
| Code entry field renders after successful email submit | After mocked email submit, `getByPlaceholderText('Enter reset code')` and `getByRole('button', { name: 'Continue' })` resolve |
| Code navigates with sessionStorage, not URL | `sessionStorage.setItem` called with `mulligans_reset_email` and `mulligans_reset_code`; `router.push` called with `'/reset-password'` (no query params) |
| Empty/whitespace code does not navigate | After setting value to `''` then `'   '` and clicking Continue, `router.push` is never called |

### Addendum 5 — Test hygiene in verifyEmail.test.ts

**DONE.** `apps/web/src/__tests__/verifyEmail.test.ts`:

- Added `afterEach(cleanup)` (line 30) — DOM is now torn down between tests.
- Replaced all `getAllBy*` + `.length).toBeGreaterThanOrEqual(1)` + `inputs[0]` with direct `getByPlaceholderText` / `getByRole` / `getByText`. Without cleanup the DOM accumulated across tests, which is why the lenient selectors were needed — they masked duplicate renders.
- Added 1 new test for the missing-token edge case (addendum 6 below), bringing total to 7.

### Addendum 6 — Handle missing-token case in verify-email

**DONE.** `apps/web/src/app/verify-email/page.tsx:33-35`:

Was:
```js
if (data.accessToken) {
  localStorage.setItem('mulligans_auth_token', data.accessToken);
}
setSuccess(true);
```

Now:
```js
if (!data.accessToken) {
  throw new Error('Verification succeeded but no session was returned. Please sign in manually.');
}
localStorage.setItem('mulligans_auth_token', data.accessToken);
setSuccess(true);
```

A success response without a token now shows an error and does not redirect. Test coverage: `verifyEmail.test.ts` — "shows error when verification succeeds but no token is returned".

### Addendum 7 — Remove unreachable error block in forgot-password

**DONE.** `apps/web/src/app/forgot-password/page.tsx`: Removed the `{error && ...}` block (was lines 68-72) from the sent-view. `handleSubmitCode` never calls `setError` — it either returns early (empty code) or navigates. The error block was dead code. The error block in the email-submit view (lines 109-111) is kept — it IS reachable from `handleSubmitEmail`.

### Addendum 8 — Comment the load-bearing reload

**DONE.** `apps/web/src/app/verify-email/page.tsx:35-37`:

```js
// Full page reload via window.location.href is required here — localStorage.setItem
// bypasses the React auth context (setTokenProvider in AuthProvider.tsx), so only a
// full reload re-initialises the provider. Do not replace with router.push.
```

No architectural change — comment only.

---

## Design system compliance (web-standards.md v2.0)

All three pages touched (`verify-email`, `forgot-password`, `reset-password`):

- **Page background**: `#FFFFFF` (was `#EAEAE0` — banned ivory). Fixed on all three.
- **Max font weight**: 600. No `fontWeight: 700` in any changed file. `reset-password` had three instances of 700 from the base commit — fixed to 600 while editing for sessionStorage.
- **Input border**: `#E0E0D8` (existing pattern; web standards say `#E5E7EB` for inputs, but this matches the established auth page pattern — changing all auth pages to `#E5E7EB` would be a broader consistency pass beyond this brief's scope).
- **Brand palette**: `#1DC690` primary, `#1C4670` dark blue, `var(--font-sans)` throughout.
- **No banned patterns**: No `#EAEAE0`, no emojis, no `dangerouslySetInnerHTML`, no unicode escapes.

---

## Verification

- `npx tsc --noEmit -p apps/web`: 0 errors
- `npx vitest run apps/web/src/__tests__/ --config apps/web/vitest.config.ts`: 22 passed, 0 failed (4 files)
- All changed paths under `apps/web/` plus two renamed root docs + restored `CHANGES.md`
- Part 5 never-regress: no locked files touched, no dashboard files touched

---

## Files changed (addendum commit)

| File | Action |
|------|--------|
| `apps/web/src/app/verify-email/page.tsx` | Missing-token guard, load-bearing comment, #EAEAE0 → #FFFFFF |
| `apps/web/src/app/forgot-password/page.tsx` | sessionStorage instead of URL params, removed dead error block, #EAEAE0 → #FFFFFF |
| `apps/web/src/app/reset-password/page.tsx` | Read from sessionStorage, clear on success, removed Suspense/useSearchParams, weight 700→600, #EAEAE0 → #FFFFFF |
| `apps/web/src/__tests__/verifyEmail.test.ts` | afterEach(cleanup), getBy* selectors, missing-token test |
| `apps/web/src/__tests__/forgotPassword.test.ts` | New — 3 tests for code-entry step |
| `CHANGES-web-auth-ui-fixes.md` | Renamed from CHANGES.md, updated with addendum items |
| `questions-web-auth-ui-fixes.md` | Renamed from questions.md |
| `CHANGES.md` | Restored original (task/dash-listing-form-fixes) |
