// Express app factory (no server listen here) - used by tests and index.js
const express = require('express');
const cors = require("cors");
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const setupSwagger = require('./src/swagger/swagger');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const worklogRoutes = require('./src/routes/workLogRoutes');
const chatBotRoutes = require('./src/routes/chatbotRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');

const app = express();

// Trust proxy - Required for rate limiting behind reverse proxies (like DigitalOcean)
// This allows Express to trust X-Forwarded-For header
app.set('trust proxy', 1);

// Security: Helmet middleware for security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now (can be configured later)
  crossOriginEmbedderPolicy: false // Allow embedding for Swagger UI
}));

// CORS middleware to allow frontend requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow localhost with all dev ports (5173, 5174, 8080, etc)
  if (origin && origin.startsWith('http://localhost:')) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  // Allow production frontend (set FRONTEND_URL in App Platform env vars)
  if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Middleware
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 media uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint for DigitalOcean App Platform
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/worklogs', worklogRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chatbot', chatBotRoutes);

// Setup Swagger Docs
setupSwagger(app);

module.exports = app;
