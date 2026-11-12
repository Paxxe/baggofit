# Baggofit

Baggofit estimates the usable backpack capacity for a trip from duration, packing list, and packing style. The MVP is account-free and available in English and Italian.

## Run locally

Requires Node.js 20.19 or later and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The root redirects to `/en`; Italian is at `/it`.

## Checks

```bash
npm test
npm run lint
npm run build
```

## Architecture

- `src/app/[locale]`: localized App Router pages, metadata, airline guides, and packing guides.
- `src/components/configurator.tsx`: five-step client workflow; state is stored in browser local storage and can be shared in a URL.
- `src/lib/calculators`: pure deterministic capacity and airline-fit calculations with unit tests.
- `src/lib/data`: typed airline and packing-item data, kept separate from UI.
- `src/lib/products/provider.ts`: future product-provider contract only; no catalog integration is active.
- `prisma/schema.prisma`: PostgreSQL models for airlines, baggage rules, packing items, and anonymous configurations.

The capacity estimate sums approximate packed item volumes, adds a transparent 0.5 L per trip day buffer for unlisted essentials, applies a style margin (15% minimalist, 25% balanced, 40% extra space), and rounds up to a five-liter recommendation range. It is not a measurement of a specific bag. Internal usable capacity and external bounding-box volume are different quantities.

Airline limits are intentionally unverified and are not represented as current policy. Airline pages link to official sites and are marked `noindex` until policy data has been checked and sourced. The compatibility engine requires a verified, dated rule, all three external dimensions, and weight when the rule has a weight limit. No current airline limit is invented or preloaded.

## Database

Copy `.env.example` to `.env` and set `DATABASE_URL` to a PostgreSQL database before using Prisma. `NEXT_PUBLIC_SITE_URL` should be set to the canonical production origin for metadata and sitemap URLs.

```bash
npx prisma validate
npm run db:generate
npx prisma migrate dev --name init
```

The current MVP runs from typed local data and does not require a database connection. No user account or personal profile is stored. Shared URLs include the travel configuration; treat them as public to anyone who receives the link.

## Before public launch

- Verify and source each airline rule against its official baggage page, including fare conditions and the date checked.
- Keep airline detail pages `noindex` until useful verified data is available.
- Review the draft privacy page and add the operator's contact details.
- Set `NEXT_PUBLIC_SITE_URL` to the canonical domain.
