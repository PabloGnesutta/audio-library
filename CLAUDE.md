# audiolibrary-backend

Express 5 + Mongoose 9 (MongoDB Atlas) API. Serves the built frontend
SPA as static files from `__client-app-build` (gitignored — see
workspace-root `CLAUDE.md`) plus `/api/*` routes.

## Setup

`.env` (copy from `.env.example`): `PORT`, `SECRET_KEY` (JWT signing),
`DB_HOST`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` (Mongo Atlas SRV
connection, built in `src/index.audio-library.js`), `R2_*` (Cloudflare
R2, S3-compatible — see below), `SMTP_*`/`MAIL_*` (see Email below).
The server boots fine with these empty/missing — it just can't reach
Mongo/R2/SMTP, which surfaces as a caught connection error on boot
(Mongo) or per-request failures (R2/email), not a crash.

`DB_HOST` must be the **bare cluster hostname** (e.g.
`cluster0.xxxxx.mongodb.net`, no `mongodb+srv://`, no path, no `?query`)
— `connectMongoDB()` builds the full SRV URI as
`mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}`. Atlas's
"Connect" dialog gives you a full string like
`mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?appName=Cluster0`
with no database name in it at all (Atlas leaves that for you to add)
— copying that whole suffix into `DB_HOST` verbatim silently drops
`DB_NAME` from the connection (empty path before `?appName=...`), so
Mongoose connects without selecting `AUDIO_LIBRARY` at all. Fixed
2026-08-29; see `DIAGNOSIS.md`.

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

## Object storage (`src/helper/S3Helper.js`) — Cloudflare R2

Rewritten 2026-08-29 from AWS SDK v2 (deprecated/EOL) to v3
(`@aws-sdk/client-s3` + `@aws-sdk/lib-storage` for `uploadDataToBucket`
+ `@aws-sdk/s3-request-presigner` for `getSignedUrl`), originally
pointed at DigitalOcean Spaces, then switched the same day to
Cloudflare R2 (`endpoint: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
`region: 'auto'` — both hardcoded/fixed rather than env-driven, since
R2's region is always `'auto'`). R2's S3-compatible API supports
multipart upload, delete, and SigV4 presigned URLs the same way any S3
provider does, so the rest of the class needed no changes for the
switch. `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY` come from a Cloudflare
R2 API token (dashboard → R2 → Manage API tokens), not AWS credentials.
**Not yet exercised against live R2 credentials** — verified only by
successful module load + the rest of the app's request flow; the
actual upload/delete/signed-url calls need a live smoke test once real
`R2_*` values are in `.env`.

## Email (`src/service/EmailService.js`) — nodemailer/SMTP

Switched 2026-08-29 from SendGrid (`@sendgrid/mail`) to `nodemailer`
over plain SMTP — `SENDGRID_API_KEY`/`SENDGRID_SENDER` env vars are
gone, replaced by `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` (`'true'` for
port 465/implicit TLS, `'false'`/unset for STARTTLS on 587 or plain
local relays — compared as a string since env vars are always
strings), `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` (envelope/header From
address), and `MAIL_APP_NAME` (display name wrapping it, e.g. `"App
Name" <MAIL_FROM>`). `sendMail()`'s fire-and-forget shape (resolves
`undefined` even on failure, logs instead of rejecting) is unchanged
from the SendGrid version — that was a deliberate fix earlier in this
modernization pass (see `DIAGNOSIS.md`) to stop an unhandled promise
rejection from crashing the process, and applies the same way
regardless of which transport sends the mail. **Not yet exercised
against a live SMTP server** — verified only by mocked unit tests
(`test/service/EmailService.test.js`); point `SMTP_*` at a real
provider (or something like Mailtrap/a local Maildev instance for
dev) and send a real verify-email to smoke-test before relying on it.

## Mongoose 9 migration notes

`Document#remove()`/`.delete()` were removed upstream; this codebase's
one use (`FileService.deleteFile`/`deleteMultipleFiles`) now calls
`file.deleteOne()`, and `model/File.js`'s cascade-delete-bookmarks hook
moved from the removed `'remove'` document middleware to `'deleteOne'`
document middleware (`{ document: true, query: false }`). If you add
new document deletion elsewhere, follow the same pattern — `Query`-level
`deleteOne`/`deleteMany`/`findOneAndDelete` (used everywhere else in
`helper/*.js`) were never affected by this and need no special handling.
