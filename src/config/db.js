// config/db.js

const mongoose = require('mongoose');

// Fungsi untuk menghubungkan ke database MongoDB
const connectDB = async () => {
  try {
    // MongoDB Connection String diambil dari environment variable
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,        // Opsi ini menangani URL parsing
      useUnifiedTopology: true,     // Opsi ini menggunakan mesin topologi server yang baru

    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Keluar dari proses jika koneksi gagal
    process.exit(1); 
  }
};

module.exports = connectDB;