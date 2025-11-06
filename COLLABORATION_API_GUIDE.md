# Real-Time Collaboration API Guide

## Overview
NEBWORK uses **Hocuspocus** (WebSocket server) + **Yjs** (CRDT) to enable real-time collaborative editing in TipTap rich text editor. This is an **invite-only** system where only the worklog owner and explicitly invited collaborators can edit.

---

## Architecture

```
Frontend (TipTap + Yjs)
    ↓ WebSocket
Hocuspocus Server (Port 1234)
    ↓
MongoDB (WorkLog.yjsState)
```

### Key Features
- ✅ **Invite-only editing** - Only owner + invited collaborators can edit
- ✅ **Active user tracking** - See who's editing in real-time
- ✅ **Auto-save** - Changes persist to MongoDB automatically
- ✅ **Conflict-free** - Yjs CRDT handles concurrent edits
- ✅ **Session cleanup** - Removes users on disconnect
- ✅ **Division read-only access** - Division members can view via REST API

---

## Backend Configuration

### Environment Variables
```env
COLLAB_PORT=1234              # Hocuspocus WebSocket port
MONGO_URI=mongodb://...       # MongoDB connection
JWT_SECRET=your-secret        # For authentication
```

### WorkLog Schema Fields
```javascript
{
  yjsState: Buffer,                    // Yjs binary document state
  collaborators: [ObjectId],           // Invited users (all have edit access)
  activeUsers: [{                      // Currently connected users
    userId: ObjectId,
    name: String,
    email: String,
    socketId: String,
    connectedAt: Date
  }]
}
```

---

## REST API Endpoints

### 1. Add Collaborator
**POST** `/api/v1/worklogs/:id/collaborators`

```json
// Request
{
  "email": "colleague@company.com"
}

// Response
{
  "message": "Collaborator added successfully",
  "log": { ...worklog }
}
```

**Authorization:** Only the worklog owner can add collaborators.

**Note:** All invited collaborators have full edit access.

---

### 2. Get Collaboration Status
**GET** `/api/v1/worklogs/:id/collaboration/status`

```json
// Response
{
  "worklogId": "675a1b2c3d4e5f6g7h8i9j0k",
  "title": "Q4 Strategy Planning",
  "activeUsers": [
    {
      "userId": { "name": "Alice", "email": "alice@company.com" },
      "socketId": "abc123",
      "connectedAt": "2025-11-04T10:30:00.000Z"
    }
  ],
  "totalActive": 1
}
```

**Authorization:** Owner and collaborators only.

---

### 3. Get Collaborators List
**GET** `/api/v1/worklogs/:id/collaborators`

```json
// Response
{
  "message": "Collaborators retrieved successfully",
  "collaborators": [
    {
      "_id": "675a1b2c3d4e5f6g7h8i9j0k",
      "name": "Bob Smith",
      "email": "bob@company.com",
      "division": "Engineering",
      "role": "user"
    }
  ]
}
```

---

### 4. Remove Collaborator
**DELETE** `/api/v1/worklogs/:id/collaborators/:collaboratorId`

```json
// Response
{
  "message": "Collaborator removed successfully",
  "collaborators": ["remaining-user-ids"]
}
```

**Authorization:** Only the worklog owner.

---

## WebSocket Connection (Frontend)

### 1. Install Dependencies
```bash
npm install @hocuspocus/provider yjs @tiptap/extension-collaboration
```

### 2. Connect to Hocuspocus
```javascript
import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'

// Create Yjs document
const ydoc = new Y.Doc()

// Connect to Hocuspocus server
const provider = new HocuspocusProvider({
  url: 'ws://localhost:1234',  // or wss://your-domain.com for production
  name: worklogId,             // Document name = WorkLog _id
  document: ydoc,
  token: jwtToken,             // JWT from login
  
  onAuthenticated() {
    console.log('✅ Connected to collaborative session')
  },
  
  onAuthenticationFailed({ reason }) {
    console.error('❌ Auth failed:', reason)
    alert('You do not have permission to edit this document')
  },
  
  onStatus({ status }) {
    console.log('Connection status:', status) // 'connected' | 'disconnected'
  },
  
  onSynced() {
    console.log('✅ Document synced')
  }
})
```

### 3. Integrate with TipTap
```javascript
import { useEditor } from '@tiptap/react'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'

const editor = useEditor({
  extensions: [
    // ... other TipTap extensions
    
    Collaboration.configure({
      document: ydoc,  // Yjs document from provider
    }),
    
    CollaborationCursor.configure({
      provider: provider,  // Show other users' cursors
      user: {
        name: currentUser.name,
        color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
      },
    }),
  ],
  
  content: '', // Initial content will be loaded from Yjs
})
```

### 4. Display Active Users
```javascript
import { useEffect, useState } from 'react'
import axios from 'axios'

function ActiveUsers({ worklogId }) {
  const [activeUsers, setActiveUsers] = useState([])

  useEffect(() => {
    // Poll every 5 seconds
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(
          `/api/v1/worklogs/${worklogId}/collaboration/status`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setActiveUsers(data.activeUsers)
      } catch (error) {
        console.error('Failed to fetch active users:', error)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [worklogId])

  return (
    <div className="active-users">
      {activeUsers.map(user => (
        <div key={user.socketId}>
          <img src={user.userId.profile_photo} alt={user.userId.name} />
          <span>{user.userId.name}</span>
        </div>
      ))}
    </div>
  )
}
```

