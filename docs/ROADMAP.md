# Roadmap

What is done, and what comes next. Each item is small enough to be one pull request.

## Done
- [x] Customer site: fleet list with filters, availability calendar, 3-step booking, test checkout, confirmation
- [x] Owner dashboard: KPIs and charts (GraphQL), bookings table, fleet management, settings, dark mode
- [x] PostgreSQL / Supabase database with a database-level double-booking guard, automatic first-run setup, health check and a "Reset demo data" button
- [x] Unit, data-layer, browser (Playwright) and accessibility (axe) tests, plus CI
- [x] Lighthouse: 100 for accessibility, best practices and SEO

## Next
- [ ] **Supabase Auth** for the owner login (replace the signed cookie in `src/server/auth.ts`) and support several staff accounts
- [ ] **Supabase Storage** for vehicle photos (today they are resized in the browser and stored in the database)
- [ ] **Stripe webhooks** so a payment confirms the booking even if the customer closes the tab, and real refunds on cancellation
- [ ] **Emails**: booking confirmation and pickup reminders
- [ ] **Rate limiting** on the booking and login endpoints
- [ ] **Pricing rules**: weekend rates, discounts for longer rentals, extras such as child seats
- [ ] **Multi-location** support: pickup and return branches
- [ ] **Staff roles**: owner, manager, read-only
