# audiolibrary-frontend

Vue 3.5 SPA built with Vue CLI 5 (webpack 5 under the hood) + Vuex 4 +
Vue Router 4. See workspace-root `CLAUDE.md` for how this pairs with
`audiolibrary-backend`.

## Setup

`.env` (copy from `.env.example`) needs `VUE_APP_ENV` and
`VUE_APP_LOCAL_BACKEND_PORT` — the latter must match the backend's
`PORT` (`3004` by convention) or API calls 404/CORS-fail silently.

## Structure

- `src/config.js` — builds `BACKEND_API_URL` from env vars; everything
  API-related flows through `src/controller/*`.
- `src/router/index.js` — single global `beforeEach` guard does the
  auth check (calls `/api/auth/sesion` via `AuthController.verifySession`)
  for any route with `meta.requiresAuth`. Any early-return branch in
  here must not fall through to the unconditional `next()` at the
  bottom — vue-router warns (and future versions error) on `next()`
  being invoked twice in one guard call. This bit the router guard once
  already (see `DIAGNOSIS.md`, 2026-08-29 fix): fixed by `return`-ing
  the redirect call.

## Known, accepted state (as of 2026-08-29 modernization pass)

- `@vue/cli-service` and friends are pinned to the `5.0.x` line
  deliberately — Vue CLI is in maintenance mode upstream (Vite is the
  ecosystem's recommended successor), so further major bumps to
  webpack/sass-loader/etc. aren't attempted here without a real Vite
  migration. `npm audit` still reports a handful of moderate/high
  findings confined to `@vue/cli-service`'s own dev-time transitive deps
  (postcss, serialize-javascript, uuid) — none of them ship in the
  production bundle. If the user ever asks for a fully clean `npm
  audit`, that's the Vite-migration conversation, not a patch bump.
- `sass`/`sass-loader` intentionally stay on Dart Sass (`sass`, pure JS)
  — no `node-sass` anywhere, so no native-binding/node-gyp version
  coupling to worry about across Node upgrades.
