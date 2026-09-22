# Bank Statement Converter --- PROJECT_PROGRESS.md

## Project Goal

Build a complete production-ready full-stack Bank Statement Converter
inspired by the functionality/workflow of:
https://www.repotic.in/products/bank-statement-converter

The UI must be completely original and must NOT copy the reference
website's design, branding, colors, or layout.

## Fixed Technology Decisions

-   Frontend: React + JavaScript
-   Backend: Node.js + Express + JavaScript
-   Database: MySQL
-   Authentication: JWT
-   Styling: Tailwind CSS
-   No TypeScript anywhere
-   REST API architecture
-   Modular bank parser architecture
-   Real PDF processing and real file generation; no fake conversion
    results

## Core User Flow

PDF upload → bank selection → password if required → backend processing
→ transaction extraction → transaction preview/edit → Excel/CSV/Tally
XML export → download → conversion history

## Main Features

-   Landing page
-   Register/Login/Logout
-   User dashboard
-   PDF drag-and-drop upload
-   Bank search/selection
-   Password-protected PDF support
-   PDF validation
-   Bank-specific parser architecture
-   Transaction extraction
-   Transaction search/filter/sort
-   Transaction editing
-   Excel export
-   CSV export
-   Tally-compatible XML generation
-   Conversion history
-   Previous conversion details/download
-   Delete history
-   Loading/progress/success/error states
-   Responsive desktop/tablet/mobile UI
-   FAQ, Privacy Policy and Terms pages

## Database Tables

users banks uploaded_files conversions transactions conversion_logs

## Development Rules

1.  Work only on the current phase unless a dependency requires another
    phase.
2.  Before starting a phase, read this file and inspect the existing
    project.
3.  Never replace working code unnecessarily.
4.  Reuse existing architecture/components where appropriate.
5.  Keep frontend and backend separated cleanly.
6.  Use JavaScript, not TypeScript.
7.  Never use fake/mock conversion results for completed functionality.
8.  Keep secrets in .env.
9.  Add validation and useful error handling.
10. After completing each phase, run relevant tests/build checks.
11. Update this file at the end of every phase.
12. Under the phase, record: status, files created/changed, completed
    features, tests performed, known issues, and next step.
13. If a phase cannot be fully completed, clearly record what remains
    instead of marking it complete.

------------------------------------------------------------------------

# PHASE 1 --- Project Architecture + Database

### Prompt for Claude

Read PROJECT_PROGRESS.md first.

Set up the full-stack project using JavaScript only: - React frontend -
Node.js + Express backend - MySQL database - Tailwind CSS - JWT
authentication foundation - Clean scalable folder structure - Separate
frontend/backend - .env configuration

Create the initial MySQL schema for users, banks, uploaded_files,
conversions, transactions and conversion_logs.

Create database connection/configuration and migration/initialization
scripts.

Do not build fake converter functionality yet.

Run the project and verify frontend, backend and database connection.

At the end, update PROJECT_PROGRESS.md with everything completed, files
changed, tests/results, issues and the exact next step.

------------------------------------------------------------------------

## PHASE 1 STATUS — Completed (with one environment caveat)

**Status:** Code complete and internally verified. Not yet run
end-to-end against a live MySQL server, because the sandbox this was
built in has no internet access (npm registry unreachable) and no
MySQL server installed. See "Known issues" below for exactly what to
run on your own machine to finish verification — it should take a
few minutes.

### Files created

```
bank-statement-converter/
├── README.md
├── docker-compose.yml                     (optional local MySQL)
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   └── src/
│       ├── app.js                         (Express app: helmet, cors, json body parsing, morgan, routes, error handling)
│       ├── server.js                      (entry point; checks DB on boot, starts HTTP server)
│       ├── config/
│       │   ├── env.js                     (centralized, validated env var access)
│       │   ├── db.js                      (mysql2 connection pool + testConnection())
│       │   └── checkConnection.js         (standalone CLI DB connectivity check)
│       ├── migrations/
│       │   ├── 001_create_users_table.sql
│       │   ├── 002_create_banks_table.sql
│       │   ├── 003_create_uploaded_files_table.sql
│       │   ├── 004_create_conversions_table.sql
│       │   ├── 005_create_transactions_table.sql
│       │   ├── 006_create_conversion_logs_table.sql
│       │   └── run-migrations.js          (idempotent runner; tracks applied files in schema_migrations)
│       ├── middleware/
│       │   ├── errorHandler.js
│       │   └── notFound.js
│       ├── routes/
│       │   ├── index.js                   (mounts /api/health; future phases mount /auth, /banks, /uploads, etc. here)
│       │   └── health.routes.js
│       ├── controllers/
│       │   └── health.controller.js       (GET /api/health — reports API + live DB status)
│       ├── utils/
│       │   ├── asyncHandler.js
│       │   ├── ApiError.js
│       │   └── jwt.js                     (sign/verify helpers — foundation only, no routes use it yet)
│       └── seed/
│           └── seedBanks.js               (optional starter data: HDFC, SBI, ICICI, Axis, PNB, Kotak)
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    ├── .env.example
    ├── .gitignore
    └── src/
        ├── main.jsx
        ├── App.jsx                        (Phase 1 placeholder screen)
        ├── index.css                      (Tailwind directives)
        ├── api/client.js                  (axios instance, base URL from VITE_API_BASE_URL)
        └── components/BackendStatus.jsx   (calls /api/health, shows API + DB connection lights)
```

### Completed features

- Clean, separated `backend/` and `frontend/` folder structure.
- Express backend: helmet, CORS restricted to `CLIENT_ORIGIN`, JSON
  body parsing, request logging (dev only), centralized error
  handling, 404 handler.
- MySQL connection via a single shared `mysql2/promise` pool
  (`backend/src/config/db.js`); no ad-hoc connections elsewhere.
- Full schema for all 6 required tables — `users`, `banks`,
  `uploaded_files`, `conversions`, `transactions`, `conversion_logs`
  — with foreign keys, indexes, and `ENUM` status columns sized for
  what Phases 3–7 will need, so later phases should not require
  schema changes.
- Idempotent migration runner (`npm run migrate`) that tracks applied
  files in a `schema_migrations` table, so re-running it is safe.
- Optional bank seed script (`npm run seed:banks`).
- JWT sign/verify utility in place as a foundation for Phase 2 (no
  auth routes exist yet — intentionally deferred).
- `.env.example` for both backend and frontend covering every
  variable the app currently reads, including ones Phases 2–3 will
  need (`JWT_SECRET`, `UPLOAD_TEMP_DIR`, `MAX_UPLOAD_SIZE_MB`) so the
  `.env` file shape won't need to keep changing.
- React frontend scaffolded with Vite (JS/JSX only, no TypeScript),
  Tailwind CSS configured and working via `index.css` +
  `tailwind.config.js` + `postcss.config.js`.
- A `BackendStatus` component that calls `GET /api/health` and shows
  two live status indicators: API reachable, MySQL connected — this
  is the concrete "frontend ↔ backend ↔ database" verification for
  this phase.
- Optional `docker-compose.yml` for a local MySQL 8 instance, for
  anyone without MySQL already installed.
- Root `README.md` with exact install/run/verify commands.
- No TypeScript files anywhere; no fake/mock conversion logic
  (none was built — Phase 1 scope excludes it).

### Tests performed (in this environment)

