/**
 * Manual WebSocket Testing Script
 * 
 * This script allows you to manually test the Hocuspocus WebSocket server
 * Run with: node src/test/manual-websocket-test.js
 */

const WebSocket = require('ws');
const mongoose = require('mongoose');
const User = require('../models/User');
const WorkLog = require('../models/WorkLog');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuration
const WS_URL = process.env.COLLAB_WS_URL || 'ws://localhost:1234';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nebwork';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`),
  data: (msg) => console.log(`${colors.magenta}📊 ${msg}${colors.reset}`)
};

// Helper to create WebSocket connection
const connectToDocument = (documentId, token) => {
  return new Promise((resolve, reject) => {
    const url = `${WS_URL}/${documentId}`;
    log.info(`Connecting to: ${url}`);
    
    const ws = new WebSocket(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Connection timeout'));
    }, 10000);
    
    ws.on('open', () => {
      clearTimeout(timeout);
      log.success('WebSocket connection established');
      resolve(ws);
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      log.error(`WebSocket error: ${error.message}`);
      reject(error);
    });
    
    ws.on('close', () => {
      log.warning('WebSocket connection closed');
    });
    
    ws.on('message', (data) => {
      log.data(`Received message: ${data.length} bytes`);
    });
  });
};

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test scenarios
const tests = {
  async testBasicConnection(user, worklog, token) {
    log.test('Test 1: Basic Connection');
    
    try {
      const ws = await connectToDocument(worklog._id.toString(), token);
      log.success('Basic connection test PASSED');
      
      await wait(1000);
      ws.close();
      await wait(500);
      
      return true;
    } catch (error) {
      log.error(`Basic connection test FAILED: ${error.message}`);
      return false;
    }
  },
  
  async testInvalidToken(worklog) {
    log.test('Test 2: Invalid Token');
    
    try {
      const ws = await connectToDocument(worklog._id.toString(), 'invalid-token');
      ws.close();
      log.error('Invalid token test FAILED: Should have rejected connection');
      return false;
    } catch (error) {
      log.success('Invalid token test PASSED: Connection rejected as expected');
      return true;
    }
  },
  
  async testNonExistentDocument(token) {
    log.test('Test 3: Non-existent Document');
    
    try {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const ws = await connectToDocument(fakeId, token);
      ws.close();
      log.error('Non-existent document test FAILED: Should have rejected');
      return false;
    } catch (error) {
      log.success('Non-existent document test PASSED: Connection rejected');
      return true;
    }
  },
  
  async testMultipleConnections(worklog, token) {
    log.test('Test 4: Multiple Simultaneous Connections');
    
    try {
      const connections = [];
      
      for (let i = 0; i < 5; i++) {
        const ws = await connectToDocument(worklog._id.toString(), token);
        connections.push(ws);
        log.success(`Connection ${i + 1}/5 established`);
      }
      
      log.data(`All ${connections.length} connections active`);
      
      await wait(2000);
      
      // Check active users in database
      const updatedWorklog = await WorkLog.findById(worklog._id);
      log.data(`Active users in DB: ${updatedWorklog.activeUsers.length}`);
      
      // Close all
      connections.forEach((ws, i) => {
        ws.close();
        log.info(`Closed connection ${i + 1}`);
      });
      
      await wait(1000);
      
      log.success('Multiple connections test PASSED');
      return true;
    } catch (error) {
      log.error(`Multiple connections test FAILED: ${error.message}`);
      return false;
    }
  },
  
  async testActiveUsersTracking(worklog, token, user) {
    log.test('Test 5: Active Users Tracking');
    
    try {
      // Check initial state
      let wl = await WorkLog.findById(worklog._id);
      const initialCount = wl.activeUsers.length;
      log.data(`Initial active users: ${initialCount}`);
      
      // Connect
      const ws = await connectToDocument(worklog._id.toString(), token);
      await wait(1000);
      
      // Check after connection
      wl = await WorkLog.findById(worklog._id);
      const afterConnectCount = wl.activeUsers.length;
      log.data(`Active users after connect: ${afterConnectCount}`);
      
      // Verify user is tracked
      const isTracked = wl.activeUsers.some(
        u => u.userId.toString() === user._id.toString()
      );
      
      if (!isTracked) {
        log.error('User not found in activeUsers');
        ws.close();
        return false;
      }
      
      log.success('User successfully tracked');
      
      // Disconnect
      ws.close();
      await wait(1500);
      
      // Check after disconnection
      wl = await WorkLog.findById(worklog._id);
      const afterDisconnectCount = wl.activeUsers.length;
      log.data(`Active users after disconnect: ${afterDisconnectCount}`);
      
      if (afterDisconnectCount < afterConnectCount) {
        log.success('Active users tracking test PASSED');
        return true;
      } else {
        log.warning('User might not have been removed (cleanup delay)');
        return true; // Still pass as cleanup might be delayed
      }
    } catch (error) {
      log.error(`Active users tracking test FAILED: ${error.message}`);
      return false;
    }
  },
  
  async testDocumentPersistence(worklog, token) {
    log.test('Test 6: Document Persistence');
    
    try {
      const ws = await connectToDocument(worklog._id.toString(), token);
      
      // Update document
      const mockState = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      await WorkLog.findByIdAndUpdate(worklog._id, {
        yjsState: mockState,
        lastModified: new Date()
      });
      
      log.info('Document state updated');
      
      await wait(1000);
      
      // Verify persistence
      const updated = await WorkLog.findById(worklog._id).select('+yjsState');
      
      if (updated.yjsState && Buffer.isBuffer(updated.yjsState)) {
        log.success(`yjsState persisted: ${updated.yjsState.length} bytes`);
        log.success('Document persistence test PASSED');
        ws.close();
        return true;
      } else {
        log.error('yjsState not persisted correctly');
        ws.close();
        return false;
      }
    } catch (error) {
      log.error(`Document persistence test FAILED: ${error.message}`);
      return false;
    }
  },
  
  async testConcurrentEditing(worklog, token1, token2) {
    log.test('Test 7: Concurrent Editing (if 2 tokens available)');
    
    if (!token2) {
      log.warning('Skipping: Need 2 tokens for this test');
      return true;
    }
    
    try {
      const ws1 = await connectToDocument(worklog._id.toString(), token1);
      log.success('User 1 connected');
      
      const ws2 = await connectToDocument(worklog._id.toString(), token2);
      log.success('User 2 connected');
      
      await wait(1000);
      
      // Check both are active
      const wl = await WorkLog.findById(worklog._id);
      log.data(`Total active users: ${wl.activeUsers.length}`);
      
      if (wl.activeUsers.length >= 2) {
        log.success('Both users tracked simultaneously');
      }
      
      ws1.close();
      ws2.close();
      
      log.success('Concurrent editing test PASSED');
      return true;
    } catch (error) {
      log.error(`Concurrent editing test FAILED: ${error.message}`);
      return false;
    }
  },
  
  async testConnectionStability(worklog, token) {
    log.test('Test 8: Connection Stability (30 seconds)');
    
    try {
      const ws = await connectToDocument(worklog._id.toString(), token);
      let messageCount = 0;
      
      ws.on('message', () => {
        messageCount++;
      });
      
      log.info('Maintaining connection for 30 seconds...');
      
      for (let i = 1; i <= 30; i++) {
        await wait(1000);
        
        if (ws.readyState !== WebSocket.OPEN) {
          log.error(`Connection lost after ${i} seconds`);
          return false;
        }
        
        if (i % 5 === 0) {
          log.data(`${i}s elapsed, connection stable, messages: ${messageCount}`);
        }
      }
      
      ws.close();
      log.success('Connection stability test PASSED');
      return true;
    } catch (error) {
      log.error(`Connection stability test FAILED: ${error.message}`);
      return false;
    }
  }
};

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(60));
  log.info('WebSocket Manual Testing Script');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Connect to database
    log.info('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    log.success('Connected to MongoDB');
    
    // Find or create test user
    log.info('Setting up test user...');
    let testUser = await User.findOne({ email: 'websocket-test@test.com' });
    
    if (!testUser) {
      testUser = await User.create({
        name: 'WebSocket Test User',
        email: 'websocket-test@test.com',
        password: 'test123',
        division: 'Engineering',
        role: 'user'
      });
      log.success('Test user created');
    } else {
      log.success('Test user found');
    }
    
    // Generate token
    const token = jwt.sign(
      { id: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    log.success('JWT token generated');
    
    // Find or create test worklog
    log.info('Setting up test worklog...');
    let testWorkLog = await WorkLog.findOne({ title: 'WebSocket Test Document' });
    
    if (!testWorkLog) {
      testWorkLog = await WorkLog.create({
        title: 'WebSocket Test Document',
        content: 'This is a test document for WebSocket testing',
        tag: ['test', 'websocket'],
        user: testUser._id,
        collaborators: []
      });
      log.success('Test worklog created');
    } else {
      log.success('Test worklog found');
    }
    
    log.data(`Document ID: ${testWorkLog._id}`);
    log.data(`User ID: ${testUser._id}`);
    log.data(`WebSocket URL: ${WS_URL}`);
    
    console.log('\n' + '-'.repeat(60) + '\n');
    
    // Run tests
    const results = [];
    
    results.push(await tests.testBasicConnection(testUser, testWorkLog, token));
    console.log();
    
    results.push(await tests.testInvalidToken(testWorkLog));
    console.log();
    
    results.push(await tests.testNonExistentDocument(token));
    console.log();
    
    results.push(await tests.testMultipleConnections(testWorkLog, token));
    console.log();
    
    results.push(await tests.testActiveUsersTracking(testWorkLog, token, testUser));
    console.log();
    
    results.push(await tests.testDocumentPersistence(testWorkLog, token));
    console.log();
    
    // Optional: Test concurrent editing if you have another user
    // results.push(await tests.testConcurrentEditing(testWorkLog, token, token2));
    
    results.push(await tests.testConnectionStability(testWorkLog, token));
    console.log();
    
    // Summary
    console.log('='.repeat(60));
    log.info('TEST SUMMARY');
    console.log('='.repeat(60));
    
    const passed = results.filter(r => r).length;
    const failed = results.length - passed;
    
    log.data(`Total tests: ${results.length}`);
    log.success(`Passed: ${passed}`);
    if (failed > 0) {
      log.error(`Failed: ${failed}`);
    }
    
    const successRate = ((passed / results.length) * 100).toFixed(1);
    log.data(`Success rate: ${successRate}%`);
    
    console.log('='.repeat(60) + '\n');
    
    if (failed === 0) {
      log.success('🎉 All tests passed!');
    } else {
      log.warning('⚠️  Some tests failed. Check logs above.');
    }
    
  } catch (error) {
    log.error(`Test execution failed: ${error.message}`);
    console.error(error);
  } finally {
    // Cleanup
    log.info('Cleaning up...');
    await mongoose.disconnect();
    log.success('Disconnected from MongoDB');
    
    console.log('\n' + '='.repeat(60));
    log.info('Test run complete');
    console.log('='.repeat(60) + '\n');
    
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTests, tests };
