const { Server } = require('@hocuspocus/server');
const { Database } = require('@hocuspocus/extension-database');
const WorkLog = require('../models/WorkLog');
const jwt = require('jsonwebtoken');

/**
 * Setup Hocuspocus WebSocket server attached to existing HTTP server
 * This allows WebSocket connections on the same port as Express (required for DigitalOcean App Platform)
 * 
 * @param {http.Server} httpServer - The HTTP server instance from Express
 * @returns {Server} Hocuspocus server instance
 */
const setupHocuspocus = (httpServer) => {
  const server = new Server({
    // No port configuration - we're attaching to existing HTTP server
    
    async onAuthenticate({ token, documentName }) {
      try {
        console.log(`🔐 [onAuthenticate] Auth attempt for document: ${documentName}`);
        console.log(`   Token received: ${token ? 'YES' : 'NO'}`);
        
        if (!token) {
          throw new Error('No token provided');
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`✅ [onAuthenticate] JWT verified for user: ${decoded.id}`);
        
        const worklog = await WorkLog.findById(documentName)
          .populate('user', '_id division')
          .populate('collaborators', '_id division');
        
        if (!worklog) {
          throw new Error('WorkLog not found');
        }
        
        console.log(`   Worklog owner: ${worklog.user._id}`);
        console.log(`   Collaborators: ${worklog.collaborators.map(c => c._id).join(', ')}`);
        
        const isOwner = worklog.user._id.toString() === decoded.id;
        const isCollaborator = worklog.collaborators.some(
          collab => collab._id.toString() === decoded.id
        );
        
        console.log(`   Is owner: ${isOwner}, Is collaborator: ${isCollaborator}`);
        
        // 🔒 STRICT INVITE-ONLY: Only owner and explicitly invited collaborators can edit
        if (!isOwner && !isCollaborator) {
          throw new Error('Access denied: You must be invited as a collaborator');
        }
        
        const User = require('../models/User');
        const user = await User.findById(decoded.id);
        
        if (!user) {
          throw new Error('User not found in database');
        }
        
        const userData = {
          id: decoded.id,
          name: user.name,
          email: user.email,
          division: user.division
        };
        
        console.log(`✅ [onAuthenticate] Access granted for user: ${user.name}`);
        console.log(`   Returning user data:`, userData);
        
        // Return the user data that will be available in context
        return {
          user: userData
        };
      } catch (error) {
        console.error('❌ [onAuthenticate] Authentication failed:', error.message);
        console.error('   Stack:', error.stack);
        throw error;
      }
    },
    
    async onConnect({ documentName, context, socketId }) {
      console.log('[onConnect] Connection attempt:', {
        documentName,
        hasContext: !!context,
        hasUser: !!context?.user,
        user: context?.user,
        socketId
      });
      
      if (!context || !context.user) {
        console.error('❌ [onConnect] No user context available');
        return;
      }
      
      console.log(`✅ ${context.user.name} connected to ${documentName}`);
      
      try {
        await WorkLog.findByIdAndUpdate(documentName, {
          lastModified: new Date(),
          $addToSet: { 
            activeUsers: {
              userId: context.user.id,
              name: context.user.name,
              email: context.user.email,
              socketId,
              connectedAt: new Date()
            }
          }
        });
      } catch (error) {
        console.error('❌ Error updating active users:', error.message);
      }
    },
    
    async onDisconnect({ documentName, socketId, context }) {
      console.log(`🔌 ${context?.user?.name || 'User'} disconnected from ${documentName}`);
      
      try {
        const worklog = await WorkLog.findByIdAndUpdate(
          documentName, 
          {
            $pull: { activeUsers: { socketId } }
          },
          { new: true }
        );

        // If no more active users, create a version history entry
        if (worklog && worklog.activeUsers.length === 0) {
          console.log(`📝 Last user left ${documentName}, saving final state...`);
          const LogHistory = require('../models/LogHistory');
          await LogHistory.create({
            message: `Collaborative editing session ended`,
            user: context?.user?.id || worklog.user
          });
        }
      } catch (error) {
        console.error('❌ Error removing user:', error.message);
      }
    },

    async onChange({ documentName, context }) {
      try {
        await WorkLog.findByIdAndUpdate(documentName, {
          lastModified: new Date()
        });
      } catch (error) {
        console.error('❌ Error updating lastModified:', error.message);
      }
    },

    async onDestroy() {
      console.log('🔌 Hocuspocus server is shutting down...');
      try {
        await WorkLog.updateMany(
          { 'activeUsers.0': { $exists: true } },
          { $set: { activeUsers: [] } }
        );
        console.log('✅ Cleared all active collaboration sessions');
      } catch (error) {
        console.error('❌ Error cleaning up sessions:', error.message);
      }
    },
    
    extensions: [
      new Database({
        fetch: async ({ documentName }) => {
          try {
            const worklog = await WorkLog.findById(documentName).select('+yjsState');
            return worklog?.yjsState || null;
          } catch (error) {
            console.error(`❌ Fetch error:`, error.message);
            return null;
          }
        },
        
        store: async ({ documentName, state }) => {
          try {
            await WorkLog.findByIdAndUpdate(documentName, {
              yjsState: Buffer.from(state),
              lastModified: new Date()
            });
          } catch (error) {
            console.error(`❌ Store error:`, error.message);
          }
        }
      })
    ],
    
    debounce: 2000,
    maxDebounce: 10000
  });

  // Handle WebSocket upgrade requests on /collaboration path
  httpServer.on('upgrade', async (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    
    console.log(`📡 WebSocket upgrade request: ${url.pathname}`);
    
    // Only handle Hocuspocus WebSocket connections on /collaboration path
    if (url.pathname.startsWith('/collaboration')) {
      console.log(`✅ Routing to Hocuspocus`);
      
      // Extract token from Authorization header or query param
      let token = null;
      
      // Try Authorization header first
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log(`   Token from header: ${token.substring(0, 20)}...`);
      }
      
      // Try query params if no header
      if (!token && url.searchParams.has('token')) {
        token = url.searchParams.get('token');
        console.log(`   Token from query: ${token.substring(0, 20)}...`);
      }
      
      // Add token to request URL for Hocuspocus
      if (token) {
        // Hocuspocus expects token in URL query params
        const separator = url.search ? '&' : '?';
        request.url = `${request.url}${separator}token=${token}`;
        console.log(`   Updated URL: ${request.url}`);
      }
      
      // Let Hocuspocus's internal WebSocket server handle the upgrade and connection
      // This properly triggers all Hocuspocus hooks (onAuthenticate, onConnect, etc.)
      server.webSocketServer.handleUpgrade(request, socket, head, (ws) => {
        server.webSocketServer.emit('connection', ws, request);
      });
    } else {
      console.log(`❌ Not a collaboration path, destroying socket`);
      // Reject non-collaboration WebSocket connections
      socket.destroy();
    }
  });
  
  console.log(`🚀 Hocuspocus attached to HTTP server on /collaboration path`);
  console.log(`   WebSocket URL: ws://localhost:${process.env.PORT || 5000}/collaboration`);
  
  return server;
};

const destroyHocuspocus = async (server) => {
  if (server) {
    await server.destroy();
    console.log('🔌 Hocuspocus destroyed');
  }
};

module.exports = { setupHocuspocus, destroyHocuspocus };