// Script untuk check worklog collection details
// Run: node src/scripts/checkWorklogDetails.js

require('dotenv').config();
const mongoose = require('mongoose');
const WorkLog = require('../models/WorkLog');

console.log('🔍 Checking WorkLog Collection Details...\n');

async function checkDetails() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get database and collection info
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('📚 Collections in database:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    console.log('');

    // Check WorkLog collection name
    const worklogCollection = WorkLog.collection.name;
    console.log(`📦 WorkLog model uses collection: "${worklogCollection}"\n`);

    // Get sample worklog with embedding
    const sampleLog = await WorkLog.findOne().select('+embedding').lean();
    
    if (!sampleLog) {
      console.log('❌ No worklogs found!');
      process.exit(0);
    }

    console.log('📄 Sample WorkLog Document:');
    console.log(`   ID: ${sampleLog._id}`);
    console.log(`   Title: ${sampleLog.title}`);
    console.log(`   Content length: ${sampleLog.content?.length || 0} chars`);
    console.log(`   Has embedding: ${sampleLog.embedding ? 'YES' : 'NO'}`);
    if (sampleLog.embedding) {
      console.log(`   Embedding length: ${sampleLog.embedding.length} dimensions`);
      console.log(`   Embedding type: ${Array.isArray(sampleLog.embedding) ? 'Array' : typeof sampleLog.embedding}`);
      console.log(`   Sample values: [${sampleLog.embedding.slice(0, 3).join(', ')}...]`);
    }
    console.log('');

    // Check index information
    console.log('🔍 Checking indexes on worklogs collection...');
    const indexes = await db.collection(worklogCollection).listIndexes().toArray();
    
    console.log(`\n📊 Found ${indexes.length} indexes:`);
    indexes.forEach(idx => {
      console.log(`\n   Index: ${idx.name}`);
      console.log(`   Keys: ${JSON.stringify(idx.key)}`);
      if (idx.type) console.log(`   Type: ${idx.type}`);
    });
    console.log('');

    // Check for vector search index specifically
    const hasVectorIndex = indexes.some(idx => 
      idx.name === 'worklog_vector_index' || 
      idx.type === 'vectorSearch'
    );

    if (hasVectorIndex) {
      console.log('✅ Vector search index found!\n');
    } else {
      console.log('❌ No vector search index found!\n');
      console.log('🔧 To create vector search index:');
      console.log('   1. Go to MongoDB Atlas (cloud.mongodb.com)');
      console.log('   2. Navigate to your cluster → Browse Collections');
      console.log('   3. Go to "Search" tab');
      console.log('   4. Click "Create Search Index"');
      console.log('   5. Choose "Atlas Vector Search"');
      console.log('   6. Configuration:');
      console.log('      {');
      console.log('        "fields": [');
      console.log('          {');
      console.log('            "type": "vector",');
      console.log('            "path": "embedding",');
      console.log('            "numDimensions": 3072,');
      console.log('            "similarity": "cosine"');
      console.log('          }');
      console.log('        ]');
      console.log('      }');
      console.log('   7. Index name: worklog_vector_index\n');
    }

    // Try direct aggregation to see what happens
    console.log('🧪 Testing direct aggregation pipeline...\n');
    
    try {
      const pipeline = [
        { $limit: 5 },
        { $project: { 
          title: 1, 
          hasEmbedding: { $cond: [{ $isArray: "$embedding" }, true, false] },
          embeddingSize: { $size: { $ifNull: ["$embedding", []] } }
        }}
      ];
      
      const results = await db.collection(worklogCollection).aggregate(pipeline).toArray();
      
      console.log('   Results:');
      results.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.title}`);
        console.log(`      Has embedding: ${r.hasEmbedding}`);
        console.log(`      Embedding size: ${r.embeddingSize}`);
      });
      console.log('');
    } catch (err) {
      console.log(`   ❌ Aggregation error: ${err.message}\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

checkDetails();
