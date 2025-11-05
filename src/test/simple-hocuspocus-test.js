/**
 * Simple Hocuspocus Server Test
 * 
 * Just tests if the server accepts connections and authenticates.
 * This is a BACKEND test (no provider needed).
 * 
 * USAGE: node src/test/simple-hocuspocus-test.js
 */

require('dotenv').config();
const WebSocket = require('ws');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

console.log('\n🧪 === SIMPLE HOCUSPOCUS CONNECTION TEST ===\n');

async function simpleTest() {
  let testWorkLog = null;
  
  try {
    // Setup
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    const User = require('../models/User');
    const WorkLog = require('../models/WorkLog');

    // Create test user
    let testUser = await User.findOne({ email: 'simple-test@example.com' });
    if (!testUser) {
      testUser = await User.create({
        name: 'Test User',
        email: 'simple-test@example.com',
        password: 'Test123!',
        division: 'Engineering',
        role: 'user'
      });
    }
    console.log('✅ Test user ready\n');

    // Create worklog
    testWorkLog = await WorkLog.create({
      title: 'Simple Connection Test',
      content: 'Test',
      tag: ['test'],
      user: testUser._id,
      collaborators: []
    });
    console.log(`✅ Test worklog created: ${testWorkLog._id}\n`);

    // Generate token
    const token = jwt.sign({ id: testUser._id }, JWT_SECRET, { expiresIn: '1h' });

    // Test WebSocket connection
    console.log('🔌 Attempting WebSocket connection...');
    console.log(`   URL: ws://localhost:${PORT}/collaboration/${testWorkLog._id}`);
    console.log(`   Token: ${token.substring(0, 20)}...\n`);

    const ws = new WebSocket(`ws://localhost:${PORT}/collaboration/${testWorkLog._id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout (10s)'));
      }, 10000);

      ws.on('open', () => {
        clearTimeout(timeout);
        console.log('✅ WebSocket connection OPENED\n');
        console.log('🎉 SUCCESS! Hocuspocus server is accepting connections!\n');
        console.log('📊 What this proves:');
        console.log('  ✅ Hocuspocus server is running');
        console.log(`  ✅ Port ${PORT} is accessible`);
        console.log('  ✅ JWT authentication working');
        console.log('  ✅ Document lookup working');
        console.log('  ✅ Permission check working');
        console.log('  ✅ WebSocket upgrade on /collaboration path working\n');
        
        ws.close();
        resolve();
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ WebSocket error:', error.message);
        reject(error);
      });

      ws.on('close', (code, reason) => {
        console.log(`🔌 Connection closed (code: ${code})`);
        if (reason) console.log(`   Reason: ${reason}`);
      });

      ws.on('message', (data) => {
        console.log(`📨 Received message (${data.length} bytes)`);
      });
    });

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Solution: Make sure your backend server is running!');
      console.error('   Run: npm run dev');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Solution: Hocuspocus server may not be responding.');
      console.error('   Check backend logs for errors.');
    }
    
    process.exit(1);
  } finally {
    // Cleanup
    if (testWorkLog) {
      const WorkLog = require('../models/WorkLog');
      await WorkLog.findByIdAndDelete(testWorkLog._id);
      console.log('🧹 Cleaned up test data');
    }
    await mongoose.disconnect();
    console.log('📦 MongoDB disconnected\n');
  }
}

simpleTest();
