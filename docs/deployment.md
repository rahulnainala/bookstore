# Deployment

How the live site is set up. Everything runs on free tiers.

- Database: Neon (Postgres)
- API: Render, using `render.yaml`
- Web: Vercel, with `/api/*` rewritten to the Render service (`vercel.json` in the repo root)

## Database

Create a Neon project and copy the connection string (it ends in `?sslmode=require`).

To create the tables and load the demo data, use the `Reset demo data` GitHub Action rather than running anything locally:

1. In the repo's Settings -> Secrets and variables -> Actions, add a secret `DEMO_DATABASE_URL` with the Neon string, and a variable `DEMO_RESET_ENABLED` set to `true`.
2. Go to Actions -> Reset demo data -> Run workflow.

The same workflow then runs every night to reset the demo. (Locally, `DATABASE_URL=... npm run db:reset` does the same thing.)

## API

In Render, create a new Blueprint from this repo. It picks up `render.yaml`. Set `DATABASE_URL` when it asks; `JWT_SECRET` is generated. Migrations run on every start, so new ones get applied on deploy.

Check `https://<service>.onrender.com/api/health` returns `{"status":"ok"}`.

If the service isn't called `bookstore-api`, update the URL in `vercel.json`.

## Web

Import the repo in Vercel and keep the default root directory. `vercel.json` in the repo root sets the install and build commands and the output folder.

For the custom domain, add `bookstore.rahulnainala.com` in the Vercel project and create a `CNAME bookstore -> cname.vercel-dns.com` record.

## Nightly reset

Already set up by the database step. It runs at 03:17 UTC; you can also run it by hand from the Actions tab.

## Environment variables (API)

| Name               | Notes                                                              |
| ------------------ | ------------------------------------------------------------------ |
| `DATABASE_URL`     | Neon connection string                                             |
| `JWT_SECRET`       | Signs the session cookie                                           |
| `NODE_ENV`         | `production` turns on secure cookies                               |
| `TRUST_PROXY_HOPS` | `2` in production (Vercel + Render) so rate limiting sees real IPs |
| `CORS_ORIGIN`      | Only needed if the web app calls the API from another origin       |
