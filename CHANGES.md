# CHANGES — task/web-auth-ui-fixes

**Branch:** `task/web-auth-ui-fixes`
**Base:** `upstream/pro-seller-foundation` @ `03cc15f`
**Date:** 2026-07-26

---

## Item 1 — Email verification dead-ends signup

**Verdict: REAL (critical)**

**Evidence:**
- `apps/web/src/app/verify-email/page.tsx` (original): Says "We've sent a verification link... Click the link to activate your account" — no code input field, no submit handler.
- Backend `POST /api/auth/verify-email` (authRoutes.ts:203): Expects `{ email, code }`, validates a 6-digit code stored in DB.
- Email template `src/email-templates/verification-email.html`: Sends a 6-digit `{{code}}` with text "Enter this code in the app to verify your account." No clickable link.
- Result: every web signup user sees "click the link" but receives a code. Dead-end confirmed.

**What changed:**
- Rewrote `apps/web/src/app/verify-email/page.tsx`:
  - Added code input field (6-char, numeric inputMode, centered, tracking-widest)
  - Submit handler calls `POST /api/auth/verify-email` with `{ email, code }`
  - On success: stores returned `accessToken` in localStorage, shows success state with checkmark, redirects to `/` after 1.5s
  - On error: displays backend error message (invalid/expired code)
  - Kept existing "Resend Code" button (calls `POST /api/auth/resend-verification`)
  - Updated copy from "verification link" to "verification code"
  - All styling matches existing brand palette (#1DC690 primary, #1C4670 dark blue, var(--font-sans), max weight 600)

---

## Item 2 — Other auth-flow frontend gaps

### Login page (`apps/web/src/app/login/page.tsx`)

**Verdict: FALSE**

No dead buttons or missing fields. Calls `POST /api/auth/login` (exists at authRoutes.ts). Handles `requires_verification` by redirecting to verify-email. Stores JWT in localStorage (security concern noted in questions.md — out of scope for this brief).

### Signup page (`apps/web/src/app/signup/page.tsx`)

**Verdict: FALSE**

Functional. All fields present (display name, email, password, confirm, T&C checkbox). Calls `POST /api/auth/register` (exists). Redirects to `/verify-email?email=...` on success.

### Forgot-password page (`apps/web/src/app/forgot-password/page.tsx`)

**Verdict: REAL (same pattern as Item 1)**

- Backend `POST /api/auth/forgot-password` (authRoutes.ts:357) sends a 6-digit code via email template `password-reset.html` showing `{{code}}` as "Your reset code".
- Original page: after submitting email, showed static "we've sent a password reset link" with only a "Back to Sign In" link. No way for a web user to enter the received code.
- The `/reset-password` page exists and expects URL params `?email=...&token=CODE`, but nothing navigated users there with those params.
- Result: web password reset was a dead-end (user received code by email but had no place to enter it).

**What changed:**
- Rewrote `apps/web/src/app/forgot-password/page.tsx`:
  - After email is sent, shows code-entry field with "Enter the code below to continue"
  - On code submit: navigates to `/reset-password?email=...&token=CODE`
  - Updated copy from "reset link" to "reset code"
  - Same visual style as other auth pages

### Reset-password page (`apps/web/src/app/reset-password/page.tsx`)

**Verdict: FALSE**

Functional once reached with correct URL params. Sends `POST /api/auth/reset-password` with `{ email, code, password }` (exists at authRoutes.ts:413). The dead-end was upstream in the forgot-password flow, not in this page.

### `src/lib/auth.ts` (Amplify/Cognito config)

**Verdict: FALSE (not a UI gap)**

Configures AWS Amplify for Cognito but auth pages use direct fetch to backend JWT endpoints. This is unused infrastructure — not a dead button or missing field. No UI impact.

---

## Item 4 — Tests

**What was added:**
- `apps/web/src/__tests__/verifyEmail.test.ts`: 5 tests covering the verify-email page
  1. Renders code input and verify button
  2. Displays user email from URL search params
  3. Submits code to `/api/auth/verify-email` and stores token on success
  4. Shows error message on invalid code
  5. Calls `/api/auth/resend-verification` on resend click

- Updated `apps/web/vitest.config.ts`: added `@vitejs/plugin-react` plugin to support JSX component tests (dependency already in workspace root package.json)

**Test run:** All 18 tests pass (3 files: verifyEmail + 2 existing).

---

## Files changed

| File | Action |
|------|--------|
| `apps/web/src/app/verify-email/page.tsx` | Rewritten — added code entry + verify flow |
| `apps/web/src/app/forgot-password/page.tsx` | Rewritten — added code entry step after email submit |
| `apps/web/src/__tests__/verifyEmail.test.ts` | New — 5 component tests for verify-email |
| `apps/web/vitest.config.ts` | Updated — added React plugin for JSX in tests |
| `CHANGES.md` | This file |
| `questions.md` | Endpoint contracts confirmed, deferred concerns |
