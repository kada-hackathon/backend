// server.js atau app.js
require('dotenv').config(); //harus paling atassss

// Validate required environment variables
const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'NODE_ENV',
  'OS_ACCESS_KEY',
  'OS_SECRET_KEY',
  'OS_BUCKET',
  'EMBEDDING_API_KEY'
];

const missing = requiredEnvVars.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ ERROR: Missing required environment variables: ${missing.join(', ')}`);
  console.error('Please set these in DigitalOcean App Platform environment variables.');
  process.exit(1);
}

console.log('✅ All required environment variables are set');

const connectDB = require('./src/config/db');

// connect to database
connectDB();

// create app from app.js
const app = require('./app');
const mongoose = require('mongoose');
const { setupHocuspocus, destroyHocuspocus } = require('./src/config/websocket');

// Jalankan Server
const PORT = process.env.PORT || 5000; 
const server = app.listen(PORT, () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Setup Hocuspocus WebSocket server for real-time collaboration
let hocuspocusServer;
try {
  hocuspocusServer = setupHocuspocus(server);
  console.log('✅ Real-time collaboration enabled via Hocuspocus');
} catch (error) {
  console.error('❌ Failed to initialize Hocuspocus:', error.message);
  // Continue without real-time collaboration if setup fails
}

// Graceful shutdown for DigitalOcean App Platform deployments
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Closing server gracefully...`);
  
  server.close(async () => {
    console.log('HTTP server closed.');
    
    try {
      // Destroy Hocuspocus WebSocket server
      if (hocuspocusServer) {
        await destroyHocuspocus(hocuspocusServer);
      }
      
      await mongoose.connection.close(false);
      console.log('MongoDB connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle termination signals from App Platform
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
