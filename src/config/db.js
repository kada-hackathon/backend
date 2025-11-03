// config/db.js

const mongoose = require('mongoose');

// Fungsi untuk menghubungkan ke database MongoDB dengan retry logic
const connectDB = async (retries = 5) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // MongoDB Connection String diambil dari environment variable
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        maxPoolSize: 15,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 10000, // Increased for slow connections
        socketTimeoutMS: 45000,
        family: 4
      });

      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      
      // Handle connection events in production
      mongoose.connection.on('error', err => {
        console.error('❌ MongoDB connection error:', err.message);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected. Will attempt to reconnect automatically...');
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected successfully');
      });
      
      return; // Success, exit function
      
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${attempt}/${retries} failed: ${error.message}`);
      
      if (attempt < retries) {
        const delay = attempt * 2000; // Exponential backoff: 2s, 4s, 6s, 8s, 10s
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ All MongoDB connection attempts failed. Exiting...');
        process.exit(1); // Exit if all retries fail
      }
    }
  }
};

module.exports = connectDB;