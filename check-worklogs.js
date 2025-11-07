const mongoose = require('mongoose');
const WorkLog = require('./src/models/WorkLog');
require('dotenv').config();

async function checkWorkLogs() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nebwork');
    console.log('✅ Connected to MongoDB');
    
    const totalCount = await WorkLog.countDocuments();
    console.log(`\n📊 Total WorkLogs: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log('\n❌ NO WORK LOGS FOUND!');
      console.log('This is why you\'re seeing the "no work logs" message.\n');
      console.log('To fix this:');
      console.log('1. Create some work logs through the UI');
      console.log('2. Make sure the backend is running');
      console.log('3. Check if user is authenticated\n');
      process.exit(0);
    }
    
    const withEmbeddings = await WorkLog.countDocuments({ 
      embedding: { $exists: true, $ne: null } 
    });
    console.log(`📈 WorkLogs with embeddings: ${withEmbeddings}`);
    
    if (withEmbeddings === 0) {
      console.log('\n⚠️  WARNING: No embeddings found!');
      console.log('Work logs exist but have no embeddings for semantic search.\n');
      console.log('To fix this:');
      console.log('1. Check if EMBEDDING_API_KEY is set in .env');
      console.log('2. Run the migration script: node src/scripts/migrateEmbeddings.js');
      console.log('3. Or create new work logs (they will auto-generate embeddings)\n');
    }
    
    // Show sample work log
    const sample = await WorkLog.findOne()
      .select('+embedding')
      .populate('user', 'name email division');
    
    if (sample) {
      console.log('\n📝 Sample WorkLog:');
      console.log(`   Title: ${sample.title}`);
      console.log(`   Author: ${sample.user?.name || 'Unknown'}`);
      console.log(`   Has Embedding: ${sample.embedding ? 'Yes ✅' : 'No ❌'}`);
      console.log(`   Embedding Length: ${sample.embedding?.length || 0} dimensions`);
      console.log(`   Created: ${sample.createdAt}`);
    }
    
    console.log('\n✅ Database check complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

checkWorkLogs();
