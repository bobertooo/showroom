# Railway + Google OAuth + Stripe Setup

This app already contains OAuth and billing routes. Use this checklist to finish production setup.

## 1) Environment variables (Railway)

Set these in Railway service variables:

- `NODE_ENV=production`
- `SESSION_SECRET=<long-random-string>`
- `CLIENT_URL=https://<your-domain>`
- `SERVER_URL=https://<your-domain>`
- `GOOGLE_CLIENT_ID=<from-google-cloud>`
- `GOOGLE_CLIENT_SECRET=<from-google-cloud>`
- `ADMIN_EMAIL=<your-google-email>` (optional, for admin auto-role)
- `STRIPE_SECRET_KEY=<sk_live_...>`
- `STRIPE_WEBHOOK_SECRET=<whsec_...>`
- `STRIPE_PRO_PRICE_ID=<price_...>` (recommended)

Notes:

- If you keep frontend and API on the same Railway service/domain, `CLIENT_URL` and `SERVER_URL` should be identical.
- `GOOGLE_CALLBACK_URL` is optional. If omitted, the app uses `SERVER_URL + /api/auth/google/callback`.

## 2) Google OAuth (Google Cloud Console)

Create OAuth credentials:

1. Go to Google Cloud Console -> APIs & Services -> Credentials.
2. Create OAuth Client ID (Web application).
3. Add Authorized redirect URI:
   - `https://<your-domain>/api/auth/google/callback`
4. Add local redirect URI (optional for local testing):
   - `http://localhost:3001/api/auth/google/callback`
   - If testing through Vite proxy, also add `http://localhost:3000/api/auth/google/callback`
5. Copy client ID/secret into Railway variables.

## 3) Stripe products and prices

1. In Stripe Dashboard, create a Product: `Showroom Pro`.
2. Create a recurring monthly Price (e.g. `$29/month`).
3. Copy the Price ID (`price_...`) into `STRIPE_PRO_PRICE_ID`.

If `STRIPE_PRO_PRICE_ID` is not set, server falls back to an inline `$29/month` checkout line item.

## 4) Stripe webhook endpoint

Create webhook endpoint in Stripe:

- URL: `https://<your-domain>/api/webhooks/stripe`
- Events:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

Copy signing secret to `STRIPE_WEBHOOK_SECRET`.

## 5) What is now wired in code

- Google login/signup button: `/api/auth/google`
- Google callback route: `/api/auth/google/callback`
- Checkout session route: `POST /api/checkout/create-session`
- Billing portal route: `POST /api/checkout/create-portal-session`
- Stripe webhook route: `POST /api/webhooks/stripe`
- Stripe success redirect now returns to: `/pricing?checkout=success`

## 6) Local verification

1. Copy `.env.example` -> `.env` and fill test keys.
2. Run:
   - `npm run dev:all`
3. Verify:
   - Google button signs in.
   - Pro checkout opens Stripe.
   - After payment, user is marked `plan: "pro"` in `data/users.json`.
   - Pro users can open billing portal from Pricing page.
