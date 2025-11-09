// Script untuk test vector search langsung
// Run: node src/scripts/testVectorSearch.js

require('dotenv').config();
const mongoose = require('mongoose');
const WorkLog = require('../models/WorkLog');
const { generateEmbedding } = require('../services/embeddingService');

console.log('🔍 Testing Vector Search...\n');

async function testVectorSearch() {
  try {
    // Connect
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Test query
    const testQuery = "What did I work on today?";
    console.log(`📝 Test Query: "${testQuery}"\n`);

    // Generate embedding for query
    console.log('🔄 Generating embedding...');
    const queryEmbedding = await generateEmbedding(testQuery);
    console.log(`✅ Generated ${queryEmbedding.length}-dim embedding\n`);

    // Try vector search
    console.log('🔍 Attempting vector search...');
    try {
      const results = await WorkLog.aggregate([
        {
          $vectorSearch: {
            index: "worklog_vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: 7
          }
        },
        {
          $project: {
            title: 1,
            content: 1,
            tag: 1,
            createdAt: 1,
            score: { $meta: "vectorSearchScore" }
          }
        }
      ]);

      console.log(`✅ Vector search successful!\n`);
      console.log(`📊 Found ${results.length} results:\n`);

      if (results.length === 0) {
        console.log('⚠️  No results found. This is weird since embeddings exist!\n');
      } else {
        results.forEach((result, i) => {
          console.log(`${i + 1}. ${result.title}`);
          console.log(`   Score: ${result.score.toFixed(4)}`);
          console.log(`   Content: ${result.content?.substring(0, 100)}...`);
          console.log('');
        });
      }

      console.log('🎉 Vector search is working!\n');

    } catch (vectorError) {
      console.log('❌ Vector search FAILED!\n');
      console.log('Error:', vectorError.message);
      console.log('\n📋 Possible causes:');
      console.log('   1. Vector index "worklog_vector_index" not created in MongoDB Atlas');
      console.log('   2. Index name mismatch');
      console.log('   3. Index not properly configured\n');
      
      console.log('🔧 How to fix:');
      console.log('   1. Go to MongoDB Atlas → Database → Browse Collections');
      console.log('   2. Click on your database → worklogs collection');
      console.log('   3. Go to "Search Indexes" tab');
      console.log('   4. Create new "Atlas Vector Search" index with:');
      console.log('      - Index Name: worklog_vector_index');
      console.log('      - Field: embedding');
      console.log('      - Dimensions: 3072');
      console.log('      - Similarity: cosine\n');

      // Try fallback: regular search
      console.log('🔄 Trying fallback search (recent worklogs)...\n');
      const fallbackResults = await WorkLog.find()
        .sort({ createdAt: -1 })
        .limit(7)
        .select('title content tag createdAt');

      console.log(`✅ Found ${fallbackResults.length} worklogs (fallback):\n`);
      fallbackResults.forEach((result, i) => {
        console.log(`${i + 1}. ${result.title}`);
        console.log(`   Created: ${result.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

testVectorSearch();
