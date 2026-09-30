# Deployment setup

This repo is set up for a split deployment:

- Frontend: Cloudflare Worker
- API: Vercel

## 1) Deploy API to Vercel

1. Push the repo to GitHub.
2. Import the project into Vercel.
3. Set the Vercel project root directory to the repository root. `vercel.json` limits the build command to the API package; the function in `api/` routes requests to the Express app in `artifacts/api-server`.
4. Deploy. The API health route is:
   - `/api/healthz`

Example response:

```json
{ "status": "ok" }
```

## 2) Deploy frontend to Cloudflare Worker

1. Add the Vercel deployment origin as a Cloudflare Worker secret:

```bash
pnpm --filter @workspace/api-server exec wrangler secret put API_BASE_URL --config ../../wrangler.toml
```

Enter the Vercel origin, for example `https://your-project.vercel.app` (without an `/api` suffix).

2. Deploy from the repository root:

```bash
pnpm --filter @workspace/api-server exec wrangler deploy --config ../../wrangler.toml
```

Wrangler builds `artifacts/soundwave` and publishes its static output as Worker assets. The Worker serves those assets for frontend routes and proxies `/api/*` to Vercel.

The frontend calls the same-origin `/api` path, so browser requests stay on Cloudflare and do not need a separate API URL or cross-origin CORS setup.