// Express app factory (no server listen here) - used by tests and index.js
const express = require('express');
const cors = require("cors");
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const workLogRoutes = require('./src/routes/workLogRoutes');
const chatBotRoutes = require('./src/routes/chatbotRoutes');

const app = express();

// CORS middleware to allow frontend requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow both localhost:5173 and localhost:5174
  if (origin === 'http://localhost:5173' || origin === 'http://localhost:5174') {
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
app.use('/api/chatbot', chatBotRoutes);

module.exports = app;
