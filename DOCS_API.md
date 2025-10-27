# NEBWORK Backend — API Reference


## 1) Environment variables (.env)
Create a `.env` file in the project root with the following keys:

- `MONGO_URI` — MongoDB connection string. Example: `mongodb://localhost:27017/networkdb` or `mongodb://localhost:27017` (database created on first write).
- `JWT_SECRET` — secret for signing JWT tokens (use strong random string).
- `EMAIL_USER` — SMTP user (e.g. Gmail address used for sending reset emails).
- `EMAIL_PASS` — SMTP password or App Password (for Gmail use an App Password when 2FA is enabled; no spaces).

Example `.env`:

```
MONGO_URI=mongodb://localhost:27017/networkdb
JWT_SECRET=your_jwt_secret_here
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_app_password_here
```

## 2) How to run

```powershell
npm install
node index.js
```

If port 5000 is already in use, stop the existing node process or change `PORT` in env.

---

## 3) Routes overview

Base URL: `http://localhost:5000`

- Auth
  - POST `/api/auth/login` — Login with email & password.
  - POST `/api/auth/forgot-password` — Request password reset (sends reset token via email when configured).

- Admin (employee management)
  - POST `/api/admin/employees` — Add employee
  - PUT `/api/admin/employees/:id` — Edit employee
  - DELETE `/api/admin/employees/:id` — Delete employee
  - GET `/api/admin/employees` — List employees (supports `page` and `limit` query params)

- User profile routes (in `src/routes/userRoutes.js`) — placeholders for profile operations (upload photo, update profile, etc.)

---

## 4) Models (important fields)

### User (from `src/models/User.js`)
- `email` (String, unique, required)
- `name` (String, required)
- `password` (String, required — hashed automatically in model pre-save hook)
- `division` (String)
- `profile_photo` (String)
- `join_date` (Date)
- `role` (String) — existing code uses `admin` and `user` values
- `resetPasswordToken`, `resetPasswordExpire` — used by forgot/reset flows

Notes:
- Passwords are hashed with `bcryptjs` in the model `pre('save')` hook.
- Timestamps may be enabled in model (check model file for `timestamps` option).

---

## 5) Endpoint details and Postman RAW examples

### POST /api/auth/login
- Body (JSON):
```json
{
  "email": "user@gmail.com",
  "password": "password123"
}
```
- Success response (200):
```json
{
  "message": "Login successful",
  "token": "<JWT>",
  "user": { "id": "...", "email": "...", "name": "...", "division": "...", "role": "..." }
}
```
- Validation: the code enforces allowed domains (gmail.com or yahoo.com) using `ALLOWED_DOMAINS_REGEX`.


### POST /api/auth/forgot-password
- Body (JSON):
```json
{ "email": "user@gmail.com" }
```
- Behavior: finds user by email, generates a reset token (stored hashed on user), sets expire time and sends an email with a reset URL.
- Important: Email sending requires valid SMTP credentials and (for Gmail) an App Password.
- Success response (200):
```json
{ "message": "Email sent successfully" }
```
- If email is not configured or sending fails, the endpoint may produce a 500 error with details.


### POST /api/admin/employees
- Body (JSON):
```json
{
  "email": "employee@gmail.com",
  "password": "tempPassword123",
  "name": "Employee Name",
  "division": "Engineering",
  "role": "user"
}
```
- Behavior: validates required fields and email domain (only `gmail.com` or `yahoo.com`), creates user and returns created employee summary.
- Success (201):
```json
{
  "status": "success",
  "message": "Employee added successfully",
  "data": { "id": "...", "email": "...", "name": "..." }
}
```


### PUT /api/admin/employees/:id
- Example URL: `/api/admin/employees/6423a7e1...`
- Body (JSON) — only fields to change:
```json
{ "name": "New Name", "email": "new@gmail.com" }
```
- Behavior: validates email domain if `email` is supplied. Returns updated user object.


### DELETE /api/admin/employees/:id
- Method: DELETE
- No body required.
- Behavior: deletes the employee and returns success message.


### GET /api/admin/employees
- Query params: `?page=1&limit=10`
- Response: list of users (password is omitted with `.select('-password')`) and pagination metadata.


## 7) Known issues & operational notes
- Email sending failures: Gmail requires App Passwords when 2FA is enabled. If you see `Missing credentials for "PLAIN"` or `EAUTH`, check `EMAIL_USER` and `EMAIL_PASS` in `.env` and generate an App Password.
- CSP warnings in browser DevTools (accessing `/.well-known/...`) are devtools artifacts and not server faults.
- MongoDB driver warnings: options `useNewUrlParser` and `useUnifiedTopology` are deprecated in recent drivers. You can remove those options from `src/config/db.js` when upgrading.
- Port conflicts: if port 5000 is already used, stop previous node processes or change environment `PORT`.

---

### Testing / CI notes

- The test suite uses Jest + Supertest and is located in `src/test`. Tests import the Express `app` from `app.js` (so they don't start a real HTTP server via `index.js`).
- Environment variables used by tests:
  - `MONGO_URI_TEST` (optional) — MongoDB connection for test runs. If not provided, the tests will fallback to `MONGO_URI` or `mongodb://localhost:27017/networkdb_test`.
  - `JWT_SECRET` — the test runner sets a default if missing, but you can provide one.
  - `DISABLE_EMAIL=true` — set this to prevent tests from attempting to send real emails. The test suite sets this value automatically when running.

- Recommendation for CI:
  1. Set `MONGO_URI_TEST` to a disposable MongoDB instance (local container or cloud test DB).
  2. Set `DISABLE_EMAIL=true` to avoid outbound email from CI.
  3. Provide `JWT_SECRET` as a secret variable in CI.

### How tests handle email and tokens

- For reliability, the code will skip sending emails when `DISABLE_EMAIL` is set to `true` or when `NODE_ENV` is `test`.
- Tests create unique email addresses (timestamp suffix) to avoid duplicate key errors on the `email` index. The `User` model enforces a unique email index.

### Quick test commands

```powershell
# run tests (powershell)
npm test

# Run a single test file
npx jest src/test/auth.test.js
```

