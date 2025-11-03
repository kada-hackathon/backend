# 🚀 NEBWORK API - Complete Frontend Integration Guide

**Base URL:** `http://localhost:5000`  
**Version:** 1.0.0  
**Last Updated:** November 3, 2025

---

## 📋 Table of Contents
1. [Authentication](#1-authentication)
2. [Work Logs](#2-work-logs)
3. [File Uploads](#3-file-uploads)
4. [Admin (Employee Management)](#4-admin-employee-management)
5. [Chatbot](#5-chatbot-ai-assistant)
6. [Error Handling](#6-error-handling)
7. [Best Practices](#7-best-practices)

---

## 🔐 1. Authentication

All authenticated endpoints require a JWT token in the `Authorization` header:
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### 1.1 Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user and receive JWT token (valid for 7 days)

**Request Body:**
```json
{
  "email": "john.doe@gmail.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64b25ff43c99d68dca99a3a5",
    "email": "john.doe@gmail.com",
    "name": "John Doe",
    "division": "Engineering",
    "role": "user",
    "profilePicture": "https://nebwork-storage.sgp1.cdn.digitaloceanspaces.com/...",
    "dateOfJoin": "2025-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Missing email/password or invalid domain
- `401` - Invalid credentials
- `500` - Server error

**Allowed Email Domains:** `@gmail.com` or `@yahoo.com`

**Frontend Implementation:**
```javascript
async function login(email, password) {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    // Store token in localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }
  
  throw new Error(data.message);
}
```

---

### 1.2 Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Clear authentication cookie

**Request Body:** `{}`

**Response (200 OK):**
```json
{
  "message": "Logout successfully"
}
```

**Frontend Implementation:**
```javascript
async function logout() {
  await fetch('http://localhost:5000/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  // Clear local storage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
```

---

### 1.3 Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**Description:** Request password reset link via email (valid for 1 hour)

**Request Body:**
```json
{
  "email": "john.doe@gmail.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Email sent successfully"
}
```

**Error Responses:**
- `400` - Missing email
- `404` - User not found
- `500` - Email sending failed

**Email Content:**
```
Subject: Password Reset Request

Reset URL: http://localhost:8080/new-password/{resetToken}
Expires in: 1 hour
```

---

### 1.4 Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Description:** Reset password using token from email

**Request Body:**
```json
{
  "token": "abc123def456...",
  "password": "newPassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

**Error Responses:**
- `400` - Invalid or expired token
- `500` - Server error

---

### 1.5 Get User Profile

**Endpoint:** `GET /api/auth/profile`

**Authentication:** Required

**Description:** Get current authenticated user's profile

**Response (200 OK):**
```json
{
  "id": "64b25ff43c99d68dca99a3a5",
  "email": "john.doe@gmail.com",
  "name": "John Doe",
  "division": "Engineering",
  "role": "user",
  "profile_photo": "https://nebwork-storage.sgp1.cdn.digitaloceanspaces.com/...",
  "join_date": "2025-01-15T10:00:00.000Z"
}
```

---

### 1.6 Update User Profile

**Endpoint:** `PUT /api/auth/profile`

**Authentication:** Required

**Description:** Update user profile information

**Request Body:**
```json
{
  "name": "John Updated",
  "division": "Product",
  "profile_photo": "https://nebwork-storage.sgp1.cdn.digitaloceanspaces.com/..."
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "64b25ff43c99d68dca99a3a5",
    "email": "john.doe@gmail.com",
    "name": "John Updated",
    "division": "Product",
    "profile_photo": "https://...",
    "join_date": "2025-01-15T10:00:00.000Z"
  }
}
```

---

## 📝 2. Work Logs

### 2.1 Filter Work Logs (RECOMMENDED)

**Endpoint:** `GET /api/worklogs/filter`

**Authentication:** Required

**Description:** Search and filter work logs with advanced filtering. Only returns work logs from authenticated user's division.

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search by title or content (regex, case-insensitive) | `?search=AI` |
| `tag` | string | Filter by tags (comma-separated, OR logic) | `?tag=nodejs,react` |
| `from` | string | Start date (YYYY-MM-DD) | `?from=2024-10-01` |
| `to` | string | End date (YYYY-MM-DD) | `?to=2024-10-31` |

**Example Requests:**
```bash
# Search by title/content
GET /api/worklogs/filter?search=recruitment

# Filter by tags
GET /api/worklogs/filter?tag=nodejs,react

# Date range
GET /api/worklogs/filter?from=2024-10-01&to=2024-10-31

# Combined filters
GET /api/worklogs/filter?search=report&tag=hr,monthly&from=2024-10-01&to=2024-10-31
```

**Response (200 OK):**
```json
{
  "worklogs": [
    {
      "_id": "671b1f3f2c8d7b8a8c4b1234",
      "title": "AI Development Report",
      "content": "<p>Discussion about AI trends...</p>",
      "tag": ["nodejs", "react", "ai"],
      "datetime": "2024-10-15T10:30:00Z",
      "media": [
        {
          "url": "https://nebwork-storage.sgp1.cdn.digitaloceanspaces.com/2024/10/15/image_1697365800000.png",
          "type": "image",
          "name": "screenshot.png",
          "size": 245678
        }
      ],
      "user": {
        "_id": "500...",
        "name": "Afif Putra",
        "division": "HR",
        "email": "afif@company.com",
        "profile_photo": "https://..."
      },
      "collaborators": [
        {
          "_id": "501...",
          "name": "Jane Smith",
          "email": "jane@company.com"
        }
      ],
      "log_history": ["history_id_1", "history_id_2"]
    }
  ]
}
```

**Frontend Implementation:**
```javascript
async function filterWorkLogs({ search, tag, from, to }) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (tag) params.append('tag', tag);
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  
  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:5000/api/worklogs/filter?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
}
```

---

### 2.2 Get Work Log by ID

**Endpoint:** `GET /api/worklogs/{id}`

**Authentication:** Required

**Description:** Get detailed work log by ID (for reading/editing)

**Parameters:**
- `id` (path parameter) - Work log MongoDB ID

**Response (200 OK):**
```json
{
  "_id": "671b1f3f2c8d7b8a8c4b1234",
  "title": "Monthly Report",
  "content": "<p>Full TipTap editor content here...</p>",
  "tag": ["monthly", "report"],
  "media": [
    {
      "url": "https://nebwork-storage.sgp1.cdn.digitaloceanspaces.com/2024/10/15/file.pdf",
      "type": "document",
      "name": "report.pdf",
      "size": 1048576
    }
  ],
  "user": {
    "_id": "500...",
    "name": "John Doe",
    "email": "john@company.com",
    "division": "Engineering"
  },
  "collaborators": [
    {
      "_id": "501...",
      "name": "Jane Smith"
    }
  ],
  "log_history": ["history_1", "history_2"],
  "datetime": "2024-10-15T10:30:00Z",
  "embedding": [0.123, 0.456, ...] // 768-dimensional vector
}
```

**Error Responses:**
- `404` - Work log not found
- `500` - Server error

---

### 2.3 Create Work Log

**Endpoint:** `POST /api/worklogs`

**Authentication:** Required

**Description:** Create a new work log with automatic media upload and AI embedding generation

**Request Body:**
```json
{
  "title": "Weekly Development Update",
  "content": "<p>This week we worked on...</p><img src=\"https://nebwork-storage.sgp1.cdn.digitaloceanspaces.com/2024/11/03/inline_1730678400000.png\" />",
  "tag": ["development", "weekly"],
  "media": [
    {
      "url": "https://nebwork-storage.sgp1.cdn.digitaloceanspaces.com/2024/11/03/file_1730678400000.pdf",
      "type": "document",
      "name": "report.pdf",
      "size": 1048576
    }
  ]
}
```

**Important Notes:**
1. **Inline Images:** If your TipTap editor has inline images, use the `/api/upload` endpoint first, then embed the returned URL in the content HTML
2. **Media Attachments:** Upload files via `/api/upload` first, then include the returned metadata in the `media` array
3. **Embedding:** Generated automatically (768-dimensional vector for AI search)

**Response (201 Created):**
```json
{
  "_id": "671b1f3f2c8d7b8a8c4b1234",
  "title": "Weekly Development Update",
  "content": "<p>This week we worked on...</p>...",
  "tag": ["development", "weekly"],
  "media": [...],
  "user": "64b25ff43c99d68dca99a3a5",
  "datetime": "2024-11-03T10:30:00Z",
  "embedding": [0.123, ...]
}
```

**Frontend Implementation:**
```javascript
async function createWorkLog({ title, content, tag, media }) {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:5000/api/worklogs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, content, tag, media })
  });
  
  return await response.json();
}
```

---

### 2.4 Update Work Log

**Endpoint:** `PUT /api/worklogs/{id}`

**Authentication:** Required

**Description:** Update an existing work log (re-generates AI embedding)

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "<p>Updated content...</p>",
  "tag": ["updated", "tags"],
  "media": [...]
}
```

**Response (200 OK):**
```json
{
  "_id": "671b1f3f2c8d7b8a8c4b1234",
  "title": "Updated Title",
  "content": "<p>Updated content...</p>",
  "tag": ["updated", "tags"],
  "media": [...],
  "user": "64b25ff43c99d68dca99a3a5",
  "datetime": "2024-11-03T10:30:00Z",
  "embedding": [0.789, ...] // Re-generated
}
```

**Error Responses:**
- `404` - Work log not found
- `500` - Server error

---

### 2.5 Delete Work Log

**Endpoint:** `DELETE /api/worklogs/{id}`

**Authentication:** Required

**Description:** Delete work log and all associated media from DigitalOcean Spaces

**Response (200 OK):**
```json
{
  "message": "WorkLog deleted successfully"
}
```

**Error Responses:**
- `403` - Not allowed (only owner can delete)
- `404` - Work log not found
- `500` - Server error

**Important:** This will permanently delete:
- The work log document
- All inline images in content
- All media attachments from cloud storage

---

### 2.6 Add Collaborator

**Endpoint:** `POST /api/worklogs/{id}/collaborators`

**Authentication:** Required

**Description:** Add a collaborator to a work log by email

**Request Body:**
```json
{
  "email": "collaborator@gmail.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Collaborator added",
  "log": {
    "_id": "671b1f3f2c8d7b8a8c4b1234",
    "title": "Work Log Title",
    "collaborators": ["user_id_1", "user_id_2"]
  }
}
```

**Error Responses:**
- `404` - User or work log not found
- `500` - Server error

---

### 2.7 Get Collaborators

**Endpoint:** `GET /api/worklogs/{id}/collaborators`

**Authentication:** Required

**Description:** Get list of collaborators for a work log

**Response (200 OK):**
```json
{
  "message": "Collaborators retrieved successfully",
  "collaborators": [
    {
      "_id": "64b25ff43c99d68dca99a3a5",
      "name": "Jane Smith",
      "email": "jane@gmail.com",
      "division": "Engineering",
      "role": "user"
    },
    {
      "_id": "64b25ff43c99d68dca99a3a6",
      "name": "Bob Johnson",
      "email": "bob@gmail.com",
      "division": "Product",
      "role": "user"
    }
  ]
}
```

---

### 2.8 Delete Collaborator

**Endpoint:** `DELETE /api/worklogs/{id}/collaborators/{collaboratorId}`

**Authentication:** Required (only owner)

**Description:** Remove a collaborator from a work log

**Response (200 OK):**
```json
{
  "message": "Collaborator removed",
  "log": {
    "_id": "671b1f3f2c8d7b8a8c4b1234",
    "collaborators": ["remaining_user_id"]
  }
}
```

**Error Responses:**
- `403` - Access denied (only owner can delete collaborators)
- `404` - Work log not found
- `500` - Server error

---

### 2.9 Add Version

**Endpoint:** `POST /api/worklogs/{id}/versions`

**Authentication:** Required

**Description:** Add a version entry to work log history

**Request Body:**
```json
{
  "message": "Updated quarterly goals section"
}
```

**Response (201 Created):**
```json
{
  "message": "Version added",
  "version": {
    "_id": "version_id_123",
    "message": "Updated quarterly goals section",
    "user": "user_id",
    "datetime": "2024-11-03T10:30:00Z"
  }
}
```

---

### 2.10 Get Versions

**Endpoint:** `GET /api/worklogs/{id}/versions`

**Authentication:** Required

**Description:** Get version history for a work log (only owner/collaborators)

**Response (200 OK):**
```json
{
  "worklog_id": "671b1f3f2c8d7b8a8c4b1234",
  "title": "Work Log Title",
  "versions": [
    {
      "_id": "version_id_1",
      "message": "Initial creation",
      "datetime": "2024-10-01T10:00:00Z",
      "user": {
        "name": "John Doe",
        "email": "john@gmail.com",
        "division": "Engineering",
        "profile_photo": "https://..."
      }
    },
    {
      "_id": "version_id_2",
      "message": "Updated quarterly goals section",
      "datetime": "2024-11-03T10:30:00Z",
      "user": {
        "name": "Jane Smith",
        "email": "jane@gmail.com",
        "division": "Product",
        "profile_photo": "https://..."
      }
    }
  ]
}
```

**Error Responses:**
- `403` - Not allowed (only owner/collaborators can view)
- `404` - Work log not found
- `500` - Server error

---

## 📤 3. File Uploads

### 3.1 Upload Single File

**Endpoint:** `POST /api/upload`

**Authentication:** Required

**Description:** Upload a single file to DigitalOcean Spaces CDN

**Request:** `multipart/form-data`

**Form Data:**
- `file` (File) - The file to upload

**Supported File Types:**
- **Images:** jpeg, png, gif, webp, svg
- **Videos:** mp4, mpeg, quicktime, avi, webm
- **Documents:** pdf, doc, docx, xls, xlsx, ppt, pptx

**File Size Limit:** 100MB per file

**Response (200 OK):**
```json
{
  "success": true,
  "url": "https://nebwork-storage.sgp1.cdn.digitaloceanspaces.com/nebwork-storage/2024/11/03/file_name_1730678400000.png",
  "type": "image",
  "name": "file_name.png",
  "size": 245678
}
```

**Error Responses:**
- `400` - No file provided / Invalid field name
- `413` - File too large (>100MB)
- `415` - Unsupported file type
- `500` - Upload failed

**Frontend Implementation (React + Axios):**
```javascript
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const token = localStorage.getItem('token');
  
  const response = await axios.post(
    'http://localhost:5000/api/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log(`Upload Progress: ${percentCompleted}%`);
      }
    }
  );
  
  return response.data;
}

// Usage
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const result = await uploadFile(file);
    console.log('Uploaded:', result.url);
    // Use result.url in your work log media array
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

**Frontend Implementation (Vanilla JS Fetch):**
```javascript
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:5000/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type, let browser set it with boundary
    },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
}
```

---

### 3.2 Upload Multiple Files

**Endpoint:** `POST /api/upload/multiple`

**Authentication:** Required

**Description:** Upload multiple files at once

**Request:** `multipart/form-data`

**Form Data:**
- `files[]` (File[]) - Array of files to upload

**Response (200 OK):**
```json
{
  "success": true,
  "files": [
    {
      "url": "https://nebwork-storage.sgp1.cdn.digitaloceanspaces.com/nebwork-storage/2024/11/03/file1_1730678400000.png",
      "type": "image",
      "name": "file1.png",
      "size": 245678
    },
    {
      "url": "https://nebwork-storage.sgp1.cdn.digitaloceanspaces.com/nebwork-storage/2024/11/03/file2_1730678401000.pdf",
      "type": "document",
      "name": "file2.pdf",
      "size": 1048576
    }
  ],
  "count": 2
}
```

**Frontend Implementation:**
```javascript
async function uploadMultipleFiles(files) {
  const formData = new FormData();
  
  // Append all files
  files.forEach(file => {
    formData.append('files', file);
  });
  
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:5000/api/upload/multiple', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return await response.json();
}

// Usage
const handleMultipleUpload = async (event) => {
  const files = Array.from(event.target.files);
  
  try {
    const result = await uploadMultipleFiles(files);
    console.log(`Uploaded ${result.count} files:`, result.files);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

---

### 3.3 Delete File

**Endpoint:** `DELETE /api/upload`

**Authentication:** Required

**Description:** Delete a file from DigitalOcean Spaces

**Request Body:**
```json
{
  "url": "https://nebwork-storage.sgp1.cdn.digitaloceanspaces.com/nebwork-storage/2024/11/03/file_1730678400000.png"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**Error Responses:**
- `400` - No URL provided
- `500` - Deletion failed

---

### 3.4 Delete Multiple Files

**Endpoint:** `DELETE /api/upload/multiple`

**Authentication:** Required

**Description:** Delete multiple files from DigitalOcean Spaces

**Request Body:**
```json
{
  "urls": [
    "https://nebwork-storage.sgp1.cdn.digitaloceanspaces.com/nebwork-storage/2024/11/03/file1.png",
    "https://nebwork-storage.sgp1.cdn.digitaloceanspaces.com/nebwork-storage/2024/11/03/file2.pdf"
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "2 files deleted successfully",
  "deleted": 2
}
```

---

## 👥 4. Admin (Employee Management)

### 4.1 Add Employee

**Endpoint:** `POST /api/admin/employees`

**Authentication:** Required (admin only)

**Description:** Create a new employee account

**Request Body:**
```json
{
  "email": "newemployee@gmail.com",
  "password": "password123",
  "name": "John Smith",
  "division": "Engineering",
  "role": "user"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Employee added successfully",
  "data": {
    "id": "64b25ff43c99d68dca99a3a5",
    "email": "newemployee@gmail.com",
    "name": "John Smith",
    "division": "Engineering",
    "role": "user",
    "join_date": "2024-11-03T10:30:00Z"
  }
}
```

**Error Responses:**
- `400` - Validation error / Invalid domain / User exists
- `500` - Server error

**Error Codes:**
- `VALIDATION_ERROR` - Missing required fields
- `INVALID_EMAIL_DOMAIN` - Email not from gmail.com or yahoo.com
- `USER_EXISTS` - Email already registered

---

### 4.2 Edit Employee

**Endpoint:** `PUT /api/admin/employees/{id}`

**Authentication:** Required (admin only)

**Description:** Update employee information

**Request Body:**
```json
{
  "email": "updated@gmail.com",
  "name": "John Smith Updated",
  "division": "Product",
  "role": "admin",
  "join_date": "2024-01-15T00:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Employee updated successfully",
  "data": {
    "id": "64b25ff43c99d68dca99a3a5",
    "email": "updated@gmail.com",
    "name": "John Smith Updated",
    "division": "Product",
    "role": "admin",
    "join_date": "2024-01-15T00:00:00Z"
  }
}
```

**Error Responses:**
- `400` - Invalid email domain
- `404` - Employee not found
- `500` - Server error

---

### 4.3 Delete Employee

**Endpoint:** `DELETE /api/admin/employees/{id}`

**Authentication:** Required (admin only)

**Description:** Delete an employee account

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Employee deleted successfully"
}
```

**Error Responses:**
- `404` - Employee not found
- `500` - Server error

---

### 4.4 Get Employees List

**Endpoint:** `GET /api/admin/employees`

**Authentication:** Required

**Description:** Get paginated list of all employees

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |

**Example Requests:**
```bash
GET /api/admin/employees?page=1&limit=10
GET /api/admin/employees?page=2&limit=20
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "employees": [
      {
        "_id": "64b25ff43c99d68dca99a3a5",
        "email": "john@gmail.com",
        "name": "John Doe",
        "division": "Engineering",
        "role": "user",
        "join_date": "2024-01-15T00:00:00Z",
        "profile_photo": "https://..."
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
}
```

**Frontend Implementation:**
```javascript
async function getEmployees(page = 1, limit = 10) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(
    `http://localhost:5000/api/admin/employees?page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return await response.json();
}
```

---

## 🤖 5. Chatbot (AI Assistant)

### 5.1 Send Message to Chatbot

**Endpoint:** `POST /api/chatbot`

**Authentication:** Required

**Description:** Ask the AI assistant questions about work logs. Uses RAG (Retrieval-Augmented Generation) to provide accurate answers based on your organization's work logs.

**Request Body:**
```json
{
  "message": "What did John work on last week?",
  "session_id": "optional-uuid-for-conversation-history"
}
```

**Response (200 OK):**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "What did John work on last week?",
  "response": "According to the work logs, John worked on the following tasks last week:\n\n1. **AI Development Report** (Oct 15, 2024)\n   - Researched latest AI trends\n   - Implemented new chatbot features\n   - Updated documentation\n\n2. **Database Optimization** (Oct 17, 2024)\n   - Optimized query performance\n   - Added indexes to user table\n   - Reduced response time by 40%\n\nWould you like more details about any of these tasks?",
  "context_logs_count": 3,
  "processing_time": "6234ms",
  "breakdown": {
    "embedding_generation": "1856ms",
    "vector_search": "284ms",
    "ai_generation": "4094ms"
  }
}
```

**Important Notes:**
1. **Session ID:** Optional. Provide to maintain conversation context
2. **Processing Time:** First request may take 6-9 seconds (cache cold), subsequent requests 4-7 seconds
3. **Context:** AI uses semantic search to find relevant work logs from your division
4. **Cache:** Embeddings and searches are cached for better performance

**Error Responses:**
- `400` - Empty message
- `404` - No work logs found (handled gracefully)
- `500` - Service failure
- `502` - AI API unavailable

**Frontend Implementation:**
```javascript
async function askChatbot(message, sessionId = null) {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:5000/api/chatbot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message,
      session_id: sessionId
    })
  });
  
  return await response.json();
}

// Usage
const handleChatMessage = async (message) => {
  try {
    const result = await askChatbot(message, currentSessionId);
    
    // Update UI with response
    displayMessage('user', message);
    displayMessage('bot', result.response);
    
    // Store session ID for conversation continuity
    currentSessionId = result.session_id;
    
    console.log(`Response time: ${result.processing_time}`);
  } catch (error) {
    console.error('Chatbot error:', error);
  }
};
```

---

### 5.2 Get Chat History

**Endpoint:** `GET /api/chatbot/session/{session_id}`

**Authentication:** Required

**Description:** Retrieve conversation history for a session

**Response (200 OK):**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "messages": [
    {
      "_id": "message_id_1",
      "role": "user",
      "content": "What did John work on last week?",
      "timestamp": "2024-11-03T10:30:00Z"
    },
    {
      "_id": "message_id_2",
      "role": "assistant",
      "content": "According to the work logs, John worked on...",
      "timestamp": "2024-11-03T10:30:06Z",
      "context_logs_count": 3
    }
  ],
  "user": {
    "_id": "user_id",
    "name": "Current User",
    "division": "Engineering"
  },
  "created_at": "2024-11-03T10:30:00Z",
  "updated_at": "2024-11-03T10:30:06Z"
}
```

**Error Responses:**
- `404` - Session not found
- `500` - Server error

---

## ⚠️ 6. Error Handling

### Standard Error Response Format

All errors follow this consistent structure:

```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

### Common HTTP Status Codes

| Code | Meaning | When to Handle |
|------|---------|----------------|
| `400` | Bad Request | Validation errors, missing required fields |
| `401` | Unauthorized | Invalid/missing token, wrong credentials |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `413` | Payload Too Large | File size exceeds limit |
| `415` | Unsupported Media Type | Invalid file type |
| `500` | Internal Server Error | Backend error |
| `502` | Bad Gateway | External service unavailable (AI API) |

### Frontend Error Handling Template

```javascript
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      // Handle specific error codes
      switch (response.status) {
        case 401:
          // Token expired or invalid - redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        
        case 403:
          // Insufficient permissions
          showNotification('You do not have permission to perform this action', 'error');
          break;
        
        case 404:
          showNotification('Resource not found', 'error');
          break;
        
        case 413:
          showNotification('File is too large. Maximum size is 100MB', 'error');
          break;
        
        case 500:
          showNotification('Server error. Please try again later', 'error');
          break;
        
        default:
          showNotification(data.message || 'An error occurred', 'error');
      }
      
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}
```

---

## 💡 7. Best Practices

### 7.1 Authentication

**Token Storage:**
```javascript
// ✅ Good: Store in localStorage
localStorage.setItem('token', token);

// ❌ Bad: Store in cookies (vulnerable to CSRF)
document.cookie = `token=${token}`;
```

**Token Expiry Handling:**
```javascript
// Check token on app load
function checkAuth() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    redirectToLogin();
    return false;
  }
  
  // Decode JWT to check expiry (use jwt-decode library)
  const decoded = jwtDecode(token);
  const isExpired = decoded.exp * 1000 < Date.now();
  
  if (isExpired) {
    localStorage.removeItem('token');
    redirectToLogin();
    return false;
  }
  
  return true;
}
```

---

### 7.2 File Uploads

**Upload Workflow:**

```javascript
// Step 1: Upload file first
async function handleWorkLogSubmission(title, content, tags, files) {
  try {
    // 1. Upload all files first
    const uploadedFiles = [];
    for (const file of files) {
      const result = await uploadFile(file);
      uploadedFiles.push({
        url: result.url,
        type: result.type,
        name: result.name,
        size: result.size
      });
    }
    
    // 2. Create work log with uploaded URLs
    await createWorkLog({
      title,
      content, // TipTap HTML with CDN image URLs
      tag: tags,
      media: uploadedFiles
    });
    
    showNotification('Work log created successfully', 'success');
  } catch (error) {
    showNotification('Failed to create work log', 'error');
  }
}
```

**File Size Validation:**
```javascript
function validateFile(file) {
  const maxSize = 100 * 1024 * 1024; // 100MB
  
  if (file.size > maxSize) {
    throw new Error('File size exceeds 100MB limit');
  }
  
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm',
    'application/pdf'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not supported');
  }
}
```

**Progress Tracking:**
```javascript
async function uploadWithProgress(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(percentComplete);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error('Upload failed'));
      }
    });
    
    xhr.open('POST', 'http://localhost:5000/api/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);
    xhr.send(formData);
  });
}
```

---

### 7.3 Work Logs

**Filtering Example:**
```javascript
// Create a reusable filter function
function buildWorkLogFilters({ searchTerm, selectedTags, dateRange }) {
  const params = {};
  
  if (searchTerm && searchTerm.trim()) {
    params.search = searchTerm.trim();
  }
  
  if (selectedTags && selectedTags.length > 0) {
    params.tag = selectedTags.join(',');
  }
  
  if (dateRange && dateRange.from) {
    params.from = dateRange.from; // YYYY-MM-DD format
  }
  
  if (dateRange && dateRange.to) {
    params.to = dateRange.to;
  }
  
  return params;
}

