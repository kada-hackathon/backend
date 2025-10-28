// server.js atau app.js
require('dotenv').config(); //harus paling atassss
const express = require('express');
const dotenv = require('dotenv');
const cors = require("cors");
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const workLogRoutes = require('./src/routes/workLogRoutes');


// Load env vars
dotenv.config(); 

// Koneksi ke Database
connectDB(); 

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Middleware
app.use(express.json());

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/worklogs', workLogRoutes);


// Jalankan Server
const PORT = process.env.PORT || 5000; 
app.listen(PORT, console.log(`Server berjalan di mode ${process.env.NODE_ENV} di port ${PORT}`));