### 5. Cleanup on Unmount
```javascript
useEffect(() => {
  return () => {
    provider?.destroy()  // Disconnect from Hocuspocus
    editor?.destroy()    // Cleanup TipTap editor
  }
}, [])
```

---

## Authentication Flow

### Backend (Hocuspocus)
```javascript
onAuthenticate: async ({ token, documentName }) => {
  // 1. Verify JWT
  const decoded = jwt.verify(token, JWT_SECRET)
  
  // 2. Find worklog
  const worklog = await WorkLog.findById(documentName)
  
  // 3. Check ownership
  const isOwner = worklog.user._id.toString() === decoded.id
  
  // 4. Check collaborator status
  const isCollaborator = worklog.collaborators.some(
    collab => collab._id.toString() === decoded.id
  )
  
  // 5. DENY if not owner or collaborator
  if (!isOwner && !isCollaborator) {
    throw new Error('Access denied: You must be invited')
  }
  
  // 6. Grant access (all invited users can edit)
  return { user: { id, name, email, division } }
}
```

---

## Error Handling

### Frontend Error Handling
```javascript
provider.on('authenticationFailed', ({ reason }) => {
  if (reason.includes('invite')) {
    // Not a collaborator
    showError('You need to be invited to edit this document')
  } else {
    // Other auth errors
    showError('Authentication failed: ' + reason)
  }
  } else {
    // Other auth errors
    showError('Authentication failed: ' + reason)
  }
})

provider.on('disconnect', () => {
  showWarning('Disconnected. Reconnecting...')
})

provider.on('connect', () => {
  showSuccess('Reconnected!')
})
```

### Backend Error Handling
All errors in Hocuspocus lifecycle hooks are logged but don't crash the server:
```javascript
try {
  // Operation
} catch (error) {
  console.error('❌ Error:', error.message)
  // Continue operation
}
```

---

## Common Use Cases

### 1. Owner Creates Document & Invites Team
```javascript
// Step 1: Create worklog (REST API)
const { data: worklog } = await axios.post('/api/v1/worklogs', {
  title: 'Q4 Planning',
  content: 'Initial draft...',
  tag: ['strategy', 'q4']
})

// Step 2: Invite collaborators (all get edit access)
await axios.post(`/api/v1/worklogs/${worklog._id}/collaborators`, {
  email: 'alice@company.com'
})

await axios.post(`/api/v1/worklogs/${worklog._id}/collaborators`, {
  email: 'bob@company.com'
})

// Step 3: Start collaborative editing
const provider = new HocuspocusProvider({
  url: 'ws://localhost:1234',
  name: worklog._id,
  document: ydoc,
  token: jwtToken
})
```

### 2. Collaborator Joins Session
```javascript
// User clicks "Edit" button in UI
const worklogId = '675a1b2c3d4e5f6g7h8i9j0k'

// Connect to Hocuspocus (all invited collaborators can edit)
try {
  const provider = new HocuspocusProvider({
    url: 'ws://localhost:1234',
    name: worklogId,
    document: ydoc,
    token: jwtToken
  })
} catch (error) {
  console.error('Failed to join session:', error)
}
```

---

## Security Considerations

### ✅ What's Protected
- JWT authentication on every WebSocket connection
- Owner-only operations (add/remove collaborators)
- Strict invite-only access (no division-based editing)
- All invited collaborators have edit access

### ⚠️ Important Notes
- **Access model**: Owner + Invited Users = Edit Access | Division Members = Read-only via REST API
- **Token expiration**: Use short-lived JWTs and handle re-authentication on the frontend.
- **Removing collaborators**: They'll lose access on next reconnection attempt.

---

## Troubleshooting

### "Authentication failed" error
**Cause:** Invalid JWT, expired token, or user not invited.

**Fix:**
1. Check JWT is valid and not expired
2. Verify user is in `collaborators` array or is the owner
3. Ensure Hocuspocus server is running

### Changes not syncing
**Cause:** WebSocket connection issue or Yjs not configured.

**Fix:**
1. Check `provider.status` is `'connected'`
2. Verify Hocuspocus server is running (port 1234)
3. Check browser console for WebSocket errors

### Active users not updating
**Cause:** Polling interval too slow or endpoint not called.

**Fix:** Poll `/api/v1/worklogs/:id/collaboration/status` every 3-5 seconds.

---

## Production Deployment

### Use WSS (Secure WebSocket)
```javascript
const provider = new HocuspocusProvider({
  url: 'wss://api.nebwork.com',  // Not ws://
  // ...
})
```

### Environment Variables
```env
COLLAB_PORT=1234
MONGO_URI=mongodb+srv://...
JWT_SECRET=strong-secret-key
FRONTEND_URL=https://app.nebwork.com
```

### Load Balancing
If running multiple Hocuspocus servers, use sticky sessions (same user always connects to same server).

---

## Summary

### For Frontend Developers
1. Install `@hocuspocus/provider`, `yjs`, `@tiptap/extension-collaboration`
2. Get JWT token from login
3. Create `HocuspocusProvider` with worklog ID and token
4. Connect to TipTap with `Collaboration` extension
5. Display active users from REST API

### For Backend Developers
✅ **You're done!** The backend is fully configured:
- Invite-only access enforcement
- Edit vs. view-only permissions
- Active user tracking
- Auto-save to MongoDB
- Session cleanup on disconnect
- REST API for collaboration management

### Next Steps
- Test with multiple browser windows
- Monitor Hocuspocus logs for errors
- Add frontend UI for permission management
- Set up production WSS endpoint
