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
