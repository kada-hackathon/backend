// Express app factory (no server listen here) - used by tests and index.js
const express = require('express');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();

// Middleware
app.use(express.json());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

module.exports = app;