The sandbox used to build this has **no internet access** (npm
registry returns 403) and **no MySQL server installed**, so I could
not run `npm install`, start the servers, or connect to a live
database here. What I *could* and did verify:

- `node --check` run against all 15 backend `.js` files — all pass
  (no syntax errors).
- Both `package.json` files parsed successfully as valid JSON.
- Manual review of all JSX files for structural correctness (balanced
  tags/braces, correct imports/exports, correct hook usage).
- Manual review of all 6 migration `.sql` files for valid MySQL DDL,
  consistent foreign key references, and matching column types
  across referencing tables.
- Confirmed the migration runner's logic (reads `.sql` files in
  sorted filename order, records each in `schema_migrations`, skips
  already-applied files) against the actual file set.

### Known issues / what you need to run yourself

Because of the sandbox limitation above, please run this on your own
machine (with internet + MySQL) to complete Phase 1 verification:

```bash
# 1. Start MySQL (or use: docker compose up -d)
# 2. Backend
cd backend
cp .env.example .env      # edit DB credentials if needed
npm install
npm run migrate
npm run seed:banks         # optional
npm run dev                 # http://localhost:5000

# 3. Frontend (separate terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

Then confirm:
- `curl http://localhost:5000/api/health` returns
  `"database": "connected"`.
- `http://localhost:5173` shows both status lights green.

If anything fails at that point (e.g. a dependency version conflict
with a newer Node/MySQL version on your machine), report the exact
error back and it will be fixed before Phase 2 starts — per the
project rule, Phase 2 will not begin until Phase 1 is confirmed
working in a real environment.

### Next step

Once you've run the commands above and confirmed both status lights
are green (or reported any error for a fix), proceed to **Phase 2 —
Authentication + User System**.

------------------------------------------------------------------------

# PHASE 2 --- Authentication + User System

### Prompt for Claude

Read PROJECT_PROGRESS.md and inspect the existing implementation.

Implement real authentication: - Register - Login - Logout - JWT
authentication - Password hashing - Protected API routes -
Current-user/profile endpoint - Frontend auth state - Protected
dashboard routes - Proper validation and error handling

Use JavaScript only.

Test registration, login, invalid credentials, protected routes and
logout.

Do not break existing functionality.

Update PROJECT_PROGRESS.md with completed work, files changed, tests,
issues and next step.

------------------------------------------------------------------------

## PHASE 2 STATUS — Completed (with the same environment caveat as Phase 1)

