# Deployment

One Cloudflare Worker serves everything:

- Frontend: static assets built from `artifacts/soundwave`
  (`pnpm --filter @workspace/soundwave run build`)
- API: the Hono app in `artifacts/api-server`, mounted at `/api/*`
  by `cloudflare/worker.ts`

## Deploy

```bash
pnpm --filter @workspace/api-server run deploy:worker
```

This builds the frontend, then runs `wrangler deploy` from the repo root
using `wrangler.toml`.

## Local dev

- API only (Node, port 5000):
  `PORT=5000 pnpm --filter @workspace/api-server run dev`
- Full worker (frontend + API on the Workers runtime):
  `pnpm --filter @workspace/api-server run dev:worker`

## Database

Routes that need Postgres call `getDb(env)` from `@workspace/db`
(postgres-js driver, lazy init, no work at import time). On Workers,
bind Hyperdrive:

1. `wrangler hyperdrive create nle-db --connection-string="$DATABASE_URL"`
2. Uncomment the `[[hyperdrive]]` block in `wrangler.toml` and paste the id.

Without Hyperdrive you can `wrangler secret put DATABASE_URL`
(slower; Hyperdrive is recommended).
