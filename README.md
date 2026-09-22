# Bank Statement Converter — Phase 1: Project Architecture + Database

Full-stack scaffold: React (Vite) frontend, Node.js + Express backend,
MySQL database. JavaScript only, no TypeScript anywhere.

## Folder structure

```
bank-statement-converter/
├── backend/
│   ├── src/
│   │   ├── config/        env.js, db.js, checkConnection.js
│   │   ├── migrations/    numbered .sql files + run-migrations.js
│   │   ├── middleware/    errorHandler.js, notFound.js
│   │   ├── routes/        index.js, health.routes.js
│   │   ├── controllers/   health.controller.js
│   │   ├── utils/         asyncHandler.js, ApiError.js, jwt.js
│   │   ├── seed/          seedBanks.js
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/client.js
│   │   ├── components/BackendStatus.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── .env.example
├── docker-compose.yml     (optional local MySQL)
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- A MySQL 8.x server (local install, or use the included
  `docker-compose.yml`)

## 1. Start MySQL

Either use your own MySQL install, or, if you have Docker:

```bash
docker compose up -d
```

This starts MySQL 8 on `localhost:3306` with root password `changeme`
and creates an empty `bank_statement_converter` database.

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env if your DB credentials differ from the defaults
npm install
npm run migrate        # creates all 6 tables (users, banks,
                        # uploaded_files, conversions, transactions,
                        # conversion_logs) + a schema_migrations table
npm run seed:banks      # optional: inserts a starter list of banks
npm run dev              # starts the API on http://localhost:5000
```

Verify independently at any time:

```bash
npm run db:check         # prints whether MySQL is reachable
curl http://localhost:5000/api/health
```

Expected `/api/health` response once MySQL is up and migrated:

```json
{
  "success": true,
  "api": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

## 3. Frontend setup

In a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # starts Vite on http://localhost:5173
```

Open `http://localhost:5173`. The page calls the backend's
`/api/health` endpoint and shows two status lights: API reachable, and
MySQL connected. Both should be green once steps 1–2 are done.

## Phase 3 additions — Bank Management + Secure PDF Upload

After the Phase 1/2 setup above, re-run `npm install` in `backend/`
to pick up the new `multer` and `pdfjs-dist` dependencies, then:

```bash
cd backend
npm run migrate      # applies migration 007 (adds password_required status)
npm run seed:banks    # if you haven't already
npm run dev
```

New endpoints (all require being logged in — send the auth cookie,
or an `Authorization: Bearer <token>` header):

- `GET  /api/banks?search=<text>` — searchable bank list
- `POST /api/uploads` — multipart form with a `file` (PDF) field and
  optional `bankId`
- `GET  /api/uploads/:id` — status/details of one upload (owner only)
- `POST /api/uploads/:id/verify-password` — body `{ "password": "..." }`
- `DELETE /api/uploads/:id` — removes the upload (file + DB row)

In the frontend, log in and visit `/converter` (also linked from the
nav bar as "Convert") to select a bank and upload a PDF.

## Phase 4 additions — Real PDF Transaction Extraction

No new dependencies this phase. After migrating:

```bash
cd backend
npm run migrate      # applies migration 008 (adds needs_review/review_reason)
npm run dev
```

New endpoint:

- `POST /api/conversions` — body `{ "uploadedFileId": <id> }`. Runs the
  generic extraction engine against the uploaded PDF and stores the
  result. Returns `201` with the conversion on success, or `422` with
  a clear error message if extraction failed or its confidence was
  too low to trust. Retryable if a previous attempt failed.
- `GET /api/conversions` — lists the current user's conversions,
  newest first (minimal version; Phase 7 adds search/filter/UI).
- `GET /api/conversions/:id` — returns the conversion, its extracted
  transactions, and its log entries (owner only).

In the frontend, after a file reaches the "ready" state on
`/converter`, click "Extract transactions" to run it end-to-end and
see the results table (rows needing review are highlighted).

### How the extraction engine works

- `backend/src/extraction/` is the header-driven **generic parser**:
  it reads a PDF's text with page coordinates (`pdfText.js`), groups
  it into rows (`rowBuilder.js`), finds the transaction table's header
  row by matching common column-name synonyms across banks
  (`canonicalFields.js`, `headerDetector.js`), and reads every value
  below it by column position rather than by column order.
- `GenericStatementParser.js` ties this together and is the default
  parser for every bank (`parser_key = 'generic'`).
- `validate.js` reconciles each row's balance against the previous
  row; column-mapping errors are the most common failure mode for a
  generic parser, and this is the strongest catch for them. Rows
  that don't reconcile, or that couldn't be read at all, are stored
  with `needs_review = 1` rather than silently accepted or dropped.
  If more than 30% of rows in a statement fail validation, the whole
  conversion is marked `failed` instead of returning low-confidence
  data.
- **No PDF sample was available in the sandbox this was built in**,
  so the pipeline is verified with a synthetic test instead:
  `node backend/scripts/test-extraction.js` builds a fake two-page
  "statement" (positioned text items, the same shape `pdfText.js`
  produces from a real PDF) and asserts the engine correctly reads
  clean rows, merges a wrapped description line into the previous
  row, and flags a row with a deliberately wrong balance. **Please
  run this against a handful of your own real bank statement PDFs**
  and report back anything that doesn't extract correctly — that's
  the next real test this needs.

### Growing the bank list

`src/seed/seedBanks.js` ships a starter set of ~60 verified, real
Indian banks (PSU, private, foreign, small finance, payments, and
major cooperative banks), all set to `parser_key = 'generic'`. To
grow this toward full RBI/NPCI coverage (~1,400 banks) without typing
them by hand, download a public dataset - e.g. `banknames.json` or
`IFSC.csv` from [github.com/razorpay/ifsc](https://github.com/razorpay/ifsc)
(MIT-licensed code, public-domain data compiled from RBI/NPCI
sources) - and run:

```bash
node src/scripts/importBanksFromDataset.js path/to/banknames.json
```

Every imported bank is immediately searchable and convertible via
the generic parser - no code changes needed per bank. A bank whose
statements the generic parser can't read reliably can later get a
small config override or, for real outliers, its own parser class
registered in `src/parsers/index.js`.

### Diagnosing extraction issues

Set `DEBUG_EXTRACTION=1` when starting the backend
(`DEBUG_EXTRACTION=1 npm run dev` from `backend/`) to print detected
header columns, the numeric-zone boundary, and per-row item/cluster
detail for the first 5 transaction rows directly to the console. This
is the fastest way to diagnose a statement that doesn't extract
correctly - share that output when reporting an extraction bug.

## What Phase 1 intentionally does NOT include

- No authentication routes yet (Phase 2). The JWT signing/verification
  helper (`backend/src/utils/jwt.js`) is in place so Phase 2 can build
  on it directly, but nothing calls it yet.
- No file upload, PDF parsing, or conversion logic (Phases 3–4). The
  database tables for these already exist so later phases don't need
  schema changes.
- No export or history UI (Phases 6–7).
- The frontend has one placeholder screen, not the real landing page
  (Phase 8 builds the full original UI).

## Why this matters for later phases

- Every table Phase 1 creates matches the columns later phases will
  need (foreign keys to `users`, `banks`, `conversions`, etc.), so
  Phase 3 onward should not require altering this schema, only adding
  rows/queries against it.
- `src/config/db.js` exports a single shared pool; all future
  queries should import it rather than opening new connections.
- `src/routes/index.js` is the one place new route groups get
  mounted (`/auth`, `/banks`, `/uploads`, ...) — keeps route
  registration centralized as the API grows.
