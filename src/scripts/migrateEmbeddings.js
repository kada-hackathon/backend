const mongoose = require('mongoose');
const WorkLog = require('../models/WorkLog');
const { generateEmbedding, prepareTextForEmbedding } = require('../services/embeddingService');
require('dotenv').config();

async function migrateEmbeddings() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find WorkLogs without embeddings
        const logsWithoutEmbeddings = await WorkLog.find({ 
            embedding: { $exists: false } 
        }).limit(100); // Process in batches

        console.log(`Found ${logsWithoutEmbeddings.length} logs to process`);

        for (const log of logsWithoutEmbeddings) {
            try {
                const textToEmbed = prepareTextForEmbedding({
                    title: log.title,
                    content: log.content,
                    tag: log.tag
                });

                const embedding = await generateEmbedding(textToEmbed);

                await WorkLog.updateOne(
                    { _id: log._id },
                    { $set: { embedding } }
                );

                console.log(`✓ Processed: ${log.title}`);

                // Rate limiting (OpenAI has rate limits)
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`✗ Error processing ${log._id}:`, error.message);
            }
        }

        console.log('Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

migrateEmbeddings();