# Deployment

How the live site is set up. Everything runs on free tiers.

- Database: Neon (Postgres)
- API: Render, using `render.yaml`
- Web: Vercel, with `/api/*` rewritten to the Render service (`apps/web/vercel.json`)

## Database

Create a Neon project and copy the connection string (it ends in `?sslmode=require`). Load the schema and demo data once:

```bash
DATABASE_URL='postgresql://...?sslmode=require' npm run db:reset
```

## API

In Render, create a new Blueprint from this repo. It picks up `render.yaml`. Set `DATABASE_URL` when it asks; `JWT_SECRET` is generated. Migrations run on every start, so new ones get applied on deploy.

Check `https://<service>.onrender.com/api/health` returns `{"status":"ok"}`.

If the service isn't called `bookstore-api`, update the URL in `apps/web/vercel.json`.

## Web

Import the repo in Vercel and set the root directory to `apps/web`. The defaults for Vite are fine.

For the custom domain, add `bookstore.rahulnainala.com` in the Vercel project and create a `CNAME bookstore -> cname.vercel-dns.com` record.

## Nightly reset

The `Reset demo data` workflow reseeds the database every night. To turn it on, add a `DEMO_DATABASE_URL` secret and a `DEMO_RESET_ENABLED=true` variable in the repo's Actions settings. You can also run it by hand from the Actions tab.

## Environment variables (API)

| Name               | Notes                                                              |
| ------------------ | ------------------------------------------------------------------ |
| `DATABASE_URL`     | Neon connection string                                             |
| `JWT_SECRET`       | Signs the session cookie                                           |
| `NODE_ENV`         | `production` turns on secure cookies                               |
| `TRUST_PROXY_HOPS` | `2` in production (Vercel + Render) so rate limiting sees real IPs |
| `CORS_ORIGIN`      | Only needed if the web app calls the API from another origin       |
