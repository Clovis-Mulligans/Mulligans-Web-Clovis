# Mulligans Web Platform — Setup Guide

Follow these steps to get the monorepo running locally and deployed to AWS Amplify.

---

## 1. Create the GitHub Repository

1. Go to GitHub and create a new **private** repository called `Mulligans-Web`
   under the HS-Mulligans organisation.
2. Do NOT initialise with a README or .gitignore (we already have both).
3. Clone locally:
   ```bash
   git clone git@github.com:HS-Mulligans/Mulligans-Web.git
   cd Mulligans-Web
   ```
4. Copy all scaffold files into this directory (the contents of this folder).
5. Initial commit and push:
   ```bash
   git add .
   git commit -m "Brief 2: Turborepo monorepo scaffold"
   git push -u origin main
   ```

---

## 2. Install Dependencies Locally

```bash
npm install --legacy-peer-deps
```

This installs all workspace dependencies including turbo, both apps, and
both packages.

---

## 3. Run Locally

```bash
# Run both apps in development mode
npm run dev

# Or run individually
npx turbo run dev --filter=dashboard   # http://localhost:3001
npx turbo run dev --filter=web         # http://localhost:3000
```

**Note:** You need `.env.local` files in each app before auth will work.
Copy the `.env.example` files and fill in the Cognito values:

```bash
cp apps/dashboard/.env.example apps/dashboard/.env.local
cp apps/web/.env.example apps/web/.env.local
```

Then edit each `.env.local` with the real Cognito values:
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID` — from AWS Cognito console
- `NEXT_PUBLIC_COGNITO_CLIENT_ID` — the app client ID (same one the mobile
  app uses, or create a new one with PKCE support for web)
- `NEXT_PUBLIC_COGNITO_DOMAIN` — your Cognito hosted UI domain

---

## 4. Cognito App Client Setup

The web apps need a Cognito app client that supports PKCE (code grant).
You have two options:

**Option A: Reuse the mobile app client**
- Go to AWS Cognito > User Pool > App Integration > App Clients
- Edit the existing mobile app client
- Add callback URLs:
  - `http://localhost:3000/` (web dev)
  - `http://localhost:3001/` (dashboard dev)
  - `https://mulligans.uk.com/` (web production)
  - `https://dashboard.mulligans.uk.com/` (dashboard production)
- Add sign-out URLs matching the above with `/login` appended
- Ensure "Authorization code grant" is enabled

**Option B: Create a separate web app client** (recommended)
- Create a new app client in the same user pool
- Enable "Authorization code grant" and PKCE
- Add the same callback/sign-out URLs as above
- Use this client ID in the web `.env` files

---

## 5. Create AWS Amplify Projects

### Dashboard App

1. Go to AWS Amplify Console (eu-west-2 / London region)
2. Click "New app" > "Host web app"
3. Connect to GitHub > Select `HS-Mulligans/Mulligans-Web` repo
4. Branch: `main`
5. App name: `mulligans-dashboard`
6. Build settings: Choose "Custom" and point to `apps/dashboard/amplify.yml`
   **OR** set the monorepo root directory to the repo root and Amplify will
   use the amplify.yml from the app directory
7. Framework: Next.js (SSR)
8. Click "Save and deploy"

### Web App

Repeat the same steps with:
- App name: `mulligans-web`
- Build settings: `apps/web/amplify.yml`

---

## 6. Set Environment Variables in Amplify

For **each** Amplify app, go to App settings > Environment variables and add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.mulligans.uk.com` |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | Your Cognito user pool ID |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | Your Cognito app client ID |
| `NEXT_PUBLIC_COGNITO_DOMAIN` | Your Cognito domain (e.g. `mulligans.auth.eu-west-2.amazoncognito.com`) |

**Important:** Both apps can use the same Cognito user pool (this is the
same pool the mobile app uses). They can share the same app client or use
separate ones — your choice.

---

## 7. Configure Custom Domains

### Dashboard: dashboard.mulligans.uk.com

1. In Amplify > Dashboard app > Domain management
2. Add domain: `mulligans.uk.com`
3. Add subdomain: `dashboard`
4. Amplify will provide a CNAME record
5. Add this CNAME to your DNS (Route 53 or wherever mulligans.uk.com is
   managed)
6. SSL certificate is provisioned automatically by Amplify

### Web: mulligans.uk.com

1. In Amplify > Web app > Domain management
2. Add domain: `mulligans.uk.com`
3. Set as root domain (or add `www` subdomain)
4. Add the DNS records Amplify provides
5. SSL certificate auto-provisioned

**DNS records needed (approximate):**
```
dashboard.mulligans.uk.com  CNAME  <amplify-provides-this>
mulligans.uk.com            CNAME  <amplify-provides-this>
```

---

## 8. Verify Deployment

After deployment completes:

- [ ] Dashboard loads at dashboard.mulligans.uk.com
- [ ] Web app loads at mulligans.uk.com
- [ ] Login page renders with Mulligans branding
- [ ] Apply page loads with the full application form
- [ ] Cognito sign-in works (test with an existing mobile account)
- [ ] Both apps show Montserrat font
- [ ] Brand colours match: #1DC690 green, #278AB0 blue, #06070A dark

---

## Project Structure

```
Mulligans-Web/
├── apps/
│   ├── dashboard/        ← Pro seller dashboard (port 3001)
│   │   ├── src/app/
│   │   │   ├── layout.tsx          ← Root layout (dark theme)
│   │   │   ├── login/page.tsx      ← Login page
│   │   │   ├── apply/page.tsx      ← Pro store application
│   │   │   └── (dashboard)/        ← Protected dashboard routes
│   │   │       ├── layout.tsx      ← Sidebar + header shell
│   │   │       ├── page.tsx        ← Overview
│   │   │       ├── inventory/      ← Brief 3
│   │   │       ├── orders/         ← Brief 4
│   │   │       ├── offers/         ← Brief 4
│   │   │       ├── messages/       ← Brief 4
│   │   │       ├── payouts/        ← Brief 5
│   │   │       ├── analytics/      ← Brief 5
│   │   │       └── settings/       ← Brief 5
│   │   └── amplify.yml
│   └── web/              ← Consumer marketplace (port 3000)
│       ├── src/app/
│       │   ├── layout.tsx          ← Root layout (light theme)
│       │   ├── page.tsx            ← Homepage with hero
│       │   ├── login/page.tsx      ← Login page
│       │   ├── listings/           ← Brief 7
│       │   └── stores/[slug]/      ← Brief 5
│       └── amplify.yml
├── packages/
│   ├── ui/               ← Shared Mulligans component library
│   │   └── src/
│   │       ├── theme.ts            ← Brand colours
│   │       ├── globals.css         ← Montserrat + CSS variables
│   │       ├── components/         ← Button, Card, Input, etc.
│   │       └── index.ts            ← All exports
│   └── api-client/       ← Typed API wrappers
│       └── src/
│           ├── client.ts           ← Base fetch client
│           ├── types/              ← User, Listing, ProStore types
│           ├── endpoints/          ← proStore, admin endpoints
│           └── index.ts            ← All exports
├── turbo.json
├── package.json
└── .gitignore
```

---

## What HS Needs to Do Before Brief 3

1. Create the GitHub repo and push this scaffold
2. Set up Cognito app client for web (PKCE)
3. Create both Amplify projects
4. Configure custom domains + DNS
5. Set environment variables in Amplify
6. Verify both apps deploy and render correctly
7. Confirm the pro store application API endpoints from Brief 1 are
   deployed to production (the apply page calls them)
