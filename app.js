// Express app factory (no server listen here) - used by tests and index.js
const express = require('express');
const cors = require("cors");
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const workLogRoutes = require('./src/routes/workLogRoutes');

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Middleware
app.use(express.json());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/worklogs', workLogRoutes);

module.exports = app;