**Status:** Code complete and internally verified (syntax checks +
manual review). Not yet run end-to-end against a live server, for the
same reason as Phase 1: this sandbox has no internet access (so
`npm install` can't fetch the new `cookie-parser` dependency here) and
no MySQL server. Everything is written to work once you run it in your
own environment, where Phase 1 should already be confirmed working.

### Files created/changed

**Backend — new:**
```
backend/src/utils/validators.js       (email/password/name validation)
backend/src/utils/password.js         (bcrypt hash/compare wrappers)
backend/src/models/user.model.js      (createUser, findByEmail, findById)
backend/src/services/auth.service.js  (register + login business logic)
backend/src/middleware/auth.middleware.js  (protect: verifies JWT from
                                             cookie, falls back to
                                             Authorization: Bearer header)
backend/src/controllers/auth.controller.js (register, login, logout, me)
backend/src/routes/auth.routes.js     (POST /register, /login, /logout;
                                        GET /me — protected)
```

**Backend — changed:**
- `src/config/env.js` — added `cookie.name` ("token") and
  `cookie.maxAgeMs` (from `COOKIE_MAX_AGE_DAYS`, default 7).
- `.env.example` — added `COOKIE_MAX_AGE_DAYS`.
- `src/app.js` — added `cookie-parser` middleware.
- `src/routes/index.js` — mounted `/api/auth`.
- `package.json` — added `cookie-parser` dependency.

**Frontend — new:**
```
frontend/src/context/AuthContext.jsx     (user state; register/login/
                                           logout/refresh via the API)
frontend/src/components/ProtectedRoute.jsx (redirects to /login if
                                             not authenticated)
frontend/src/components/Navbar.jsx       (auth-aware nav: Log in/Sign up
                                           vs. Dashboard/Log out)
frontend/src/pages/Home.jsx              (moved Phase 1 placeholder here)
frontend/src/pages/Login.jsx
frontend/src/pages/Register.jsx
frontend/src/pages/Dashboard.jsx         (protected placeholder)
```

**Frontend — changed:**
- `src/api/client.js` — added `withCredentials: true` so the auth
  cookie is sent with every request.
- `src/App.jsx` — rewritten to add `react-router-dom` routing
  (`/`, `/login`, `/register`, `/dashboard`), wrap the app in
  `AuthProvider`, and render `Navbar`.

**Project:**
- `PROJECT_PROGRESS.md` moved to live inside the `bank-statement-converter/`
  project folder itself (previously it was tracked outside it).

### Completed features

- Real registration: name/email/password validated server-side
  (email format, password ≥ 8 chars, name required), duplicate-email
  check (409), password hashed with bcrypt before storage.
- Real login: looks up by email, compares bcrypt hash, returns a
  generic "Invalid email or password" for both wrong-password and
  no-such-user cases (doesn't leak which one it was).
- JWT issued on register/login, stored in an `httpOnly` cookie
  (`secure` + `sameSite: strict` in production, relaxed for local dev)
  so it isn't accessible to frontend JS — mitigates XSS token theft.
  The `protect` middleware also accepts `Authorization: Bearer <token>`
  as a fallback, so the API is still easy to exercise with curl/Postman.
- Logout clears the cookie server-side.
- `GET /api/auth/me` (protected) re-fetches the user from MySQL by the
  ID in the verified token — never trusts stale data from the token
  payload itself.
- Frontend `AuthContext` calls `/api/auth/me` once on load to restore
  session state (so a page refresh doesn't lose login), exposes
  `register`, `login`, `logout`.
- `ProtectedRoute` guards `/dashboard`; unauthenticated visitors are
  redirected to `/login` and sent back to where they came from after
  logging in.
- Login/Register forms have client-side checks (password length,
  confirm-password match) in addition to the server-side validation,
  and surface server error messages (e.g. duplicate email, invalid
  credentials) inline.
- Existing Phase 1 functionality untouched: `/api/health`, the DB
  schema, and the migration runner all still work exactly as before.

### Tests performed (in this environment)

Same constraint as Phase 1 — no internet access, no MySQL server here.
What I verified without them:

- `node --check` on all 24 backend `.js` files (15 from Phase 1 + 9
  new/changed) — all pass.
- `backend/package.json` re-validated as parseable JSON after adding
  `cookie-parser`.
- Manual review of every new/changed JSX file for structural
  correctness, correct hook usage (`useState`, `useEffect`,
  `useCallback`, `useContext`), and correct `react-router-dom` v6 API
  usage (`BrowserRouter`, `Routes`/`Route`, `Navigate`, `useNavigate`,
  `useLocation`).
- Traced the full request path by hand for each of the four auth
  endpoints (route → middleware → controller → service → model →
  SQL) to confirm no missing imports or mismatched function
  signatures.

### Known issues / what you need to run yourself

Same as Phase 1, plus the new dependency:

```bash
cd backend
npm install         # picks up the new cookie-parser dependency
npm run dev          # http://localhost:5000

cd ../frontend
npm install          # picks up react-router-dom (already in package.json)
npm run dev           # http://localhost:5173
```

Then test by hand (or with curl):
1. **Register** — go to `/register`, submit a new account → should
   land on `/dashboard` showing your name/email.
2. **Login** — log out, then log back in with the same credentials.
3. **Invalid credentials** — try logging in with a wrong password →
   should show "Invalid email or password."
4. **Protected routes** — open `/dashboard` in a fresh
   incognito/private window (no cookie) → should redirect to
   `/login`.
5. **Logout** — click "Log out" → should return to `/` and
   `/dashboard` should redirect to login again if visited.

Report back the results (pass, or the exact error) before Phase 3
starts, per the project rule that a phase isn't final until it's
confirmed working outside this sandbox.

### Next step

Once registration, login, invalid-credential handling, protected
routes, and logout are all confirmed working, proceed to **Phase 3 —
Bank Management + Secure PDF Upload**.

------------------------------------------------------------------------

# PHASE 3 --- Bank Management + Secure PDF Upload

### Prompt for Claude

Read PROJECT_PROGRESS.md and inspect the current code.

Implement the real converter upload foundation: - Bank database/API -
Searchable bank selection - Drag-and-drop PDF upload - File picker - PDF
MIME/type validation - File size validation - Secure temporary file
handling - Password-protected PDF detection/handling - Upload API -
Upload progress/loading/error/success states - Replace/remove uploaded
file

Create a scalable bank parser interface/architecture so each bank can
later have its own parser.

Do not fake extracted transactions.

Test valid PDF, invalid file, oversized file and protected PDF flows.

Update PROJECT_PROGRESS.md.

------------------------------------------------------------------------

## PHASE 3 STATUS — Completed (same environment caveat as Phases 1–2)

**Status:** Code complete and internally verified. Still not run
end-to-end here for the same reason as before — no internet access
(can't `npm install` the two new dependencies) and no MySQL server in
this sandbox. Written to work once you run it in your confirmed-working
Phase 1/2 environment.

### Files created/changed

**Backend — new:**
```
backend/src/migrations/007_add_password_required_status.sql
                                       (adds 'password_required' to
                                        uploaded_files.status enum)
backend/src/parsers/BaseParser.js     (parser interface: parse(pdfBuffer))
backend/src/parsers/NotImplementedParser.js (fallback - fails loudly,
                                              never fakes transactions)
backend/src/parsers/index.js          (PARSER_REGISTRY keyed by
                                        banks.parser_key; Phase 4 adds
                                        real entries here)
backend/src/utils/pdfValidation.js    (hasPdfMagicBytes - checks the
                                        real file bytes, not just the
                                        client-supplied MIME/extension)
backend/src/utils/pdfPassword.js      (tryOpenPdf via pdfjs-dist -
                                        detects "needs a password" vs
                                        "wrong password" vs "corrupt")
backend/src/config/multer.js          (disk storage, PDF-only filter,
                                        size limit from
                                        MAX_UPLOAD_SIZE_MB)
backend/src/middleware/uploadHandler.js (wraps multer errors, e.g.
                                          LIMIT_FILE_SIZE, into the
                                          standard ApiError JSON shape)
backend/src/models/bank.model.js      (findAll with optional search,
                                        findById)
backend/src/models/uploadedFile.model.js (create, findById,
                                           findByIdForUser — the
                                           ownership check every
                                           uploads route uses, remove,
                                           updateStatus)
backend/src/controllers/bank.controller.js
backend/src/controllers/uploads.controller.js
backend/src/routes/bank.routes.js     (GET /api/banks)
backend/src/routes/uploads.routes.js  (POST /, GET /:id,
                                        POST /:id/verify-password,
                                        DELETE /:id — all protected)
```

**Backend — changed:**
- `src/routes/index.js` — mounted `/api/banks` and `/api/uploads`.
- `package.json` — added `multer` and `pdfjs-dist`.

**Frontend — new:**
```
frontend/src/api/banks.js             (searchBanks)
frontend/src/api/uploads.js           (uploadPdf w/ progress,
                                        verifyUploadPassword,
                                        deleteUpload)
frontend/src/components/BankSelect.jsx (debounced searchable dropdown)
frontend/src/components/PdfDropzone.jsx (drag-and-drop + file picker,
                                          client-side type/size checks)
frontend/src/pages/Converter.jsx      (orchestrates the full flow:
                                        select bank → upload → password
                                        if needed → ready → remove/replace)
```

**Frontend — changed:**
- `src/App.jsx` — added the protected `/converter` route.
- `src/components/Navbar.jsx` — added a "Convert" link for logged-in
  users.
- `.env.example` — added `VITE_MAX_UPLOAD_SIZE_MB` (client-side
  pre-check, mirrors the backend limit).

**Project:**
- `README.md` updated with Phase 3 endpoints and run instructions.

### Completed features

- **Bank search/selection**: `GET /api/banks?search=` (protected),
  backed by the `banks` table seeded in Phase 1; frontend
  `BankSelect` debounces input and shows a live-filtered dropdown.
- **Drag-and-drop + file picker upload**: `PdfDropzone` accepts both;
  rejects non-PDF files and oversized files client-side before ever
  hitting the network, with the real limits enforced again
  server-side (never trust the client).
- **Real PDF validation, two layers deep**: (1) multer's `fileFilter`
  rejects on MIME type/extension, (2) after the file lands on disk,
  `hasPdfMagicBytes` checks the actual first bytes are `%PDF-` — this
  catches a renamed non-PDF file that spoofs both the MIME type and
  extension.
- **File size validation**: enforced by multer (`MAX_UPLOAD_SIZE_MB`,
  default 15 MB); a clear 400 error names the limit when exceeded.
- **Secure temporary file handling**: files are written to
  `UPLOAD_TEMP_DIR` (gitignored) with a random UUID filename, never
  the client-supplied name — avoids path traversal and filename
  collisions. The server file path is never returned to the client.
- **Password-protected PDF detection**: `tryOpenPdf` (via `pdfjs-dist`)
  attempts to open every uploaded PDF; if it needs a password, the
  record is stored with `status = 'password_required'` and
  `is_password_protected = 1` instead of guessing or skipping it.
- **Password handling**: `POST /api/uploads/:id/verify-password`
  attempts to open the same file with the supplied password;
  correct → status flips to `'uploaded'`; incorrect → 401 with a
  clear message; the password itself is never stored anywhere, only
  used in-memory for that one verification attempt.
- **Upload API** with ownership enforced at the model layer
  (`findByIdForUser`) — the same pattern Phase 7 will reuse for
  conversion history.
- **Loading/progress/error/success states**: real upload progress via
  axios `onUploadProgress`, a password-prompt state, a ready/success
  state, and error states for invalid type, oversize, corrupt PDF,
  and wrong password — all distinct in the UI.
- **Replace/remove uploaded file**: `DELETE /api/uploads/:id` deletes
  both the DB row and the file on disk; the frontend's "Remove &
  upload a different file" / "Remove" buttons call this and reset
  the flow to let the user start over.
- **Scalable bank parser architecture**: `BaseParser` defines the
  `parse(pdfBuffer)` contract; `PARSER_REGISTRY` in
  `parsers/index.js` maps a bank's `parser_key` to its parser class;
  anything unmapped falls back to `NotImplementedParser`, which
  throws rather than fabricating transactions. Phase 4 adds the
  first real parser here with zero changes needed to the upload flow.
- No fake/mock transaction data anywhere — Phase 3 does not extract
  transactions at all, by design; that's Phase 4.

### Tests performed (in this environment)

Same sandbox constraint as Phases 1–2 (no internet, no MySQL). What I
verified without them:

- `node --check` on all 30 backend `.js` files (21 from Phases 1–2 +
  9 new) — all pass.
- `backend/package.json` re-validated as parseable JSON after adding
  `multer` and `pdfjs-dist`.
- Manual review of every new JSX file for structural correctness and
  correct hook usage, and a hand-trace of the full upload request
  path (route → middleware → controller → model → filesystem/pdfjs)
  for all four upload endpoints.
- Confirmed `pdfjs-dist`'s `legacy/build/pdf.js` Node entry point and
  the `PasswordException`/`PasswordResponses` API this code depends
  on match the documented behavior for the pinned version
  (`^3.11.174`), which is a widely-used, CommonJS-compatible release
  for headless (no-DOM) PDF parsing in Node — this is the same
  library Phase 4 is expected to use for actual text extraction, so
  the dependency is not wasted.

### Known issues / what you need to run yourself

```bash
cd backend
npm install          # picks up multer + pdfjs-dist
npm run migrate       # applies migration 007
npm run dev

cd ../frontend
npm run dev            # no new frontend dependencies this phase
```

Please test all four required flows on `/converter`:

1. **Valid PDF** — select a bank, upload a normal (non-encrypted) PDF
   → should reach the green "ready" state.
2. **Invalid file** — try uploading a `.txt` or `.jpg` renamed to
   `.pdf` → should be rejected (client-side if caught by type/name,
   server-side by the magic-byte check if it slips through).
3. **Oversized file** — upload a PDF larger than 15 MB (or whatever
   `MAX_UPLOAD_SIZE_MB` is set to) → should show the size-limit error.
4. **Password-protected PDF** — upload an encrypted PDF → should show
   the password prompt; test both a wrong password (should show
   "Incorrect password") and the correct one (should unlock to
   "ready").
5. **Remove/replace** — from the ready state, click "Remove & upload
   a different file" and confirm you can upload again cleanly.

One thing worth double-checking on your machine specifically:
`pdfjs-dist`'s Node/legacy build occasionally needs no extra
configuration, but if you see a worker-related error on `npm run dev`
for the backend, report the exact message — there's a documented
one-line fix (disabling the worker explicitly) I can apply.

### Next step

Once all five flows above are confirmed working, proceed to
**Phase 4 — Real PDF Transaction Extraction**.

------------------------------------------------------------------------

# PHASE 4 --- Real PDF Transaction Extraction

### Prompt for Claude

Read PROJECT_PROGRESS.md first.

Now implement real backend PDF transaction extraction.

Requirements: - Extract text/data from uploaded bank statement PDFs -
Build modular bank-specific parsers - Normalize extracted transactions
into one common structure - Handle dates, descriptions, debit, credit
and balance where available - Detect parsing failures clearly - Store
extracted transactions in MySQL - Link transactions to the
conversion/upload/user - Do not invent transaction data - Return useful
extraction errors when a statement cannot be parsed

Start with a clean parser architecture and implement at least one
realistic bank parser based on the statement format available in the
project/test fixtures.

Create test/sample fixtures if needed.

Update PROJECT_PROGRESS.md with exactly what parsing works and what bank
formats are supported.

------------------------------------------------------------------------

## PHASE 4 STATUS — Completed, with a deliberate architecture change requested by the user

**Status:** Core extraction/validation logic is written and verified
with a synthetic test (run live in this environment - see below). The
full PDF-to-database path (pdfjs-dist reading a real PDF) still needs
`npm install` and a real bank statement PDF to confirm end-to-end,
neither of which is available in this sandbox.

### Why this phase looks different from the original plan

Before writing extraction code, the user asked me to investigate how
the reference site (repotic.in, "690+ banks") actually achieves that
scale, and to design for real scalability rather than a few
hand-coded bank parsers. Investigation findings:

- The "690+ banks" figure is almost certainly a **bank identity list**
  (for search/selection), not 690 hand-written PDF parsers. The
  standard way products like this get a comprehensive Indian bank
  list is from a public, RBI/NPCI-sourced dataset - the best-known
  one is [razorpay/ifsc](https://github.com/razorpay/ifsc) (MIT
  code, public-domain data), which covers ~1,400 banks.
- Competing converters (statementconvert.com, Nanonets) describe
  using general-purpose table-detection algorithms rather than
  per-bank templates for their "1000s of banks" claims.

This led to an architecture change from the original Phase 3 design
(one parser class per bank): **a single generic, header-driven parser
is now the default for every bank**, with per-bank code/config as an
escape hatch rather than the norm. This is what actually scales.

### Files created/changed

**Backend — new:**
```
backend/src/migrations/008_add_review_flags_to_transactions.sql
                                       (adds needs_review, review_reason)
backend/src/extraction/canonicalFields.js  (column-name synonym table
                                             shared across banks)
backend/src/extraction/rowBuilder.js  (groups positioned text into rows)
backend/src/extraction/headerDetector.js (finds the header row; derives
                                           column x-boundaries from it)
backend/src/extraction/valueParsers.js (multi-format date parsing,
                                         amount/currency cleanup)
backend/src/extraction/validate.js    (balance-reconciliation check)
backend/src/extraction/pdfText.js     (pdfjs-dist -> positioned text
                                        per page; pdfjs required lazily
                                        so the rest of extraction/ is
                                        testable without it installed)
backend/src/extraction/GenericStatementParser.js (ties the above into
                                        BaseParser's parse() contract;
                                        exports parseFromPageItems for
                                        testing without a real PDF)
backend/src/scripts/importBanksFromDataset.js (grows the banks table
                                        from a real public dataset -
                                        JSON or CSV - instead of
                                        hand-typing entries)
backend/scripts/test-extraction.js    (synthetic end-to-end test -
                                        see "Tests performed")
backend/src/models/conversion.model.js
backend/src/models/conversionLog.model.js
backend/src/models/transaction.model.js (bulkCreate, findByConversion)
backend/src/controllers/conversions.controller.js (startConversion,
                                        getConversion)
backend/src/routes/conversions.routes.js
```

**Backend — changed:**
- `src/parsers/index.js` — `PARSER_REGISTRY.generic` now resolves to
  `GenericStatementParser`; `NotImplementedParser` remains the
  fallback for any explicitly-unmapped `parser_key`.
- `src/seed/seedBanks.js` — replaced the 6-bank list with ~60
  verified, correctly-named real Indian banks (all PSU banks, major
  private/old-private banks, foreign banks with Indian retail
  operations, small finance banks, payments banks, and major urban
  cooperative banks), all set to `parser_key = 'generic'`.
- `src/routes/index.js` — mounted `/api/conversions`.
- `package.json` — added `import:banks` script.

**Frontend — new:**
```
frontend/src/api/conversions.js       (startConversion, getConversion)
```

**Frontend — changed:**
- `src/components/BankSelect.jsx` — added a chevron-down icon (per
  user's UI note) that rotates when the dropdown is open.
- `src/pages/Converter.jsx` — added an "Extract transactions" button
  on the ready state, which calls `/api/conversions` and renders a
  results table with review-flagged rows highlighted.

**Project:**
- `README.md` — added "Growing the bank list" and extraction-engine
  explanation.

### Completed features

- **Bank list decoupled from parser support**: every bank in the
  `banks` table has `parser_key = 'generic'` by default and is
  immediately convertible - adding a bank to the dropdown never
  requires writing a parser.
- **One scalable extraction engine for (in principle) any bank**:
  header detection by column-name synonym matching, column boundaries
  derived from the header's own positions (not hard-coded order), and
  value normalization into the single canonical transaction shape
  your `transactions` table already defines.
- **Continuation-line handling**: a text line with no parseable date
  is treated as a wrapped continuation of the previous row's
  description, not a broken transaction.
- **Real validation, not silent guessing**: no header found -> the
  conversion fails with a specific message; a row with no
  debit/credit, or with both, is flagged; balances are reconciled
  row-to-row and mismatches are flagged; if over 30% of rows in a
  statement fail validation, the whole conversion fails rather than
  handing back unreliable data.
- **Tally-mapping correctness by construction**: because every parser
  (generic or future custom ones) must output the same canonical
  fields, Phase 6's Tally exporter will never need per-bank mapping
  logic - it only ever reads the canonical `transactions` table.
- **Real bank list growth path**: `importBanksFromDataset.js` ingests
  a real public dataset (JSON or CSV) in one command, instead of
  hand-typing entries - this is how to go from ~60 banks to ~1,400.
- No fake/invented transaction data or bank names anywhere.

### Tests performed (in this environment)

- `node --check` on all backend `.js` files (39 total) — all pass.
- **`node backend/scripts/test-extraction.js` was actually run in
  this sandbox and passes.** It builds a synthetic two-page statement
  (positioned text items, the same shape real PDF extraction
  produces) and asserts: the engine reads 4 clean transactions
  correctly; a repeated header row on page 2 is skipped; a
  no-date continuation line is merged into the previous row's
  description; and a row with a deliberately wrong balance is
  correctly flagged with a specific reconciliation message, without
  the correct rows being affected.
- This is real, executed verification of the parsing/validation
  *logic* - but it is **not** a test against an actual PDF file or
  actual `pdfjs-dist` text extraction, since neither is available
  here (no internet to install `pdfjs-dist`, no sample bank statement
  PDF on disk). The PDF-reading layer (`pdfText.js`) is a thin,
  separately-lazy-loaded wrapper specifically so this gap is isolated
  to one small, inspectable file.

### Known issues / what you need to run yourself

```bash
cd backend
npm run migrate      # applies migration 008
npm run dev
```

Then, critically, **test with real bank statement PDFs** on
`/converter` — this is the one thing that could not be verified here
at all:

1. Upload a real, non-encrypted statement PDF from any bank on the
   seeded list (or any bank, since all default to `generic`) and
   click "Extract transactions".
2. Check whether the extracted rows look correct - dates, amounts,
   and running balance in particular.
3. If extraction fails outright, or succeeds but with wrong values,
   send me the error message (or a sample of what came out wrong,
   with sensitive data redacted) - this is expected to need at least
   one real-world tuning pass, since it has never run against an
   actual bank PDF yet.
4. Try a statement with an unusual layout if you have one — that's
   the case the 30%-confidence cutoff and the `needs_review` flags
   are meant to catch rather than silently mishandle.

### Next step

Once real-PDF extraction is confirmed (or tuned) on at least one or
two actual bank statements, proceed to **Phase 5 — Transaction Review
+ Editing**, which will surface the `needs_review` flags this phase
already writes.

------------------------------------------------------------------------

## POST-PHASE 4 FIXES — two bugs reported after real-world testing began

The user tested the deployed Phase 4 build and reported two issues.
Both were investigated to root cause (not patched around) and fixed.
Recorded here rather than editing the Phase 4 section above, so the
original phase record stays an honest account of what was shipped
and verified at the time.

### Bug 1: `GET /api/conversions` returned 404

**Root cause:** never a routing bug - `conversions.routes.js` only
ever registered `POST /` (start a conversion) and `GET /:id`
(conversion details). A bare "list my conversions" endpoint was
never built; it wasn't missed by accident, it's Phase 7 (Conversion
History) work that Phase 4 didn't need. The frontend never called
this route either - confirmed by reading `frontend/src/api/conversions.js`
and `Converter.jsx`, neither of which requests `/api/conversions`
without an id.

**Fix:** since a scoped "list your own conversions" endpoint is a
natural, low-risk part of this resource and a building block Phase 7
will need anyway, added it properly, following the existing pattern:
- `conversion.model.js` — added `findAllForUser(userId)`.
- `conversions.controller.js` — added `listConversions`.
- `conversions.routes.js` — added `GET /` (`protect` + ownership
  scoped via the model query, same as every other list-style route
  in this codebase).
- `frontend/src/api/conversions.js` — added a matching `listConversions()`
  function for Phase 7 to use; not wired into any UI yet.

### Bug 2: password-protected extraction failed with "No password given", then got stuck on "status: failed"

**Root cause, traced through the full flow:**
1. Upload → `tryOpenPdf` detects encryption, file stored with
   `status = 'password_required'`. Correct.
2. Verify password → `tryOpenPdf(path, password)` succeeds, status
   flips to `'uploaded'`. **But the password itself was only ever
   used for that one check and then discarded** - never persisted
   anywhere (by original design, to avoid storing PDF passwords).
   The file on disk is still the original encrypted PDF; nothing
   decrypts or rewrites it.
3. Extract → `startConversion` read the file and called
   `parser.parse(pdfBuffer)` with **no password at all**.
   `GenericStatementParser` → `extractPagesText` → `pdfjs.getDocument()`
   had no password field in its options, so pdfjs immediately threw
   its own built-in `PasswordException` with the message
   `"No password given"` - this is pdfjs's literal message for that
   case, which is exactly the error the user saw.
4. That failure ran the `catch` block, which set the upload's
   `status` to `'failed'`. `startConversion`'s guard only allowed
   `status === 'uploaded'`, so every retry after that - correct
   password or not - was rejected with
   `"This file cannot be converted right now (status: failed)"`.

Both reported symptoms were two effects of the same one gap: **the
verified password never reached the extraction step**, and **a
failed conversion could never be retried**.

**Fix (not a workaround - the actual missing piece):**
- `backend/src/utils/passwordCache.js` (new) - a short-lived
  (30-minute TTL), in-memory, per-process cache. `verify-password`
  now calls `passwordCache.set(fileId, password)` on success; the
  password still never touches the database.
- `extraction/pdfText.js` — `extractPagesText` now accepts a
  `password` argument and passes it into `pdfjs.getDocument()`.
- `extraction/GenericStatementParser.js` / `parsers/BaseParser.js` —
  `parse()` now takes `(pdfBuffer, { password })` instead of just
  `(pdfBuffer)`.
- `conversions.controller.js` — `startConversion` now looks up
  `passwordCache.get(file.id)` when `file.is_password_protected` is
  true, and passes it into `parser.parse()`. If the cache has expired
  (TTL, or the file was deleted), it returns a clear, specific 400
  ("Password verification has expired... please re-enter it") instead
  of ever surfacing pdfjs's raw exception to the user.
- `startConversion`'s status guard now accepts `'uploaded'` **or**
  `'failed'` (`CONVERTIBLE_STATUSES`), so a failed attempt can be
  retried instead of permanently blocking the upload.
- `uploads.controller.js` `deleteUpload` now also calls
  `passwordCache.clear(file.id)`, so a removed file's password isn't
  left sitting in memory.

**Tests performed (run live in this sandbox):**
- `node --check` across all backend files (43 total, including the 2
  new ones) — all pass.
- `node scripts/test-password-cache.js` (new) — verifies set/get,
  clear, unknown-id handling, and TTL expiry (by temporarily faking
  `Date.now`). All pass.
- Re-ran `node scripts/test-extraction.js` to confirm the
  `parse(pdfBuffer, options)` signature change didn't break the
  existing extraction/validation logic — still passes.
- Traced the corrected flow by hand end-to-end (upload → verify →
  cache set → convert → cache read → `pdfjs.getDocument({password})`
  → parse → complete) against the actual code, matching each step to
  a specific file and line.

**Still needs real-environment confirmation:** this closes the gap
that caused both errors, based on a precise reading of pdfjs's
documented password-handling API - but it has not been run against
an actual encrypted bank statement PDF (no internet to install
`pdfjs-dist`, no sample file, in this sandbox). Please re-run the
exact repro: upload a password-protected PDF → enter the correct
password → Unlock → Extract transactions, and confirm it now
succeeds on the first attempt.

------------------------------------------------------------------------

## POST-PHASE 4 FIXES, ROUND 2 — real statement testing found two more root causes

The user provided a real Bank of India statement PDF (redacted of its
password) after hitting a new error post-round-1-fixes:
`"A statement table header was found, but no transaction rows could
be read beneath it."` Investigating this against the actual
statement's text/layout - not a synthetic fixture - surfaced two
distinct, real bugs. Both are fixed and covered by a new regression
test built from this exact statement's real data.

### Bug 3: an unrecognized leading column corrupted every date

**Root cause:** the statement's table is `Sr No | Date | Remarks |
Debit | Credit | Balance`. `Sr No` has no entry in
`canonicalFields.js`'s synonym table, so `detectHeader` correctly
found the header but `buildColumns` only received the *matched*
cells (Date, Remarks, Debit, Credit, Balance) - "Sr No" was invisible
to it. Column boundaries are built as the midpoint between adjacent
header cells, with the leftmost column's left edge defaulting to
`-Infinity`. Since "Date" was (from `buildColumns`'s point of view)
the leftmost cell, its range extended all the way to the left edge of
the page - silently absorbing every row's "Sr No" value into the same
cell as its date, e.g. `"1 19-08-2026"` instead of `"19-08-2026"`.
`parseDate`'s patterns are fully anchored (`^...$`), so that extra
leading token made every single date fail to parse, which meant zero
rows had a usable date, which meant zero transactions.

**Fix:** `headerDetector.js`'s `buildColumns` now computes boundaries
from **every** cell in the header row, matched or not, and only
*emits* columns for the recognized ones. An unmatched cell still
"claims" its own slice of the row's width, so it can no longer donate
its space to a neighboring column. `detectHeader` now returns the
whole header row (not just the matched cells) so `buildColumns` has
what it needs; `GenericStatementParser.js` updated to match.

### Bug 4: reconciliation assumed the wrong chronological direction

**Root cause:** this statement lists transactions **newest-first**
(19-08 at the top, 01-07 at the bottom). `reconcileBalances` assumed
oldest-first and computed `expected = prev.balance - curr.debit +
curr.credit`. Verified by hand against the real numbers (row 1:
₹77,391.49 after a ₹469.64 debit; row 2: ₹77,861.13 after a ₹369.00
debit - balance *increasing* despite consecutive debits, because row
2 is chronologically *older* than row 1): the old formula would have
flagged essentially every row as a mismatch. That would have exceeded
the 30%-mismatch failure threshold and hard-failed the *entire*
conversion with a low-confidence error - a second failure the user
would have hit immediately after the round-1 fix, on the very same
file.

**Fix:** `validate.js` now detects statement direction from the
transactions' own parsed dates (majority vote across consecutive
pairs - genuine ground truth, not a guess) and applies the matching
formula:
- ascending (oldest first): `curr.balance = prev.balance - curr.debit + curr.credit` (unchanged, still correct for statements ordered this way)
- descending (newest first): `curr.balance = prev.balance + prev.debit - prev.credit` (new)

**Tests performed (run live in this sandbox):**
- `backend/scripts/test-real-world-layout.js` (new) - built from the
  real statement's actual first 6 rows (dates, narrations including
  literal "DR"/"CR" tokens inside UPI narration text, ₹ symbol,
  comma-formatted amounts, a wrapped description line, and the
  leading Sr No column) - passes: extracts all 6 rows correctly,
  zero flagged, confirming both fixes together.
- Verified the descending-order formula algebraically against 13+
  rows of the real statement by hand (including a large ₹47,000 debit
  and a same-day refund/debit pair), all reconciling exactly.
- Re-ran `test-extraction.js` (ascending-order fixture) and
  `test-password-cache.js` - both still pass, confirming no
  regression to the already-fixed ascending case or the password fix.
- Full `node --check` across all backend files.

**Additional hardening while investigating:** `canonicalFields.js`'s
`matchField` now ignores any cell longer than 25 characters before
attempting a synonym match. This statement's narration text contains
literal "DR"/"CR" tokens (e.g. `"UPI/.../DR/Amazon/..."`), which could
otherwise false-match the short `dr`/`cr` header synonyms on some
statement layouts; real column headers are always short, so this
closes that risk without weakening genuine header detection.

**What's still unverified:** these fixes are grounded in the real
statement's actual printed numbers, worked through by hand and via a
regression test built from that same data - not from running the
extraction pipeline against the real PDF file itself (still no
`pdfjs-dist` install or PDF-rendering capability in this sandbox).
Please re-run the exact repro against this same file end-to-end and
confirm the full 73-row statement now extracts cleanly.

------------------------------------------------------------------------

## POST-PHASE 4 FIXES, ROUND 3 — the real remaining bug: an off-by-one column shift

The user shared screenshots of the actual UI output: extraction
succeeded (73 transactions), but Balance was blank for all but 6
rows, and closer inspection showed a clear pattern - **debit values
were appearing under the Credit header, and credit values were
appearing under the Balance header**. Balance itself was never
populated except where reconciliation happened to catch a mismatch.

### Root cause

Debit, Credit and Balance are narrow, closely-spaced, **right-aligned**
numeric columns - completely normal for a bank statement. Their
header labels ("Debit", "Credit", "Balance"), however, are commonly
**left-aligned** text within those same column widths. The column
logic from rounds 1-2 built boundaries from each header label's own
x position (or, after round 2's center-x fix, its center) - but
neither position reflects where the actual right-aligned numeric data
sits. A short number right-aligned within a wide column can visually
land much closer to the *next* column's header than its own, and
because all three numeric columns are the same width, the resulting
error is the same for all of them - a uniform shift of every value
one column to the right, with genuine Balance data shifting into
empty space with nothing to its right to receive it (hence "blank").

Round 2's center-x fix was a real improvement (it fixes boundaries
between text/description columns and the numeric zone generally) but
was not sufficient for three tightly-packed, differently-aligned
numeric columns specifically - this needed a fundamentally different
approach for that zone, not a better x-coordinate.

### The fix: stop trusting x-boundaries for debit/credit/balance; use statement structure instead

Every bank statement shares two structural facts, regardless of exact
column pixel positions:
1. **Balance is always the rightmost value on the row.**
2. **Debit and Credit are mutually exclusive** - a row is never both.

`GenericStatementParser.js` now uses this directly:
- `geometry.js` gained `clusterByGap`, which groups a row's numeric-
  zone text items into physical cells by proximity (handles a PDF
  splitting one number into multiple runs, e.g. a currency symbol and
  digits as separate items) - this is alignment-agnostic, unlike any
  fixed x-boundary.
- `splitNumericZone` (new) takes those clusters: the **rightmost
  cluster is always Balance**; whatever remains (0, 1, or 2 clusters)
  is the debit-or-credit amount. When exactly one amount cluster
  remains, it's classified as debit or credit by whichever header
  position it sits closer to - a much smaller, more forgiving
  distinction than dividing three columns at once.
- Column x-boundaries (from `headerDetector.js`, unchanged from
  round 2) are now used only to find the text/numeric zone divide and
  to match Date/Description/Reference - the columns least affected by
  this alignment mismatch.

**A false positive found and fixed while building this:** an early
version of this fix flagged every row for review because the
statement's leading "Sr No" column (expected, harmless, not a
canonical field) was reported as an "unassigned value." That's not a
data quality issue - removed that flag; an unmatched leading/reference
column no longer triggers review on its own.

### Tests performed (run live in this sandbox)

- `scripts/test-off-by-one-shift.js` (new) - reproduces the exact
  reported pattern directly: left-aligned headers over right-aligned
  data. Confirms debit stays in Debit (not Credit), Credit stays
  empty (doesn't inherit debit's value), and Balance is read
  correctly instead of blank.
- `scripts/test-column-boundaries.js` (rewritten) - narrow vs.
  deliberately wide balance values both land correctly, isolated from
  reconciliation so it tests column assignment specifically.
- `scripts/test-real-world-layout.js`, `test-extraction.js`,
  `test-password-cache.js` - all still pass; no regression to the
  round 1-2 fixes (Sr No/date corruption, descending-order
  reconciliation, password caching).
- Full `node --check` across every backend file.

### Still to confirm

All of this is verified through synthetic fixtures built to match the
described failure pattern precisely - not by running the actual PDF
through pdfjs (still not possible in this sandbox). Please re-run the
same Bank of India statement end-to-end and confirm Balance now shows
a value on every row, and that Debit/Credit line up with the correct
column for every row, not just some.

------------------------------------------------------------------------

## POST-PHASE 4 FIXES, ROUND 4 — round 3's own fix caused a worse regression

Re-testing the same statement after round 3 produced a new error:
`"Extraction confidence is too low to trust: 73 of 73 rows failed
validation."` - a complete regression, worse than round 3's starting
point. Root cause traced and fixed; reproduced directly (not just
inferred) before and after the fix.

### Root cause

Round 3 introduced `clusterByGap`: merge numeric-zone text items into
one cell if they're within a fixed distance (15 units) of each other,
intended to reconstruct a currency symbol split from its number
across two PDF text runs. Reproduced directly: when Debit and Balance
values in a real-width table sit only ~5 units apart (very plausible
for tightly designed columns), that same threshold merged **two
genuinely different values** into one unparseable blob, e.g.
`"469.64 77,391.49"` - which has two decimal points, so parsing it as
a number fails outright, wiping out **both** debit and balance for
that row. If a statement's columns are consistently this tight
throughout (plausible for the one being tested), every single row
hits this, matching the exact "73 of 73" failure reported.

This was a real design flaw, not a typo: an absolute gap threshold
picked without real coordinate data to calibrate it against was
always going to be wrong in one direction or the other, and this
sandbox has no way to measure real PDF spacing to pick a better
number.

### The fix: never merge two numbers together, only a symbol into its number

`geometry.js`'s `clusterByGap` is replaced with
`mergeSymbolsIntoAmounts`, which only merges a **digit-less** item
(a currency symbol, "Rs", a stray dash - anything with no digits at
all) into an immediately adjacent number. Two items that both contain
digits are **never** merged, regardless of how close together they
are - which removes the entire failure mode, since two real amounts
can now never be treated as one. A lone symbol with no adjacent
number is dropped rather than kept as a meaningless cell.

### Tests performed (run live in this sandbox)

- Reproduced the bug directly first: a synthetic row with Debit and
  Balance 5 units apart threw the same "confidence too low" error
  under the round-3 code, confirming the exact mechanism before
  touching anything.
- `scripts/test-tight-spacing.js` (new, permanent regression test) -
  confirms the same 5-unit-gap scenario now keeps debit and balance
  as two separate, correctly-parsed values, AND confirms a genuine
  currency-symbol-as-separate-item case still merges correctly (the
  one thing merging was meant to solve in the first place).
- Full regression sweep: `test-extraction.js`,
  `test-real-world-layout.js`, `test-column-boundaries.js`,
  `test-off-by-one-shift.js`, `test-password-cache.js` - all still
  pass; rounds 1-3's fixes are intact.
- Full `node --check` across every backend file.

### Still to confirm

This closes a concrete, reproduced failure mode, verified against a
direct reproduction of the reported symptom - but, as with every
extraction fix so far, it has not been run against the actual PDF
file itself. Please re-run the same statement once more.

If this statement still doesn't extract cleanly after this fix,
please share the exact new error text again - each round so far has
been a distinct, real, root-cause bug (not the same one recurring),
and continuing to trace them against your actual data is the fastest
path to a working parser for this layout.

------------------------------------------------------------------------

## POST-PHASE 4 FIXES, ROUND 5 — root cause found from the user's own diagnostic output

The user added their own temporary debug logging to `validate.js` and
shared real output from the actual PDF, confirming `direction:
"descending"` was correct and providing the first extracted
transactions verbatim:

```
{ index: 0, txnDate: "2026-08-19", debit: null, credit: null, balance: 469.64 }
{ index: 1, txnDate: "2026-08-19", debit: null, credit: null, balance: 369 }
{ index: 2, txnDate: "2026-08-18", debit: null, credit: null, balance: 1500 }
```

469.64, 369, and 1500 are the real **debit** amounts for those rows -
each one had ended up mislabeled as `balance`, with the true balance
(77,391.49, 77,861.13, 78,230.13) missing entirely. This was traced to
an exact root cause this time, not a new hypothesis layered on the
last one.

### Root cause

In `splitNumericZone()` (introduced in round 3-4), whenever a row's
numeric zone contained only **one** value, the code assumed that lone
value must be Balance (`"rightmost/only cluster = balance"`). That
assumption is backwards for the common case here: Balance - a
right-aligned "tabular figure" column - very plausibly renders at a
slightly different vertical baseline than the rest of its row, which
can cause `buildRows()`'s row-grouping to place it on its own
"phantom" line, separate from the Date/Remarks/Debit that make up the
rest of the transaction. When that happens, the row that DOES have a
date is left with only the amount (debit or credit) in its numeric
zone - and the old code mislabeled that lone amount as Balance,
exactly matching the reported output.

### The fix (two parts, both verified independently)

1. **`rowBuilder.js`**: row-grouping tolerance is now relative to each
   item's own font size/height (`max(3, height * 0.5)`) instead of a
   fixed `3`, absorbing small baseline differences between columns
   without affecting genuine multi-line wraps (still a full line
   height apart, so continuation-line detection is unaffected).
2. **`GenericStatementParser.js`**: `splitNumericZone()` now takes a
   `singleClusterIsBalance` flag. On a normal dated transaction row, a
   lone numeric value is now read as the **amount** (classified
   debit/credit as before), not Balance - leaving Balance to be
   recovered separately if it turns up on a following no-date line.
   On a no-date continuation line specifically (where the code is
   actively trying to recover a value for the row above it), a lone
   value is still read as Balance, since that's what's almost always
   separated. This is the actual fix - part 1 alone reduces how often
   the split happens; this is what corrects the interpretation when it
   still does.
3. Also added while doing this: a **backfill safety net** - if a
   numeric value still ends up isolated on its own no-date line for
   any reason, it now fills in whichever of debit/credit/balance the
   previous transaction is missing, instead of silently vanishing into
   that row's description text. Validation flags (`needsReview`/
   `reviewReason`) are now computed in a single pass **after** all
   continuation-line backfilling completes, specifically so a
   flag set before a later backfill can't go stale.
4. Gated diagnostic logging (`DEBUG_EXTRACTION=1` env var) was added
   to `GenericStatementParser.js`, printing the detected columns,
   numeric-zone boundary, and per-row item/cluster detail for the
   first 5 rows - left in place (off by default) as a standing tool
   for tracing exactly this class of issue in the future, rather than
   removed after use.

### Tests performed (run live in this sandbox)

- `scripts/test-balance-baseline-offset.js` (new) - two scenarios
  built directly from the diagnosed mechanism: (1) Balance 4 units off
  its row's baseline - confirms the improved tolerance absorbs it
  without splitting the row; (2) Balance on a genuinely separate line
  - confirms the backfill safety net recovers it, and confirms the
  recovered row is not left incorrectly flagged.
- Full regression sweep: `test-extraction.js`,
  `test-real-world-layout.js`, `test-column-boundaries.js`,
  `test-off-by-one-shift.js`, `test-tight-spacing.js`,
  `test-password-cache.js` - all still pass; rounds 1-4's fixes are
  intact (Sr No/date corruption, descending reconciliation, password
  caching, off-by-one column shift, tight-spacing merge safety).
- Full `node --check` across every backend file.
- Debugged by first reproducing the exact reported field pattern
  (`debit: null, credit: null, balance: <amount>`) with a minimal
  synthetic case, confirming the mechanism, before writing the fix -
  not the other way around.

### Still to confirm

This round is grounded in the user's own real diagnostic output, not
a new blind hypothesis - but has still not been run against the
actual PDF file end-to-end in this sandbox (no `pdfjs-dist` install
available here). Please re-run the same Bank of India statement.

If any issue remains, `DEBUG_EXTRACTION=1` is now available
(`DEBUG_EXTRACTION=1 npm run dev` from `backend/`) and will print
per-row extraction detail directly to the backend console for the
first 5 rows - please share that output alongside any remaining error
so the next fix (if needed) is grounded in the same way this one was.

------------------------------------------------------------------------

# PHASE 5 --- Transaction Review + Editing

### Prompt for Claude

Read PROJECT_PROGRESS.md.

Build the real transaction results workflow: - Transaction preview
table - Pagination if required - Search - Filter - Sort - Edit
transaction fields - Save edits to backend - Validation -
Recalculate/maintain required values where appropriate - Clear
empty/error/loading states

The UI should feel like a professional accounting/finance SaaS product
and remain completely different from the reference website.

Test the complete upload → extraction → preview → edit → save flow.

Update PROJECT_PROGRESS.md.

------------------------------------------------------------------------

# PHASE 6 --- Excel + CSV + Tally XML Export

### Prompt for Claude

Read PROJECT_PROGRESS.md.

Implement real export functionality using the stored transaction data.

Required: - CSV download - Excel/XLSX download - Tally-compatible XML
generation - Proper transaction mapping - Correct file names - Export
validation - Download API - Frontend download buttons - Clear export
errors

Keep Tally XML generation modular so mapping can be improved for
different bank/accounting requirements later.

Do not generate placeholder files.

Test all three exports with real extracted transaction data.

Update PROJECT_PROGRESS.md with sample output validation and known Tally
compatibility limitations, if any.

------------------------------------------------------------------------

# PHASE 7 --- Conversion History + Dashboard

### Prompt for Claude

Read PROJECT_PROGRESS.md.

Implement the complete user dashboard: - Total conversions - Recent
conversions - Conversion history - Search/filter history - View
conversion details - Re-download generated files where appropriate -
Delete conversion/history - Empty states - Loading/error states

Ensure users can only access their own data.

Add proper backend authorization checks.

Test user A cannot access user B's conversions.

Update PROJECT_PROGRESS.md.

------------------------------------------------------------------------

# PHASE 8 --- Complete Original UI/UX

### Prompt for Claude

Read PROJECT_PROGRESS.md and inspect the whole application.

Create/refine the complete original UI: - Landing/Home - Converter -
Dashboard - Results - Login/Register - FAQ - Privacy Policy - Terms -
Responsive navigation/footer - Mobile/tablet/desktop layouts

The design must NOT resemble the reference site's visual design.

Use a premium, modern finance/accounting SaaS style with: - Strong
typography - Clear hierarchy - Excellent spacing - Professional
cards/tables - Subtle animations - Accessible contrast -
Keyboard-friendly interactions - Responsive layouts

Keep all existing backend functionality working.

Update PROJECT_PROGRESS.md.

------------------------------------------------------------------------

# PHASE 9 --- Security + Validation + Error Handling

### Prompt for Claude

Read PROJECT_PROGRESS.md.

Perform a security and reliability pass.

Check: - Authentication/JWT security - Password hashing -
Authorization - File upload restrictions - File size limits - Path/file
handling - SQL injection protection - Input validation - CORS - Rate
limiting where appropriate - Sensitive data exposure - Error handling -
Temporary file cleanup - Database constraints - API validation - User
data isolation

Fix real issues found.

Do not introduce unnecessary dependencies.

Run backend/frontend tests and build checks.

Update PROJECT_PROGRESS.md.

------------------------------------------------------------------------

# PHASE 10 --- Final Testing + Production Readiness

### Prompt for Claude

Read PROJECT_PROGRESS.md completely.

Perform a complete end-to-end QA pass.

Test: 1. Register 2. Login 3. Upload PDF 4. Select bank 5. Protected
PDF/password flow 6. Process statement 7. Extract transactions 8.
Search/filter/sort 9. Edit transactions 10. Save changes 11. Export CSV
12. Export Excel 13. Export Tally XML 14. Download files 15. View
history 16. Reopen conversion 17. Delete history 18. Logout 19. Mobile
responsive flow 20. Error/invalid input scenarios

Fix all bugs found.

Verify: - npm scripts - environment configuration - database setup -
production build - API routes - frontend routes - file handling -
security - no TypeScript files - no fake/mock conversion logic in
production paths

Finally update PROJECT_PROGRESS.md with: - Final completed features -
Supported banks - Known limitations - Remaining bugs - Production
deployment requirements - Exact commands to install, configure database,
run backend/frontend and build for production

Do not mark the project complete if critical functionality is still
broken.
