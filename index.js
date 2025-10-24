// server.js atau app.js
require('dotenv').config(); //harus paling atassss
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');


// Load env vars
dotenv.config(); 

// Koneksi ke Database
connectDB(); 

const app = express();

// Middleware
app.use(express.json());

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Jalankan Server
const PORT = process.env.PORT || 5000; 
app.listen(PORT, console.log(`Server berjalan di mode ${process.env.NODE_ENV} di port ${PORT}`));