# Deployment Guide (Vercel + Neon)

This app runs a Next.js (App Router) project in `web/` with Prisma against a Neon Postgres database.

## Vercel project settings

- Framework Preset: Next.js
- Root Directory: `web`
- Install Command: `npm ci`
- Build Command: `npm run build:vercel`
- Node.js: 22.x

`package.json` (web) includes:

```
"build:vercel": "prisma generate && prisma migrate deploy && next build"
```

## Environment variables (Vercel → Project → Settings → Environment Variables)

Add these for Production and Preview (values without quotes):

- `DATABASE_URL` → Neon pooled URL (sslmode=require)
- `SHADOW_DATABASE_URL` → Neon direct (non‑pooled) URL (sslmode=require)
- Any additional secrets used by the app (e.g. `JWT_SECRET`, SMTP settings)

Tip: Copy from Neon → Connect → Prisma. Use "Pooled" for `DATABASE_URL` and "Direct" for `SHADOW_DATABASE_URL`.

## Migrations

- We baselined the database already. Future changes:
  - Local: `npx prisma migrate dev` (creates a new folder in `prisma/migrations`)
  - Production (Vercel build): `prisma migrate deploy` runs automatically via `build:vercel`

## Domains (GoDaddy → Vercel)

1. Vercel: Project → Settings → Domains → Add `eco-presents.com` and `www.eco-presents.com`.
2. GoDaddy (DNS Zone):
   - A `@` → `216.198.79.1` (remove any other A/AAAA for `@` like 76.223.105.230, 13.248.243.5)
   - CNAME `www` → `cname.vercel-dns.com`
   - Remove conflicting A/AAAA/CNAME for these hosts.
3. Back on Vercel: wait for validation and SSL (HTTPS) issuance.
4. Set the primary domain (recommended: `www.eco-presents.com`) and automatic redirect (apex ↔ www).

## Email (SMTP) setup — free option

This project uses `nodemailer` with SMTP. Configure these environment variables (Vercel and local `.env`):

- `SMTP_HOST` (e.g. smtp-relay.brevo.com)
- `SMTP_PORT` (587 recommended)
- `SMTP_USER` (per provider)
- `SMTP_PASS` (per provider)
- `SMTP_SECURE` (`true` for 465, otherwise `false`)
- `SMTP_FROM` (e.g. no-reply@eco-presents.com)
- `SMTP_FROM_NAME` (e.g. Eco Presents)

Recommended free provider: Brevo (ex Sendinblue)
- Free tier (~300 emails/day) and SMTP relay.
- Steps:
  1. Create an account at brevo.com
  2. Add/verify sender or domain (they guide you through SPF/DKIM)
  3. Get SMTP relay credentials (host, user, password)
  4. Put them in Vercel env vars above
  5. Optional: Set `FROM` to a domain-based address for better deliverability

Test your SMTP locally:

```
npm run email:test
```

If SMTP is not configured, `sendMail` safely logs emails to the server console instead of throwing.

## Smoke tests

- Public pages load without authentication.
- Admin: open `/admin` and sign in with the seeded admin (no signup required).
- API endpoints `/api/*` return 200.

## Troubleshooting

- "Missing script: build:vercel": Ensure build runs in `web/` (Root Directory) or prefix commands with `cd web && ...`.
- Migration errors in build: ensure `SHADOW_DATABASE_URL` is set to Neon Direct (non‑pooled) with `sslmode=require`.
- 500 errors at runtime: verify Prisma client path and environment variables; check Vercel logs.
- Email not sending: run `npm run email:test`, complete SMTP/DNS setup (SPF/DKIM) in your provider dashboard, and check Vercel logs.

## Notes

- Do not set `NEXT_PUBLIC_GHPAGES` on Vercel (that would force static export).
- For Preview deployments, consider using a separate Neon database and set its URL only for the "Preview" environment in Vercel.