// Usage
const filters = buildWorkLogFilters({
  searchTerm: 'AI development',
  selectedTags: ['nodejs', 'react'],
  dateRange: {
    from: '2024-10-01',
    to: '2024-10-31'
  }
});

const results = await filterWorkLogs(filters);
```

**Debounced Search:**
```javascript
// Prevent excessive API calls while typing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Usage
const debouncedSearch = debounce(async (searchTerm) => {
  const results = await filterWorkLogs({ search: searchTerm });
  updateUI(results);
}, 500); // Wait 500ms after user stops typing

// In your search input handler
searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});
```

---

### 7.4 Chatbot Integration

**Session Management:**
```javascript
class ChatbotManager {
  constructor() {
    this.sessionId = this.loadSessionId();
  }
  
  loadSessionId() {
    return sessionStorage.getItem('chatbot_session_id');
  }
  
  saveSessionId(sessionId) {
    sessionStorage.setItem('chatbot_session_id', sessionId);
    this.sessionId = sessionId;
  }
  
  async sendMessage(message) {
    const result = await askChatbot(message, this.sessionId);
    
    // Save session ID from response
    if (result.session_id) {
      this.saveSessionId(result.session_id);
    }
    
    return result;
  }
  
  clearSession() {
    sessionStorage.removeItem('chatbot_session_id');
    this.sessionId = null;
  }
}

