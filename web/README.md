This is a [Next.js](https://nextjs.org) project with a deterministic recommendation engine (no external LLM required).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

Recommendations are served by the POST endpoint `/api/recommend` using the local product catalog (Prisma + SQLite). Populate products from the Admin page, including keywords, categories, origin, ecoScore, and popularity for best results.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Migrations

Run Prisma migrations (from the `web` folder) to sync the database schema:

```bash
npm run prisma:migrate
```

Then seed or create products via the Admin interface.
