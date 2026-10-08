# Showcasing Folio on rahulnainala.com

Copy-paste material for the projects page.

## Project card

**Title:** Folio: Online Bookstore

**One-liner:** A full-stack bookstore with search, cart, transactional checkout, reviews and an admin dashboard.

**Short description (2 sentences):**
Folio is a production-style online bookstore built with React, Express and PostgreSQL. It covers the full flow of a real store: searchable catalog, guest-to-account carts, checkout that can't oversell, reviews, and an admin dashboard with sales analytics. One-click demo logins let you try it without signing up.

**Tags:** React · TypeScript · Node.js · Express · PostgreSQL · Drizzle ORM · TanStack Query · Tailwind CSS · Zod · Playwright · Vercel · Render

**Links**

- Live demo: https://bookstore.rahulnainala.com
- Source: https://github.com/rahulnainala/bookstore
- API docs: https://bookstore.rahulnainala.com/api/docs

**Hero image:** `docs/screenshots/home.png` (or `apps/web/public/og-image.png` at 1200×630).

## Longer case study (for a project detail page)

**Problem.** I wanted a portfolio piece that goes beyond CRUD: something with real-world edge cases like
authentication, concurrent purchases, data integrity, and a public demo that strangers can use without breaking it.

**What I built.**

- A catalog of 66 books with search, filters and sorting, all kept in the URL.
- A cart that works for guests and merges into the account on sign-in.
- Checkout as a single Postgres transaction with row locks. An automated test proves three simultaneous buyers can't all get the last copy.
- An admin dashboard with a 30-day revenue chart, top sellers, low-stock alerts, catalog management and order status changes.

**Engineering highlights.**

- One set of Zod schemas validates API requests, validates forms in the UI, and generates the OpenAPI docs.
- Cookie-based JWT sessions on a single origin (Vercel rewrite to Render), so no tokens live in `localStorage`.
- 37 API integration tests run against a real Postgres, plus UI unit tests and Playwright end-to-end journeys, all in GitHub Actions.
- The demo is built to be shared: one-click demo accounts, a protected starter catalog, rate-limited auth and a nightly database reset.

**What I'd add next.** Stripe test-mode payments, wishlists, image uploads for covers, and full-text search ranking.

## Suggested HTML snippet

```html
<article class="project">
  <img src="/images/projects/folio.png" alt="Folio bookstore home page" />
  <h3>Folio: Online Bookstore</h3>
  <p>
    Full-stack bookstore with search, cart, transactional checkout, reviews and an admin dashboard.
    Try it with a one-click demo login.
  </p>
  <ul class="tags">
    <li>React</li>
    <li>TypeScript</li>
    <li>Express</li>
    <li>PostgreSQL</li>
    <li>Playwright</li>
  </ul>
  <a href="https://bookstore.rahulnainala.com">Live demo</a>
  <a href="https://github.com/rahulnainala/bookstore">Source</a>
</article>
```
