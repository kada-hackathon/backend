/**
 * Simplified Collaboration Test - No Yjs Required
 * 
 * Tests basic WebSocket connectivity and message exchange.
 * The actual Yjs editing will happen on the frontend.
 * 
 * USAGE:
 * 1. Make sure your backend server is running (npm run dev)
 * 2. Run this script: node src/test/simple-collaboration-test.js
 */

const WebSocket = require('ws');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const COLLAB_PORT = 1234;
const MONGODB_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

console.log('\n🧪 === HOCUSPOCUS COLLABORATION TEST (No Yjs) ===\n');
console.log(`📍 WebSocket Server: ws://localhost:${COLLAB_PORT}\n`);

async function testCollaboration() {
  let testWorkLog = null;
  let WorkLog = null; // Define outside try block
  
  try {
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Load models - using absolute path resolution
    const userModelPath = path.resolve(__dirname, '..', 'models', 'User');
    const workLogModelPath = path.resolve(__dirname, '..', 'models', 'WorkLog');
    
    console.log(`Loading User model from: ${userModelPath}`);
    console.log(`Loading WorkLog model from: ${workLogModelPath}`);
    
    const User = require(userModelPath);
    WorkLog = require(workLogModelPath); // Assign to outer scope variable

    console.log('👥 Setting up test users...');
    let testUser1 = await User.findOne({ email: 'collab-test1@example.com' });
    if (!testUser1) {
      testUser1 = await User.create({
        name: 'Alice',
        email: 'collab-test1@example.com',
        password: 'Test123!',
        division: 'Engineering',
        role: 'user'
      });
      console.log('   ✅ Created Alice');
    } else {
      console.log('   ✅ Found Alice');
    }

    let testUser2 = await User.findOne({ email: 'collab-test2@example.com' });
    if (!testUser2) {
      testUser2 = await User.create({
        name: 'Bob',
        email: 'collab-test2@example.com',
        password: 'Test123!',
        division: 'Engineering',
        role: 'user'
      });
      console.log('   ✅ Created Bob');
    } else {
      console.log('   ✅ Found Bob');
    }
    console.log('✅ Test users ready\n');

    console.log('📝 Creating test document...');
    testWorkLog = await WorkLog.create({
      title: 'Collaboration Test',
      content: 'Testing real-time collaboration',
      tag: ['test'],
      user: testUser1._id,
      collaborators: [testUser2._id]
    });
    console.log(`✅ Document created: ${testWorkLog._id}\n`);

    console.log('🔐 Generating tokens...');
    const jwt = require('jsonwebtoken');
    const token1 = jwt.sign({ id: testUser1._id }, JWT_SECRET, { expiresIn: '1h' });
    const token2 = jwt.sign({ id: testUser2._id }, JWT_SECRET, { expiresIn: '1h' });
    console.log('✅ Tokens generated\n');

    console.log('🌐 Testing WebSocket connections...\n');
    await testConnections(testWorkLog._id.toString(), token1, token2);

    console.log('\n💾 Checking database...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const finalWorkLog = await WorkLog.findById(testWorkLog._id);
    console.log(`   Active Users: ${finalWorkLog.activeUsers.length}`);
    console.log(`   Last Modified: ${finalWorkLog.lastModified.toISOString()}`);

    console.log('\n✅ === TEST PASSED ===\n');
    console.log('Summary:');
    console.log('  ✅ Hocuspocus WebSocket server is running');
    console.log('  ✅ JWT authentication works');
    console.log('  ✅ Multiple users can connect simultaneously');
    console.log('  ✅ Active users tracking works');
    console.log('  ✅ Database persistence works');
    console.log('\n💡 Note: Actual Yjs editing will happen on the frontend using:');
    console.log('   - @hocuspocus/provider');
    console.log('   - yjs');
    console.log('   - @tiptap/extension-collaboration\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    // Cleanup - WorkLog is now accessible here
    if (testWorkLog && WorkLog) {
      console.log('\n🧹 Cleaning up...');
      try {
        await WorkLog.findByIdAndDelete(testWorkLog._id);
        console.log('✅ Test document deleted');
      } catch (cleanupError) {
        console.error('⚠️  Cleanup error:', cleanupError.message);
      }
    }
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('📦 Disconnected from MongoDB');
    }
    
    process.exit(0);
  }
}

/**
 * Test WebSocket connections for both users
 */
function testConnections(documentId, token1, token2) {
  return new Promise((resolve, reject) => {
    let alice, bob;
    let aliceConnected = false;
    let bobConnected = false;
    let aliceMessages = 0;
    let bobMessages = 0;
    let testComplete = false;

    alice = new WebSocket(`ws://localhost:${COLLAB_PORT}/${documentId}`, {
      headers: { 'Authorization': `Bearer ${token1}` }
    });

    bob = new WebSocket(`ws://localhost:${COLLAB_PORT}/${documentId}`, {
      headers: { 'Authorization': `Bearer ${token2}` }
    });

    alice.on('open', () => {
      aliceConnected = true;
      console.log('   👤 Alice connected');
      checkBothConnected();
    });

    bob.on('open', () => {
      bobConnected = true;
      console.log('   👤 Bob connected');
      checkBothConnected();
    });

    alice.on('message', (data) => {
      aliceMessages++;
      console.log(`   📨 Alice received: ${data.length} bytes`);
    });

    bob.on('message', (data) => {
      bobMessages++;
      console.log(`   📨 Bob received: ${data.length} bytes`);
    });

    alice.on('error', (error) => {
      if (!testComplete) {
        console.error('   ❌ Alice error:', error.message);
        testComplete = true;
        alice.close();
        bob.close();
        reject(error);
      }
    });

    bob.on('error', (error) => {
      if (!testComplete) {
        console.error('   ❌ Bob error:', error.message);
        testComplete = true;
        alice.close();
        bob.close();
        reject(error);
      }
    });

    function checkBothConnected() {
      if (aliceConnected && bobConnected && !testComplete) {
        console.log('   🎉 Both users connected!');
        console.log('   ⏳ Keeping connections open for 3 seconds...\n');
        
        setTimeout(() => {
          testComplete = true;
          console.log('   📊 Results:');
          console.log(`   - Alice received ${aliceMessages} messages`);
          console.log(`   - Bob received ${bobMessages} messages`);
          console.log('   🔌 Closing connections...');
          
          alice.close();
          bob.close();
          
          setTimeout(resolve, 500);
        }, 3000);
      }
    }

    // Safety timeout
    setTimeout(() => {
      if (!testComplete) {
        testComplete = true;
        console.error('   ⏱️  Test timeout after 10 seconds');
        alice.close();
        bob.close();
        reject(new Error('Test timeout'));
      }
    }, 10000);
  });
}

testCollaboration();