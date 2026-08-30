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
- **`.env.production`** (added 2026-08-29, closing a gap this migration
  originally left open) sets `VUE_APP_ENV=production` so `vite build`
  picks it up automatically (Vite loads `.env.production` for build
  mode, `.env` for dev) and `src/config.js` switches to the relative
  `/api` path instead of baking in `http://localhost:${VUE_APP_LOCAL_BACKEND_PORT}`.
  Without it, a production build would still resolve the dev-mode URL —
  harmless when frontend and backend share a host, but wrong in a real
  multi-host deployment. Verified by grepping the built bundle for
  `3004`/`localhost` (absent) and `/api` (present), then serving it
  through the backend and checking it in a real browser.

## Test coverage (Vitest, added 2026-08-29)

`npm test` runs Vitest (`jsdom` environment, config lives in the `test`
key of `vite.config.js` — same file Vite itself uses). Covers pure
logic (`helpers/`, `plugins/error-mixin.js`, the Vuex mutations in
`store/modules/`) plus a regression suite for `controller/
base-controller.js`'s axios response-error handling — the exact bugs
fixed earlier in this modernization pass (unconditional
`error.response.status` throwing on network failures; a failed token
refresh resolving instead of rejecting). That handler was pulled out
into a named export (`handleResponseError`) specifically so it could
be unit-tested directly rather than reaching into axios interceptor
internals — pure refactor, no behavior change. Sanity-checked the same
way as the backend suite: reverted a fix, confirmed the matching test
fails with the exact original bug's error, restored it.

## Component tests (`@vue/test-utils`, added 2026-08-30)

`.vue` component rendering/interaction is now covered too, via
`mount()` — `test/components/**`, mirroring `src/components/**`.
Started with `FileRow.vue` and `TagsModal.vue` since both were touched
in the same pass that added bulk tag-apply/mark-complete (see
`DIAGNOSIS.md`) and were the highest regression risk at the time.

Conventions for adding more:
- Build the smallest possible Vuex store with `createStore()` —
  only the namespaced module(s) the component actually reads via
  `mapGetters`/`mapMutations` — then overwrite `store.commit = vi.fn()`
  on the instance and assert against that, rather than wiring the
  real store modules.
- `vi.mock('@/controller/...')` the whole controller a component talks
  to (its methods are just thin axios wrappers over `BaseController`)
  instead of letting requests actually go through axios.
- `ErrorMixin`'s `toastError` goes through `eventBus`, not Vuex, so it
  needs no store setup on its own.

Not covered yet: any component that touches `vue-router` directly, or
the native-`<audio>`-driven parts of `AudioPlayer.vue` (play/pause,
scrubbing, bookmarks) or the drag handlers in `TreeNavigation.vue` —
those lean on real browser APIs (`<audio>`, `DataTransfer`) that are
either unavailable or awkward to fake under jsdom, and are better
candidates for e2e coverage later than for `mount()`-level tests.
`AudioPlayer.test.js` is the one exception so far: it covers the sleep
timer (added 2026-08-30), which is plain component state/timers and
never touches `this.AP` except a guarded `.pause()` call, so it's
testable by stubbing `wrapper.vm.AP` and driving `vi.useFakeTimers()`
rather than a real `<audio>` element.
