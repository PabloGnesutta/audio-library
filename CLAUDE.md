# audiolibrary-frontend

Vue 3.5 SPA built with Vite (migrated from Vue CLI/webpack 2026-08-29)
+ Vuex 4 + Vue Router 4. See workspace-root `CLAUDE.md` for how this
pairs with `audiolibrary-backend`.

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

## Vite migration notes (2026-08-29)

Migrated off Vue CLI/webpack entirely — `npm audit` is now 0 findings
(the residual `@vue/cli-service` dev-tooling findings from the earlier
modernization pass are gone along with the package itself). Things
that needed to change and why, for whoever touches build config next:

- **`vite.config.js`** sets `envPrefix: 'VUE_APP_'` so the existing
  `.env` files (and every `import.meta.env.VUE_APP_*` read in
  `src/config.js`) didn't need renaming to Vite's default `VITE_*`
  prefix.
- **`vite.config.js`**'s `resolve.extensions` explicitly adds `.vue` to
  Vite's defaults. Vue CLI's webpack config resolved extensionless
  `.vue` imports and this codebase relies on that in ~40 places across
  16 files; Vite doesn't do this out of the box. Vite's own docs
  recommend explicit extensions instead for larger projects, but for
  this project's size the resolver cost is a non-issue — touching every
  import site wasn't worth the risk of a typo slipping through a
  40-edit sweep.
- **`index.html`** moved from `public/index.html` to the project root
  (Vite convention) and its Vue-CLI/htmlWebpackPlugin EJS templating
  (`<%= BASE_URL %>`, `<%= htmlWebpackPlugin.options.title %>`) was
  replaced with Vite's own `%BASE_URL%` substitution and a hardcoded
  title string, plus the `<script type="module" src="/src/main.js">`
  tag Vite's index.html is expected to reference directly.
- **CommonJS → ESM**: `require()`/`module.exports` in application source
  don't work under Vite (no `require` shim in the browser bundle) —
  converted `src/config.js`, `src/controller/base-controller.js`,
  `src/controller/file-controller.js`, and `src/helpers/helper-functions.js`.
- **`src/store/modules/index.js`** used `require.context(...)`, a
  webpack-only API with no Vite equivalent, to auto-import every Vuex
  module in that directory. Replaced with `import.meta.glob('./*.js',
  { eager: true })`, which does the same auto-discovery.
- **`package.json`** now has `"type": "module"` — without it, Vite 8
  warns on every build/serve that `vite.config.js`'s ESM syntax is
  being loaded as CommonJS.
- **`.browserslistrc`** and `sass-loader` were removed — the former
  isn't read by Vite without `@vitejs/plugin-legacy` (not installed),
  and `sass` (Dart Sass, already in use) is consumed directly by Vite's
  built-in CSS preprocessing, no loader package needed.
- A Sass `slash-div` deprecation warning surfaced in
  `AudioPlayer.vue`'s `<style>` (a newer Dart Sass than the codebase
  had been built with before) — fixed by wrapping the division in
  `calc()`.
- **Known pre-existing gap, not introduced by this migration**: there's
  no `.env.production`, so a production build still bakes in whatever
  `VUE_APP_ENV`/`VUE_APP_LOCAL_BACKEND_PORT` are set to in the base
  `.env` file rather than switching to the relative `/api` path
  `src/config.js` intends for production. Harmless when frontend and
  backend share a host (as in this dev setup), but would misresolve the
  API URL in a real multi-host deployment. Add a `.env.production` with
  `VUE_APP_ENV=production` to fix, whenever that's needed.
