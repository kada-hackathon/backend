# 📚 WorkLog API Endpoints Summary

## Overview
Complete API documentation for the WorkLog Management System after optimization and cleanup.

---

## 🔍 READ OPERATIONS

### 1. **Filter Work Logs** (RECOMMENDED - Use this for all list operations)
```
GET /api/worklogs/filter
```

**Purpose:** Search, filter, and retrieve work logs with advanced filtering capabilities.
- Only returns work logs from the authenticated user's division
- Supports multiple filter criteria (can be combined)

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search by title or content (regex, case-insensitive) | `search=AI` |
| `tag` | string | Filter by tags (comma-separated, OR logic) | `tag=nodejs,react` |
| `from` | string | Start date (YYYY-MM-DD) | `from=2024-10-01` |
| `to` | string | End date (YYYY-MM-DD) | `to=2024-10-31` |

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

**Response:**
```json
{
  "worklogs": [
    {
      "_id": "671b1f3f2c8d7b8a8c4b1234",
      "title": "AI Development Report",
      "content": "Discussion about AI trends...",
      "tag": ["nodejs", "react"],
      "datetime": "2024-10-15T10:30:00Z",
      "user": {
        "_id": "500...",
        "name": "Afif Putra",
        "division": "HR",
        "email": "afif@company.com"
      },
      "collaborators": [...]
    }
  ]
}
```

**Used By:**
- Navbar (get available tags)
- HomeContent (display filtered posts)
- WorkLogList (display user's filtered worklogs)

---

### 2. **Get Work Log by ID**
```
GET /api/worklogs/{id}
```

**Purpose:** Retrieve a specific work log with full details (for reading/editing).

**Parameters:**
| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `id` | string | Path | Work log MongoDB ID |

**Example Request:**
```bash
GET /api/worklogs/671b1f3f2c8d7b8a8c4b1234
```

**Response:**
```json
{
  "_id": "671b1f3f2c8d7b8a8c4b1234",
  "title": "Monthly Report",
  "content": "Full content here...",
  "tag": ["monthly", "report"],
  "media": ["image1.png"],
  "user": {...},
  "collaborators": [...],
  "log_history": [...],
  "datetime": "2024-10-15T10:30:00Z"
}
```

**Used By:**
- BlogPost (read-only view)
- BlogEditor (edit view)

---

## ✍️ CREATE OPERATIONS

### **Create Work Log**
```
POST /api/worklogs
```

**Purpose:** Create a new work log entry.

**Request Body:**
```json
{
  "title": "Design System Update",
  "content": "Updated the color palette and spacing system",
  "tag": ["UI", "Design"],
  "media": ["screenshot1.png"]
}
```

**Response:** Created work log object (201)

---

## 🔄 UPDATE OPERATIONS

### **Update Work Log**
```
PUT /api/worklogs/{id}
```

**Purpose:** Edit an existing work log.

**Request Body:** (any fields to update)
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "tag": ["updated", "tags"]
}
```

**Response:** Updated work log object (200)

---

## 🗑️ DELETE OPERATIONS

### **Delete Work Log**
```
DELETE /api/worklogs/{id}
```

**Purpose:** Delete a work log (only owner can delete).

**Response:** Success message (200)

---

## 📝 VERSION MANAGEMENT

### **Add Version**
```
POST /api/worklogs/{id}/versions
```

**Purpose:** Create a version snapshot of the work log.

**Request Body:**
```json
{
  "message": "Added section for responsive layout"
}
```

### **Get Versions**
```
GET /api/worklogs/{id}/versions
```

**Purpose:** Retrieve all version history for a work log.

**Response:**
```json
{
  "worklog_id": "...",
  "title": "...",
  "versions": [
    {
      "_id": "...",
      "message": "User updated the content",
      "datetime": "2024-10-15T10:30:00Z",
      "user": {...}
    }
  ]
}
```

---

## 👥 COLLABORATOR MANAGEMENT

### **Add Collaborator**
```
POST /api/worklogs/{id}/collaborators
```

**Request Body:**
```json
{
  "email": "collaborator@company.com"
}
```

### **Get Collaborators**
```
GET /api/worklogs/{id}/collaborators
```

**Response:**
```json
{
  "message": "Collaborators retrieved successfully",
  "collaborators": [
    {
      "_id": "...",
      "name": "John Doe",
      "email": "john@company.com",
      "division": "IT"
    }
  ]
}
```

### **Remove Collaborator**
```
DELETE /api/worklogs/{id}/collaborators/{collaboratorId}
```

---

## 📊 REMOVED ENDPOINTS

### ❌ `GET /api/worklogs` (getAllWorkLogs)
**Status:** REMOVED (v1.1.0)

**Reason:** Redundant with `/filter` endpoint. All use cases are now covered by:
- `/filter` (with no parameters) → Returns all worklogs from user's division
- `/filter` (with parameters) → Advanced filtering

**Migration Path:**
```javascript
// Old
GET /api/worklogs

// New
GET /api/worklogs/filter  // ← No parameters = get all
```

---

## 🔐 AUTHENTICATION

All endpoints require JWT Bearer token in Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🛡️ SECURITY FEATURES

### Division-Aware Filtering
- `/filter` endpoint only returns worklogs from the authenticated user's division
- Prevents cross-division data leakage

### Authorization Checks
- DELETE operations: Only owner can delete
- Version access: Only owner or collaborator can view versions
- Collaborator management: Only owner can manage collaborators

---

## 📈 PERFORMANCE NOTES

1. **Use `/filter` endpoint** instead of fetching all and filtering client-side
2. **Combine filter criteria** when possible (single API call)
3. **Pagination** (if needed in future) should be added to `/filter`

---

## 🧪 TESTING EXAMPLES

### Test Filter Endpoint
```bash
# 1. Get all worklogs from user's division
curl -H "Authorization: Bearer {token}" \
  "http://localhost:5000/api/worklogs/filter"

# 2. Search by title
curl -H "Authorization: Bearer {token}" \
  "http://localhost:5000/api/worklogs/filter?search=recruitment"

# 3. Filter by tags (multiple)
curl -H "Authorization: Bearer {token}" \
  "http://localhost:5000/api/worklogs/filter?tag=nodejs,react"

# 4. Combined filters
curl -H "Authorization: Bearer {token}" \
  "http://localhost:5000/api/worklogs/filter?search=report&tag=monthly&from=2024-10-01&to=2024-10-31"
```

---

## 📋 QUICK REFERENCE

| Operation | Endpoint | Method | Auth | Status |
|-----------|----------|--------|------|--------|
| Filter/Search | `/filter` | GET | ✅ | ✅ Active |
| Get Detail | `/{id}` | GET | ✅ | ✅ Active |
| Create | `/` | POST | ✅ | ✅ Active |
| Update | `/{id}` | PUT | ✅ | ✅ Active |
| Delete | `/{id}` | DELETE | ✅ | ✅ Active |
| Add Version | `/{id}/versions` | POST | ✅ | ✅ Active |
| Get Versions | `/{id}/versions` | GET | ✅ | ✅ Active |
| Add Collaborator | `/{id}/collaborators` | POST | ✅ | ✅ Active |
| Get Collaborators | `/{id}/collaborators` | GET | ✅ | ✅ Active |
| Remove Collaborator | `/{id}/collaborators/{colId}` | DELETE | ✅ | ✅ Active |
| ~~Get All~~ | `~~~/~~` | ~~GET~~ | ✅ | ❌ Removed |

---

**Last Updated:** October 31, 2025
**API Version:** 1.1.0
**Swagger Docs:** http://localhost:5000/api-docs