// Usage
const chatbot = new ChatbotManager();

async function handleChatSubmit(message) {
  showTypingIndicator();
  
  try {
    const result = await chatbot.sendMessage(message);
    displayMessage('bot', result.response);
    displayProcessingTime(result.processing_time);
  } catch (error) {
    displayError('Failed to get response');
  } finally {
    hideTypingIndicator();
  }
}
```

**Loading States:**
```javascript
async function askChatbotWithLoading(message) {
  const loadingToast = showToast('AI is thinking...', { type: 'info', duration: 0 });
  
  try {
    const result = await askChatbot(message);
    
    hideToast(loadingToast);
    
    // Show processing time if slow
    if (parseInt(result.processing_time) > 8000) {
      showToast('Response took longer than usual', { type: 'warning' });
    }
    
    return result;
  } catch (error) {
    hideToast(loadingToast);
    showToast('Failed to get response from AI', { type: 'error' });
    throw error;
  }
}
```

---

### 7.5 Performance Optimization

**Lazy Loading Work Logs:**
```javascript
class WorkLogList {
  constructor() {
    this.page = 1;
    this.limit = 20;
    this.loading = false;
    this.hasMore = true;
  }
  
  async loadMore() {
    if (this.loading || !this.hasMore) return;
    
    this.loading = true;
    
    try {
      const results = await filterWorkLogs({
        ...this.currentFilters,
        page: this.page,
        limit: this.limit
      });
      
      if (results.worklogs.length < this.limit) {
        this.hasMore = false;
      }
      
      this.appendWorkLogs(results.worklogs);
      this.page++;
    } finally {
      this.loading = false;
    }
  }
  
  setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        this.loadMore();
      }
    });
  }
}
```

**Image Optimization:**
```javascript
// Use CDN URLs for better performance
function getOptimizedImageUrl(url, width = 800) {
  // DigitalOcean Spaces CDN automatically serves optimized images
  return url; // CDN handles optimization
}

// Lazy load images
function setupLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
}
```

---

### 7.6 Security Best Practices

**Input Sanitization:**
```javascript
// Sanitize user input before sending to API
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS
    .substring(0, 10000); // Limit length
}

// Usage
const workLog = {
  title: sanitizeInput(titleInput.value),
  content: editorContent, // TipTap handles sanitization
  tag: tags.map(t => sanitizeInput(t))
};
```

**CORS Configuration:**
```javascript
// Your frontend should use consistent origin
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.yourcompany.com'
  : 'http://localhost:5000';

// Always use HTTPS in production
```

---

## 📚 Complete Integration Example

Here's a complete React component example:

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

// Configure axios defaults
axios.defaults.baseURL = API_BASE;
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function WorkLogApp() {
  const [workLogs, setWorkLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    tag: '',
    from: '',
    to: ''
  });

  // Load work logs with filters
  useEffect(() => {
    loadWorkLogs();
  }, [filters]);

  async function loadWorkLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.tag) params.append('tag', filters.tag);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);

      const response = await axios.get(`/api/worklogs/filter?${params}`);
      setWorkLogs(response.data.worklogs);
    } catch (error) {
      console.error('Failed to load work logs:', error);
      alert('Failed to load work logs');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  async function createWorkLog(data) {
    try {
      const response = await axios.post('/api/worklogs', data);
      setWorkLogs([response.data, ...workLogs]);
      alert('Work log created successfully');
    } catch (error) {
      console.error('Failed to create work log:', error);
      alert('Failed to create work log');
    }
  }

  return (
    <div>
      {/* Your UI components */}
      <h1>Work Logs</h1>
      
      {/* Filters */}
      <input
        type="text"
        placeholder="Search..."
        value={filters.search}
        onChange={e => setFilters({ ...filters, search: e.target.value })}
      />
      
      {/* Work logs list */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {workLogs.map(log => (
            <li key={log._id}>
              <h3>{log.title}</h3>
              <div dangerouslySetInnerHTML={{ __html: log.content }} />
              <p>By: {log.user.name} ({log.user.division})</p>
              <p>Tags: {log.tag.join(', ')}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default WorkLogApp;
```

