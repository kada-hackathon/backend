# 🗑️ Upload Cleanup Strategy

## Problem: Orphaned Files

When users upload files via `/api/upload` but don't save the worklog, files remain in DigitalOcean Spaces forever (orphaned files).

```
User uploads → GET URL → User cancels/refreshes page → File still in Spaces ❌
```

---

## ✅ Solutions Implemented

### 1. **Manual Delete Endpoint (Implemented)**

Frontend can delete uploaded files if user cancels/removes them.

#### **Delete Single File:**
```javascript
DELETE /api/upload
Body: { "url": "https://your-space.com/file.jpg" }
```

#### **Delete Multiple Files:**
```javascript
DELETE /api/upload/multiple
Body: { "urls": ["url1", "url2", "url3"] }
```

#### **Frontend Implementation Example:**
```javascript
// Tiptap: Track uploaded files
const uploadedFiles = [];

// When user uploads
async function handleUpload(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch('/api/upload', { 
    method: 'POST', 
    body: formData 
  });
  
  const { url } = await res.json();
  uploadedFiles.push(url); // Track it
  return url;
}

// When user removes from editor
async function handleRemove(url) {
  await fetch('/api/upload', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  
  uploadedFiles = uploadedFiles.filter(u => u !== url);
}

// When user cancels/leaves page without saving
window.addEventListener('beforeunload', async (e) => {
  if (uploadedFiles.length > 0 && !worklogSaved) {
    // Cleanup uploaded files
    await fetch('/api/upload/multiple', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: uploadedFiles })
    });
  }
});
```

---

## 🔄 Alternative Solutions

### 2. **Temporary Upload Folder (Recommended for Production)**

Upload to `/temp/` folder first, move to permanent location only after worklog is saved.

```javascript
// In uploadController.js
const url = await uploadBase64ToSpaces(base64Data, filename, 'temp'); // Upload to temp

// In workLogController.js (after save)
const permanentUrl = await moveFromTempToPermanent(tempUrl);
```

Then run a daily cleanup job to delete old temp files:
```javascript
// cleanup.js
const deleteOldTempFiles = async () => {
  const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  // List and delete files in /temp/ older than cutoffDate
};
```

### 3. **Database Tracking (Most Robust)**

Track all uploads in a separate collection:

```javascript
// UploadTracking Schema
{
  url: String,
  uploadedBy: ObjectId,
  uploadedAt: Date,
  status: 'pending' | 'used' | 'orphaned',
  worklogId: ObjectId // null if not yet used
}
```

Then:
- Mark as `'used'` when worklog is saved
- Run cleanup job to delete `'pending'` files older than 24 hours

### 4. **Frontend Base64 Only (Simplest)**

Don't use `/api/upload` endpoint at all - just send base64 directly to `/api/worklogs`. No orphan problem!

**Trade-off:** Larger payloads, no progress bar for large files.

---

## 🎯 Recommended Approach

**For your current setup:**

1. ✅ **Use the DELETE endpoints** (already implemented)
2. ✅ **Frontend cleanup on cancel/beforeunload**
3. ⚠️ **Optional:** Add a weekly cleanup script for very old orphaned files

**Example cleanup script:**
```javascript
// scripts/cleanupOrphanedFiles.js
const { listAllFilesInSpaces, deleteFromSpaces } = require('../services/mediaService');
const WorkLog = require('../models/WorkLog');

async function cleanupOldOrphanedFiles() {
  const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  
  // Get all file URLs from database
  const worklogs = await WorkLog.find({}, 'media content');
  const usedUrls = new Set();
  
  worklogs.forEach(log => {
    log.media.forEach(m => usedUrls.add(m.url));
    // Also extract from content...
  });
  
  // List all files in Spaces uploaded before cutoff
  const allFiles = await listAllFilesInSpaces();
  const oldFiles = allFiles.filter(f => f.lastModified < cutoffDate);
  
  // Delete files not in database
  for (const file of oldFiles) {
    if (!usedUrls.has(file.url)) {
      console.log(`Deleting orphaned file: ${file.url}`);
      await deleteFromSpaces(file.url);
    }
  }
}
```

---

## 📊 Comparison

| Strategy | Complexity | Reliability | Storage Waste |
|----------|------------|-------------|---------------|
| Manual DELETE | ⭐ Low | ⚠️ Depends on frontend | Medium |
| Temp Folder + Cleanup | ⭐⭐ Medium | ✅ High | Low |
| Database Tracking | ⭐⭐⭐ High | ✅ Very High | Very Low |
| Base64 Only | ⭐ Lowest | ✅ Perfect (no orphans) | None |

---

## 🧪 Testing DELETE Endpoints

### Postman Test:

**1. Upload a file:**
```
POST /api/upload
Body: form-data with file
Response: { "url": "https://..." }
```

**2. Delete it (simulate user canceling):**
```
DELETE /api/upload
Headers: Authorization: Bearer TOKEN
Body: { "url": "https://your-space.com/2025/11/03/file_123.jpg" }
Response: { "success": true, "message": "File deleted successfully" }
```

**3. Try to access the URL:**
- Should return 404 or AccessDenied ✅
