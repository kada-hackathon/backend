// Script untuk check dan regenerate embeddings untuk semua worklogs
// Run: node src/scripts/checkEmbeddings.js

require('dotenv').config();
const mongoose = require('mongoose');
const WorkLog = require('../models/WorkLog');
const { generateEmbedding } = require('../services/embeddingService');

console.log('🔍 Checking WorkLog Embeddings...\n');

async function checkAndFixEmbeddings() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI not found in .env file!');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get ALL worklogs (including embedding field)
    const allLogs = await WorkLog.find({}).select('+embedding');
    console.log(`📊 Total WorkLogs: ${allLogs.length}\n`);

    if (allLogs.length === 0) {
      console.log('❌ No worklogs found in database!');
      console.log('💡 Please create some worklogs first.\n');
      process.exit(0);
    }

    // Check embeddings
    const logsWithoutEmbeddings = allLogs.filter(log => !log.embedding || log.embedding.length === 0);
    const logsWithEmbeddings = allLogs.filter(log => log.embedding && log.embedding.length > 0);

    console.log(`✅ WorkLogs WITH embeddings: ${logsWithEmbeddings.length}`);
    console.log(`❌ WorkLogs WITHOUT embeddings: ${logsWithoutEmbeddings.length}\n`);

    if (logsWithoutEmbeddings.length === 0) {
      console.log('🎉 All worklogs have embeddings! Chatbot should work.\n');
      
      // Show sample
      if (logsWithEmbeddings.length > 0) {
        const sample = logsWithEmbeddings[0];
        console.log('📦 Sample worklog:');
        console.log(`   Title: ${sample.title}`);
        console.log(`   Embedding length: ${sample.embedding.length} dimensions`);
        console.log(`   First 5 values: [${sample.embedding.slice(0, 5).join(', ')}...]\n`);
      }
      
      process.exit(0);
    }

    // Ask to regenerate
    console.log('🔧 Found worklogs without embeddings!\n');
    console.log('Missing embeddings for:');
    logsWithoutEmbeddings.forEach((log, i) => {
      console.log(`   ${i + 1}. ${log.title} (ID: ${log._id})`);
    });
    console.log('');

    // Auto-regenerate
    console.log('🚀 Regenerating embeddings...\n');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < logsWithoutEmbeddings.length; i++) {
      const log = logsWithoutEmbeddings[i];
      
      try {
        console.log(`   Processing ${i + 1}/${logsWithoutEmbeddings.length}: ${log.title}`);
        
        // Generate text for embedding
        const textToEmbed = `${log.title} ${log.content || ''} ${log.tag?.join(' ') || ''}`.trim();
        
        if (!textToEmbed) {
          console.log(`   ⚠️  Skipped (empty content)`);
          failCount++;
          continue;
        }

        // Generate embedding
        const embedding = await generateEmbedding(textToEmbed);
        
        if (!embedding || embedding.length === 0) {
          console.log(`   ❌ Failed to generate embedding`);
          failCount++;
          continue;
        }

        // Save embedding
        log.embedding = embedding;
        await log.save();
        
        console.log(`   ✅ Generated ${embedding.length}-dim embedding`);
        successCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Results:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📈 Total: ${logsWithoutEmbeddings.length}`);
    console.log('='.repeat(60) + '\n');

    if (successCount > 0) {
      console.log('🎉 Embeddings regenerated successfully!');
      console.log('💡 Chatbot should now work properly.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the script
checkAndFixEmbeddings();
