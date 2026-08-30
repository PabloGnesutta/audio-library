# AudioLibrary — Diagnosis & Modernization Plan

Written 2026-08-29. Two independent git repos live side by side here:
`audiolibrary-frontend` (Vue 3 / Vue CLI 5) and `audiolibrary-backend`
(Express 4 / Mongoose 6). No repo exists at the workspace root — this file
and the root `CLAUDE.md` are workspace-level notes only, not tracked by git.

## TL;DR

A completely clean `npm install` + run on **Node v24.19.0** (currently
installed via nvm-windows) succeeded on **both** projects with **zero
compile errors**. `npm run serve` (frontend) and `node
src/index.audio-library.js` (backend) both started cleanly. `npm run build`
(frontend) also succeeded.

This means the "conflicts with node version and libraries like tailwind"
the user described **could not be reproduced** from a fresh checkout. There
is no Tailwind anywhere in either repo's history (checked `git log`, full
source tree, no config files) — grep for `tailwind` across `src/` in both
projects returns nothing. Likely explanations, unconfirmed:
- A stale/partial `node_modules` from a much older Node (16.x, per the
  READMEs) was present locally and never reinstalled cleanly.
- An uncommitted local experiment (e.g. adding Tailwind) was in progress
  and left the tree in a broken state that git wouldn't show if it was
  never staged, or was on a machine/branch not seen here.
- npm global cache/config corruption on the original machine, unrelated to
  this repo's code.

**Action item: ask the user for the exact terminal error text if they still
have it**, or have them try `rm -rf node_modules package-lock.json && npm
install` fresh — that alone may resolve it, matching what happened here.

## Environment observed

- Node: v24.19.0 (nvm-windows also has 20.20.2 available; no 16.x installed)
- npm: 11.17.0
- Both READMEs claim `node version: v16.17.0` — stale, not enforced
  anywhere (no `.nvmrc`, no `engines` field in either `package.json`)
- No `node_modules` existed in either project before this session's installs
- No `.env` file in either project — only `.env.example`. This is expected
  (gitignored) but means the app cannot fully function (no DB/S3/SendGrid
  credentials) until the user creates real `.env` files locally.

## Frontend (`audiolibrary-frontend`)

- Vue 3.2 + Vue CLI 5.0 (webpack 5 under the hood) + Vuex 4 + Vue Router 4
- `sass` (Dart Sass, pure JS) + `sass-loader` — no native bindings, so no
  node-gyp/OpenSSL-provider class of issues (the kind that plagues
  `node-sass` + Node 17+). This is good and should be preserved.
- Build output is written directly into the backend repo at
  `../audiolibrary-backend/__client-app-build` (see `vue.config.js`) — the
  backend serves the built SPA as static files. **The two repos are
  coupled**: frontend build must run before backend can serve the app in
  "production-like" mode. In dev, frontend runs its own dev server
  (`localhost:8080`) and the backend is hit directly via
  `VUE_APP_LOCAL_BACKEND_PORT`.
- `npm audit`: 52 vulnerabilities (5 critical: `@babel/traverse`,
  `form-data`, `shell-quote`, `webpack`, `websocket-driver`) — **all are
  transitive dev/build-tooling deps of `@vue/cli-service`**, not shipped in
  the production bundle. Bumping `@vue/cli-service` etc. to `5.0.9` (patch,
  currently on `5.0.8`) is low-risk and should be done regardless.
- `@vue/cli` itself is in **maintenance mode** (officially deprecated by
  the Vue team in favor of Vite as of late 2023). Worth flagging to the
  user as an option, not a requirement — migrating build tooling is a
  bigger, separate decision from "make it run cleanly."