---

## 🔗 Quick Reference

### Base URL
```
http://localhost:5000
```

### Authentication Header
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### CDN Base URL
```
https://nebwork-storage.sgp1.cdn.digitaloceanspaces.com
```

### Common Endpoints Quick List
```
Authentication:
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/profile
PUT    /api/auth/profile

Work Logs:
GET    /api/worklogs/filter
GET    /api/worklogs/{id}
POST   /api/worklogs
PUT    /api/worklogs/{id}
DELETE /api/worklogs/{id}

Collaborators:
POST   /api/worklogs/{id}/collaborators
GET    /api/worklogs/{id}/collaborators
DELETE /api/worklogs/{id}/collaborators/{collaboratorId}

Versions:
POST   /api/worklogs/{id}/versions
GET    /api/worklogs/{id}/versions

File Uploads:
POST   /api/upload
POST   /api/upload/multiple
DELETE /api/upload
DELETE /api/upload/multiple

Admin:
POST   /api/admin/employees
PUT    /api/admin/employees/{id}
DELETE /api/admin/employees/{id}
GET    /api/admin/employees

Chatbot:
POST   /api/chatbot
GET    /api/chatbot/session/{session_id}
```

---

## 📞 Support

For issues or questions, contact the backend team or refer to:
- Swagger Documentation: `http://localhost:5000/api-docs`
- GitHub Issues: [Your Repository]
- Slack Channel: #backend-support

---

**Document Version:** 1.0.0  
**Last Updated:** November 3, 2025  
**Maintained By:** Backend Team
