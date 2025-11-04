const { Server } = require('@hocuspocus/server');
const { Database } = require('@hocuspocus/extension-database');
const WorkLog = require('../models/WorkLog');
const jwt = require('jsonwebtoken');

const setupHocuspocus = () => {
  const server = new Server({
    port: parseInt(process.env.COLLAB_PORT) || 1234,
    
    async onAuthenticate({ token, documentName }) {
      try {
        console.log(`🔐 Auth attempt for document: ${documentName}`);
        
        if (!token) {
          throw new Error('No token provided');
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`✅ JWT verified for user: ${decoded.id}`);
        
        const worklog = await WorkLog.findById(documentName)
          .populate('user', '_id division')
          .populate('collaborators', '_id division');
        
        if (!worklog) {
          throw new Error('WorkLog not found');
        }
        
        const isOwner = worklog.user._id.toString() === decoded.id;
        const isCollaborator = worklog.collaborators.some(
          collab => collab._id.toString() === decoded.id
        );
        
        // 🔒 STRICT INVITE-ONLY: Only owner and explicitly invited collaborators can edit
        if (!isOwner && !isCollaborator) {
          throw new Error('Access denied: You must be invited as a collaborator');
        }
        
        const User = require('../models/User');
        const user = await User.findById(decoded.id);
        
        console.log(`✅ Access granted for user: ${user.name}`);
        
        return {
          user: {
            id: decoded.id,
            name: user.name,
            email: user.email,
            division: user.division
          }
        };
      } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        throw error;
      }
    },
    
    async onConnect({ documentName, context, socketId }) {
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
      // Track that document was modified
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
      // Clean up any active sessions
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

  // Use standalone mode on separate port
  server.listen();
  console.log(`🚀 Hocuspocus running on port ${process.env.COLLAB_PORT || 1234}`);
  
  return server;
};

const destroyHocuspocus = async (server) => {
  if (server) {
    await server.destroy();
    console.log('🔌 Hocuspocus destroyed');
  }
};

module.exports = { setupHocuspocus, destroyHocuspocus };