// server entrypoint - starts the HTTP server
require('dotenv').config();
const connectDB = require('./src/config/db');

// connect to database
connectDB();

// create app from app.js
const app = require('./app');

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server berjalan di mode ${process.env.NODE_ENV} di port ${PORT}`));