- Outdated (non-major, safe): `sass` 1.56→1.103, `vue` 3.2.45→3.5.42 (still
  Vue 3, safe), `vue-router` 4.1.6→4.6.4 (safe, stay on v4 — v5 is a major
  breaking bump and pairs with Vue's newer reactivity, not needed here),
  `axios` 1.2.0→1.20.0 (**should upgrade — audit lists many real CVEs**
  fixed in later 1.x releases, no major bump needed).
- `.browserslistrc` triggers a "caniuse-lite is outdated" warning on every
  build — trivial fix via `npx update-browserslist-db@latest`.

## Backend (`audiolibrary-backend`)

- Express 4.18 + Mongoose 6.3 + MongoDB driver 4.5 + `aws-sdk` v2 (used only
  in `src/helper/S3Helper.js`, callback-based `upload`/`deleteObject`/
  `getSignedUrl` against a DigitalOcean Spaces S3-compatible endpoint) +
  `bcryptjs` + `jsonwebtoken` 8.5 + `@sendgrid/mail` 7.7.
- `npm audit`: 31 vulnerabilities including a **critical** in `mongoose`
  (prototype pollution / NoSQL injection family, fixed in mongoose 6.13+/
  the 7/8/9 lines) and **high**-severity findings in `jsonwebtoken` 8.x
  (signature-validation-bypass class of bugs, fixed in 9.x), plus `express`,
  `axios` (via `@sendgrid/mail`), `mongodb` driver, `path-to-regexp`, etc.
  **These are real, worth fixing regardless of the "won't run" complaint.**
- `aws-sdk` v2 is in AWS's maintenance/end-of-support track — the
  officially recommended replacement is the modular `@aws-sdk/client-s3` +
  `@aws-sdk/s3-request-presigner` (v3). `S3Helper.js` is small (56 lines,
  3 methods) so this rewrite is contained and low-risk, but it **is** an
  API-shape change (promise-native v3 clients, `PutObjectCommand` /
  `DeleteObjectCommand` / `getSignedUrl` from the presigner package instead
  of the v2 callback style).
- Default port mismatch is a documentation gap, not a bug: `PORT` defaults
  to `3000` in code (`index.audio-library.js:2`) if unset, but
  `.env.example` specifies `3004`, and the frontend's `config.js` expects
  `VUE_APP_LOCAL_BACKEND_PORT` to match whatever the backend actually
  listens on. **Once the user creates real `.env` files, make sure the
  backend's `PORT` and the frontend's `VUE_APP_LOCAL_BACKEND_PORT` agree.**
- No `.nvmrc`/`engines` field here either.

## Proposed plan (pending user's scope decision — see questions asked)

### Phase 0 — baseline hygiene (safe, do regardless of scope chosen)
1. Add `.nvmrc` (`24` or an LTS, TBD) + `engines.node` to both
   `package.json`s so the version story is truthful and enforced.
2. Update both READMEs to drop the stale `node version: v16.17.0` claim.
3. `npx update-browserslist-db@latest` in frontend.
4. Scaffold real `.env` files from `.env.example` (values to be filled by
   the user — cannot invent DB/S3/SendGrid credentials).
5. Reconcile the `PORT` / `VUE_APP_LOCAL_BACKEND_PORT` mismatch by default
   (both to `3004`, matching `.env.example`'s intent).

### Phase 1 — safe/minor dependency bumps (low risk, fixes most audit noise)
- Frontend: `@vue/cli-*` → 5.0.9, `sass` → latest 1.x, `vue` → 3.5.x,
  `vue-router` → 4.6.x, `axios` → latest 1.x.
- Backend: `axios` (transitive, via sendgrid) will follow `@sendgrid/mail`
  bump; `cors`, `dotenv`, `express-fileupload` → latest minor/patch;
  `nodemon` → 3.x (dev-only, safe).

### Phase 2 — targeted major bumps that fix the *critical* CVEs
- `jsonwebtoken` 8 → 9 (check `sign`/`verify` call sites in
  `AuthHelper.js`/`TokenFactory.js` for the default-algorithm behavior
  change).
- `mongoose` 6 → 9 + `mongodb` driver 4 → 7 together (check for removed
  callback-style APIs, `strictQuery` default changes, and any deprecated
  query operators used in `model/*.js` and `service/*.js`).
- `bcryptjs` 2 → 3 (check for breaking API changes, likely none for basic
  `hash`/`compare` usage).

### Phase 3 — optional/bigger architectural calls (ask before doing)
- `aws-sdk` v2 → `@aws-sdk/client-s3` v3 rewrite of `S3Helper.js`.
- `express` 4 → 5 (breaking: removed methods, changed route matching via
  new `path-to-regexp`; also fixes the audit's `express`/`path-to-regexp`
  findings directly). Worth doing but needs a route-by-route check.
- Vue CLI → Vite migration (bigger, not required for "runs with no
  errors/warnings", but removes the last of the critical frontend audit
  findings and is the ecosystem-recommended direction).

## Outcome — what was actually done (2026-08-29)

User chose: treat the original repro as stale local `node_modules` (no
error text was available to investigate further), full modernization
including the `aws-sdk` v3 rewrite, and to fill in real `.env`
credentials themselves (scaffolded from `.env.example`).

### Backend (`audiolibrary-backend`)
- Dependency bumps: `jsonwebtoken` 8→9, `mongoose` 6→9 (drops the
  explicit `mongodb` 4.x dependency — unused directly, and mongoose
  manages its own driver version internally), `bcryptjs` 2→3, `express`
  4→5, `express-fileupload` →1.5.2, `cors` →2.8.6, `dotenv` 16→17,
  `@sendgrid/mail` 7→8, `nodemon` 2→3 (dev). `npm audit`: 31→0
  vulnerabilities.
- `aws-sdk` v2 → v3: removed entirely, replaced with
  `@aws-sdk/client-s3` + `@aws-sdk/lib-storage` +
  `@aws-sdk/s3-request-presigner` in `src/helper/S3Helper.js`. **Not
  tested against live DigitalOcean Spaces credentials** — only verified
  the module loads and the rest of the request flow around it is
  intact. Smoke-test upload/delete/signed-url once real `S3_KEY`/
  `S3_SECRET` are set.
- Mongoose 7+ removed `Document#remove()`; the one call site
  (`FileService.deleteFile`/`deleteMultipleFiles`, via `file.delete()`)
  now uses `file.deleteOne()`, and `model/File.js`'s post-delete
  cascade hook moved from `'remove'` to `'deleteOne'` document
  middleware. No other deprecated Mongoose API usage found anywhere
  else in the codebase (checked all of `helper/`, `service/`).
- `jwt.sign`/`jwt.verify` now explicitly pin `algorithm`/`algorithms:
  ['HS256']` (`helper/AuthHelper.js`) — addresses the "insecure default
  algorithm" class of CVE the audit flagged for jsonwebtoken 8.x.
  Verified with a live sign→verify→reject-garbage-token roundtrip
  script (see conversation) since there's no DB to exercise this
  through a real HTTP login.
- Fixed two pre-existing bugs unrelated to the version bumps but
  directly relevant to "runs with no errors": `controllers/
  auth-controller.js` (`authorizationMiddleware` and
  `refreshAccessToken`) referenced an undefined `error` variable inside
  their `.catch(_err => ...)` blocks — any invalid/expired token would
  throw a `ReferenceError` instead of returning a clean 401/403.
  `controllers/bookmark-controller.js`'s `updateBookmark` had the same
  class of bug (`catch (err)` body referenced `_err`). Both fixed by
  making the caught param name match its usage.
- `dotenv` v17 prints a random self-promotional "tip" line on every
  boot (confirmed legitimate — see `lib/main.js`'s `TIPS` array in the
  installed package, matches the maintainer's own CHANGELOG; not a
  supply-chain issue). Silenced via `dotenv.config({ quiet: true })` in
  `src/index.audio-library.js` since it's just noise for this project.
- Added `.nvmrc` (`24`) and `engines.node: ">=20"`.
- Observed but **not changed** (out of scope — flagging for the user):
  `service/AuthService.js:49` hashes the literal string `'qwe'` on
  every login attempt and never uses the result — looks like leftover
  debug code, harmless but wasteful (one throwaway bcrypt hash per
  login).

### Frontend (`audiolibrary-frontend`)
- Dependency bumps (all non-major, deliberately — see the "Known,
  accepted state" note in `audiolibrary-frontend/CLAUDE.md`): `@vue/
  cli-*` 5.0.8→5.0.9, `vue` 3.2→3.5, `vue-router` 4.1→4.6, `axios`
  1.2→1.20, `sass` 1.32→1.103. `npm audit`: 52 (5 critical) → 12 (0
  critical, all confined to `@vue/cli-service`'s own dev-time tooling —
  postcss, serialize-javascript, uuid — none shipped in the production
  bundle).
- `npx update-browserslist-db@latest` — removes the "caniuse-lite is
  outdated" warning on every build.
- Fixed a real bug surfaced during browser verification: `src/router/
  index.js`'s global `beforeEach` guard called `next({name:'Login'})`
  in its `catch` branch and then fell through to the unconditional
  `next()` at the bottom of the function — vue-router warns loudly
  ("next callback was called more than once") whenever an
  unauthenticated user hits any `requiresAuth` route, which in practice
  is every fresh/logged-out page load. Fixed with a `return`.
- Added `.nvmrc` (`24`) and `engines.node: ">=20"`.

### Verification performed
- Full clean install (`rm -rf node_modules package-lock.json && npm
  install`) on both repos, on Node v24.19.0.
- Backend: boots clean, no warnings, only the expected Mongo connection
  failure (blank `DB_HOST` — resolves once real credentials are set).
  jwt sign/verify and bcrypt hash/compare exercised directly via a
  smoke script (no DB needed) — all correct.
- Frontend: `npm run build` and `npm run serve` both fully clean, zero
  warnings.
- End-to-end browser check (Playwright, headless Chromium): both
  servers running together, navigated to `localhost:8080`, app renders
  the login screen correctly (screenshot confirmed), zero JS
  `pageerror`s. Remaining console lines are expected/by-design: a 403
  network-log line from the unauthenticated session check (browsers
  always log non-2xx XHRs) and a `console.warn` mirror of the
  "Permission denied" toast (intentional — see `Toast.vue:46`, `success
  ? console.log : console.warn`).

### Still needs the user
- Real `.env` values (`DB_HOST`/`DB_USER`/`DB_PASSWORD`, `R2_*`,
  `SENDGRID_API_KEY`) to actually exercise DB/storage/email —
  everything above was verified as far as possible without them.
- A live smoke test of `S3Helper.js`'s three methods once R2 creds
  exist, since the v2→v3 rewrite (and the DO→R2 switch below) was only
  verified structurally.
- If the original "tailwind/node conflicts" resurface with real error
  text, that would change the diagnosis above — nothing in the current
  codebase or history explains it.

## Follow-up — switched object storage from DigitalOcean Spaces to Cloudflare R2 (2026-08-29)

User asked whether the AWS SDK v3 rewrite would work with R2, then
asked to switch it over. It's a small change since both are
S3-compatible: `S3Helper.js`'s `endpoint` now points at
`https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` and `region` is
hardcoded to `'auto'` (R2's only valid value) instead of being read
from an env var. Env vars renamed throughout (`.env.example`, `.env`,
`CLAUDE.md`) from the generic `S3_*` naming to `R2_*`:
`S3_SPACE_NAME`→`R2_BUCKET_NAME`, `S3_KEY`→`R2_ACCESS_KEY_ID`,
`S3_SECRET`→`R2_SECRET_ACCESS_KEY`, `S3_REGION` removed (no longer
needed — region is fixed). `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`
come from a Cloudflare R2 API token (dashboard → R2 → Manage API
tokens), not an AWS IAM user. Verified the backend still boots clean
with the renamed env vars; the actual upload/delete/signed-url calls
still need a live test once real R2 credentials exist.

## Follow-up — full bug audit beyond the dependency upgrade (2026-08-29)

User asked "have you found any other bugs?" — prompted a deliberate
line-by-line pass through every backend service/factory/helper file and
every frontend JS/Vue file (the modernization pass above had only
touched files that the dependency bumps actually forced changes in).
Found and fixed five more real, verified bugs; one more was found,
verified, and deliberately left as-is per the user's choice.

**Fixed:**

1. **`service/EmailService.js` — crashed the whole Node process.**
   `sendMail`'s SendGrid call was fire-and-forget with a
   `.catch(_err => { throw _err })` that nothing awaited or caught.
   Verified live: any SendGrid failure became an unhandled promise
   rejection, which terminates the Node process by default (Node 15+),
   not just the request. Currently dormant — the call site in
   `AuthService.signUp` is commented out — but would bite the instant
   email verification is re-enabled. Fixed by making `sendMail`/
   `sendVerifyEmailMail` return their promises (declared with `const`
   now too — they were accidental implicit globals) and catching the
   failure with a `console.error` instead of a re-throw. Re-verified
   live: same failure now resolves cleanly with no unhandled rejection.

2. **`controller/base-controller.js` (frontend) — axios interceptor
   assumed every error has a `.response`.** `error.response.status` was
   read unconditionally; a network-level failure (backend unreachable,
   CORS block, timeout) has no `.response`, so this threw a `TypeError`
   that masked the real error on literally every failed call while the
   backend is down. Fixed with `error.response?.status`.

3. **`controller/base-controller.js` — failed token refresh resolved
   instead of rejecting.** When a refresh token existed but was
   invalid/expired, the retry chain's `.catch` called
   `handleTokenError()` but never re-threw or returned a rejection, so
   the *original* failed request's promise silently resolved as
   `undefined`. Any caller destructuring `.data` off that would crash
   with a confusing error instead of the real 401. Fixed by returning
   `Promise.reject(error)` in both failure branches. Also deduped an
   accidental double `store.commit('auth/doLogout')` call in the same
   function.

4. **`components/bookmarks/AddBookmarkModal.vue:72`** — `catch (_err)`
   body referenced an undefined `e` instead of `_err` (same bug class
   fixed earlier in the two backend controllers) — any bookmark-creation
   failure threw a `ReferenceError` instead of showing the toast, and
   skipped the subsequent `closeModal()` call too. Fixed.

5. **`components/audio-player/AudioPlayer.vue` and
   `components/shared/modal/ModalBox.vue`** — both used `beforeDestroy()`,
   a **Vue 2** lifecycle hook name; Vue 3 silently ignores unknown hook
   names, so the `document.removeEventListener` cleanup in both never
   ran. Leaked a global `keyup` listener on every destroy/recreate cycle
   (e.g. logout → login). Renamed both to `beforeUnmount()` (Vue 3's
   equivalent hook).

All five fixes were rebuilt and re-verified (clean `npm run build`,
clean backend boot, and a second Playwright pass — identical
console output to the pre-fix baseline, confirming no regression).

**Found, verified, deliberately left as-is (user's choice):**

- **`components/audio-player/VolumeSlider.vue`** — references `this.AP`
  (the `<audio>` element) in `onVolumeClick()` and
  `setVolumeWithPercentage()`, but the component has no prop, data, or
  injection providing `AP` — it would throw immediately if rendered.
  It's currently fully commented out in `AudioPlayer.vue`'s template, so
  it's dead/unreachable code today, not a live bug. User chose to leave
  it as documented dead code rather than wire it up or delete it.

**Already known, not fixed (lower priority, flagged for awareness only):**

- `service/AuthService.js:49` — hashes the literal string `'qwe'` on
  every login attempt and discards the result; leftover debug code.
- `views/AboutView.vue` and `components/HelloWorld.vue` — default Vue
  CLI scaffolding, not wired into the router (`router/index.js` only
  defines `/`, `/login`, `/verify-email/:token`), effectively dead files.
- `components/shared/inputs/FolderSelect.vue`'s `selectFolder()` writes
  to `this.selectedFolder`, a property never declared in `data()` and
  never read anywhere — harmless dead assignment (the component's real
  state flows through the `value`/`input` v-model prop, which works
  correctly).

Coverage note: this pass read every `.js` file in both repos and every
`.vue` file except pure single-purpose SVG icon components (trivial
markup, `components/shared/svg/*.vue`) and the two dead scaffolding
files listed above.

## Follow-up — "quick win" improvements applied (2026-08-29)

After the bug audit, asked for general improvement suggestions and the
user picked the low-effort/high-value tier to apply immediately:

- `model/User.js` — `email` field now `{ type: String, unique: true }`.
  Duplicate-account prevention was purely app-side (`AuthHelper.validateEmail`
  checks before insert), which is a TOCTOU race under concurrent
  signups; a DB-level unique index closes that.
- `index.audio-library.js` / `error-controller.js` — the previously
  unused `get404` handler is now mounted at `app.use('/api', get404)`,
  positioned after the four API route mounts and before the SPA
  catch-all. Unmatched `/api/*` paths now return a real `404` with a
  JSON body instead of silently falling through to the SPA's
  `index.html` with a `200`. `get404` itself now sets the status
  explicitly. Verified live with curl: `/api/nonexistent` → 404 JSON,
  `/` still → 200 HTML.
- `service/AuthService.js` — removed the dead `bcrypt.hash('qwe', 12)`
  debug line from `login()` (and the now-unused `bcryptjs` import).
- `views/auth/Login.vue` — both forms' `<label for="...">` pointed at
  no matching `id` on their inputs (click-to-focus and screen-reader
  association were both broken). Added `id="login-email"` /
  `id="login-password"` / `id="signup-email"` / `id="signup-password"`
  matched to each label's `for`.

Deferred (bigger effort, not requested yet — see the improvement list
in conversation): rate limiting on `/api/auth/*`, request body
validation (zod/express-validator).

## Follow-up — helmet, backend test coverage, Vite migration (2026-08-29)

User asked to do the remaining deferred items from the improvement
list, in this order: helmet, test coverage, Vite migration.

**Helmet** (`audiolibrary-backend`): added with `contentSecurityPolicy:
false` — a default CSP would have blocked the audio player's
cross-origin R2 streaming and (in dev) the frontend's cross-origin API
calls. All other headers (HSTS, X-Content-Type-Options, frame-options,
etc.) are on. Verified live via `curl -I`.

**Backend test coverage**: no test suite existed in either repo before
this. Added Jest to `audiolibrary-backend` (`npm test`) — see the
commit for full file-by-file coverage notes; the short version is it
targets the highest-risk business logic and the exact bug classes
found during the earlier audit (regression tests for the EmailService
unhandled-rejection crash, the two controller ReferenceError bugs, and
the Mongoose 9 `deleteOne()` migration), rather than chasing raw
coverage percentage. Sanity-checked that the tests actually catch
regressions, not just pass vacuously: temporarily reverted the
EmailService fix and confirmed its test suite fails (in fact crashes
the Jest worker exactly like it would crash the real process), then
restored the fix and re-ran clean.

Frontend test coverage was deliberately deferred to after the Vite
migration (Vitest is the natural fit for a Vite project; setting up
Jest against the old Vue-CLI/webpack build first would have meant
reconfiguring the test runner twice) — not done yet as of this entry.

**Vite migration** (`audiolibrary-frontend`): full replacement of
`@vue/cli-service`/webpack with Vite. `npm audit` is now 0 findings.
Full list of what had to change and why is in
`audiolibrary-frontend/CLAUDE.md`'s "Vite migration notes" section —
the short version: `require()`/`module.exports` in application source
(no `require` shim in Vite's browser bundle), a webpack-only
`require.context()` call in `store/modules/index.js` (replaced with
`import.meta.glob`), `public/index.html`'s htmlWebpackPlugin/EJS
templating (replaced with Vite's `%BASE_URL%` convention and moved to
the project root), extensionless `.vue` imports across ~40 sites (kept
working via `resolve.extensions` rather than editing every import
site), and a Sass `slash-div` deprecation warning in `AudioPlayer.vue`.

One of these — the `require.context()` call — was **not caught by the
build**; `vite build` succeeded and only failed at runtime in the
browser (`ReferenceError: require is not defined`), caught by the same
Playwright-based browser verification used throughout this session.
This is the reason every non-trivial change in this whole modernization
effort has been checked in an actual browser, not just by a successful
build — a clean build is necessary but not sufficient.

Verified: clean `npm run build` and `npm run serve` (both 0 warnings),
a Playwright pass against the Vite dev server, and a second Playwright
pass against the actual production build served through the backend
(`__client-app-build` → `express.static` → catch-all) — both produced
byte-for-byte the same rendered login page and zero console errors as
the pre-migration baseline.

**Discovered, not fixed (pre-existing, unrelated to the migration
itself)**: neither `.env.production` nor any mode-specific env file
exists, so a production build still bakes in the base `.env`'s
`VUE_APP_ENV=development` / `VUE_APP_LOCAL_BACKEND_PORT` instead of
`src/config.js`'s intended relative `/api` path for production. Same
host in dev (masks the issue), would misresolve the API URL if frontend
and backend ever have different hostnames in production. Add a
`.env.production` with `VUE_APP_ENV=production` to fix.

Still deferred: rate limiting on `/api/auth/*`, request body validation.

## Follow-up — frontend test coverage (2026-08-29)

Closed out the last deferred item from the "helmet, test coverage,
Vite migration" list. Added Vitest + `@vue/test-utils` + `jsdom` to
`audiolibrary-frontend` (`npm test`), configured via the `test` key in
`vite.config.js`. Coverage and rationale are in
`audiolibrary-frontend/CLAUDE.md`'s "Test coverage" section — same
approach as the backend suite: pure logic plus regression tests for
bugs actually found and fixed during this session, not raw coverage
percentage. `controller/base-controller.js`'s response-error handler
was pulled into a named export (`handleResponseError`) purely so it
could be unit-tested directly; verified this was a no-op refactor via
another full build + Playwright browser pass (byte-identical rendering
and zero console errors, same as every other check this session).
Sanity-checked the regression coverage the same way as the backend:
reverted the `error.response?.status` optional-chaining fix, confirmed
the matching test fails with the exact original `TypeError`, restored
it, confirmed the full suite (28 tests, 6 files) passes clean.

Not covered: `.vue` component rendering/interaction tests. This and
the backend suite both intentionally prioritized business-logic
coverage over UI coverage given the time available.

Still deferred: rate limiting on `/api/auth/*`, request body
validation, `.vue` component tests.

## SendGrid → nodemailer/SMTP (2026-08-29)

Replaced `@sendgrid/mail` with `nodemailer` in `src/service/
EmailService.js`, at the user's request (no particular provider
issue — just a switch to a generic SMTP transport). Env vars changed:
`SENDGRID_API_KEY`/`SENDGRID_SENDER` → `SMTP_HOST`, `SMTP_PORT`,
`SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_APP_NAME`
(see backend `CLAUDE.md`'s "Email" section for the full mapping).
`sendMail()`'s fire-and-forget resolve-even-on-failure shape (the fix
for the unhandled-rejection crash documented above) was preserved
unchanged — only the transport underneath it changed. Backend test
suite updated to mock `nodemailer.createTransport` instead of
`@sendgrid/mail`; full suite re-verified green (41/41). Not yet
exercised against a live SMTP server — `.env`'s `SMTP_*` values are
still empty, same caveat as the R2 credentials above.

## Bug: `DB_NAME` silently unused in `connectMongoDB()` (2026-08-29)

Found while the user was filling in real Atlas credentials.
`connectMongoDB()` in `src/index.audio-library.js` built the Mongo SRV
URI as `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_HOST}` — `DB_NAME`
(`AUDIO_LIBRARY` in `.env`) was defined but never interpolated
anywhere. Harmless as long as `DB_HOST` was just a bare hostname (no
database selected, but nothing exercised it), until the user pasted
Atlas's "Connect" dialog string — which is `<user>:<password>@<cluster
host>/?appName=Cluster0` with no database name in it at all — directly
into `DB_HOST`. That produces `mongodb+srv://user:pass@cluster0.xxx.
mongodb.net/?appName=Cluster0`, an empty path before `?`, silently
connecting without selecting `AUDIO_LIBRARY`.

Fixed by making the code build `.../${DB_HOST}/${DB_NAME}` explicitly,
and reverting `.env`'s `DB_HOST` back to the bare cluster hostname
(dropping the cosmetic `?appName=` query param — Atlas UI labeling
only, not required for the connection to work). See backend
`CLAUDE.md`'s "Setup" section for the `DB_HOST` format note this
prompted. Verified against the live cluster once real `DB_USER`/
`DB_PASSWORD` and an Atlas Network Access IP allowlist entry were in
place — connected and confirmed `mongoose.connection.name ===
'AUDIO_LIBRARY'`.

## SMTP credentials verified live (2026-08-29)

Once real `SMTP_*`/`MAIL_*` values were in `.env` (Brevo), sent a real
test email via a throwaway script hitting `nodemailer` directly (same
transport config as `EmailService.js`) — accepted with `250 OK:
queued`. First attempt used a `MAIL_FROM` that already contained a
display name (`Audio Library<...>`), which combined with
`MAIL_APP_NAME` into a malformed nested address header
(`"X" <Name<addr>>`) — nodemailer's lenient parser still extracted a
valid envelope address so the SMTP conversation succeeded, but the
malformed header was suspected of getting the message silently
dropped downstream (never showed up in Brevo's dashboard or the
inbox). Fixed by setting `MAIL_FROM` to a bare address and
`MAIL_APP_NAME` separately; resent, and — after Brevo's usual
delivery-log lag — it arrived. Takeaway for future `.env` setup:
`MAIL_FROM` must be a bare email address, not a `Name<addr>` string;
the display name belongs in `MAIL_APP_NAME` alone.

## Production-mode local run + `.env.production` gap closed (2026-08-29)

Verified running the app the way it'd actually run in production
(single origin, no dev servers): `npm run build` in the frontend,
`npm start` (not `npm run serve`) in the backend, then hit
`http://localhost:3004` directly. This exposed the gap flagged during
the Vite migration — no `.env.production` existed, so the build was
still baking in `VUE_APP_ENV=development` and hardcoding
`http://localhost:3004/api` instead of the relative `/api` path
`src/config.js` intends for same-origin production deployments. Added
`audiolibrary-frontend/.env.production` with `VUE_APP_ENV=production`;
Vite picks it up automatically for `vite build`. Verified by grepping
the built bundle (no `3004`/`localhost`, `/api` present) and checking
the served app in a real browser — loaded correctly, no page errors.
One unrelated pre-existing behavior surfaced during that browser check:
visiting `/` with no session logs a `403` and briefly flashes a
"Permission denied" toast before redirecting to `/login`, because `/`
is a `requiresAuth: true` route and the guard's catch branch fires a
toast on any verify-session failure — not a regression, same thing
would happen in dev at `:8080`, just cosmetically rough for a fresh
visitor's first load.

## Bug: signup never sent the verification email (2026-08-29)

Found while smoke-testing the signup flow end-to-end (with
`SIGNUP_FLAG=enabled` temporarily set for local testing — it's
`disabled` by default; see `routes/auth-routes.js`). `AuthService
.signUp()` had its `EmailService.sendVerifyEmailMail(...)` call
commented out — pre-existing dead code, unrelated to anything else
changed this session; signup being disabled by default meant this path
had likely never been exercised before. Uncommented it; added a
regression test asserting `EmailService.sendVerifyEmailMail` is called
with the new user's email/token (`test/service/AuthService.test.js`).
Full backend suite re-verified green (42/42).

Practical side effect: a signup attempted before this fix creates a
permanently-stuck unverified account (email uniqueness blocks
re-signup with the same address, and there was never a token emailed
to resend). No resend-verification-email flow exists in the app today
— if this happens, either delete the stray user document directly in
MongoDB, or look up its `emailToken` directly and build the
`${FRONTEND_URL}/verify-email/${token}` link by hand.
