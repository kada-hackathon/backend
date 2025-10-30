// Express app factory (no server listen here) - used by tests and index.js
const express = require('express');
const cors = require("cors");
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const workLogRoutes = require('./src/routes/workLogRoutes');
const setupSwagger = require('./src/swagger/swagger');

const app = express();

// CORS middleware to allow frontend requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow localhost dengan semua port dev (5173, 5174, 8080, etc)
  if (origin && origin.startsWith('http://localhost:')) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
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
app.use(express.json());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/worklogs', workLogRoutes);

// Setup Swagger Docs
setupSwagger(app);

module.exports = app;
