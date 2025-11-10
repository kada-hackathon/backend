# NEBWORK Backend API - Complete Documentation

> **Version:** 1.0.0  
> **Last Updated:** November 7, 2025  
> **Authors:** Nebwork Team (KADA Group 2) - Arrizal, Regina, Salwanetta, Gideon, Jovan

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Environment Setup](#environment-setup)
5. [Installation & Running](#installation--running)
6. [API Endpoints](#api-endpoints)
7. [Authentication & Authorization](#authentication--authorization)
8. [Security Features](#security-features)
9. [Database Models](#database-models)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Overview

NEBWORK is a work logging and knowledge management platform designed to help companies retain institutional knowledge. The backend provides RESTful APIs for:

- 🔐 User authentication and authorization
- 👥 Employee management (Admin)
- 📝 Work log creation, versioning, and collaboration
- 🤖 AI-powered chatbot for knowledge retrieval
- 📤 Media file uploads (images, documents)

**Key Features:**
- JWT-based authentication
- Role-based access control (Admin/User)
- AI embeddings for semantic search
- Version control for work logs
- Secure file storage (DigitalOcean Spaces / AWS S3)

---

## Tech Stack

### Core Technologies
- **Runtime:** Node.js 18.x
- **Framework:** Express.js 5.1
- **Database:** MongoDB (Mongoose ORM)
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **File Upload:** Multer + AWS SDK (S3-compatible)

### Security
- **Helmet:** Security headers
- **express-rate-limit:** Brute force protection
- **CORS:** Cross-origin resource sharing
- **Password Validation:** Custom validator utility

### AI & Embeddings
- **DigitalOcean AI Inference:** DeepSeek-R1-Distill-Llama-70B for chatbot responses
- **Elice/OpenAI API:** Text Embedding 3 Large for vector embeddings and semantic search
- **Caching:** node-cache for performance

### Development
- **Testing:** Jest + Supertest
- **Documentation:** Swagger (swagger-jsdoc + swagger-ui-express)
- **Hot Reload:** Nodemon

---

## Project Structure

```
backend-nebwork/
├── app.js                          # Express app factory (no server.listen)
├── index.js                        # Server entry point + DB connection
├── package.json                    # Dependencies and scripts
├── .env                            # Environment variables (DO NOT COMMIT)
│
├── src/
│   ├── config/
│   │   └── db.js                   # MongoDB connection
│   │
│   ├── controllers/
│   │   ├── authController.js       # Login, logout, profile, password reset
│   │   ├── adminController.js      # Employee CRUD (Admin only)
│   │   ├── workLogController.js    # WorkLog CRUD + versioning
│   │   └── chatbotController.js    # AI chatbot logic
│   │
│   ├── models/
│   │   ├── User.js                 # User schema (email, password, role)
│   │   ├── WorkLog.js              # WorkLog schema (title, content, versions)
│   │   ├── LogHistory.js           # Version history schema
│   │   └── Chat.js                 # Chat history schema
│   │
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth/* endpoints
│   │   ├── adminRoutes.js          # /api/admin/* endpoints
│   │   ├── workLogRoutes.js        # /api/worklogs/* endpoints
│   │   ├── chatbotRoutes.js        # /api/chatbot/* endpoints
│   │   └── uploadRoutes.js         # /api/upload/* endpoints
│   │
│   ├── middlewares/
│   │   └── authMiddleware.js       # JWT verification + role checks
│   │
│   ├── services/
│   │   ├── aiService.js            # OpenAI API wrapper
│   │   ├── embeddingService.js     # Vector embeddings generation
│   │   ├── chatbotService.js       # Chatbot business logic
│   │   └── cacheService.js         # In-memory caching
│   │
│   ├── utils/
│   │   └── passwordValidator.js    # Strong password policy validator
│   │
│   ├── swagger/
│   │   ├── swagger.js              # Swagger setup
│   │   ├── authDocs.js             # Auth endpoint docs
│   │   ├── adminDocs.js            # Admin endpoint docs
│   │   └── workLogDocs.js          # WorkLog endpoint docs
│   │
│   ├── test/
│   │   ├── auth.test.js            # Authentication tests
│   │   ├── worklog.test.js         # WorkLog CRUD tests
│   │   └── jest.setup.js           # Test configuration
│   │
│   └── scripts/
│       ├── migrateEmbeddings.js    # Generate embeddings for existing logs
│       └── debugWorklog.js         # Debug worklog issues
│
└── reports/
    └── test-results.json           # Jest test output
```

---

## Environment Setup

### Required Environment Variables

Create a `.env` file in the project root:

```env
# Server Configuration
NODE_ENV=development              # development | production
PORT=5000                          # Server port

# Database
MONGO_URI=mongodb://localhost:27017/nebwork_db
MONGO_URI_TEST=mongodb://localhost:27017/nebwork_test  # Optional: for tests

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d                      # Token expiration (e.g., 7d, 30d)

# Email Service (for password reset)
EMAIL_SERVICE=gmail                # gmail | outlook | mailgun
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=NEBWORK <noreply@nebwork.com>
DISABLE_EMAIL=false                # Set to true to skip email in tests

# AI Services
MODEL_ACCESS_KEY=do-ai-...         # DigitalOcean AI Inference API key for DeepSeek model
EMBEDDING_API_KEY=sk-...           # Elice/OpenAI API key for Text Embedding 3 Large

# File Storage (DigitalOcean Spaces or AWS S3)
OS_ENDPOINT=https://sgp1.digitaloceanspaces.com  # S3-compatible endpoint
OS_ACCESS_KEY=your-access-key
OS_SECRET_KEY=your-secret-key
OS_BUCKET=your-bucket-name
OS_REGION=sgp1                     # Region (e.g., sgp1, nyc3, us-east-1)

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173  # Production frontend URL
```

### Environment Variable Validation

On startup, the server validates these **required** variables:
- `MONGO_URI`
- `JWT_SECRET`
- `NODE_ENV`
- `OS_ACCESS_KEY`
- `OS_SECRET_KEY`
- `OS_BUCKET`
- `MODEL_ACCESS_KEY`
- `EMBEDDING_API_KEY`

**If any are missing, the server will exit with an error.**

---

## Installation & Running

### Prerequisites
- Node.js 18.x or higher
- MongoDB (local or Atlas)
- npm 9.x or higher

### Install Dependencies

```powershell
npm install
```

### Start the Server

**Development Mode (with auto-reload):**
```powershell
npm run dev
```

**Production Mode:**
```powershell
npm start
```

### Stop All Node Processes (Windows)
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Health Check
```bash
# Check if server is running
curl http://localhost:5000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-11-07T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "development"
}
```

---

## API Endpoints

### Base URL
- **Development:** `http://localhost:5000`
- **Production:** `https://your-domain.com`

### Interactive API Documentation
- **Swagger UI:** `http://localhost:5000/api-docs`

---

### 🔐 Authentication Endpoints (`/api/auth`)

#### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Pass@123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "division": "Engineering"
  }
}
```

**Rate Limit:** 5 attempts per 15 minutes per IP

---

#### 2. Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

#### 3. Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "division": "Engineering",
  "profile_photo": "https://...",
  "join_date": "2025-01-15T00:00:00.000Z"
}
```

---

#### 4. Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "division": "Product"
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "user": { /* updated user object */ }
}
```

---

#### 5. Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset email sent",
  "resetToken": "abc123..."  // Only in development mode
}
```

**Rate Limit:** 5 attempts per 1 hour per email

---

#### 6. Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "abc123...",
  "newPassword": "NewPass@456"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

**Rate Limit:** 10 attempts per 15 minutes per token

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*...)

---

### 👥 Admin Endpoints (`/api/admin`)

**Required Role:** Admin only

#### 1. Get All Employees
```http
GET /api/admin/employees
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "email": "employee@example.com",
    "name": "Jane Doe",
    "role": "user",
    "division": "Marketing",
    "join_date": "2025-01-15T00:00:00.000Z"
  }
]
```

---

#### 2. Add Employee
```http
POST /api/admin/employees
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "email": "newemployee@example.com",
  "name": "Alice Johnson",
  "password": "Pass@123",
  "division": "Sales",
  "role": "user"
}
```

**Response (201 Created):**
```json
{
  "message": "Employee added successfully",
  "user": { /* new user object */ }
}
```

**Validation:**
- Email must be unique
- Password must meet strong password requirements

---

#### 3. Edit Employee
```http
PUT /api/admin/employees/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Alice Smith",
  "division": "Engineering"
}
```

**Response (200 OK):**
```json
{
  "message": "Employee updated successfully",
  "user": { /* updated user object */ }
}
```

---

#### 4. Delete Employee
```http
DELETE /api/admin/employees/:id
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
{
  "message": "Employee deleted successfully"
}
```

---

### 📝 WorkLog Endpoints (`/api/worklogs`)

#### 1. Get All WorkLogs (with filtering)
```http
GET /api/worklogs/filter?tag=meeting&startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer <token>
```

**Query Parameters:**
- `tag` (string): Filter by tag
- `startDate` (ISO date): Filter logs after this date
- `endDate` (ISO date): Filter logs before this date

**Response (200 OK):**
```json
{
  "worklogs": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Team Meeting Notes",
      "content": "Discussed Q4 goals...",
      "tag": ["meeting", "planning"],
      "media": ["https://..."],
      "user": {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "collaborators": [],
      "datetime": "2025-11-07T10:00:00.000Z",
      "createdAt": "2025-11-07T10:00:00.000Z",
      "updatedAt": "2025-11-07T10:00:00.000Z"
    }
  ]
}
```

---

#### 2. Get WorkLog by ID
```http
GET /api/worklogs/:id
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Team Meeting Notes",
  "content": "Discussed Q4 goals...",
  "tag": ["meeting"],
  "media": [],
  "user": { /* user object */ },
  "collaborators": [],
  "log_history": [],
  "datetime": "2025-11-07T10:00:00.000Z"
}
```

---

#### 3. Create WorkLog
```http
POST /api/worklogs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "New Project Kickoff",
  "content": "Project objectives and timeline...",
  "tag": ["project", "planning"],
  "media": []
}
```

**Response (201 Created):**
```json
{
  "message": "Worklog added successfully",
  "worklog": { /* new worklog object */ }
}
```

**Note:** AI embeddings are generated automatically in the background.

---

#### 4. Update WorkLog
```http
PUT /api/worklogs/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content...",
  "tag": ["project", "update"]
}
```

**Response (200 OK):**
```json
{
  "message": "Worklog updated successfully",
  "worklog": { /* updated worklog */ }
}
```

---

#### 5. Delete WorkLog
```http
DELETE /api/worklogs/:id
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Worklog and its log history deleted successfully"
}
```

---

#### 6. Add Version to WorkLog
```http
POST /api/worklogs/:id/versions
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Version 2",
  "content": "Updated content for version 2...",
  "tag": ["project", "v2"]
}
```

**Response (201 Created):**
```json
{
  "message": "New version added successfully",
  "version": { /* new version object */ }
}
```

---

#### 7. Get All Versions
```http
GET /api/worklogs/:id/versions
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "versions": [
    {
      "_id": "...",
      "worklog_id": "507f1f77bcf86cd799439011",
      "user_id": "...",
      "title": "Version 1",
      "content": "Original content...",
      "tag": ["project"],
      "datetime": "2025-11-07T10:00:00.000Z"
    }
  ]
}
```

---

#### 8. Add Collaborator
```http
POST /api/worklogs/:id/collaborators
Authorization: Bearer <token>
Content-Type: application/json

{
  "collaboratorId": "507f1f77bcf86cd799439012"
}
```

**Response (200 OK):**
```json
{
  "message": "Collaborator added successfully",
  "worklog": { /* updated worklog with collaborators */ }
}
```

---

#### 9. Get Collaborators
```http
GET /api/worklogs/:id/collaborators
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "collaborators": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "division": "Engineering"
    }
  ]
}
```

---

#### 10. Remove Collaborator
```http
DELETE /api/worklogs/:id/collaborators/:collaboratorId
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Collaborator removed successfully",
  "worklog": { /* updated worklog */ }
}
```

---

### 🤖 Chatbot Endpoints (`/api/chatbot`)

#### 1. Send Message to Chatbot
```http
POST /api/chatbot
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What are the project deliverables?",
  "session_id": "optional-session-id"
}
```

**Response (200 OK):**
```json
{
  "reply": "Based on the work logs, the project deliverables are...",
  "session_id": "abc123-def456-ghi789",
  "timestamp": "2025-11-07T10:00:00.000Z"
}
```

**How it works:**
1. User message is converted to embedding using Text Embedding 3 Large
2. System searches for similar work logs using vector similarity
3. Relevant logs are sent to DeepSeek-R1-Distill-Llama-70B as context
4. DeepSeek generates response based on work log knowledge

---

#### 2. Get Chat History
```http
GET /api/chatbot/history
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "sessions": [
    {
      "session_id": "abc123-def456-ghi789",
      "lastMessage": "What are the project deliverables?",
      "messageCount": 5,
      "lastActivity": "2025-11-07T10:00:00.000Z"
    }
  ]
}
```

---

#### 3. Get Messages from Session
```http
GET /api/chatbot/session/:session_id
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What are the project deliverables?",
      "timestamp": "2025-11-07T10:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "Based on the work logs, the project deliverables are...",
      "timestamp": "2025-11-07T10:00:02.000Z"
    }
  ]
}
```

---

#### 4. Delete Chat Session
```http
DELETE /api/chatbot/session/:session_id
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Chat session deleted successfully"
}
```

---

### 📤 Upload Endpoints (`/api/upload`)

#### 1. Upload Single File
```http
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary file data>
```

**Supported formats:** Images (jpg, jpeg, png, gif, webp), Documents (pdf, doc, docx)

**Response (200 OK):**
```json
{
  "url": "https://your-bucket.sgp1.digitaloceanspaces.com/uploads/abc123.jpg",
  "key": "uploads/abc123.jpg",
  "mimetype": "image/jpeg",
  "size": 102400
}
```

---

#### 2. Upload Multiple Files
```http
POST /api/upload/multiple
Authorization: Bearer <token>
Content-Type: multipart/form-data

files: <binary file data 1>
files: <binary file data 2>
...
```

**Max files:** 10 per request

**Response (200 OK):**
```json
{
  "files": [
    {
      "url": "https://...",
      "key": "uploads/abc123.jpg",
      "mimetype": "image/jpeg",
      "size": 102400
    },
    {
      "url": "https://...",
      "key": "uploads/def456.pdf",
      "mimetype": "application/pdf",
      "size": 204800
    }
  ]
}
```

---

#### 3. Delete File
```http
DELETE /api/upload
Authorization: Bearer <token>
Content-Type: application/json

{
  "key": "uploads/abc123.jpg"
}
```

**Response (200 OK):**
```json
{
  "message": "File deleted successfully"
}
```

---

#### 4. Delete Multiple Files
```http
DELETE /api/upload/multiple
Authorization: Bearer <token>
Content-Type: application/json

{
  "keys": ["uploads/abc123.jpg", "uploads/def456.pdf"]
}
```

**Response (200 OK):**
```json
{
  "message": "Files deleted successfully",
  "deleted": ["uploads/abc123.jpg", "uploads/def456.pdf"]
}
```

---

## Authentication & Authorization

### JWT Token Flow

1. **Login** → Server generates JWT token
2. **Token Storage** → Client stores token in `sessionStorage`
3. **Authenticated Requests** → Client sends token in `Authorization` header
4. **Token Verification** → Server verifies token signature and expiration
5. **Access Control** → Server checks user role for admin-only endpoints

### Token Structure

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "user",
  "iat": 1699350000,
  "exp": 1699954800
}
```

### Middleware Protection

**File:** `src/middlewares/authMiddleware.js`

#### `protect` Middleware
- Verifies JWT token
- Attaches `req.user` to request
- Returns 401 if token is invalid/expired

#### `isAdmin` Middleware
- Checks if `req.user.role === 'admin'`
- Returns 403 if user is not admin

**Usage Example:**
```javascript
router.post('/employees', protect, isAdmin, adminController.addEmployee);
```

---

## Security Features

### 1. Rate Limiting ✅

**Implementation:** `express-rate-limit`

**Endpoints Protected:**
- **Login:** 5 attempts per 15 minutes per IP
- **Forgot Password:** 5 requests per 1 hour per email
- **Reset Password:** 10 attempts per 15 minutes per token

**Custom Key Generators:**
```javascript
// Forgot Password: Rate limit by email
keyGenerator: (req) => req.body.email || req.ip

// Reset Password: Rate limit by token
keyGenerator: (req) => req.body.token || req.ip
```

**Benefits:**
- Prevents brute force attacks
- Prevents password reset abuse
- Protects against credential stuffing

---

### 2. Strong Password Policy ✅

**File:** `src/utils/passwordValidator.js`

**Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*...)

**Enforced at:**
- Admin → Add Employee
- Auth → Reset Password

**Example:**
```javascript
const { validatePassword } = require('../utils/passwordValidator');

const validation = validatePassword('Pass@123');
console.log(validation);
// { isValid: true, message: 'Password is strong' }
```

---

### 3. Security Headers (Helmet) ✅

**File:** `app.js`

**Headers Added:**
- `X-DNS-Prefetch-Control: off`
- `X-Frame-Options: SAMEORIGIN` (prevents clickjacking)
- `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
- `X-XSS-Protection: 0` (modern browsers use CSP)
- `Strict-Transport-Security` (HTTPS only)

**Configuration:**
```javascript
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
```

---

### 4. CORS Protection ✅

**Allowed Origins:**
- Development: `http://localhost:*` (all ports)
- Production: `process.env.FRONTEND_URL`

**Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers:** Origin, X-Requested-With, Content-Type, Accept, Authorization

---

### 5. Password Hashing ✅

**Library:** bcryptjs

**Implementation:** Mongoose pre-save hook

```javascript
UserSchema.pre('save', async function(next){
  if(!this.isModified('password')){
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

---

## Database Models

### User Model

**File:** `src/models/User.js`

```javascript
{
  email: String (required, unique),
  name: String (required),
  password: String (required, hashed),
  division: String (required),
  profile_photo: String,
  join_date: Date (default: now),
  role: String (enum: ['admin', 'user'], default: 'user'),
  resetPasswordToken: String,
  resetPasswordExpire: Date
}
```

**Methods:**
- `matchPassword(enteredPassword)` → Returns boolean

---

### WorkLog Model

**File:** `src/models/WorkLog.js`

```javascript
{
  title: String (required),
  content: String,
  tag: [String],
  media: [String],
  collaborators: [ObjectId → User],
  datetime: Date (default: now),
  user: ObjectId → User (required),
  log_history: [ObjectId → LogHistory],
  embedding: [Number] (vector, hidden by default),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- Text search on `title` and `content`

---

### LogHistory Model

**File:** `src/models/LogHistory.js`

```javascript
{
  worklog_id: ObjectId → WorkLog (required),
  user_id: ObjectId → User (required),
  title: String,
  content: String,
  tag: [String],
  media: [String],
  datetime: Date (default: now),
  embedding: [Number] (vector, hidden)
}
```

---

### Chat Model

**File:** `src/models/Chat.js`

```javascript
{
  session_id: String (required),
  user_id: ObjectId → User (required),
  messages: [
    {
      role: String (enum: ['user', 'assistant']),
      content: String,
      timestamp: Date
    }
  ],
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## Testing

### Test Suite

**Framework:** Jest + Supertest

**Files:**
- `src/test/auth.test.js` - Authentication tests
- `src/test/worklog.test.js` - WorkLog CRUD tests
- `src/test/version.test.js` - Versioning tests

### Run Tests

```powershell
npm test
```

### Test Configuration

**Environment Variables:**
- `MONGO_URI_TEST` - Test database URI (optional)
- `DISABLE_EMAIL=true` - Skip email sending during tests
- `JWT_SECRET` - Auto-set if not provided

**Setup:** `src/test/jest.setup.js`
- Sets test environment variables
- Configures MongoDB Memory Server (optional)

### Test Coverage

| Feature | Coverage |
|---------|----------|
| Authentication | ✅ Login, Logout, Profile |
| Password Reset | ✅ Forgot, Reset |
| WorkLog CRUD | ✅ Create, Read, Update, Delete |
| Versioning | ✅ Add, Get versions |
| Admin | ⚠️ Partial |
| Chatbot | ❌ Not tested |

---

## Additional Resources

### API Documentation

- **Swagger UI:** `http://localhost:5000/api-docs`

### Repository

- **GitHub:** https://github.com/kada-hackathon/backend

---

## Support

For issues, questions, or contributions:
- **Create an issue:** https://github.com/kada-hackathon/backend/issues
- **Contact Team:** Nebwork Team (KADA Group 2)

---

**Last Updated:** November 7, 2025  
**Version:** 1.0.0  
**License:** ISC
