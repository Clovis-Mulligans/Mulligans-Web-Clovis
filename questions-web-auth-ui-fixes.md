# Questions — task/web-auth-ui-fixes

## Endpoint contracts confirmed

| Frontend call | Backend endpoint | Method | Request body | Response (success) | Verified |
|---|---|---|---|---|---|
| verify-email page | `/api/auth/verify-email` | POST | `{ email, code }` | `{ message, accessToken, user: { id, email, display_name } }` | Yes — authRoutes.ts:203-291 |
| verify-email resend | `/api/auth/resend-verification` | POST | `{ email }` | `{ message }` | Yes — authRoutes.ts:303 |
| forgot-password | `/api/auth/forgot-password` | POST | `{ email }` | `{ message }` | Yes — authRoutes.ts:357 |
| reset-password | `/api/auth/reset-password` | POST | `{ email, code, password }` | `{ message }` | Yes — authRoutes.ts:413 |

## Email method confirmed

Both verification and password-reset emails send a **6-digit numeric code** only (no clickable link). Templates at:
- `src/email-templates/verification-email.html` — "Your verification code" with `{{code}}`
- `src/email-templates/password-reset.html` — "Your reset code" with `{{code}}`

The code expires in 10 minutes (set by backend: `Date.now() + 10 * 60 * 1000` for verification, `Date.now() + 60 * 60 * 1000` for password reset).

## Deferred security concerns (out of scope per brief)

1. **localStorage for JWT tokens**: Both the login page and the verify-email success handler store the JWT in `localStorage`. This is noted in the original audit. Per the brief: "Do NOT re-architect token storage or touch auth security mechanics." Left as-is.

2. **Unused Amplify/Cognito configuration in `src/lib/auth.ts`**: The web app configures AWS Amplify but the auth pages bypass it entirely, using direct fetch to the backend JWT endpoints. This creates potential confusion — two auth paths exist but only one is used. Not a security vulnerability per se, but worth cleaning up in a future task. The Amplify config references env vars (`NEXT_PUBLIC_COGNITO_USER_POOL_ID`, `NEXT_PUBLIC_COGNITO_CLIENT_ID`, `NEXT_PUBLIC_COGNITO_DOMAIN`) that may not be set in production — no impact since nothing imports from this file in the auth flow.

3. **Verification code expiry mismatch**: The verification email template says "This code expires in 10 minutes" but the backend sets expiry to `Date.now() + 10 * 60 * 1000` (10 min) for email verification. Password reset email also says "10 minutes" but backend sets `Date.now() + 60 * 60 * 1000` (1 hour). Minor inconsistency in the password-reset template text vs actual expiry. Not a UI bug — backend is more generous than advertised.

## No out-of-scope changes required

All fixes were contained to `apps/web`. No backend changes, no shared package changes, no dashboard changes needed.
