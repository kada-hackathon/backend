// server.js atau app.js
require('dotenv').config(); //harus paling atassss
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

// connect to database
connectDB();

// create app from app.js
const app = require('./app');

// Jalankan Server
const PORT =  5000; 
app.listen(PORT, console.log(`Server berjalan di mode ${process.env.NODE_ENV} di port ${PORT}`));
