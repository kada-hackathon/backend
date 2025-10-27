# NEBWORK Backend

This repository contains the backend API for NEBWORK (work logging / collaboration platform).

This README covers quick setup, environment variables, and how to run the server locally.

## Quick setup
1. Install dependencies

```powershell
npm install
```

2. Configure environment variables (create `.env` at project root). See `DOCS_API.md` for required fields.

3. Start the server

```powershell
node index.js
```

> If you'd like automatic reload while developing, install nodemon globally and run `npx nodemon index.js`.

## Dev notes
- Server exposes routes under `/api/auth` and `/api/admin`.
- The API uses JWT for session tokens. See `src/controllers/authController.js`.
- MongoDB URI must point to a running MongoDB instance.

## Useful commands
- Install: `npm install`
- Start: `node index.js`
- Stop Node processes on Windows PowerShell: `Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force`

For details about endpoints and examples, open `DOCS_API.md`.

## Running tests

This project includes a small test suite under `src/test` (uses Jest + Supertest).

Before running tests, make sure you have a MongoDB instance available. Tests will use the following environment variables:

- `MONGO_URI_TEST` — optional. If not set the test suite will fall back to `MONGO_URI` or `mongodb://localhost:27017/networkdb_test`.
- `JWT_SECRET` — the test runner will set a default if not present, but you can set it to your preferred value.
- `DISABLE_EMAIL=true` — set this to avoid sending real emails during tests (the test harness sets this automatically).

Run tests with:

```powershell
npm test
```

Notes:
- The project exports an Express `app` in `app.js` so tests can import the app without starting the HTTP server. The `index.js` file starts the server and connects to the DB for normal runs.
- Tests create unique email addresses per-run (timestamp suffixes) to avoid duplicate-key errors.
