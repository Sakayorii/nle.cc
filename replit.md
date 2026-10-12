# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server on Node (port 5000)
- `pnpm --filter @workspace/api-server run dev:worker` — run the full Worker (frontend + API) locally
- `pnpm --filter @workspace/api-server run deploy:worker` — build frontend + deploy to Cloudflare Workers
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string. On Workers, prefer a Hyperdrive binding (`HYPERDRIVE`) — see `wrangler.toml`.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Hono (same app serves Node via `@hono/node-server` and Cloudflare Workers via `cloudflare/worker.ts`)
- DB: PostgreSQL + Drizzle ORM (postgres-js driver; lazy init, Hyperdrive-ready on Workers)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild for the Node API bundle; Vite for the frontend; wrangler bundles the Worker
- Deploy: one Cloudflare Worker (`wrangler.toml`) serving frontend static assets + the API at `/api/*`

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
