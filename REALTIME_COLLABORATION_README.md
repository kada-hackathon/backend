# 🔄 Real-time Collaboration Setup Guide

## Overview

NEBWORK uses **Hocuspocus** (a production-ready WebSocket server for Yjs) to enable real-time collaborative editing with Tiptap editor. Multiple users can edit the same work log simultaneously with automatic conflict resolution.

## Architecture

```
Frontend (Tiptap) <--WebSocket--> Hocuspocus Server <---> MongoDB
       ↓                              ↓
   Yjs CRDT                    Document Persistence
```

## What's Included

✅ **Backend Setup Complete:**
- `src/config/websocket.js` - Hocuspocus server configuration
- `src/models/WorkLog.js` - Extended with collaboration fields
- `index.js` - WebSocket server initialization
- `src/test/collaboration.test.js` - Comprehensive test suite

✅ **Features:**
- JWT authentication for WebSocket connections
- Division-based access control
- Owner & collaborator permissions
- Active users tracking
- Automatic document persistence to MongoDB
- Debounced saves (2s default, 10s max)
- Production-ready error handling

## Installation

### 1. Dependencies Already Installed

```bash
npm install  # Installs @hocuspocus/server @hocuspocus/extension-database
```

### 2. Environment Variables

Add to your `.env` file:

```bash
# Real-time Collaboration
COLLAB_PORT=1234
```

### 3. Start Server

```bash
npm run dev  # Development with nodemon
npm start    # Production
```

You should see:
```
✅ Server running in development mode on port 5000
🚀 Hocuspocus WebSocket server configured on port 1234
✅ Real-time collaboration enabled via Hocuspocus
```

## Frontend Integration

### Install Frontend Dependencies

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor @hocuspocus/provider yjs
```

### React Component Example

```jsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { useEffect, useState } from 'react';

function CollaborativeEditor({ worklogId }) {
  const [provider, setProvider] = useState(null);
  const [status, setStatus] = useState('connecting');
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    const ydoc = new Y.Doc();
    
    const hocuspocusProvider = new HocuspocusProvider({
      url: 'ws://localhost:1234',
      name: worklogId,
      document: ydoc,
      token: token,
      
      onConnect: () => setStatus('connected'),
      onDisconnect: () => setStatus('disconnected'),
      onAuthenticationFailed: ({ reason }) => {
        console.error('Auth failed:', reason);
        setStatus('auth-failed');
      },
      onSynced: () => setStatus('synced')
    });
    
    setProvider(hocuspocusProvider);
    
    return () => hocuspocusProvider.destroy();
  }, [worklogId]);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({ document: provider?.document }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: user.name,
          color: '#' + Math.floor(Math.random()*16777215).toString(16)
        }
      })
    ]
  });
  
  return (
    <div>
      <div className="status-bar">
        Status: {status}
        {provider && ` | Users: ${provider.awareness.getStates().size}`}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export default CollaborativeEditor;
```

## Testing

### Run Tests

```bash
npm test -- collaboration.test.js
```

### Manual Testing

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Open 2+ browser tabs** to the same work log

3. **Start typing** in one tab - should appear in all tabs instantly!

### Test Endpoints

```bash
# Check if WebSocket server is running
curl http://localhost:1234
# Should return Hocuspocus server info

# Test HTTP API
curl http://localhost:5000/health
```

## Access Control

**Who can connect to a document:**

| Role | Access |
|------|--------|
| **Owner** | ✅ Full access |
| **Collaborator** | ✅ Full access (explicitly added) |
| **Same Division** | ✅ Can view & edit |
| **Different Division** | ❌ Denied |

### Add Collaborator

```bash
POST /api/worklogs/{worklogId}/collaborators
{
  "email": "collaborator@gmail.com"
}
```

## Database Schema Changes

### WorkLog Model (Updated)

```javascript
{
  // ... existing fields ...
  
  // NEW: Real-time collaboration fields
  yjsState: Buffer,        // Yjs binary document state
  lastModified: Date,      // Auto-updated on changes
  activeUsers: [{
    userId: ObjectId,
    name: String,
    email: String,
    socketId: String,
    connectedAt: Date
  }]
}
```

## Production Deployment

### 1. Environment Variables

```bash
# Production values
NODE_ENV=production
COLLAB_PORT=1234
JWT_SECRET=your-actual-production-secret
```

### 2. Use WSS (Secure WebSocket)

Frontend:
```javascript
const wsUrl = process.env.NODE_ENV === 'production'
  ? 'wss://api.yourdomain.com'
  : 'ws://localhost:1234';
```

### 3. DigitalOcean App Platform

The WebSocket server runs on the same process as your Express server, so no additional service needed!

**Port Configuration:**
- HTTP API: Port 5000
- WebSocket: Port 1234

Both are handled by your single backend service.

### 4. Nginx Reverse Proxy (Optional)

```nginx
# WebSocket support
location /collab/ {
    proxy_pass http://localhost:1234;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;
}
```

## Monitoring

### Active Connections

Check database for active users:
```javascript
const worklog = await WorkLog.findById(worklogId);
console.log('Active users:', worklog.activeUsers);
```

### Logs

Hocuspocus logs important events:
- ✅ User connected
- 🔌 User disconnected
- 📝 Document changed
- 💾 Document saved
- ❌ Authentication failed

## Troubleshooting

### Issue: "Authentication failed"

**Cause:** Invalid or expired JWT token

**Solution:**
```javascript
// Re-login to get fresh token
const { token } = await login(email, password);
localStorage.setItem('token', token);
```

### Issue: "Connection timeout"

**Cause:** WebSocket server not running or firewall blocking

**Solution:**
```bash
# Check if server is running
netstat -an | grep 1234

# Restart server
npm run dev
```

### Issue: "Access denied"

**Cause:** User not owner/collaborator or from different division

**Solution:**
```bash
# Add user as collaborator
POST /api/worklogs/{id}/collaborators
{
  "email": "user@gmail.com"
}
```

### Issue: Changes not saving

**Cause:** Database connection issue or insufficient permissions

**Solution:**
```bash
# Check MongoDB connection
mongo mongodb://localhost:27017/nebwork

# Check server logs for save errors
npm run dev
```

## API Documentation

See **FRONTEND_API_DOCUMENTATION.md** Section 3 for complete API reference including:
- WebSocket connection setup
- Authentication methods
- Error handling
- Code examples
- Best practices

## Support

For issues or questions:
- Check `FRONTEND_API_DOCUMENTATION.md` Section 3
- Run tests: `npm test -- collaboration.test.js`
- GitHub Issues: https://github.com/kada-hackathon/backend

---

**Version:** 1.0.0  
**Last Updated:** November 4, 2025  
**Maintained By:** Backend Team
