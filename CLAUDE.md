# audiolibrary-backend

Express 5 + Mongoose 9 (MongoDB Atlas) API. Serves the built frontend
SPA as static files from `__client-app-build` (gitignored — see
workspace-root `CLAUDE.md`) plus `/api/*` routes.

## Setup

`.env` (copy from `.env.example`): `PORT`, `SECRET_KEY` (JWT signing),
`DB_HOST`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` (Mongo Atlas SRV
connection, built in `src/index.audio-library.js`), `S3_*` (DigitalOcean
Spaces, S3-compatible), `SENDGRID_*`. The server boots fine with these
empty/missing — it just can't reach Mongo/S3/SendGrid, which surfaces
as a caught connection error on boot (Mongo) or per-request failures
(S3/SendGrid), not a crash.

## Structure

Layered: `routes/` → `controllers/` → `service/` → `helper/`/`factory/`
→ `model/` (Mongoose schemas). `exception/BusinessError` (400) and
`exception/SystemError` (500) are the two error shapes; `factory/
ErrorFactory.create(err, fallbackMsg)` normalizes anything else into a
`SystemError` before it reaches `controllers/error-controller.js`'s
handler, which expects every error to carry `.status`/`.message`. When
writing a new controller `catch` block, use `ErrorFactory.create`
rather than reaching into a bare caught error's `.status`/`.message`
directly — a caught-param-name mismatch (`catch (err)` vs. referencing
`_err`, or vice versa) has caused silent `ReferenceError`s here before
(fixed 2026-08-29 in `auth-controller.js` and `bookmark-controller.js`;
see `DIAGNOSIS.md`).

## S3 (`src/helper/S3Helper.js`)

Rewritten 2026-08-29 from AWS SDK v2 (deprecated/EOL) to v3
(`@aws-sdk/client-s3` + `@aws-sdk/lib-storage` for `uploadDataToBucket`
+ `@aws-sdk/s3-request-presigner` for `getSignedUrl`). **Not yet
exercised against real DigitalOcean Spaces credentials** — verified
only by successful module load + the rest of the app's request flow;
the actual upload/delete/signed-url calls need a live smoke test once
real `S3_KEY`/`S3_SECRET` are in `.env`.

## Mongoose 9 migration notes

`Document#remove()`/`.delete()` were removed upstream; this codebase's
one use (`FileService.deleteFile`/`deleteMultipleFiles`) now calls
`file.deleteOne()`, and `model/File.js`'s cascade-delete-bookmarks hook
moved from the removed `'remove'` document middleware to `'deleteOne'`
document middleware (`{ document: true, query: false }`). If you add
new document deletion elsewhere, follow the same pattern — `Query`-level
`deleteOne`/`deleteMany`/`findOneAndDelete` (used everywhere else in
`helper/*.js`) were never affected by this and need no special handling.
