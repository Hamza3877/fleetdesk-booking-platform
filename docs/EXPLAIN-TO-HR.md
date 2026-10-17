# How to explain FleetDesk (for interviews)

## The 30-second pitch

> "Small rental businesses often manage bookings in WhatsApp and spreadsheets. FleetDesk gives their customers a fast website to find a car, see real availability and pay, and gives the owner one dashboard for bookings, fleet and revenue. I built it with Next.js and TypeScript. The public pages are server-rendered, forms are validated with the same rules on the client and the server, the dashboard uses charts and a sortable, searchable table, and every push runs lint, type checks and tests."

## The 2-minute walkthrough (what to click)

1. **Home → Our fleet.** "Results come from the server as finished HTML. Filters are in the URL so you can share a search."
2. **Open a car, pick dates.** "The calendar greys out booked days and the price updates as you type."
3. **Book it.** "Three steps with validation. The draft is kept in Redux so going back never loses what you typed."
4. **Pay with the test card, show the confirmation.** "Payment is in test mode. The booking is held for 30 minutes while paying."
5. **Try booking the same dates again.** "The server blocks double bookings. A booking can start on the day another one returns, like real rental companies."
6. **Sign in as the owner.** "KPIs and charts come from one GraphQL query."
7. **Bookings.** "Search, sort and paging happen on the server. When I click 'Mark as picked up' the row updates instantly (optimistic update) and rolls back if the server refuses."
8. **Fleet.** "Add or edit a car with validation and a photo upload that resizes in the browser."
9. **Dark mode and phone width.**

## Questions you will probably get

**Why Redux *and* TanStack Query?**
They solve different problems. Redux holds client state (the booking form draft). TanStack Query holds server state (bookings, vehicles, analytics) and gives caching, loading and error states.

**Where is the data stored?**
In PostgreSQL on Supabase when `DATABASE_URL` is set, and in memory (demo data) when it isn't, so anyone can run the project in two minutes. Services only talk to a `Repository` interface with two implementations, and the same tests run against both. The SQL is plain, with no ORM, so I can explain every query.

**How do you stop double bookings?**
Three layers. The browser greys out booked days for instant feedback. The server checks the dates when the booking is created and returns a friendly 409. And the database has an exclusion constraint on the bookings table, so two overlapping bookings for the same car cannot exist even if two customers pay at the same millisecond. There is a test where two simultaneous bookings race and exactly one wins.

**Where is validation?**
`src/lib/schemas.ts`. One Zod schema per form, reused by the API route, so the rules cannot drift apart.

**How is it secured?**
Owner pages check the signed session cookie in one layout. Owner API routes call `requireOwner()`. The cookie is `httpOnly` and signed with HMAC. In production I would use a managed auth provider.

**How did you test it?**
Four levels. Unit and component tests for rules and forms. Data-layer tests that run the same suite against the in-memory store and a real PostgreSQL engine. Playwright browser tests that book and pay as a customer and manage the fleet as the owner. And an axe accessibility scan of every screen in light and dark mode. A smoke script also exercises the running app over HTTP, in either mode. Lighthouse scores are 100 for accessibility, best practices and SEO, and about 86 to 97 for performance.

**How did you use AI?**
As a pair programmer. I reviewed and ran everything, and I can explain each file. (Be ready to open `bookingService.ts` and `useBookingStatusMutation.ts` and walk through them.)

**What would you do next?**
Supabase Auth in place of the signed cookie, Supabase Storage for vehicle photos, Stripe webhooks, email confirmations and rate limiting. They are listed in `docs/ROADMAP.md`.

**What happens when you deploy it?**
Vercel builds the app and the first request creates the tables in Supabase and loads demo data, guarded by a database lock so it happens once even if several servers wake at the same time. `/api/health` confirms the database is reachable. A "Reset demo data" button restores the sample data after visitors experiment.

## Files worth knowing by heart

| File | Why |
|---|---|
| `src/server/services/bookingService.ts` | The core business rules |
| `src/lib/bookingStatus.ts` | Booking life cycle in one table |
| `src/lib/schemas.ts` | All validation |
| `src/hooks/useBookingStatusMutation.ts` | The optimistic update |
| `src/components/booking/BookingWizard.tsx` | How the 3 steps are coordinated |
| `src/store/bookingDraftSlice.ts` | Redux usage |
| `src/components/ui/DataTable.tsx` | A generic, reusable component |
