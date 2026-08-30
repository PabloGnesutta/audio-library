# AudioLibrary

npm-workspaces monorepo, merged 2026-08-29 from two previously
independent git repos (`audiolibrary-frontend`, `audiolibrary-backend`
— their full commit history was preserved via `git subtree` and lives
under `packages/`). The pre-merge two-repo workspace still exists
alongside this one as a backup; see `DIAGNOSIS.md` for the full history
of everything done in both, including this merge.

- `packages/frontend/` — Vue 3 SPA (Vite)
- `packages/backend/` — Express + Mongoose API (MongoDB Atlas,
  Cloudflare R2, SMTP via nodemailer)

## How they're coupled

`packages/frontend/vite.config.js` sets `build.outDir` to
`../backend/__client-app-build` — `npm run build` in the frontend
writes directly into the backend package (gitignored there), and the
backend serves that directory as static files + a catch-all SPA route.
In dev, the two run independently: frontend dev server on `:8080`,
backend API on the port from its `.env` (`3004` by convention), wired
together via the frontend's `VUE_APP_LOCAL_BACKEND_PORT` env var
(`src/config.js`).

## Setup

```
npm install     # once, at the repo root -- installs both packages via workspaces
```

Each package needs its own real `.env` (copy from `.env.example`) — see
`packages/frontend/CLAUDE.md` and `packages/backend/CLAUDE.md` for what
each requires to actually connect vs. just boot.

To run both locally:
```
npm run serve -w packages/backend     # nodemon, :3004
npm run serve -w packages/frontend    # vite dev server, :8080
```

To simulate production locally (single origin, no dev servers):
```
npm run build -w packages/frontend    # writes into packages/backend/__client-app-build
npm start -w packages/backend         # :3004, serves API + built SPA together
```

## Environment

Both packages are pinned to Node via `.nvmrc` (`24`) and
`engines.node` (`>=20`). See `DIAGNOSIS.md` for the full modernization
history (dependency upgrades, bug fixes, the Vite migration, etc.) from
before the merge into this monorepo.

## Before assuming something is broken

A fresh `npm install` + run on Node 24 has been verified clean (zero
warnings) on both packages as of the last pass through `DIAGNOSIS.md`.
If you hit install/build errors, suspect a stale local `node_modules`
before suspecting the committed code — `rm -rf node_modules
package-lock.json && npm install` at the repo root first.
