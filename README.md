# FleetDesk

**A booking and operations platform for small rental businesses.**
Customers find a car, see live availability, and book and pay online. The owner runs bookings, fleet and revenue from one dashboard.

Built with Next.js, React and TypeScript. Everything is free. It runs instantly with demo data in memory, and you can connect a free **Supabase** (PostgreSQL) database so data is saved for real.

> Portfolio project. Payments run in test mode and no real money moves.

## Run it (2 minutes)

You need [Node.js](https://nodejs.org) 20.9 or newer (22 recommended).

```bash
npm install
npm run dev
```

Open http://localhost:3000.

| What | Where |
|---|---|
| Customer site | http://localhost:3000 |
| Owner dashboard | http://localhost:3000/login |
| Owner login | `owner@fleetdesk.dev` / `demo1234` (the login page has a "Fill in demo login" button) |
| Test card that works | `4242 4242 4242 4242` (any expiry and CVC) |
| Test card that is declined | `4000 0000 0000 0002` |

Demo data (12 vehicles and about 165 bookings) is generated relative to today's date, so the charts are never empty. Without a database it is created in memory on every start. With a database it is loaded once by `npm run db:setup` (see below).

## Try these flows

**As a customer**
1. Home page, then **Browse the fleet**. Filter by type, price and dates. Only cars free on those dates are shown.
2. Open a car. The calendar shows booked days. Pick dates and the price updates live.
3. **Continue to booking**: dates, your details, review and pay (3 steps, with validation).
4. Pay with the test card and you land on the confirmation page with a reference such as `FD-1167`.
5. Try to book the same dates again: it is blocked. A booking that starts on another booking's return day is allowed.

**As the owner**
1. Sign in. The **Overview** shows revenue, bookings, occupancy, three charts and top vehicles. Change the range (7, 30, 90 days).
2. **Bookings**: search, filter by status, sort by column, page through results. Use the action buttons (picked up, returned, cancel). The table updates instantly.
3. **Fleet**: add, edit and delete vehicles, upload a photo, set a car to "In maintenance" to hide it from the website.
4. **Settings**: change the business name and phone and watch the public site header and footer update. Dark mode is here and in the sidebar.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start in development mode |
| `npm run build` then `npm start` | Production build and server |
| `npm test` | Unit, component and data-layer tests (Vitest and React Testing Library). The data tests run against the in-memory store **and** a real PostgreSQL engine |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript in strict mode |
| `npm run check` | Lint, typecheck, tests and build in one go (same as CI) |
| `npm run test:e2e` | Browser tests with Playwright: book and pay as a customer, sign in as the owner, add a vehicle (run `npm run build` first; first time only: `npx playwright install chromium`) |
| `npm run test:a11y` | Automated accessibility scan (axe, WCAG 2.1 A and AA) of every screen in light and dark mode |
| `npm run smoke` | End-to-end test of a running server over HTTP (44 checks). Works with or without a database |
| `npm run db:setup` | Create the tables in your database and load demo data (only if empty). Needs `DATABASE_URL` |
| `npm run db:reset` | Wipe the database and load fresh demo data (dates are relative to today) |
| `npm run db:local` | Start a free local PostgreSQL (no account needed) to try database mode |

## How it is organised

```
src/
  app/                    Pages and API routes (Next.js App Router)
    (public)/             Customer site: home, vehicles, booking, checkout, confirmation
    dashboard/            Owner area: overview, bookings, fleet, settings
    login/
    api/                  REST endpoints + one GraphQL endpoint
  components/
    ui/                   Reusable building blocks: Button, Field, DataTable, Modal, Toast, StatCard...
    booking/              The 3-step booking flow
    vehicles/             Vehicle cards, filters, calendar
    dashboard/            Dashboard screens and charts
    layout/ providers/    Header, footer, app-wide providers
  lib/                    Code shared by browser and server: types helpers, dates, pricing, validation (Zod)
  server/                 Server-only code
    services/             Business rules: bookings, vehicles, analytics, payments, settings
    db/                   Data access: repository interface, in-memory and PostgreSQL versions, demo data
    graphql/              GraphQL schema
    auth.ts               Login with a signed cookie
  store/                  Redux (booking draft)
  e2e/                    Playwright browser tests (booking flow, owner flow, accessibility)
supabase/
  schema.sql              The database tables, rules and security settings
  hooks/                  Small reusable hooks
  types/                  TypeScript types for the whole app
```

**The one rule that keeps it clean:** pages and components never contain business rules. They call a *service* (on the server) or an *API function* (in the browser). Rules such as "no double booking" or "a completed booking can't be cancelled" live in one place: `src/server/services` and `src/lib`.

### How a booking works

```
Customer picks dates ──▶ POST /api/bookings ──▶ bookingService.createBooking()
                                                  checks: car exists, available, dates free
                                                  creates booking: "pending", "unpaid" (car is held 30 min)
                 ──▶ POST /api/payments/checkout ──▶ test checkout page (or Stripe Checkout)
                 ──▶ card accepted ──▶ markBookingPaid() ──▶ "confirmed" + "paid"
Owner: confirmed ──▶ picked up ("active") ──▶ returned ("completed")      any step before pickup can be cancelled
```

Status rules are defined once in `src/lib/bookingStatus.ts`. The server enforces them and the dashboard uses the same table to decide which buttons to show.

### Decisions worth knowing (and why)

| Decision | Reason |
|---|---|
| **Server components for public pages** | The car list and detail pages arrive as finished HTML: fast first load and readable by search engines. Filters live in the URL, so results are shareable. |
| **Redux Toolkit for the booking draft** | It is *client state*: what step the customer is on and what they typed. It survives going back and forth between steps. |
| **TanStack Query for dashboard data** | It is *server state*: bookings, vehicles, analytics. It caches, shows loading and error states, and powers the optimistic updates. |
| **Optimistic update on booking status** | The row changes the instant you click. If the server refuses, it rolls back and shows an error (`useBookingStatusMutation.ts`). |
| **Zod schemas shared by form and API** | The form shows messages next to fields and the API runs the same rules, so the server never trusts the browser (`lib/schemas.ts`). |
| **REST for everything, GraphQL for analytics** | The overview needs many numbers at once, so one GraphQL query asks for exactly those fields (`/api/graphql`). |
| **Tailwind with design tokens** | Colours are variables in `globals.css`. Dark mode and re-branding change one file. |
| **Native `<dialog>` for modals** | The browser handles focus trapping and the Escape key. Less code, better accessibility. |
| **Dates as `YYYY-MM-DD` strings** | A rental only cares about days. No time zone bugs, and they sort correctly as text. |
| **Back-to-back bookings allowed** | The return day is free for the next customer, like real rental businesses. Covered by tests. |

### Accessibility and performance

- Every input has a label; errors are announced (`aria-live`, `role="alert"`); keyboard focus is always visible; skip-to-content link; sortable table headers expose `aria-sort`; calendar days have text labels; animations respect "reduce motion".
- No web fonts and no images to download (cars are SVG illustrations unless the owner uploads a photo). Uploaded photos are resized in the browser before saving.
- Loading skeletons, empty states, error boundaries and toasts everywhere data loads.
- **Measured** with Lighthouse 12 on the production build (mobile settings, run on a development machine, so expect about ±5 points of variation):

  | Page | Performance | Accessibility | Best practices | SEO |
  |---|---|---|---|---|
  | Home | 92 to 95 | 100 | 100 | 100 |
  | Fleet list | 86 to 93 | 100 | 100 | 100 |
  | Vehicle page | 93 to 97 | 100 | 100 | 100 |
  | Login | 97 to 98 | 100 | 100 | 100 |

  Run it again on your own deployed link and put those numbers here; they are the ones a recruiter can reproduce.
- Accessibility is checked automatically (`npm run test:a11y`) on every screen in both themes. Automated checks catch roughly a third of problems, so also try the keyboard (Tab, Enter, Escape) yourself.

## Use a real database (Supabase, free)

Without any setup the app keeps demo data in memory (it resets on restart). Set one environment variable and the same app stores everything in PostgreSQL instead. Nothing else changes: pages, components and API routes are identical in both modes.

**Connect Supabase (about 3 minutes)**
1. Create a free project at [supabase.com](https://supabase.com) and choose a database password.
2. In the project: **Project Settings, Database, Connection string, "Transaction pooler"** (port 6543). Copy it and replace `[YOUR-PASSWORD]`.
3. Copy `.env.example` to `.env.local` and set `DATABASE_URL=` to that string.
4. Run `npm run dev`. On the first request the app **creates the tables and loads the demo data by itself** (once, safely, even if several servers start at the same moment). Bookings, vehicles and settings are now saved.

`npm run db:setup` does the same thing on demand, and you can paste `supabase/schema.sql` into the Supabase **SQL Editor** if you prefer clicking to commands. Neither is required.

**Try it with no account first.** `npm run db:local` starts a free local PostgreSQL. Put `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/postgres` in `.env.local`, then run `npm run dev`.

**What the database adds**
- Data survives restarts and works on serverless hosts such as Vercel.
- **Double booking is impossible at the database level.** The `bookings` table has an exclusion constraint: the same vehicle cannot have two non-cancelled bookings with overlapping days. Even two customers paying in the same millisecond cannot both win. The service checks first for a friendly message; the database is the final guard.
- Booking numbers (FD-1001, FD-1002, ...) come from a database sequence, so they never repeat.
- Search, filter, sort and paging run in SQL, so the bookings table stays fast with thousands of rows.
- Row Level Security is switched on for every table, so Supabase's public API cannot read your data. The app uses its own server connection.

**How it is built (for interviews).** Services (`src/server/services`) hold the business rules and only talk to a `Repository` interface (`src/server/db/repository.ts`). It has two implementations: `memoryRepository.ts` and `postgresRepository.ts` (plain SQL with the `postgres` driver, no ORM). The same test suite runs against both, and the PostgreSQL side runs on a real PostgreSQL engine (PGlite), so a rule that works in one store and not the other fails a test.

**What is and isn't Supabase here.** The project uses Supabase as its PostgreSQL database. The owner login is a signed cookie (`src/server/auth.ts`) and photos are stored as resized images in the database, not Supabase Auth or Storage. Both are on the roadmap (`docs/ROADMAP.md`).

**Good to know**
- Demo dates are relative to the day the data was loaded. Use **Settings, Reset demo data** in the dashboard (or `npm run db:reset`) shortly before you share the link, and again every few weeks, so the charts and calendars look full. It also fixes the site in one click if a visitor deleted things.
- `/api/health` tells you whether the app can read its data (`{"ok":true,"database":"postgres","vehicles":12}`). Open it right after you deploy.
- Free Supabase projects can pause when unused for a while. If the site shows errors after a quiet period, open the Supabase dashboard and restore the project.
- The database layer is tested on PostgreSQL, including first-run setup on an empty database and data surviving a restart. Supabase itself is the same PostgreSQL, but click through the booking flow once on your own deployed link before you share it (`docs/DEPLOY.md` has a 5-minute checklist).

## Real Stripe test payments (optional)

By default checkout uses a built-in test page, so everything works offline. To use real Stripe Checkout in test mode:

1. Create a free Stripe account and copy your **test** secret key (`sk_test_...`).
2. Copy `.env.example` to `.env.local` and set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_SITE_URL`.
3. Restart. Checkout now redirects to Stripe, and the confirmation page verifies the payment with Stripe before confirming the booking.

This path calls Stripe's API directly (`src/server/services/paymentService.ts`). It has not been exercised against a live Stripe account, so test it with your own key before relying on it.

## Deploy for free

Full step-by-step guide with screenshots-in-words and a troubleshooting table: **[docs/DEPLOY.md](docs/DEPLOY.md)**.

In short:
1. Push this folder to a GitHub repository (`.env.local`, `node_modules` and `.pglite` are ignored).
2. Create a free Supabase project and copy its **Transaction pooler** connection string.
3. Import the repository on [vercel.com](https://vercel.com) (free Hobby plan) and set `DATABASE_URL`, `AUTH_SECRET` and `NEXT_PUBLIC_SITE_URL`.
4. Open `your-site/api/health`. It should say `"ok":true`. Make a test booking and see it appear in Supabase's Table Editor.

**Without a database:** a host that runs one long-lived Node server also works (for example Render). Do not use serverless hosting in that mode: each request can reach a different instance with its own memory, so a booking can be missing on the next page.

CI (`.github/workflows/ci.yml`) runs lint, type check, unit and data tests, the production build and the Playwright browser tests on every push. Add the badge to the top of this README after your first green run.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Redux Toolkit · TanStack Query · React Hook Form + Zod · Recharts · Framer Motion · GraphQL (graphql-js) · PostgreSQL / Supabase (postgres.js) · Vitest + React Testing Library · Playwright + axe · GitHub Actions

## Built with AI assistance

This project was built with Claude as a pair programmer. Every module was reviewed, run, tested (unit tests, a browser walkthrough and an HTTP smoke test) and adjusted by hand.
