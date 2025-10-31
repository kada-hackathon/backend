// config/db.js

const mongoose = require('mongoose');

// Fungsi untuk menghubungkan ke database MongoDB
const connectDB = async () => {
  try {
    // MongoDB Connection String diambil dari environment variable
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 15,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      useNewUrlParser: true,        // Opsi ini menangani URL parsing
      useUnifiedTopology: true,     // Opsi ini menggunakan mesin topologi server yang baru
      family: 4

    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Keluar dari proses jika koneksi gagal
    process.exit(1); 
  }
};

module.exports = connectDB;